"use client";

import { useRef, useState, useSyncExternalStore, type PointerEvent } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, primaryBtn, usePlay, useScene, useSeed, useSeeded, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { Bubble, Loop, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { EUROPE, FULL, GREEK, RopeBand, RopeCards, RopeLine, TONE, makeRope, type Rope, type RopeCard, type Span } from "@/components/interactive/timeline-journey";

// Screens for "Physics 1.3 — চুম্বক আর ঘষা চিরুনি, দুই বল না এক?", told as a Journey.
//
// Wednesday in the poster corner. The rope from 1.2 is bare after 1700. On the
// desk: a plastic comb, paper bits, a torch cell, a wire, and করিম চাচা's old
// compass. সামিন's rubbed comb lifts paper; one lodestone pulls another. হামজা:
// চুম্বক আর বিদ্যুৎ দুইটা আলাদা জিনিস। The reader does both tricks and seals a
// bet (TwoTricks). 1760–1880's Coulomb, Rumford/Kelvin and Volta cards clip on
// as plain explanation, no widget — none of the three is a surprise a class
// nine reader needs to *see*, so §2 of nctb-journey skips a widget for them
// and tells the story instead, with HeatCards/CombCoulomb/SparkVsSteady as its
// only watch-only figures. A current turning the compass and a moving magnet
// lighting a bulb (WireCompass), the two feeding each other into a wave that
// runs as fast as light (MaxwellWave) — these two ARE seen, because the
// surprise (electricity making magnetism, and back) is the whole argument.
// The whole chain is retold slowly, plain-Bangla, no widget (StoryRecap),
// before the reader answers হামজা by tying the two cards together
// (AnswerNasib). Electroweak unification (the weak force joining in) is told
// the same explanation-first way, no widget, with FewFormulas as its only
// figure. Then tags four everyday clips (TryTags), and the bet is opened
// (BetOpen13). No step cap (nctb-journey skill).
//
// Builds on 1.2's poster rope (timeline-journey): adds the UNIFY cards and a
// strip of the rope for 1760–1880 (UnifyRope). Only add exports.
//
// Words follow 1.2: the book's Bangla terms and dates as printed, `।` endings.
// Red is বিদ্যুৎ, blue is চুম্বক, everywhere. Scenes and figures are fixed ink.
//
// Changed to match nctb-journey §2 (explain first, animate only what needs
// seeing): the HeatFluid, CoulombPush, VoltaPile and MoreMerging widgets that
// used to carry these screens are gone — their facts now live in plain
// explanation steps in the MDX, each keeping only its already-built
// watch-only figure (HeatCards, CombCoulomb, SparkVsSteady, FewFormulas).
// Nothing about Coulomb's law, Rumford's cannon, Volta's pile or electroweak
// unification was dropped, only un-widgeted.

type Story = { story?: boolean };

const INK = "#0f1b2d";
const MUTE = "#5a6b7d";
/** বিদ্যুৎ */
const RED = "#dc2626";
/** চুম্বক */
const BLUE = "#2563eb";

const smallBtn =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border-2 border-cat-blue px-3 text-sm font-semibold text-cat-blue transition-colors hover:bg-cat-blue/10 disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none";

const CALM = "(prefers-reduced-motion: reduce)";
/** Whether the reader asked for less motion (a loop then stays still). */
function useCalm() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(CALM);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(CALM).matches,
    () => true,
  );
}

/** A current running along a wire: marching dashes (still under reduced motion). */
function Flow({ d, on, color = "#f59e0b", w = 1.6 }: { d: string; on: boolean; color?: string; w?: number }) {
  const calm = useCalm();
  if (!on) return null;
  return (
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeDasharray="3 5" strokeLinecap="round" className="pointer-events-none">
      {!calm && <animate attributeName="stroke-dashoffset" values="16;0" dur="0.5s" repeatCount="indefinite" />}
    </path>
  );
}

const svgX = (e: PointerEvent<Element>) => {
  const svg = (e.currentTarget as SVGElement).ownerSVGElement ?? (e.currentTarget as SVGSVGElement);
  const b = svg.getBoundingClientRect();
  return { x: ((e.clientX - b.left) / b.width) * 320, scale: 320 / b.width };
};

// ---------------------------------------------------------------------------
// The poster rope, 1760–1880: the cards this journey clips.

export const UNIFY: RopeCard[] = [
  { id: "coulomb", name: "কুলম্ব", year: 1778, label: "1778", tone: "modern", deed: "বৈদ্যুতিক চার্জের ভেতরকার বলের জন্য সূত্র।" },
  { id: "rumford", name: "রামফোর্ড", year: 1798, label: "1798", tone: "modern", deed: "তাপ একধরনের শক্তি। যান্ত্রিক শক্তিকে তাপশক্তিতে রূপান্তর করা যায়।" },
  { id: "volta", name: "ভোল্টা", year: 1800, label: "1800", tone: "modern", deed: "বৈদ্যুতিক ব্যাটারি। এরপর বিদ্যুৎ নিয়ে নানা ধরনের গবেষণা।" },
  { id: "young", name: "ইয়ং", year: 1801, label: "1801", tone: "modern", deed: "পরীক্ষা করে আলোর তরঙ্গ ধর্মের প্রমাণ।" },
  { id: "oersted", name: "অরস্টেড", year: 1820, label: "1820", tone: "modern", deed: "বিদ্যুৎপ্রবাহ দিয়ে চুম্বক তৈরি করা যায়।" },
  { id: "faraday", name: "ফ্যারাডে, হেনরি", year: 1831, label: "1831", tone: "modern", deed: "চৌম্বক ক্ষেত্রের পরিবর্তন করে বিদ্যুৎ তৈরি করা যায়।" },
  { id: "kelvin", name: "কেলভিন", year: 1850, label: "1850", tone: "modern", deed: "তাপ গতিবিজ্ঞানের (থার্মোডিনামিক্সের) দুটি গুরুত্বপূর্ণ সূত্র।" },
  { id: "maxwell", name: "ম্যাক্সওয়েল", year: 1864, label: "1864", tone: "modern", deed: "বিদ্যুৎ ও চৌম্বক ক্ষেত্র একই সূত্রে। আলো একটি বিদ্যুৎ চৌম্বকীয় তরঙ্গ।" },
];
export const UNIFY_SPAN: Span = [1760, 1880];

/** which row under the rope each name hangs on, so neighbours never overlap */
function nameRows(r: Rope, cards: RopeCard[]) {
  const order = cards.map((_, i) => i).sort((i, j) => cards[i].year - cards[j].year);
  const right: number[] = [];
  const row = cards.map(() => 0);
  for (const i of order) {
    const x = r.x(cards[i].year);
    const w = cards[i].name.length * 3.3 + 4;
    let l = right.findIndex((edge) => edge < x - w / 2);
    if (l === -1) l = right.length;
    right[l] = x + w / 2;
    row[i] = l;
  }
  return row;
}

/** The 1760–1880 stretch of the poster rope at height y, the `up` cards pinned; `pop` ones pop on. */
export function UnifyRope({ y, up, pop = [], lit = [] }: { y: number; up: string[]; pop?: string[]; lit?: string[] }) {
  const r = makeRope(UNIFY_SPAN, y);
  const cards = UNIFY.filter((c) => up.includes(c.id));
  const row = nameRows(r, cards);
  return (
    <g className="pointer-events-none">
      <RopeLine r={r} tick={10} every={20} />
      {cards.map((c, i) => (
        <g key={c.id} className={pop.includes(c.id) ? POP : undefined}>
          {lit.includes(c.id) && <circle cx={r.x(c.year)} cy={r.y} r={6} fill="#fde68a" className={FADE} />}
          <path d={`M${r.x(c.year)} ${r.y}V${r.y + 6 + row[i] * 8}`} stroke={TONE.modern} strokeWidth={0.5} />
          <circle cx={r.x(c.year)} cy={r.y} r={2.6} fill={TONE.modern} stroke="white" strokeWidth={0.6} />
          <text x={r.x(c.year)} y={r.y + 12 + row[i] * 8} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={INK}>
            {c.name}
          </text>
        </g>
      ))}
    </g>
  );
}

/** The rope strip that heads each card's screen; the new card pops on when the screen is done. */
function RopeStrip({ up, pop = [] }: { up: string[]; pop?: string[] }) {
  return (
    <svg viewBox="0 0 320 50" className="mb-2 block h-auto w-full" role="img" aria-label="the poster rope from 1760 to 1880 and the cards on it so far">
      <rect width={320} height={50} rx={8} fill="#f5efe6" />
      <UnifyRope y={16} up={up} pop={pop} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Props drawn small: the desk, a comb, a torch cell, a compass, করিম চাচা.

function Desk({ x, w, y = 122 }: { x: number; w: number; y?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y} width={w} height={5} rx={1} fill="#92400e" />
      <path d={`M${x + 5} ${y + 5}V150M${x + w - 5} ${y + 5}V150`} stroke="#78350f" strokeWidth={2.4} />
    </g>
  );
}

/** a pink plastic comb centred at (x, y) */
function Comb({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-9} y={-3} width={18} height={3.5} rx={1} fill="#ec4899" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M${-8 + i * 2.3} 0.5v3.2`} stroke="#ec4899" strokeWidth={0.9} />
      ))}
    </g>
  );
}

/** a torch cell lying on its side, + end to the right */
function Cell({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={0} y={0} width={16} height={7} rx={1.2} fill="#1f2937" />
      <rect x={10} y={0} width={3} height={7} fill="#f59e0b" />
      <rect x={16} y={2} width={1.6} height={3} fill="#9ca3af" />
    </g>
  );
}

/** a compass at (x, y), its needle turned `deg` from north (glides) */
function Compass({ x, y, r = 7, deg = 0, ms = 700 }: { x: number; y: number; r?: number; deg?: number; ms?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="white" stroke="#64748b" strokeWidth={r > 12 ? 1.4 : 0.8} />
      <text x={x} y={y - r + (r > 12 ? 7 : 3)} textAnchor="middle" fontSize={r > 12 ? 6.5 : 2.6} fontWeight={700} fill={MUTE}>
        N
      </text>
      <g
        style={{ transform: `rotate(${deg}deg)`, transformOrigin: `${x}px ${y}px`, transformBox: "view-box", transitionDuration: `${ms}ms` }}
        className="transition-transform ease-out motion-reduce:transition-none"
      >
        <path d={`M${x} ${y - r * 0.8}L${x + r * 0.2} ${y}H${x - r * 0.2}Z`} fill={RED} />
        <path d={`M${x} ${y + r * 0.8}L${x + r * 0.2} ${y}H${x - r * 0.2}Z`} fill="#475569" />
        <circle cx={x} cy={y} r={r * 0.08 + 0.4} fill={INK} />
      </g>
    </g>
  );
}

/** করিম চাচা, the school's দপ্তরি: মামা's look, his own name under his feet */
function Chacha({ x, y, arm = "down", facing = 1, walking = false }: { x: number; y: number; arm?: "down" | "wave" | "hold" | "point"; facing?: 1 | -1; walking?: boolean }) {
  return (
    <g>
      <Person who="mama" x={x} y={y} arm={arm} facing={facing} walking={walking} />
      <g style={{ transform: `translate(${x}px, ${y}px)` }} className="pointer-events-none transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
        <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
          করিম চাচা
        </text>
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: Wednesday. The rope is
//      bare after 1700. সামিন rubs the comb in his hair and it lifts paper
//      bits; করিম চাচা brings his compass; হামজা makes his claim.

export function WednesdayDesk({}: Story) {
  const s = useScene(4, [600, 2000, 2000, 2600, 2600]);
  const k = s.k;
  const bits = [122, 128, 134, 140];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="the poster corner: the rope is bare after 1700; Samin rubs a comb in his hair and lifts paper bits; Karim chacha brings his old compass; Nasib says magnets and electricity are different things">
        <path d="M8 24Q160 30 312 24" stroke="#a16207" strokeWidth={1.4} fill="none" />
        {[14, 24, 34, 44, 52, 64, 74, 84, 150, 162, 176].map((x, i) => (
          <rect key={x} x={x} y={30 + (i % 3) * 9} width={9} height={7} rx={1} fill="white" stroke={i < 5 ? "#2563eb" : i < 8 ? "#059669" : "#7c3aed"} />
        ))}
        <path d="M196 38H306" stroke="#94a3b8" strokeDasharray="4 3" />
        <text x={251} y={52} textAnchor="middle" fontSize={11} fontWeight={800} fill="#94a3b8">
          ?
        </text>
        <Desk x={110} w={110} />
        <Cell x={150} y={115} />
        <path d="M168 120q8 -7 18 -1" fill="none" stroke="#b45309" strokeWidth={1} />
        {bits.map((x, i) => {
          const up = k >= 2;
          return <rect key={x} x={x} y={up ? 110 : 119} width={3.4} height={2.6} fill="white" stroke="#94a3b8" strokeWidth={0.4} style={{ transitionDelay: `${i * 90}ms` }} className="transition-[y] duration-500 motion-reduce:transition-none" />;
        })}
        {k === 0 && <Comb x={200} y={119} s={0.8} />}
        {k === 1 && (
          <g>
            <Comb x={80} y={90} />
            <path d="M70 84q4 -4 8 0M84 82q4 -4 8 0" fill="none" stroke={MUTE} strokeWidth={0.7} className={FADE} />
          </g>
        )}
        {k >= 2 && <Comb x={131} y={106} />}
        {k >= 3 && <Compass x={204} y={117} r={6} />}
        <Person who="samin" x={k >= 2 ? 106 : 70} y={150} arm={k >= 1 ? "hold" : "down"} walking={k === 2} label />
        <Chacha x={k >= 3 ? 244 : 360} y={150} facing={-1} arm={k >= 3 ? "point" : "down"} walking={k === 3} />
        <Person who="nasib" x={292} y={150} facing={-1} mood={k >= 4 ? "smug" : "plain"} label />
        {k === 3 && <Bubble x={244} y={84} side="left" lines={["পুরানা কম্পাস।", "সাবধানে রাইখো।"]} />}
        {k >= 4 && <Bubble x={292} y={84} side="left" lines={["চুম্বক আর বিদ্যুৎ", "দুইটা আলাদা জিনিস।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · Both tricks, then the bet. Left: rub the comb (three rubs) and bring it
//     to the paper; the bits jump. Right: drag one lodestone at the other; it
//     snaps on. Then three answers, the pick drawn on the picture with a "?",
//     and sealed. Never marked here.

const G1_OPT = ["দুইটা আলাদা বল", "একই বল, দুই রূপ", "বলা যায় না"];
/** the sealed pick, kept for the last step while the lesson is open */
let S1_BET: number | null = null;

const T1_BITS = [94, 102, 110, 118, 126, 134];
const T1_STONE = "M-12 -5q4 -9 13 -8q10 3 11 10q-1 9 -11 10q-11 1 -13 -6Z";

export function TwoTricks() {
  const pass = useGate();
  const [rubs, setRubs] = useSeed("rubs", 0);
  const [down, setDown] = useSeed("down", false);
  const [lDone, setLDone] = useSeed("lDone", false);
  const [bx, setBx] = useSeed("bx", 290);
  const [stuck, setStuck] = useSeed("stuck", false);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; b: number; moved: boolean } | null>(null);
  const rub = usePlay(90);
  const lower = usePlay(650);
  const both = lDone && stuck;

  const doRub = () => {
    if (rub.running || lower.running || rubs >= 3) return;
    setDown(false);
    sfx.brush(0.5);
    rub.play(6, () => setRubs(Math.min(3, rubs + 1)));
  };
  const doLower = () => {
    if (rub.running || lower.running) return;
    setDown(true);
    sfx.whoosh(0.2);
    lower.play(2, () => {
      if (rubs >= 3) {
        sfx.tap();
        setLDone(true);
      }
    });
  };
  const lifted = down && !(lower.running && lower.k < 1) ? rubs * 2 : 0;

  const snap = () => {
    setBx(221);
    setStuck(true);
    setDragging(false);
    drag.current = null;
    sfx.click();
  };
  const onDown = (e: PointerEvent<SVGGElement>) => {
    if (stuck) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, b: bx, moved: false };
    setDragging(true);
  };
  const onMove = (e: PointerEvent<SVGGElement>) => {
    const d = drag.current;
    if (!d) return;
    const { scale } = svgX(e);
    const dx = (e.clientX - d.x) * scale;
    if (Math.abs(dx) > 2) d.moved = true;
    const nx = Math.max(214, Math.min(300, d.b + dx));
    if (nx < 244) snap();
    else setBx(nx);
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setDragging(false);
    if (!d.moved) {
      const nx = bx - 20;
      if (nx < 244) snap();
      else setBx(nx);
    }
  };

  const seal = () => {
    setSealed(true);
    S1_BET = pick;
    sfx.stamp();
    pass("বাজি সিল হলো। শেষে মিলিয়ে দেখবো।");
  };
  const look = (i: number): Look => (pick === i ? "picked" : sealed ? "dim" : "idle");
  const combX = down ? 116 : 64 + (rub.running ? (rub.k % 2 ? 6 : -6) : 0);
  const combY = down ? 92 : 44;
  const pull = !stuck && bx < 272;

  const left = lDone
    ? "কাগজ লাফিয়ে চিরুনিতে!"
    : down
      ? rubs === 0
        ? "ঘষা ছাড়া চিরুনি কিছুই টানে না। আগে চুলে ঘষুন।"
        : rubs < 3
          ? "অল্প কয়েকটা উঠলো। আরো ঘষুন।"
          : "…"
      : rubs === 0
        ? "চিরুনিটা চুলে ঘষুন, তারপর কাগজের কাছে নিন।"
        : `ঘষা হলো ${rubs} বার।`;

  return (
    <>
      <svg viewBox="0 0 320 142" className="block h-auto w-full touch-none select-none" role="img" aria-label="left: a comb rubbed in hair and brought to paper bits; right: a loose lodestone to drag toward another">
        <rect width={320} height={142} rx={10} fill="#f5efe6" />
        <path d="M160 8V118" stroke="#d6c7b0" strokeDasharray="3 3" />
        <text x={80} y={14} textAnchor="middle" fontSize={8} fontWeight={700} fill={MUTE}>
          সামিনের চিরুনি
        </text>
        <text x={240} y={14} textAnchor="middle" fontSize={8} fontWeight={700} fill={MUTE}>
          লোডস্টোন
        </text>
        {/* সামিন's head */}
        <circle cx={40} cy={56} r={15} fill="#c68e5f" />
        <path d="M25 54q-1 -17 15 -17t15 17q-3 -5 -7 -6q-2 3 -5 1q-3 3 -6 0q-3 3 -6 0q-3 1 -6 5Z" fill="#111827" />
        <circle cx={35} cy={58} r={1.3} fill={INK} />
        <circle cx={45} cy={58} r={1.3} fill={INK} />
        {/* the comb and its charge */}
        <g style={{ transform: `translate(${combX}px, ${combY}px)` }} className={rub.running ? undefined : "transition-transform duration-500 ease-out motion-reduce:transition-none"}>
          <Comb x={0} y={0} s={1.4} />
          {Array.from({ length: rubs }, (_, i) => (
            <text key={i} x={-8 + i * 8} y={-7} textAnchor="middle" fontSize={9} fontWeight={800} fill={RED} className={POP}>
              −
            </text>
          ))}
        </g>
        {/* the paper bits on a little table */}
        <rect x={86} y={112} width={60} height={4} rx={1} fill="#92400e" />
        {T1_BITS.map((x, i) => {
          const up = i < lifted;
          return (
            <rect
              key={x}
              x={x}
              y={up ? 97 : 107}
              width={5}
              height={4}
              fill="white"
              stroke="#94a3b8"
              strokeWidth={0.5}
              style={{ transitionDelay: `${i * 60}ms` }}
              className="transition-[y] duration-300 ease-out motion-reduce:transition-none"
            />
          );
        })}
        {/* the lodestones */}
        <g transform="translate(196 78)">
          <path d={T1_STONE} fill="#44403c" />
        </g>
        {pull && (
          <g className={FADE}>
            {[-6, 0, 6].map((dy) => (
              <path key={dy} d={`M${209} ${78 + dy}H${bx - 13}`} stroke={MUTE} strokeWidth={0.6} strokeDasharray="2 2" />
            ))}
          </g>
        )}
        <g
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          role="button"
          aria-label="the loose lodestone: drag it left, or tap to push it"
          style={{ transform: `translate(${bx}px, 78px)` }}
          className={`${stuck ? "" : "cursor-grab"} ${dragging ? "" : "transition-transform duration-300 ease-out motion-reduce:transition-none"}`}
        >
          <circle r={20} fill="transparent" />
          <path d={T1_STONE} fill="#57534e" transform="scale(-1 1)" />
        </g>
        {!stuck && (
          <path d="M262 102h-18m0 0l4 -3m-4 3l4 3" stroke={MUTE} strokeWidth={0.9} fill="none" className={FADE} />
        )}
        {/* the bet, drawn on the picture */}
        {pick === 0 && (
          <g key="a" className={FADE}>
            <rect x={8} y={20} width={146} height={100} rx={8} fill="none" stroke="#a8a29e" strokeDasharray="4 3" />
            <rect x={166} y={20} width={146} height={100} rx={8} fill="none" stroke="#a8a29e" strokeDasharray="4 3" />
            <text x={80} y={134} textAnchor="middle" fontSize={8} fontWeight={700} fill={MUTE}>
              একটা বল?
            </text>
            <text x={240} y={134} textAnchor="middle" fontSize={8} fontWeight={700} fill={MUTE}>
              আরেকটা বল?
            </text>
          </g>
        )}
        {pick === 1 && (
          <g key="b" className={FADE}>
            <path d="M40 122V128H280V122" fill="none" stroke="#a8a29e" strokeWidth={1.2} />
            <path d="M160 128v4" stroke="#a8a29e" strokeWidth={1.2} />
            <text x={160} y={140} textAnchor="middle" fontSize={8} fontWeight={700} fill={MUTE}>
              একই বল?
            </text>
          </g>
        )}
        {pick === 2 && (
          <g key="c" className={POP}>
            <circle cx={160} cy={64} r={14} fill="#f1f5f9" stroke="#94a3b8" />
            <text x={160} y={70} textAnchor="middle" fontSize={16} fontWeight={800} fill="#94a3b8">
              ?
            </text>
          </g>
        )}
      </svg>
      {!both ? (
        <>
          <div className="mt-2 grid grid-cols-2 items-center gap-2">
            <div className="flex justify-center gap-1.5">
              <button type="button" onClick={doRub} disabled={rub.running || lower.running || rubs >= 3 || lDone} className={smallBtn}>
                ঘষুন
              </button>
              <button type="button" onClick={doLower} disabled={rub.running || lower.running || lDone} className={smallBtn}>
                কাগজের কাছে
              </button>
            </div>
            <div className="text-center text-sm text-muted">{stuck ? "খট! লেগে গেলো।" : "ডানের পাথরটা বামে টানুন।"}</div>
          </div>
          <div className="mt-2 min-h-6 text-center text-[0.95rem]">{left}</div>
          <Ticks
            items={[
              ["চিরুনি", lDone],
              ["লোডস্টোন", stuck],
            ]}
          />
        </>
      ) : (
        <>
          <div className={`${FADE} mt-2 text-sm font-medium text-muted`}>দুইটা অদৃশ্য টান। এদের পেছনে কী?</div>
          <div className="mt-1.5 grid gap-1.5">
            {G1_OPT.map((o, i) => (
              <Choice
                key={o}
                n={i}
                look={look(i)}
                disabled={sealed}
                onClick={() => {
                  sfx.tap();
                  setPick(i);
                }}
              >
                {o}
              </Choice>
            ))}
          </div>
          {pick !== null && !sealed && (
            <div className="mt-2.5 flex justify-center">
              <button type="button" onClick={seal} className={primaryBtn}>
                বাজি সিল করুন
              </button>
            </div>
          )}
          {sealed && <div className={`${FADE} mt-2.5 text-center text-[0.95rem] text-muted`}>বাজি সিল। দড়ি ভরতে ভরতে দেখা যাবে।</div>}
        </>
      )}
      <Task done={sealed}>চিরুনি ঘষে কাগজ তুলুন, পাথর দিয়ে পাথর টানুন। তারপর বাজি ধরুন: বল একটা, না দুইটা?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: two old lands, two pulls,
//      two names. Greece: amber rubbed with fur lifts straw → Electricity.
//      China: lodestone pulls lodestone → Magnetism. A line stays between them.

const X1_SAY = [
  "দুই প্রাচীন দেশ, দুই রকম অদৃশ্য টান।",
  "গ্রিসে আম্বর নামের জিনিস পশম দিয়ে ঘষলে হালকা জিনিস টানতো।",
  "নাম হলো ইলেকট্রিসিটি বা বৈদ্যুতিক শক্তি (Electricity)।",
  "চীনে এক টুকরা লোড স্টোন আরেক টুকরাকে টানতো। নাম হলো চৌম্বকত্ব (Magnetism)।",
  "দুই নাম, দুই দেশ। শত শত বছর দুইটা আলাদা জিনিস।",
];

export function TwoLands() {
  const s = useScene(4, [600, 2200, 2200, 2400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="Greece: amber rubbed with fur lifts straw, named Electricity; China: lodestone pulls lodestone, named Magnetism">
        <rect width={240} height={110} rx={10} fill="white" />
        <text x={60} y={16} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
          প্রাচীন গ্রিস
        </text>
        <text x={180} y={16} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
          প্রাচীন চীন
        </text>
        <path d="M120 24V100" stroke="#cbd5e1" strokeWidth={k >= 4 ? 2.4 : 1} strokeDasharray={k >= 4 ? undefined : "3 3"} className="transition-[stroke-width] duration-500 motion-reduce:transition-none" />
        {/* amber and fur */}
        <path d="M44 52q6 -10 16 -6q8 6 2 14q-10 6 -18 -8Z" fill="#f59e0b" stroke="#b45309" strokeWidth={0.6} />
        {k >= 1 && (
          <g>
            <g>
              <Loop on={k === 1} run={String(k)} ms={1800} type="translate" values="-5 0;5 0;-5 0" dur={0.35} />
              <path d="M40 38q4 -6 10 -2q4 -5 9 -1q5 -3 8 2q-2 6 -8 5q-6 3 -11 0q-6 2 -8 -4Z" fill="#a16207" opacity={0.85} />
            </g>
          </g>
        )}
        {[30, 46, 62, 78].map((x, i) => (
          <path
            key={x}
            d={`M${x} 84l6 2`}
            stroke="#ca8a04"
            strokeWidth={1.2}
            style={{ transform: `translateY(${k >= 1 ? -20 : 0}px)`, transitionDelay: `${400 + i * 120}ms` }}
            className="transition-transform duration-500 motion-reduce:transition-none"
          />
        ))}
        {k >= 2 && (
          <g className={POP}>
            <rect x={22} y={88} width={76} height={15} rx={4} fill="#fef2f2" stroke={RED} />
            <text x={60} y={98.5} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={RED}>
              Electricity
            </text>
          </g>
        )}
        {/* the lodestones */}
        <g transform="translate(160 56)">
          <path d={T1_STONE} fill="#44403c" />
        </g>
        <g style={{ transform: `translate(${k >= 3 ? 184 : 210}px, 56px)` }} className="transition-transform duration-700 ease-in motion-reduce:transition-none">
          <path d={T1_STONE} fill="#57534e" transform="scale(-1 1)" />
        </g>
        {k >= 3 && (
          <g className={POP}>
            <rect x={142} y={88} width={76} height={15} rx={4} fill="#eff6ff" stroke={BLUE} />
            <text x={180} y={98.5} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={BLUE}>
              Magnetism
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: two palms rubbing warm
//      up; then the rope strip, and রামফোর্ড and কেলভিন clip on.

const X2_SAY = [
  "ঘষা মানে নড়াচড়া। নড়াচড়া মানে যান্ত্রিক শক্তি।",
  "সেটাই হয়ে যায় তাপ। দুই হাত ঘষে দেখুন।",
  "1798: রামফোর্ড দেখান, তাপ একধরনের শক্তি।",
  "1850: কেলভিন দেন তাপ গতিবিজ্ঞানের (থার্মোডিনামিক্সের) দুটি গুরুত্বপূর্ণ সূত্র।",
];

export function HeatCards() {
  const s = useScene(3, [600, 2000, 2200, 2400]);
  const k = s.k;
  const up = k >= 3 ? ["rumford", "kelvin"] : k >= 2 ? ["rumford"] : [];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X2_SAY[k]}</span>}>
      <svg viewBox="0 0 320 120" className="mx-auto block h-auto w-full max-w-[18rem]" role="img" aria-label="two palms rubbing and warming up; then Rumford and Kelvin clip onto the rope">
        <rect width={320} height={120} rx={10} fill="white" />
        <g>
          <Loop on={k <= 1} run={String(k)} ms={2000} type="translate" values="-6 0;6 0;-6 0" dur={0.3} />
          <rect x={132} y={22} width={56} height={18} rx={9} fill="#e0ac7e" />
        </g>
        <rect x={132} y={42} width={56} height={18} rx={9} fill="#d49a6a" />
        {k >= 1 &&
          [140, 160, 180].map((x, i) => (
            <path key={x} d={`M${x} 18q-4 -5 0 -10q4 -5 0 -10`} fill="none" stroke="#f97316" strokeWidth={1.4} style={{ transitionDelay: `${i * 200}ms` }} className={FADE} />
          ))}
        {k >= 1 && (
          <text x={210} y={46} fontSize={8} fontWeight={700} fill="#ea580c" className={FADE}>
            গরম
          </text>
        )}
        <UnifyRope y={82} up={up} pop={["rumford", "kelvin"]} />
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: সামিন's comb is this very
//      force. The rubbed comb, its − charges; the near side of a paper bit
//      turns +; the bit jumps. Then a spark, and the charge is gone.

const X3_SAY = [
  "1778: কুলম্ব বৈদ্যুতিক চার্জের ভেতরকার বলের জন্য সূত্র আবিষ্কার করলেন।",
  "সামিনের চিরুনিও এই বলেই কাগজ টানে।",
  "কিন্তু চিরুনির চার্জ এক ঝলকের। একটা ঝিলিক, তারপর শেষ।",
];

export function CombCoulomb() {
  const s = useScene(2, [600, 2200, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3_SAY[k]}</span>}>
      <svg viewBox="0 0 240 100" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="a charged comb pulls a paper bit; then a spark and the charge is gone">
        <rect width={240} height={100} rx={10} fill="white" />
        {k === 0 && (
          <g>
            <circle cx={90} cy={50} r={10} fill="#fee2e2" stroke="#b91c1c" />
            <circle cx={150} cy={50} r={10} fill="#fee2e2" stroke="#b91c1c" />
            <text x={90} y={54} textAnchor="middle" fontSize={11} fontWeight={800} fill="#b91c1c">
              +
            </text>
            <text x={150} y={54} textAnchor="middle" fontSize={11} fontWeight={800} fill="#b91c1c">
              +
            </text>
            <Draw d="M78 50H56m0 0l5 -4m-5 4l5 4" ms={600} className="stroke-[#b45309]" strokeWidth={2} />
            <Draw d="M162 50H184m0 0l-5 -4m5 4l-5 4" ms={600} className="stroke-[#b45309]" strokeWidth={2} />
            <rect x={96} y={74} width={48} height={14} rx={3} fill="#f1f5f9" stroke="#94a3b8" />
            <text x={120} y={84} textAnchor="middle" fontSize={7} fontWeight={700} fill={INK}>
              কুলম্বের সূত্র
            </text>
          </g>
        )}
        {k >= 1 && (
          <g className={FADE}>
            <g transform="translate(120 34)">
              <Comb x={0} y={0} s={3} />
            </g>
            {k === 1 &&
              [-18, -6, 6, 18].map((x) => (
                <text key={x} x={120 + x} y={22} textAnchor="middle" fontSize={9} fontWeight={800} fill={RED}>
                  −
                </text>
              ))}
            <g style={{ transform: `translateY(${k === 1 ? 0 : 26}px)` }} className="transition-transform duration-500 motion-reduce:transition-none">
              <rect x={108} y={52} width={24} height={14} fill="white" stroke="#94a3b8" />
              {k === 1 && (
                <text x={120} y={58} textAnchor="middle" fontSize={7} fontWeight={800} fill="#b91c1c">
                  + +
                </text>
              )}
            </g>
            {k >= 2 && (
              <g className={FADE}>
                <path d="M150 34l8 -6l-4 8l10 -4" fill="none" stroke="#facc15" strokeWidth={2} opacity={0.15} className="transition-opacity duration-[1200ms] motion-reduce:transition-none starting:opacity-100" />
                <text x={186} y={40} fontSize={8} fill={MUTE}>
                  শেষ
                </text>
              </g>
            )}
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A figure for the Volta step, no task, no widget (nctb-journey §2: the
//      order is a structure to see, not a surprise to play with): the pile,
//      labelled, built once in front of the reader — তামা, ভেজা কাপড়, দস্তা,
//      again and again — and the bulb lighting once three sets are up.

type Layer = "cu" | "cloth" | "zn";
const V4_ORDER: Layer[] = ["cu", "cloth", "zn"];
const V4_NAME: Record<Layer, string> = { cu: "তামা", cloth: "ভেজা কাপড়", zn: "দস্তা" };
const V4_FILL: Record<Layer, string> = { cu: "#c2410c", cloth: "#e0f2fe", zn: "#94a3b8" };

function LayerChip({ l, w = 60, h = 8 }: { l: Layer; w?: number; h?: number }) {
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={l === "cloth" ? 1 : 3} fill={V4_FILL[l]} stroke={l === "cloth" ? "#7dd3fc" : "#57534e"} strokeWidth={0.6} />
      {l === "cloth" && [-18, -6, 6, 18].map((x) => <circle key={x} cx={x} cy={0} r={0.9} fill="#38bdf8" />)}
    </g>
  );
}

const X4A_SAY = [
  "একটা একটা করে সাজানো শুরু।",
  "তামার চাকতি।",
  "ভেজা কাপড়।",
  "দস্তার চাকতি। এক কোষ শেষ।",
  "আবার তামা দিয়ে শুরু।",
  "ভেজা কাপড়।",
  "দস্তা। দুই কোষ।",
  "তামা, তিন নম্বর কোষ শুরু।",
  "ভেজা কাপড়।",
  "দস্তা। তিন কোষ উঠলো, বাল্ব পুরো জ্বললো।",
];

export function PileStack() {
  const s = useScene(9, [600, 500, 500, 900, 500, 500, 900, 500, 500]);
  const k = s.k;
  const cells = Math.floor(k / 3);
  const say = X4A_SAY[k];
  const base = 100;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{say}</span>}>
      <svg viewBox="0 0 200 116" className="mx-auto block h-auto w-full max-w-[13rem]" role="img" aria-label="copper, wet cloth and zinc discs stacking in order, three times, then a bulb lighting">
        <rect width={200} height={116} rx={10} fill="white" />
        <rect x={64} y={base + 4} width={40} height={4} rx={1} fill="#78350f" />
        {Array.from({ length: k }, (_, i) => (
          <g key={i} transform={`translate(84 ${base - i * 8})`} className={POP}>
            <LayerChip l={V4_ORDER[i % 3]} />
          </g>
        ))}
        {cells > 0 && (
          <g className={FADE}>
            <path d={`M104 ${base - k * 8 + 4}H140V${20 - (cells - 1) * 4}`} fill="none" stroke="#b45309" strokeWidth={1.2} />
            <path d={`M64 ${base + 4}H36V${20 - (cells - 1) * 4}`} fill="none" stroke="#b45309" strokeWidth={1.2} />
            <circle cx={88} cy={16 - (cells - 1) * 4} r={9 + cells * 2} fill="#fde047" opacity={0.15 + cells * 0.1} />
            <circle cx={88} cy={16 - (cells - 1) * 4} r={8} fill={cells >= 3 ? "#fef08a" : "white"} stroke="#64748b" strokeWidth={1.2} />
          </g>
        )}
        <text x={140} y={108} textAnchor="middle" fontSize={7} fill={MUTE}>
          কোষ: <tspan fontFamily="ui-monospace, monospace">{cells}</tspan>
        </text>
        {k >= 1 && k <= 9 && (
          <text key={k} x={20} y={20} fontSize={7.5} fontWeight={700} fill={INK} className={FADE}>
            {V4_NAME[V4_ORDER[(k - 1) % 3]]}
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the comb's spark flashes
//      and is gone; the pile keeps the bulb lit, the current running round;
//      the torch cell on the desk sits beside it.

const X4_SAY = [
  "চিরুনির চার্জ: একটা ঝিলিক, তারপর শেষ।",
  "ভোল্টার ব্যাটারি: যতক্ষণ স্তূপ আছে, ততক্ষণ প্রবাহ।",
  "1800 সালে ব্যাটারি আসার পর বিদ্যুৎ নিয়ে নানা ধরনের গবেষণা শুরু হয়।",
  "টেবিলের torch-এর ব্যাটারিটাও এই স্তূপের বংশধর।",
];

export function SparkVsSteady() {
  const s = useScene(3, [600, 2000, 2400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X4_SAY[k]}</span>}>
      <svg viewBox="0 0 240 100" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="left: a comb's spark flashes and is gone; right: a pile keeps a bulb lit">
        <rect width={240} height={100} rx={10} fill="white" />
        <g transform="translate(50 46)">
          <Comb x={0} y={0} s={2.4} />
        </g>
        {k === 0 ? (
          <path d="M50 54l-4 8l6 -2l-4 10" fill="none" stroke="#eab308" strokeWidth={2} className={POP} />
        ) : (
          <text x={50} y={74} textAnchor="middle" fontSize={8} fill={MUTE} className={FADE}>
            শেষ
          </text>
        )}
        <path d="M120 16V92" stroke="#e2e8f0" />
        {k >= 1 && (
          <g className={FADE}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <g key={i} transform={`translate(160 ${84 - i * 6})`}>
                <LayerChip l={V4_ORDER[i % 3]} w={30} h={5} />
              </g>
            ))}
            <path d="M175 52H210V40M175 86H222V40" fill="none" stroke="#b45309" strokeWidth={1.2} />
            <Flow d="M175 52H210V40" on />
            <circle cx={216} cy={30} r={12} fill="#fde047" opacity={0.4} />
            <circle cx={216} cy={30} r={8} fill="#fef08a" stroke="#64748b" />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <Cell x={140} y={20} s={1.3} />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: করিম চাচা's compass on the
//      desk, needle north; ফাহিম lays the wire over it along the needle; হামজা
//      doubts anything will happen.

export function KarimCompass({}: Story) {
  const s = useScene(3, [600, 2200, 2000, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Karim chacha's compass on the desk; Fahim lays the wire over it along the needle; Nasib doubts anything will happen">
        <Desk x={90} w={140} />
        <Compass x={160} y={112} r={12} />
        <Cell x={104} y={114} />
        {k >= 2 ? <path d="M122 117H136V100H160V124H176" fill="none" stroke="#b45309" strokeWidth={1.2} className={FADE} /> : <path d="M122 117q20 -6 40 2" fill="none" stroke="#b45309" strokeWidth={1.2} />}
        <Chacha x={66} y={150} arm={k >= 1 ? "point" : "down"} />
        <Person who="fahim" x={k >= 2 ? 190 : 236} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} walking={k === 2} label />
        <Person who="nasib" x={292} y={150} facing={-1} mood={k >= 3 ? "smug" : "plain"} label />
        {k === 1 && <Bubble x={66} y={84} side="right" lines={["কাঁটা সবসময়", "উত্তরে থাকে।"]} />}
        {k >= 3 && <Bubble x={292} y={84} side="left" lines={["তারে বিদ্যুৎ, কম্পাসে", "চুম্বক। কী হবে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · Two experiments, one after the other. 1820, অরস্টেড: close the switch;
//     the current runs and the needle swings off north. 1831, ফ্যারাডে ও
//     হেনরি: drag the magnet in and out of the coil; the bulb flickers only
//     while it moves. Passes after the switch and three flickers.

const W5_BASE = ["coulomb", "rumford", "volta", "kelvin"];

export function WireCompass() {
  const pass = useGate();
  const [part, setPart] = useSeed<"a" | "b">("part", "a");
  const [on, setOn] = useSeed("on", false);
  const [aDone, setADone] = useSeed("aDone", false);
  const [mx, setMx] = useSeed("mx", 24);
  const [glow, setGlow] = useSeed("glow", 0);
  const [flicks, setFlicks] = useSeed("flicks", 0);
  const [done, setDone] = useSeed("done", false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; m: number } | null>(null);
  const lit = useRef(0);
  const dim = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bDone = flicks >= 3;

  const toggle = () => {
    const n = !on;
    setOn(n);
    sfx.click();
    if (n) setADone(true);
  };
  const flash = (g: number, hold: number) => {
    if (g > 0.35 && lit.current <= 0.35) {
      const n = flicks + 1;
      setFlicks(n);
      if (n >= 3 && aDone && !done) {
        setDone(true);
        pass("প্রবাহ চুম্বক বানায়, চুম্বক নড়লে প্রবাহ।");
      }
    }
    lit.current = g;
    setGlow(g);
    if (dim.current) clearTimeout(dim.current);
    dim.current = setTimeout(() => {
      lit.current = 0;
      setGlow(0);
    }, hold);
  };
  const near = (m: number) => m + 60 > 150 && m < 230;
  const onDown = (e: PointerEvent<SVGGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, m: mx };
    setDragging(true);
  };
  const onMove = (e: PointerEvent<SVGGElement>) => {
    const d = drag.current;
    if (!d) return;
    const { scale } = svgX(e);
    const dx = (e.clientX - d.x) * scale;
    d.x = e.clientX;
    const m = Math.max(4, Math.min(176, d.m + dx));
    d.m = m;
    setMx(m);
    if (near(m) && Math.abs(dx) > 0.5) flash(Math.min(1, Math.abs(dx) / 5), 180);
  };
  const onUp = () => {
    drag.current = null;
    setDragging(false);
  };
  const push = () => {
    const m = mx > 100 ? 24 : 150;
    setMx(m);
    sfx.whoosh(0.3);
    flash(0.9, 520);
  };

  const up = [...W5_BASE, ...(aDone ? ["oersted"] : []), ...(bDone ? ["faraday"] : [])];
  const msg =
    part === "a"
      ? on
        ? "প্রবাহ চললো, আর কাঁটা ঘুরে গেলো! তারটা নিজেই চুম্বকের মতো টানছে।"
        : aDone
          ? "প্রবাহ বন্ধ, কাঁটা আবার উত্তরে।"
          : "সুইচে tap করে তারে প্রবাহ চালু করুন। কাঁটার দিকে চোখ রাখুন।"
      : glow > 0
        ? "নড়ছে, তাই জ্বলছে!"
        : flicks === 0
          ? "চুম্বকটা টেনে কয়েলের ভেতরে-বাইরে করুন।"
          : "থামলেই নিভে যায়। আবার নাড়ান।";

  return (
    <>
      <RopeStrip up={up} pop={["oersted", "faraday"]} />
      <div className="mb-1.5 flex justify-center gap-1.5">
        <button type="button" onClick={() => setPart("a")} className={`rounded-full border-2 px-3 py-0.5 text-sm font-semibold ${part === "a" ? "border-cat-blue bg-cat-blue/10" : "border-border"}`}>
          <span className="font-mono">1820</span> অরস্টেড
        </button>
        <button type="button" onClick={() => aDone && setPart("b")} disabled={!aDone} className={`rounded-full border-2 px-3 py-0.5 text-sm font-semibold disabled:opacity-40 ${part === "b" ? "border-cat-blue bg-cat-blue/10" : "border-border"}`}>
          <span className="font-mono">1831</span> ফ্যারাডে, হেনরি
        </button>
      </div>
      {part === "a" ? (
        <svg viewBox="0 0 320 120" className="block h-auto w-full select-none" role="img" aria-label="a cell, a switch and a wire running over a compass; closing the switch swings the needle">
          <rect width={320} height={120} rx={10} fill="#f5efe6" />
          <g transform="translate(24 84)">
            <Cell x={0} y={0} s={2} />
          </g>
          <path d="M60 91H96V80M96 66V16H200V108H14V91H24" fill="none" stroke="#b45309" strokeWidth={1.6} />
          <Compass x={200} y={62} r={26} deg={on ? -62 : 0} />
          <path d="M200 36V88" stroke="#b45309" strokeWidth={1.6} opacity={0.55} className="pointer-events-none" />
          <Flow d="M60 91H96V66V16H200V108H14V91H24" on={on} color={RED} />
          <g onClick={toggle} role="button" aria-label="the switch" className="cursor-pointer">
            <rect x={80} y={60} width={32} height={28} fill="transparent" />
            <circle cx={96} cy={80} r={2.4} fill="#57534e" />
            <circle cx={96} cy={66} r={2.4} fill="#57534e" />
            <path d={on ? "M96 80V66" : "M96 80L106 68"} stroke="#334155" strokeWidth={2.4} strokeLinecap="round" className="transition-[d] duration-200 motion-reduce:transition-none" />
            <text x={118} y={76} fontSize={7} fontWeight={700} fill={MUTE}>
              সুইচ
            </text>
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 320 120" className="block h-auto w-full touch-none select-none" role="img" aria-label="a bar magnet to drag in and out of a coil; a bulb on the coil lights only while the magnet moves">
          <rect width={320} height={120} rx={10} fill="#f5efe6" />
          <path d="M160 80V104H292V60M230 80V96H276V60" fill="none" stroke="#b45309" strokeWidth={1.4} />
          <Flow d="M230 80V96H276V60" on={glow > 0} color={RED} />
          {/* coil, back half */}
          {Array.from({ length: 8 }, (_, i) => (
            <path key={`b${i}`} d={`M${162 + i * 9} 80Q${158 + i * 9} 62 ${162 + i * 9} 44`} fill="none" stroke="#a16207" strokeWidth={1.4} />
          ))}
          {/* magnet */}
          <g
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            role="button"
            aria-label="the magnet: drag it in and out of the coil"
            style={{ transform: `translateX(${mx}px)` }}
            className={`cursor-grab ${dragging ? "" : "transition-transform duration-500 ease-in-out motion-reduce:transition-none"}`}
          >
            <rect x={-6} y={40} width={72} height={44} fill="transparent" />
            <rect x={0} y={53} width={30} height={18} fill={BLUE} />
            <rect x={30} y={53} width={30} height={18} fill={RED} />
            <text x={15} y={65} textAnchor="middle" fontSize={8} fontWeight={800} fill="white">
              S
            </text>
            <text x={45} y={65} textAnchor="middle" fontSize={8} fontWeight={800} fill="white">
              N
            </text>
          </g>
          {/* coil, front half */}
          {Array.from({ length: 8 }, (_, i) => (
            <path key={`f${i}`} d={`M${162 + i * 9} 44Q${170 + i * 9} 62 ${162 + i * 9} 80`} fill="none" stroke="#ca8a04" strokeWidth={1.6} className="pointer-events-none" />
          ))}
          {glow > 0 && <circle cx={284} cy={40} r={16 + glow * 8} fill="#fde047" opacity={0.2 + glow * 0.4} />}
          <circle cx={284} cy={40} r={11} fill={glow > 0 ? "#fef08a" : "white"} stroke="#64748b" strokeWidth={1.2} />
          <rect x={277} y={51} width={14} height={7} rx={1} fill="#94a3b8" />
          <path d="M40 98h-14m0 0l4 -3m-4 3l4 3M60 98h14m0 0l-4 -3m4 3l-4 3" stroke={MUTE} strokeWidth={0.9} fill="none" />
          <text x={196} y={114} textAnchor="middle" fontSize={7} fill={MUTE}>
            কয়েল
          </text>
        </svg>
      )}
      <div className="mt-2 min-h-12 text-center text-[0.95rem]">{msg}</div>
      <div className="mt-1 flex justify-center">
        {part === "a" ? (
          aDone && !on ? (
            <button type="button" onClick={() => setPart("b")} className={primaryBtn}>
              এবার 1831
            </button>
          ) : (
            <button type="button" onClick={toggle} className={smallBtn}>
              সুইচ {on ? "বন্ধ করুন" : "চালু করুন"}
            </button>
          )
        ) : (
          <button type="button" onClick={push} className={smallBtn}>
            ভেতরে-বাইরে করুন
          </button>
        )}
      </div>
      <Ticks
        items={[
          ["1820: সুইচ", aDone],
          [`1831: বাল্ব জ্বলা ${Math.min(3, flicks)}/3`, bDone],
        ]}
      />
      <Task done={done}>সুইচ চালু করে কাঁটা দেখুন। তারপর 1831-এ চুম্বক নাড়িয়ে বাল্বটা তিনবার জ্বালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: বিদ্যুৎ and চুম্বক as two
//      boxes with a wall between; the 1820 arrow runs one way, the 1831 arrow
//      the other; the wall cracks.

const X5_SAY = [
  "দুইটা ঘর: বিদ্যুৎ আর চুম্বক। মাঝখানে দেয়াল।",
  "1820: অরস্টেড। বিদ্যুৎপ্রবাহ দিয়ে চুম্বক তৈরি করা যায়।",
  "1831: ফ্যারাডে এবং হেনরি। ঠিক উল্টা: চৌম্বক ক্ষেত্রের পরিবর্তন করে বিদ্যুৎ।",
  "রাস্তা দুই দিকেই খোলা। দেয়ালে ফাটল।",
];

export function TwoWays() {
  const s = useScene(3, [600, 2200, 2400, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5_SAY[k]}</span>}>
      <svg viewBox="0 0 240 100" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="two boxes, electricity and magnetism; arrows run both ways; the wall between them cracks">
        <rect width={240} height={100} rx={10} fill="white" />
        <rect x={16} y={36} width={70} height={28} rx={6} fill="#fef2f2" stroke={RED} strokeWidth={1.4} />
        <text x={51} y={54} textAnchor="middle" fontSize={10} fontWeight={700} fill={RED}>
          বিদ্যুৎ
        </text>
        <rect x={154} y={36} width={70} height={28} rx={6} fill="#eff6ff" stroke={BLUE} strokeWidth={1.4} />
        <text x={189} y={54} textAnchor="middle" fontSize={10} fontWeight={700} fill={BLUE}>
          চুম্বক
        </text>
        <path d="M120 10V90" stroke="#94a3b8" strokeWidth={4} opacity={k >= 3 ? 0.25 : 1} className="transition-opacity duration-700 motion-reduce:transition-none" />
        {k >= 3 && <path d="M116 18l6 10l-5 8l7 10l-6 12l5 10" fill="none" stroke="#475569" strokeWidth={1.2} className={FADE} />}
        {k >= 1 && (
          <g>
            <Draw d="M60 34Q120 0 180 34" ms={900} className="stroke-[#b45309]" strokeWidth={1.8} />
            <path d="M180 34l-7 -1l3 -5Z" fill="#b45309" className={POP} />
            <text x={120} y={14} textAnchor="middle" fontSize={7} fontFamily="ui-monospace, monospace" fill={MUTE}>
              1820
            </text>
          </g>
        )}
        {k >= 2 && (
          <g>
            <Draw d="M180 66Q120 100 60 66" ms={900} className="stroke-[#0f766e]" strokeWidth={1.8} />
            <path d="M60 66l7 1l-3 5Z" fill="#0f766e" className={POP} />
            <text x={120} y={96} textAnchor="middle" fontSize={7} fontFamily="ui-monospace, monospace" fill={MUTE}>
              1831
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · Maxwell, 1864. Give the charge at the antenna a push: a changing
//     electric field makes a magnetic loop beside it, that makes an electric
//     one, and on and on: the wave walks off by itself. Then race it against a
//     torch's light: they reach the wall together.

const M6_LOOPS = 9;

export function MaxwellWave() {
  const pass = useGate();
  const [chained, setChained] = useSeed("chained", false);
  const [raced, setRaced] = useSeed("raced", false);
  const chain = usePlay(170);
  const race = usePlay(1500);
  const [rx] = useTween([raced || race.running ? 296 : 34], 1400);
  const shown = chain.running ? chain.k : chained ? M6_LOOPS : 0;

  const push = () => {
    if (chain.running) return;
    sfx.whoosh(0.3);
    chain.play(M6_LOOPS, () => setChained(true));
  };
  const go = () => {
    if (race.running || raced) return;
    sfx.whoosh(1.2);
    race.play(1, () => {
      setRaced(true);
      sfx.chime();
      pass("আলোও বিদ্যুৎ চৌম্বকীয় তরঙ্গ।");
    });
  };
  const wave = (x0: number, x1: number, y: number) => {
    let d = `M${x0} ${y}`;
    for (let x = x0; x <= x1; x += 3) d += `L${x} ${y + Math.sin((x - x0) / 5) * 4}`;
    return d;
  };
  const msg = raced
    ? "একসাথে পৌঁছালো! এই তরঙ্গের বেগ আর আলোর বেগ এক।"
    : chained
      ? "বিদ্যুৎ ক্ষেত্র জন্ম দিলো চৌম্বক ক্ষেত্রের, সেটা আবার বিদ্যুতের… তরঙ্গ নিজে নিজেই চললো। কোনো তার লাগে না।"
      : "অ্যান্টেনার চার্জটাকে একটা ধাক্কা দিন।";

  return (
    <>
      <RopeStrip up={[...W5_BASE, "oersted", "faraday", ...(raced ? ["maxwell"] : [])]} pop={["maxwell"]} />
      <svg viewBox="0 0 320 132" className="block h-auto w-full" role="img" aria-label="an antenna; red electric and blue magnetic loops make each other one after another and run off as a wave; below, the wave races a torch beam to a wall">
        <rect width={320} height={132} rx={10} fill="#f5efe6" />
        <text x={40} y={14} fontSize={7} fontWeight={700} fill={RED}>
          — বিদ্যুৎ ক্ষেত্র
        </text>
        <text x={120} y={14} fontSize={7} fontWeight={700} fill={BLUE}>
          — চৌম্বক ক্ষেত্র
        </text>
        <path d="M22 26V66" stroke="#475569" strokeWidth={2.4} />
        <circle cx={22} cy={chain.running ? (chain.k % 2 ? 40 : 52) : 46} r={4} fill={RED} className="transition-[cy] duration-150 motion-reduce:transition-none" />
        {Array.from({ length: shown }, (_, i) => {
          const x = 46 + i * 29;
          const e = i % 2 === 0;
          return (
            <g key={i} className={POP}>
              {e ? <ellipse cx={x} cy={46} rx={6} ry={16} fill="none" stroke={RED} strokeWidth={1.6} /> : <ellipse cx={x} cy={46} rx={14} ry={6} fill="none" stroke={BLUE} strokeWidth={1.6} />}
              {i > 0 && <path d={`M${x - 19} 70l6 0m0 0l-3 -2m3 2l-3 2`} stroke={MUTE} strokeWidth={0.7} fill="none" />}
            </g>
          );
        })}
        {/* the race */}
        <path d="M300 82V126" stroke="#78350f" strokeWidth={3} />
        <text x={30} y={88} fontSize={6.5} fill={MUTE}>
          তরঙ্গ
        </text>
        <text x={30} y={122} fontSize={6.5} fill={MUTE}>
          torch-এর আলো
        </text>
        {(chained || raced) && <path d={wave(34, rx, 98)} fill="none" stroke={RED} strokeWidth={1.4} />}
        {(chained || raced) && <path d={wave(36, rx, 100)} fill="none" stroke={BLUE} strokeWidth={1} opacity={0.7} />}
        <rect x={14} y={106} width={16} height={8} rx={2} fill="#334155" />
        {(race.running || raced) && <path d={`M30 110H${rx}`} stroke="#facc15" strokeWidth={4} strokeLinecap="round" />}
        {raced && (
          <text x={290} y={80} textAnchor="end" fontSize={8} fontWeight={800} fill="#15803d" className={POP}>
            সমান!
          </text>
        )}
      </svg>
      <div className="mt-2 min-h-12 text-center text-[0.95rem]">{msg}</div>
      <div className="mt-1 flex justify-center gap-2">
        {!chained ? (
          <button type="button" onClick={push} disabled={chain.running} className={primaryBtn}>
            ধাক্কা দিন
          </button>
        ) : (
          <button type="button" onClick={go} disabled={race.running || raced} className={primaryBtn}>
            আলোর সাথে দৌড়
          </button>
        )}
      </div>
      <Ticks
        items={[
          ["তরঙ্গ চললো", chained],
          ["বেগ মাপা", raced],
        ]}
      />
      <Task done={raced}>চার্জটাকে ধাক্কা দিয়ে দেখুন কী ছুটে যায়। তারপর সেটাকে torch-এর আলোর সাথে দৌড়ে দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · Figures for screen 6's explanation, no task. TwoFaces: one coin, a
//      বিদ্যুৎ face and a চুম্বক face; its name lands last. YoungBands: 1801,
//      light through two slits paints bright and dark bands, as only a wave
//      does.

const X6_SAY = [
  "ম্যাক্সওয়েল পরিবর্তনশীল বিদ্যুৎ ও চৌম্বক ক্ষেত্রকে একই সূত্রের মাঝে নিয়ে এলেন।",
  "এক পিঠে বিদ্যুৎ।",
  "আরেক পিঠে চুম্বক।",
  "একটাই পয়সা। একই বলের দুই রূপ: বিদ্যুৎ চৌম্বকীয় বল।",
];

export function TwoFaces() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6_SAY[k]}</span>}>
      <svg viewBox="0 0 240 100" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="one coin: an electricity face, a magnetism face, and its name, electromagnetism">
        <rect width={240} height={100} rx={10} fill="white" />
        {k === 0 && (
          <g className={FADE}>
            <rect x={40} y={30} width={60} height={24} rx={5} fill="#fef2f2" stroke={RED} />
            <text x={70} y={46} textAnchor="middle" fontSize={9} fontWeight={700} fill={RED}>
              বিদ্যুৎ
            </text>
            <rect x={140} y={30} width={60} height={24} rx={5} fill="#eff6ff" stroke={BLUE} />
            <text x={170} y={46} textAnchor="middle" fontSize={9} fontWeight={700} fill={BLUE}>
              চুম্বক
            </text>
            <Draw d="M104 42H136" ms={700} className="stroke-[#64748b]" strokeWidth={1.4} />
          </g>
        )}
        {k === 1 && (
          <g key="e" className="origin-center transition-[scale] duration-500 [transform-box:fill-box] motion-reduce:transition-none starting:scale-x-0">
            <circle cx={120} cy={42} r={30} fill="#fef2f2" stroke={RED} strokeWidth={2} />
            <path d="M124 22l-10 20h11l-8 20" fill="none" stroke={RED} strokeWidth={2.6} strokeLinejoin="round" />
          </g>
        )}
        {k === 2 && (
          <g key="m" className="origin-center transition-[scale] duration-500 [transform-box:fill-box] motion-reduce:transition-none starting:scale-x-0">
            <circle cx={120} cy={42} r={30} fill="#eff6ff" stroke={BLUE} strokeWidth={2} />
            <path d="M106 28v16a14 14 0 0 0 28 0v-16" fill="none" stroke={BLUE} strokeWidth={5} />
            <path d="M106 28v6M134 28v6" stroke={RED} strokeWidth={5} />
          </g>
        )}
        {k >= 3 && (
          <g key="both" className={POP}>
            <path d="M120 12a30 30 0 0 0 0 60Z" fill="#fef2f2" />
            <path d="M120 12a30 30 0 0 1 0 60Z" fill="#eff6ff" />
            <circle cx={120} cy={42} r={30} fill="none" stroke="#7c3aed" strokeWidth={2} />
            <path d="M110 26l-7 15h8l-6 15" fill="none" stroke={RED} strokeWidth={2.2} strokeLinejoin="round" />
            <path d="M126 30v10a7 7 0 0 0 14 0v-10" fill="none" stroke={BLUE} strokeWidth={3.4} />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={40} y={78} width={160} height={16} rx={4} fill="#f5f3ff" stroke="#7c3aed" />
            <text x={120} y={89} textAnchor="middle" fontSize={8} fontWeight={700} fill="#6d28d9">
              বিদ্যুৎ চৌম্বকীয় বল (Electromagnetism)
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

const X6B_SAY = [
  "1801: ইয়ং আলো পাঠালেন দুইটা সরু ফাঁক দিয়ে।",
  "দুই ফাঁক থেকে ঢেউ ছড়ালো, পুকুরের ঢেউয়ের মতো।",
  "পর্দায় আলো-আঁধারের সারি। এমনটা হয় শুধু তরঙ্গে।",
];

export function YoungBands() {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6B_SAY[k]}</span>}>
      <svg viewBox="0 0 240 100" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="light through two slits spreads as ripples and paints bright and dark bands on a screen">
        <rect width={240} height={100} rx={10} fill="white" />
        <rect x={10} y={44} width={18} height={12} rx={2} fill="#334155" />
        <path d="M28 50H90" stroke="#facc15" strokeWidth={6} opacity={0.8} />
        <path d="M90 10V40M90 46V54M90 60V90" stroke="#475569" strokeWidth={3} />
        {k >= 1 &&
          [10, 22, 34, 46, 58].map((r, i) => (
            <g key={r} style={{ transitionDelay: `${i * 150}ms` }} className={FADE}>
              <path d={`M${90 + r} ${43 - r * 0.9}A${r} ${r} 0 0 1 ${90 + r} ${43 + r * 0.9}`} fill="none" stroke="#eab308" strokeWidth={0.8} opacity={0.7} />
              <path d={`M${90 + r} ${57 - r * 0.9}A${r} ${r} 0 0 1 ${90 + r} ${57 + r * 0.9}`} fill="none" stroke="#eab308" strokeWidth={0.8} opacity={0.7} />
            </g>
          ))}
        <rect x={206} y={10} width={10} height={80} fill="#1e293b" />
        {k >= 2 &&
          [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={206} y={48 + i * 9} width={10} height={4} fill="#fde047" opacity={1 - Math.abs(i) * 0.18} style={{ transitionDelay: `${Math.abs(i) * 120}ms` }} className={FADE} />
          ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn: answer হামজা. Tie the বিদ্যুৎ card to the চুম্বক card with
//     the cards that prove they are one. A right card's thread holds and pulls
//     them closer; a wrong one's thread snaps. Three threads, and the two
//     cards become one.

const Y7: { id: string; name: string; year: string; ok: boolean; nope: string }[] = [
  { id: "oersted", name: "অরস্টেড", year: "1820", ok: true, nope: "" },
  { id: "coulomb", name: "কুলম্ব", year: "1778", ok: false, nope: "সুতা ছিঁড়ে গেলো। কুলম্বের সূত্র শুধু চার্জের মাঝের বল। চুম্বকের কথা সেখানে নেই।" },
  { id: "faraday", name: "ফ্যারাডে, হেনরি", year: "1831", ok: true, nope: "" },
  { id: "rumford", name: "রামফোর্ড", year: "1798", ok: false, nope: "সুতা ছিঁড়ে গেলো। রামফোর্ড দেখিয়েছেন ঘষায় তাপ হয়। বিদ্যুৎ আর চুম্বকের জোড়া সেটা না।" },
  { id: "maxwell", name: "ম্যাক্সওয়েল", year: "1864", ok: true, nope: "" },
  { id: "volta", name: "ভোল্টা", year: "1800", ok: false, nope: "সুতা ছিঁড়ে গেলো। ভোল্টার ব্যাটারি দিলো টানা বিদ্যুৎ। চুম্বক তো সেখানে নেই।" },
];

/** the বিদ্যুৎ and চুম্বক cards `gap` apart, joined by `threads`; merged when `one` */
function TwoCards({ gap, threads, one, y = 40 }: { gap: number; threads: number; one: boolean; y?: number }) {
  const lx = 160 - 38 - gap / 2;
  const rx = 160 + 38 + gap / 2;
  if (one)
    return (
      <g className={POP}>
        <rect x={70} y={y - 16} width={180} height={32} rx={7} fill="#f5f3ff" stroke="#7c3aed" strokeWidth={1.6} />
        <path d={`M78 ${y + 12}H160`} stroke={RED} strokeWidth={2} />
        <path d={`M160 ${y + 12}H242`} stroke={BLUE} strokeWidth={2} />
        <text x={160} y={y + 3} textAnchor="middle" fontSize={11} fontWeight={700} fill="#6d28d9">
          বিদ্যুৎ চৌম্বকীয় বল
        </text>
      </g>
    );
  return (
    <g>
      {Array.from({ length: threads }, (_, i) => (
        <path key={i} d={`M${lx + 36} ${y - 8 + i * 8}H${rx - 36}`} stroke="#0f766e" strokeWidth={1.2} className={FADE} />
      ))}
      <rect x={lx - 36} y={y - 16} width={72} height={32} rx={7} fill="#fef2f2" stroke={RED} strokeWidth={1.6} />
      <text x={lx} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={RED}>
        বিদ্যুৎ
      </text>
      <rect x={rx - 36} y={y - 16} width={72} height={32} rx={7} fill="#eff6ff" stroke={BLUE} strokeWidth={1.6} />
      <text x={rx} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={BLUE}>
        চুম্বক
      </text>
    </g>
  );
}

export function AnswerNasib() {
  const pass = useGate();
  const [tied, setTied] = useSeed<string[]>("tied", []);
  const [cur, setCur] = useSeed<string | null>("cur", null);
  const [nope, setNope] = useSeed<string | null>("nope", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(520);
  const one = tied.length >= 3 && !pl.running;
  const [gap] = useTween([100 * (1 - Math.min(3, tied.length) / 3)], 600);

  const tie = (id: string) => {
    if (pl.running || tied.includes(id) || one) return;
    const c = Y7.find((y) => y.id === id);
    if (!c) return;
    setCur(id);
    setNope(null);
    sfx.rope(0.4);
    pl.play(2, () => {
      setCur(null);
      if (c.ok) {
        const next = [...tied, id];
        setTied(next);
        sfx.click();
        if (next.length >= 3) {
          sfx.chime();
          pass("দুই না, এক বল: বিদ্যুৎ চৌম্বকীয়।");
        }
      } else {
        sfx.snip();
        setNope(id);
        setMiss(miss + 1);
      }
    });
  };
  const c = Y7.find((y) => y.id === cur);
  const lx = 160 - 38 - gap / 2;
  const rx = 160 + 38 + gap / 2;
  const nc = Y7.find((y) => y.id === nope);
  return (
    <>
      <svg viewBox="0 0 320 84" className="block h-auto w-full" role="img" aria-label="the electricity card and the magnetism card, pulled together by threads">
        <rect width={320} height={84} rx={10} fill="#f5efe6" />
        <TwoCards gap={gap} threads={Math.min(3, tied.length)} one={one} y={42} />
        {c && pl.running && (
          <g>
            {pl.k === 0 ? (
              <Draw d={`M${lx + 36} ${58}H${rx - 36}`} ms={450} className={c.ok ? "stroke-[#0f766e]" : "stroke-[#e11d48]"} strokeWidth={1.4} />
            ) : c.ok ? (
              <path d={`M${lx + 36} 58H${rx - 36}`} stroke="#0f766e" strokeWidth={1.4} />
            ) : (
              <g>
                <path d={`M${lx + 36} 58L${(lx + rx) / 2 - 4} 70`} stroke="#e11d48" strokeWidth={1.4} className="transition-opacity duration-500 motion-reduce:transition-none" />
                <path d={`M${rx - 36} 58L${(lx + rx) / 2 + 4} 70`} stroke="#e11d48" strokeWidth={1.4} />
              </g>
            )}
            <text x={160} y={80} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={c.ok ? "#0f766e" : "#e11d48"}>
              {c.name}
            </text>
          </g>
        )}
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {Y7.map((y) => {
          const on = tied.includes(y.id);
          return (
            <button
              key={y.id}
              type="button"
              onClick={() => tie(y.id)}
              disabled={pl.running || on || one}
              className={`cursor-pointer rounded-xl border-2 px-1 py-1.5 text-center leading-tight transition-colors disabled:cursor-default motion-reduce:transition-none ${
                on ? "border-accent bg-accent/10" : nope === y.id ? "border-danger/50" : "border-border hover:border-cat-blue/60"
              }`}
            >
              <div className="text-sm font-semibold">{y.name}</div>
              <div className="font-mono text-xs text-muted">{y.year}</div>
            </button>
          );
        })}
      </div>
      {nc && !pl.running && <Nope key={miss}>{nc.nope}</Nope>}
      <Task done={one}>হামজাকে জবাব দিন: কোন card-গুলো বিদ্যুৎ আর চুম্বককে এক সুতায় বাঁধে? বেঁধে এক করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the merging tree. Five
//      forces at the bottom; বিদ্যুৎ + চুম্বক join (1864); then the weak one
//      joins; মহাকর্ষ and নিউক্লিয়ার reach up to "একটা সূত্র?" with dashes.

const X8_SAY = [
  "আলাদা আলাদা দেখা বলগুলো।",
  "ম্যাক্সওয়েল: বিদ্যুৎ আর চুম্বক এক।",
  "তারপর: বিদ্যুৎ চৌম্বকীয় আর দুর্বল নিউক্লিয় বল এক। ইলেকট্রো উইক ফোর্স।",
  "মহাকর্ষ আর নিউক্লিয়ার বল? ভবিষ্যতে হয়তো একই সূত্রে।",
];

export function FewFormulas() {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  const leaf = (x: number, t: string, c: string) => (
    <g key={t}>
      <rect x={x - 22} y={84} width={44} height={14} rx={4} fill="white" stroke={c} />
      <text x={x} y={94} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={c}>
        {t}
      </text>
    </g>
  );
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X8_SAY[k]}</span>}>
      <svg viewBox="0 0 240 104" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="a tree of forces merging upward toward one formula with a question mark">
        <rect width={240} height={104} rx={10} fill="white" />
        {leaf(26, "বিদ্যুৎ", RED)}
        {leaf(72, "চুম্বক", BLUE)}
        {leaf(118, "দুর্বল", "#0891b2")}
        {leaf(166, "মহাকর্ষ", "#15803d")}
        {leaf(214, "নিউক্লিয়ার", "#b45309")}
        {k >= 1 && (
          <g>
            <Draw d="M26 84L49 66M72 84L49 66" ms={600} className="stroke-[#7c3aed]" strokeWidth={1.4} />
            <g className={POP}>
              <rect x={22} y={52} width={54} height={14} rx={4} fill="#f5f3ff" stroke="#7c3aed" />
              <text x={49} y={62} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#6d28d9">
                বিদ্যুৎ চৌম্বকীয়
              </text>
            </g>
          </g>
        )}
        {k >= 2 && (
          <g>
            <Draw d="M49 52L80 34M118 84L80 34" ms={600} className="stroke-[#0f766e]" strokeWidth={1.4} />
            <g className={POP}>
              <rect x={50} y={20} width={60} height={14} rx={4} fill="#f0fdfa" stroke="#0f766e" />
              <text x={80} y={30} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#0f766e">
                ইলেকট্রো উইক
              </text>
            </g>
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <path d="M110 22L140 12M166 84L150 20M214 84L166 16" fill="none" stroke="#94a3b8" strokeDasharray="3 2" />
            <rect x={132} y={2} width={64} height={14} rx={4} fill="#f8fafc" stroke="#94a3b8" strokeDasharray="3 2" />
            <text x={164} y={12} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={MUTE}>
              একটা সূত্র?
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it: four everyday clips, one at a time. Each plays; tag it বিদ্যুৎ,
//     চুম্বক, or দুইটাই. Every one is both: a wrong tag replays the clip with
//     the half it missed ringed and named.

type Half = "elec" | "mag";
const T9: { id: string; title: string; ring: Record<Half, [number, number, number, string]>; nope: Record<Half, string> }[] = [
  {
    id: "charger",
    title: "ফোন চার্জ হচ্ছে, পাশে কম্পাস।",
    ring: { elec: [70, 66, 22, "তারে প্রবাহ: বিদ্যুৎ"], mag: [168, 70, 22, "কাঁটা ঘুরলো: চুম্বক"] },
    nope: {
      elec: "তারে বিদ্যুৎ, ঠিক। কিন্তু পাশের কাঁটাটা ঘুরলো কেন? চুম্বকও আছে।",
      mag: "কাঁটা ঘুরলো, চুম্বক, ঠিক। কিন্তু ঘোরালো কে? তারের প্রবাহ, মানে বিদ্যুৎ।",
    },
  },
  {
    id: "dynamo",
    title: "হাত ঘুরিয়ে জ্বালানো ডায়নামো torch।",
    ring: { elec: [238, 56, 24, "আলো জ্বলে বিদ্যুতে"], mag: [132, 56, 22, "ভেতরে চুম্বক ঘোরে"] },
    nope: {
      elec: "বাল্ব জ্বলে বিদ্যুতে, ঠিক। কিন্তু বিদ্যুৎ এলো কোথা থেকে? ভেতরে ঘুরছে একটা চুম্বক। ফ্যারাডে!",
      mag: "ভেতরে চুম্বক, ঠিক। আর সেটা ঘুরতেই বাল্ব জ্বললো। মানে বিদ্যুৎও তৈরি হলো।",
    },
  },
  {
    id: "rainbow",
    title: "বৃষ্টির পর রংধনু।",
    ring: { elec: [160, 60, 26, "আলো নিজেই তরঙ্গ"], mag: [160, 60, 26, "আলো নিজেই তরঙ্গ"] },
    nope: {
      elec: "রংধনু তো আলো। আর আলো মানে বিদ্যুৎ চৌম্বকীয় তরঙ্গ। অর্ধেক না, দুইটা একসাথে।",
      mag: "রংধনু তো আলো। আর আলো মানে বিদ্যুৎ চৌম্বকীয় তরঙ্গ। অর্ধেক না, দুইটা একসাথে।",
    },
  },
  {
    id: "lightning",
    title: "দূরে বাজ পড়লো। ঘরে রেডিও বাজছে।",
    ring: { elec: [70, 50, 24, "বাজ: বিদ্যুৎ"], mag: [200, 64, 24, "তরঙ্গ গেলো রেডিওতে"] },
    nope: {
      elec: "বাজ বিদ্যুৎ, ঠিক। কিন্তু দূরের রেডিওতে খড়খড় করলো কেন? বিদ্যুৎ চৌম্বকীয় তরঙ্গ পৌঁছে গেছে।",
      mag: "রেডিওতে গেলো তরঙ্গ, ঠিক। কিন্তু শুরু তো বাজের বিদ্যুৎ থেকে। দুইটাই।",
    },
  },
];
const T9_TAGS: { id: Half | "both"; label: string }[] = [
  { id: "elec", label: "বিদ্যুৎ" },
  { id: "mag", label: "চুম্বক" },
  { id: "both", label: "দুইটাই, একই বল" },
];

function ClipArt({ id, t, ring }: { id: string; t: number; ring: Half[] }) {
  const c = T9.find((x) => x.id === id);
  if (!c) return null;
  const rings = ring.map((h) => c.ring[h]).filter((r, i, a) => a.findIndex((q) => q[3] === r[3]) === i);
  return (
    <g>
      {id === "charger" && (
        <g>
          <rect x={14} y={40} width={16} height={24} rx={3} fill="white" stroke="#94a3b8" />
          <path d="M20 48v6M24 48v6" stroke="#475569" strokeWidth={1.4} />
          <path d="M30 56Q80 90 130 60T250 64" fill="none" stroke="#1f2937" strokeWidth={2} />
          <Flow d="M30 56Q80 90 130 60T250 64" on={t > 0.1} color={RED} />
          <rect x={250} y={46} width={20} height={36} rx={4} fill="#1f2937" />
          <rect x={253} y={50} width={14} height={24} rx={1} fill={t > 0.5 ? "#86efac" : "#334155"} />
          <Compass x={168} y={70} r={16} deg={-55 * t} ms={0} />
        </g>
      )}
      {id === "dynamo" && (
        <g>
          <rect x={80} y={40} width={120} height={32} rx={10} fill="#475569" />
          <rect x={112} y={44} width={40} height={24} rx={4} fill="#e2e8f0" />
          <g transform={`rotate(${t * 720} 132 56)`}>
            <rect x={120} y={53} width={12} height={6} fill={BLUE} />
            <rect x={132} y={53} width={12} height={6} fill={RED} />
          </g>
          <g transform={`rotate(${t * 720} 70 56)`}>
            <path d="M70 56H56" stroke="#78350f" strokeWidth={2.6} strokeLinecap="round" />
            <circle cx={56} cy={56} r={3} fill="#92400e" />
          </g>
          <path d="M200 44l20 -6v36l-20 -6Z" fill="#94a3b8" />
          <path d="M220 38L300 20V92L220 74Z" fill="#fde047" opacity={0.6 * t} />
        </g>
      )}
      {id === "rainbow" && (
        <g>
          <circle cx={36} cy={24} r={12} fill="#facc15" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${200 + i * 16} 10l-4 12`} stroke="#93c5fd" strokeWidth={1} />
          ))}
          {["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"].map((col, i) => (
            <path key={col} d={`M${70 + i * 5} 100A${90 - i * 5} ${76 - i * 5} 0 0 1 ${250 - i * 5} 100`} fill="none" stroke={col} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} opacity={0.85} />
          ))}
        </g>
      )}
      {id === "lightning" && (
        <g>
          <ellipse cx={70} cy={18} rx={40} ry={12} fill="#64748b" />
          <path d="M70 26l-10 20h10l-8 22" fill="none" stroke="#facc15" strokeWidth={3} strokeLinejoin="round" opacity={t > 0.2 ? 1 : 0.15} />
          <path d="M150 90V60l30 -18l30 18v30Z" fill="#e7d7c1" stroke="#a8a29e" />
          <rect x={186} y={66} width={28} height={18} rx={3} fill="#92400e" />
          <circle cx={194} cy={75} r={4} fill="#1f2937" />
          {t > 0.6 && <path d="M218 64l6 -4l-2 6l6 -3M218 80l7 2l-5 3l6 3" fill="none" stroke={MUTE} strokeWidth={1} />}
        </g>
      )}
      {rings.map(([x, y, r, label]) => (
        <g key={label} className={POP}>
          <circle cx={x} cy={y} r={r} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 2" />
          <rect x={x - label.length * 2.4 - 4} y={y + r + 2} width={label.length * 4.8 + 8} height={12} rx={3} fill="#fffbeb" stroke="#f59e0b" strokeWidth={0.6} />
          <text x={x} y={y + r + 10.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#b45309">
            {label}
          </text>
        </g>
      ))}
    </g>
  );
}

function ClipPlay({ id, ring }: { id: string; ring: Half[] }) {
  const [t] = useTween([1], 1600, [0]);
  return (
    <svg viewBox="0 0 320 112" className="block h-auto w-full" role="img" aria-label={`an everyday clip: ${id}`}>
      <rect width={320} height={112} rx={10} fill={id === "rainbow" ? "#e0f2fe" : "#f5efe6"} />
      <ClipArt id={id} t={useSeeded() ? 1 : t} ring={ring} />
    </svg>
  );
}

export function TryTags() {
  const pass = useGate();
  const [idx, setIdx] = useSeed("idx", 0);
  const [wrong, setWrong] = useSeed<Half | null>("wrong", null);
  const [right, setRight] = useSeed("right", false);
  const [miss, setMiss] = useSeed("miss", 0);
  const [runs, setRuns] = useState(0);
  const pl = usePlay(1100);
  const clip = T9[Math.min(idx, T9.length - 1)];
  const over = idx >= T9.length;

  const tag = (id: Half | "both") => {
    if (pl.running || over) return;
    setRuns(runs + 1);
    if (id !== "both") {
      setWrong(id);
      setRight(false);
      setMiss(miss + 1);
      sfx.thump();
      return;
    }
    setWrong(null);
    setRight(true);
    sfx.chime();
    pl.play(1, () => {
      setRight(false);
      const n = idx + 1;
      setIdx(n);
      if (n >= T9.length) pass("যেখানে বিদ্যুৎ, সেখানে চুম্বকও।");
    });
  };
  const ring: Half[] = right ? ["elec", "mag"] : wrong ? [wrong === "elec" ? "mag" : "elec"] : [];
  return (
    <>
      <div className="mb-1 text-center text-sm font-medium text-muted">{over ? "চারটাই দেখা হলো।" : clip.title}</div>
      <ClipPlay key={`${clip.id}${runs}`} id={clip.id} ring={over ? ["elec", "mag"] : ring} />
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {T9_TAGS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => tag(g.id)}
            disabled={pl.running || over}
            className={`cursor-pointer rounded-xl border-2 px-1 py-2 text-center text-sm font-semibold transition-colors disabled:cursor-default motion-reduce:transition-none ${
              right && g.id === "both" ? "border-accent bg-accent/10" : wrong === g.id ? "nudge border-danger/50 text-danger" : "border-border hover:border-cat-blue/60"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      {wrong && !over && <Nope key={miss}>{clip.nope[wrong]}</Nope>}
      <Ticks items={T9.map((c, i): [string, boolean] => [c.id === "charger" ? "চার্জার" : c.id === "dynamo" ? "ডায়নামো" : c.id === "rainbow" ? "রংধনু" : "বাজ", i < idx])} />
      <Task done={over}>প্রতিটা ছবিতে কী আছে: বিদ্যুৎ, চুম্বক, না দুইটাই? চারটা ছবি।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10a · A story scene for the last step's setup, no task: evening. হামজা, on
//       his own, lays the wire over the compass and touches it to the cell.
//       The needle turns. He looks at it a long while and says nothing.

export function NasibTries({}: Story) {
  const s = useScene(3, [600, 2000, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="evening: Nasib lays the wire over the compass and touches it to the cell; the needle turns; he says nothing">
        <path d="M8 24Q160 30 312 24" stroke="#a16207" strokeWidth={1.4} fill="none" />
        {[14, 30, 46, 62, 130, 150, 170, 196, 214, 222, 232, 246, 262, 280].map((x, i) => (
          <rect key={x} x={x} y={30 + (i % 3) * 9} width={9} height={7} rx={1} fill="white" stroke={i < 4 ? "#2563eb" : i < 7 ? "#059669" : i < 9 ? "#7c3aed" : TONE.modern} />
        ))}
        <Desk x={100} w={120} />
        <Cell x={112} y={115} />
        {k >= 1 ? <path d="M130 117H140V100H170V124H186" fill="none" stroke="#b45309" strokeWidth={1.2} className={FADE} /> : <path d="M130 118q20 -6 40 2" fill="none" stroke="#b45309" strokeWidth={1.2} />}
        <Compass x={170} y={112} r={11} deg={k >= 2 ? -60 : 0} ms={600} />
        {k >= 2 && <path d="M170 101V123" stroke="#b45309" strokeWidth={1.2} opacity={0.55} />}
        <Flow d="M130 117H140V100H170V124H186" on={k >= 2} color={RED} w={1} />
        <Person who="samin" x={60} y={150} mood={k >= 3 ? "happy" : "plain"} label />
        <Person who="nasib" x={k >= 1 ? 200 : 270} y={150} facing={-1} arm={k === 1 || k === 2 ? "hold" : "down"} mood={k >= 3 ? "puzzled" : "plain"} walking={k === 1} label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 10 · The bet opened. The sealed pick comes back; "বাজি খুলুন" plays the
//      three answers against the two cards one by one: (a) three threads tie
//      them, so no; (b) they merge, yes; (c) it could not be said before 1864,
//      it can now.

const V10: { ok: "yes" | "no" | "part"; say: string }[] = [
  { ok: "no", say: "অরস্টেড, ফ্যারাডে, ম্যাক্সওয়েল: তিনটা সুতা। আলাদা না।" },
  { ok: "yes", say: "একই বলের দুই রূপ: বিদ্যুৎ চৌম্বকীয় বল।" },
  { ok: "part", say: "1864-এর আগে বলা কঠিন ছিল, সত্যি। ম্যাক্সওয়েলের পর বলা যায়।" },
];

export function BetOpen13() {
  const pass = useGate();
  const [bet] = useSeed<number | null>("bet", S1_BET);
  const [open, setOpen] = useSeed("open", false);
  const pl = usePlay(1100);
  const n = pl.running ? pl.k : open ? 3 : 0;
  const reveal = () => {
    if (open) return;
    setOpen(true);
    sfx.paper();
    pl.play(3, () => pass("বিদ্যুৎ আর চুম্বক: একই বল।"));
  };
  return (
    <>
      <svg viewBox="0 0 320 80" className="block h-auto w-full" role="img" aria-label="the electricity and magnetism cards, tied by three threads, then merged into one">
        <rect width={320} height={80} rx={10} fill="#f5efe6" />
        <TwoCards gap={n >= 2 ? 0 : 100} threads={n >= 1 ? 3 : 0} one={n >= 2} y={40} />
      </svg>
      <div className="mt-2 grid gap-1.5">
        {G1_OPT.map((o, i) => {
          const shown = i < n;
          const v = V10[i];
          return (
            <div
              key={o}
              className={`rounded-xl border-2 px-3 py-1.5 transition-colors motion-reduce:transition-none ${
                !shown ? (bet === i ? "border-cat-blue bg-cat-blue/5" : "border-border") : v.ok === "yes" ? "border-accent bg-accent/10" : v.ok === "part" ? "border-cat-amber/60 bg-cat-amber/5" : "border-danger/50 bg-danger/5"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[0.95rem] font-semibold">
                  {o}
                  {bet === i && <span className="ml-1.5 text-xs font-normal text-cat-blue">আপনার বাজি</span>}
                </span>
                {shown && <span className={`${FADE} shrink-0 text-sm ${v.ok === "yes" ? "text-accent-text" : v.ok === "part" ? "text-cat-amber" : "text-danger"}`}>{v.ok === "yes" ? "ঠিক" : v.ok === "part" ? "কিছুটা" : "না"}</span>}
              </div>
              {shown && <div className={`${FADE} text-xs text-muted`}>{v.say}</div>}
            </div>
          );
        })}
      </div>
      {!open && (
        <div className="mt-2.5 flex justify-center">
          <button type="button" onClick={reveal} className={primaryBtn}>
            বাজি খুলুন
          </button>
        </div>
      )}
      {open && bet === null && !pl.running && <div className={`${FADE} mt-2 text-center text-sm text-muted`}>প্রথম screen-এর বাজিটা মনে করে মিলিয়ে নিন।</div>}
      <Task done={open && !pl.running}>বাজি খুলে তিনটা উত্তর মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for the last step's explanation, no task: the poster. The
//       whole rope, bare after Newton; the 1760–1880 stretch zooms down and
//       fills with today's cards; the three that tied the two forces glow; the
//       stretch after 1880 waits with a "?".

const X10_SAY = [
  "মঙ্গলবারের দড়ি: গ্রিক থেকে নিউটন। তারপর খালি।",
  "আজ ভরলো: 1778 থেকে 1864।",
  "তিনটা card বিদ্যুৎ আর চুম্বককে এক সুতায় বাঁধলো।",
  "1880-এর পরের অংশ? কাল।",
];

export function RopeRecap13() {
  const s = useScene(3, [600, 2000, 2200, 2000]);
  const k = s.k;
  const r = makeRope(FULL, 26);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X10_SAY[k]}</span>}>
      <svg viewBox="0 0 320 112" className="mx-auto block h-auto w-full max-w-[18rem]" role="img" aria-label="the whole poster rope; the stretch from 1760 to 1880 zoomed below and filled with today's cards">
        <rect width={320} height={112} rx={10} fill="white" />
        <RopeLine r={r} tick={100} every={500} />
        <RopeCards r={r} cards={[...GREEK, ...EUROPE]} compact />
        {k >= 1 && <RopeCards r={r} cards={UNIFY} compact />}
        <path d={`M${r.x(1760)} ${r.y + 4}L14 60M${r.x(1880)} ${r.y + 4}L306 60`} stroke="#cbd5e1" strokeDasharray="2 2" />
        {k >= 1 && <UnifyRope y={68} up={UNIFY.map((c) => c.id)} pop={UNIFY.map((c) => c.id)} lit={k >= 2 ? ["oersted", "faraday", "maxwell"] : []} />}
        {k === 0 && <RopeBand r={r} from={1760} to={1880} label="?" dashed above={12} />}
        {k >= 3 && <RopeBand r={r} from={1890} to={2030} label="?" dashed above={12} />}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A mid-journey recap, no task, plain হাতে-কলমে বাংলা: the rope from
//      Coulomb to Maxwell fills in again, one beat per discovery, so the
//      whole chain is seen together before the reader has to argue it back to
//      হামজা. Nothing new — same cards, same years, just retold slowly.

const XR_SAY = [
  "কুলম্ব: বিদ্যুতেরও নিজের একটা সূত্র আছে।",
  "ভোল্টা: চিরুনির ঝলক না, টানা বিদ্যুৎ। ব্যাটারির শুরু।",
  "অরস্টেড, ফ্যারাডে: রাস্তা দুই দিকেই খোলা। বিদ্যুৎ → চুম্বক, চুম্বক → বিদ্যুৎ।",
  "ম্যাক্সওয়েল: দুইটা মিলে তরঙ্গ। বেগ মেপে দেখা গেলো, আলোর বেগের সমান।",
];

const XR_UP = [["coulomb"], ["coulomb", "volta"], ["coulomb", "volta", "oersted", "faraday"], ["coulomb", "volta", "oersted", "faraday", "maxwell"]];
const XR_LIT = [["coulomb"], ["volta"], ["oersted", "faraday"], ["maxwell"]];

export function StoryRecap() {
  const s = useScene(3, [800, 2400, 2600, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{XR_SAY[k]}</span>}>
      <svg viewBox="0 0 320 60" className="mx-auto block h-auto w-full max-w-[18rem]" role="img" aria-label="the 1760 to 1880 rope filling in again, one discovery at a time, retelling the whole chain from Coulomb to Maxwell">
        <rect width={320} height={60} rx={10} fill="#f5efe6" />
        <UnifyRope y={20} up={XR_UP[k]} pop={XR_LIT[k]} lit={XR_LIT[k]} />
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  StoryRecap: { mid: { k: 2 }, end: {} },
  PileStack: { mid: { k: 4 }, end: {} },
  WednesdayDesk: { comb: { k: 1 }, bits: { k: 2 }, compass: { k: 3 }, end: {} },
  TwoTricks: {
    start: {},
    rubbed: { rubs: 2 },
    left: { rubs: 3, down: true, lDone: true, bx: 262 },
    both: { rubs: 3, down: true, lDone: true, bx: 221, stuck: true },
    a: { rubs: 3, down: true, lDone: true, bx: 221, stuck: true, pick: 0 },
    b: { rubs: 3, down: true, lDone: true, bx: 221, stuck: true, pick: 1, sealed: true },
  },
  TwoLands: { amber: { k: 2 }, end: {} },
  HeatCards: { rub: { k: 1 }, end: {} },
  CombCoulomb: { law: { k: 0 }, comb: { k: 1 }, end: {} },
  SparkVsSteady: { spark: { k: 0 }, end: {} },
  KarimCompass: { north: { k: 1 }, end: {} },
  WireCompass: { start: {}, on: { on: true, aDone: true }, b: { part: "b", aDone: true, mx: 130, glow: 0.8, flicks: 1 }, done: { part: "b", aDone: true, mx: 150, flicks: 3, done: true } },
  TwoWays: { one: { k: 1 }, end: {} },
  MaxwellWave: { start: {}, chain: { chained: true }, raced: { chained: true, raced: true } },
  TwoFaces: { elec: { k: 1 }, mag: { k: 2 }, end: {} },
  YoungBands: { waves: { k: 1 }, end: {} },
  AnswerNasib: { start: {}, some: { tied: ["oersted"] }, wrong: { tied: ["oersted", "faraday"], nope: "coulomb", miss: 1 }, one: { tied: ["oersted", "faraday", "maxwell"] } },
  FewFormulas: { em: { k: 1 }, end: {} },
  TryTags: { start: {}, wrong: { idx: 1, wrong: "elec", miss: 1 }, rainbow: { idx: 2 }, lightning: { idx: 3, wrong: "mag", miss: 1 }, over: { idx: 4 } },
  NasibTries: { wire: { k: 1 }, end: {} },
  BetOpen13: { start: { bet: 0 }, open: { bet: 1, open: true } },
  RopeRecap13: { zoom: { k: 1 }, end: {} },
};
