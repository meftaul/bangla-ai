"use client";

import { useEffect } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { FADE, POP, Scene, Ticks, primaryBtn, quietBtn, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Label, Plane, makeFrame, type Tone, type XY } from "@/components/journey/plane";
import { Tup } from "@/components/journey/box";
import { sfx } from "@/components/journey/sfx";
import { BIRD_COLS, BIRD_PX, gray, ink } from "./pixel-art";

// Screens for "Math for AI 1.0 — ফোন কখনো পাখি দেখে নাই", the course's opening
// journey, a short hook, told in the author's Bangla-English.
//
// A winter morning on the veranda. Ammu wants last winter's doyel photo out of
// 4000; Nasib types "bird" and twelve birds come up in a second. Nasib says the
// phone knows birds; Som says it only multiplies and adds. The reader seals a
// bet on how many sums it took (SumsBet) and the Finale settles it. In
// between, three small pieces: file names say nothing (FileNames), a photo is
// a grid of numbers (ZoomBird), and a thing or a word becomes a list, an arrow
// that points the same way as things like it (ThingCards). The end leaves the
// rest as open questions for the course (OpenQuestions). 5 steps.
//
// Story scenes are on the veranda (Porch) with the cast; every <Then> figure
// is watch-only (useScene). Numbers are ASCII; sentences end in "।" like the
// rest of the course. Ink on the stages and sheets is fixed.

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

const INK = "#0f1b2d";
/** a number with Indian grouping: 1,20,000 */
const indian = (n: number) => Math.round(n).toLocaleString("en-IN");

// ---------------------------------------------------------------------------
// Small pictures: the gallery's thumbnails, in a 24 × 24 box.

type ThumbKind = "doyel" | "crow" | "bulbul" | "sparrow" | "cat" | "rice" | "boat" | "cake" | "tree" | "kite" | "face";

const BIRD_LOOK: Record<"doyel" | "crow" | "bulbul" | "sparrow", { bg: string; body: string; head: string; belly: string }> = {
  doyel: { bg: "#bae6fd", body: "#111827", head: "#111827", belly: "#f8fafc" },
  crow: { bg: "#e5e7eb", body: "#1f2937", head: "#111827", belly: "#374151" },
  bulbul: { bg: "#bbf7d0", body: "#78716c", head: "#1c1917", belly: "#fef3c7" },
  sparrow: { bg: "#fef9c3", body: "#a16207", head: "#92400e", belly: "#fde68a" },
};

function ThumbArt({ kind }: { kind: ThumbKind }) {
  if (kind in BIRD_LOOK) {
    const b = BIRD_LOOK[kind as keyof typeof BIRD_LOOK];
    return (
      <g>
        <rect width={24} height={24} fill={b.bg} />
        {kind === "doyel" && <path d="M4 0V24M10 0V24M16 0V24M22 0V24" stroke="#64748b" strokeWidth={0.8} opacity={0.6} />}
        <path d="M0 19H24" stroke="#78350f" strokeWidth={1.4} />
        <path d="M6.5 12.5L1.5 8.5L2.5 14Z" fill={b.body} />
        <ellipse cx={11.5} cy={13} rx={6} ry={4} fill={b.body} />
        <ellipse cx={12} cy={15} rx={4} ry={2} fill={b.belly} />
        {kind === "doyel" && <path d="M8 11.5H13" stroke="#f8fafc" strokeWidth={1} />}
        {kind === "bulbul" && <circle cx={8.5} cy={16} r={1} fill="#dc2626" />}
        <circle cx={16.5} cy={9.5} r={3.2} fill={b.head} />
        <path d="M19.4 9l3 1l-3 1Z" fill="#f59e0b" />
        <circle cx={17.4} cy={8.8} r={0.7} fill="white" />
        <path d="M10.5 17V19M13 17V19" stroke="#78350f" strokeWidth={0.7} />
      </g>
    );
  }
  switch (kind) {
    case "cat":
      return (
        <g>
          <rect width={24} height={24} fill="#fde68a" />
          <path d="M6 9L7 3L11 7ZM18 9L17 3L13 7Z" fill="#ea580c" />
          <circle cx={12} cy={13} r={7} fill="#f97316" />
          <circle cx={9.5} cy={12} r={1} fill={INK} />
          <circle cx={14.5} cy={12} r={1} fill={INK} />
          <path d="M11 15l1 1l1 -1" stroke={INK} strokeWidth={0.6} fill="none" />
        </g>
      );
    case "rice":
      return (
        <g>
          <rect width={24} height={24} fill="#fecaca" />
          <ellipse cx={12} cy={14} rx={10} ry={6} fill="white" stroke="#cbd5e1" strokeWidth={0.6} />
          <ellipse cx={9} cy={13} rx={4.5} ry={3} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={0.5} />
          <ellipse cx={15.5} cy={14.5} rx={3.5} ry={1.6} fill="#f59e0b" />
        </g>
      );
    case "boat":
      return (
        <g>
          <rect width={24} height={24} fill="#bae6fd" />
          <rect y={16} width={24} height={8} fill="#38bdf8" />
          <path d="M4 16H20L17 19H7Z" fill="#78350f" />
          <path d="M12 4V16M12 5L18 14H12Z" stroke="#78350f" strokeWidth={0.6} fill="#fef3c7" />
        </g>
      );
    case "cake":
      return (
        <g>
          <rect width={24} height={24} fill="#e9d5ff" />
          <rect x={5} y={11} width={14} height={9} rx={1} fill="#f9a8d4" />
          <path d="M5 13.5H19" stroke="white" strokeWidth={1} />
          <rect x={11.4} y={6} width={1.2} height={5} fill="#60a5fa" />
          <circle cx={12} cy={5} r={1} fill="#f59e0b" />
        </g>
      );
    case "tree":
      return (
        <g>
          <rect width={24} height={24} fill="#dcfce7" />
          <rect x={11} y={13} width={2} height={9} fill="#78350f" />
          <circle cx={12} cy={10} r={6} fill="#16a34a" />
        </g>
      );
    case "kite":
      return (
        <g>
          <rect width={24} height={24} fill="#bfdbfe" />
          <path d="M12 3L18 10L12 17L6 10Z" fill="#dc2626" />
          <path d="M12 3V17M6 10H18" stroke="#fef3c7" strokeWidth={0.6} />
          <path d="M12 17q-3 3 0 6" stroke={INK} strokeWidth={0.5} fill="none" />
        </g>
      );
    default:
      return (
        <g>
          <rect width={24} height={24} fill="#fed7aa" />
          <circle cx={12} cy={13} r={6.5} fill="#e0ac7e" />
          <path d="M5.5 11q6.5 -9 13 0q-6.5 -4 -13 0Z" fill="#1f1a17" />
          <circle cx={9.8} cy={13} r={0.8} fill={INK} />
          <circle cx={14.2} cy={13} r={0.8} fill={INK} />
          <path d="M10 16q2 1.4 4 0" stroke={INK} strokeWidth={0.6} fill="none" />
        </g>
      );
  }
}

/** a thumbnail as its own small SVG, for HTML places (buttons, cards) */
function Thumb({ kind, className = "size-10" }: { kind: ThumbKind; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`block rounded-md ${className}`} aria-hidden="true">
      <ThumbArt kind={kind} />
    </svg>
  );
}

/** the twelve birds the search brings up */
const TWELVE: ThumbKind[] = ["doyel", "crow", "bulbul", "sparrow", "crow", "sparrow", "bulbul", "doyel", "sparrow", "crow", "bulbul", "sparrow"];
const TILE_TONES = ["#fecaca", "#bbf7d0", "#bfdbfe", "#fde68a", "#e9d5ff", "#fed7aa", "#99f6e4", "#e5e7eb"];

// ---------------------------------------------------------------------------
// A phone in a scene, top-left at (x, y), 40 × 72 before `s`. What its screen
// shows: off, the gallery (scrolled when `scroll`), the search box with "bird"
// typed, the twelve birds, or one photo glowing in the dark.

type Screen = "off" | "gallery" | "search" | "birds" | "glow";

function Handphone({ x, y, s = 1, screen, scroll = false, thumb = "doyel" }: { x: number; y: number; s?: number; screen: Screen; scroll?: boolean; thumb?: ThumbKind }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect width={40} height={72} rx={6} fill="#1e293b" stroke="#0f172a" strokeWidth={1} />
      <rect x={16} y={2.4} width={8} height={1.6} rx={0.8} fill="#475569" />
      {/* a nested svg clips its contents to the screen */}
      <svg x={3} y={6} width={34} height={60} viewBox="0 0 34 60">
        <rect width={34} height={60} fill={screen === "off" ? "#0f172a" : screen === "glow" ? "#dbeafe" : "white"} />
        {screen === "gallery" && (
          <g style={{ transform: `translateY(${scroll ? -44 : 0}px)` }} className="transition-transform duration-[2000ms] ease-in-out motion-reduce:transition-none">
            {Array.from({ length: 30 }, (_, i) => (
              <rect key={i} x={1 + (i % 3) * 11} y={1 + Math.floor(i / 3) * 11} width={10} height={10} rx={1} fill={TILE_TONES[(i * 5) % TILE_TONES.length]} />
            ))}
          </g>
        )}
        {(screen === "search" || screen === "birds") && (
          <g>
            <rect x={2} y={2} width={30} height={8} rx={4} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={0.5} />
            <text x={7} y={7.8} fontSize={5} fontWeight={700} fill={INK}>
              bird
            </text>
          </g>
        )}
        {screen === "birds" &&
          TWELVE.map((k, i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 70}ms` }}>
              <g transform={`translate(${1.5 + (i % 3) * 10.6} ${13 + Math.floor(i / 3) * 11.2}) scale(${9.8 / 24})`}>
                <ThumbArt kind={k} />
              </g>
            </g>
          ))}
        {screen === "glow" && (
          <g key={thumb} className={POP}>
            <g transform="translate(5 18) scale(1)">
              <ThumbArt kind={thumb} />
            </g>
          </g>
        )}
      </svg>
    </g>
  );
}

// ---------------------------------------------------------------------------
// The veranda, the set for the story scenes: a grilled window with the winter
// sun behind it, and a pot plant. On the cast's "room" backdrop.

function Porch({ doyel = false }: { doyel?: boolean }) {
  const bars = Array.from({ length: 13 }, (_, i) => 150 + i * 12);
  return (
    <g className="pointer-events-none">
      <rect x={146} y={12} width={156} height={84} fill="#cfe8ff" />
      <circle cx={276} cy={34} r={11} fill="#fde047" opacity={0.85} />
      <path d={bars.map((b) => `M${b} 12V96`).join("")} stroke="#57534e" strokeWidth={1.6} />
      <path d="M146 40H302M146 70H302" stroke="#57534e" strokeWidth={1.4} />
      <rect x={146} y={12} width={156} height={84} fill="none" stroke="#57534e" strokeWidth={3} />
      {doyel && (
        <g className={POP} opacity={0.75}>
          <g transform="translate(206 44) scale(1.1)">
            <path d="M6.5 12.5L1.5 8.5L2.5 14Z" fill="#111827" />
            <ellipse cx={11.5} cy={13} rx={6} ry={4} fill="#111827" />
            <ellipse cx={12} cy={15} rx={4} ry={2} fill="#f8fafc" />
            <path d="M8 11.5H13" stroke="#f8fafc" strokeWidth={1} />
            <circle cx={16.5} cy={9.5} r={3.2} fill="#111827" />
            <path d="M19.4 9l3 1l-3 1Z" fill="#f59e0b" />
          </g>
        </g>
      )}
      <path d="M296 150L292 132H312L308 150Z" fill="#b45309" />
      <path d="M302 132q-10 -14 -4 -22M302 132q8 -12 2 -24M302 132q2 -10 12 -16" stroke="#15803d" strokeWidth={2.4} fill="none" />
    </g>
  );
}

/** Ammu's tea cup, held at her hands */
function Cup({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y} width={7} height={7} rx={1.5} fill="white" stroke="#94a3b8" strokeWidth={0.7} />
      <path d={`M${x + 7} ${y + 2}q3 1.5 0 3.5`} stroke="#94a3b8" strokeWidth={0.8} fill="none" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: Ammu asks for the doyel
//      photo, Fahim scrolls and scrolls, Nasib types "bird", twelve birds.
//      The phone's screen is shown large on the left.

export function BirdSearch({}: Story) {
  const s = useScene(4, [600, 2400, 2400, 2400]);
  const k = s.k;
  useEffect(() => {
    if (k === 3) sfx.typing(0.5);
  }, [k]);
  const screen: Screen = k >= 4 ? "birds" : k === 3 ? "search" : "gallery";
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="the veranda on a winter morning: Ammu asks for last winter's doyel photo, Fahim scrolls the gallery, Nasib types bird and twelve bird photos come up">
        <Porch doyel={k === 1} />
        {k >= 2 && (
          <g className={FADE}>
            <Handphone x={10} y={22} s={1.4} screen={screen} scroll={k === 2} />
          </g>
        )}
        <Person who="ammu" x={112} y={160} arm={k >= 1 ? "hold" : "down"} mood={k >= 4 ? "happy" : "plain"} label />
        {k >= 1 && <Cup x={120} y={114} />}
        {k === 1 && <Bubble x={112} y={94} side="right" lines={["গ্রিলে দোয়েল বসছিলো।", "ছবিটা খুঁজে দে তো।"]} />}
        <Person who="fahim" x={176} y={160} facing={-1} arm={k === 2 ? "hold" : "down"} mood={k === 2 ? "puzzled" : "plain"} label />
        {k === 2 && <Bubble x={176} y={94} side="mid" tone="think" lines={["4000 ছবি…"]} />}
        <Person who="nasib" x={k >= 3 ? 236 : 360} y={160} facing={-1} walking={k === 3} arm={k >= 3 ? "hold" : "down"} mood="smug" label />
        {k === 3 && <Bubble x={236} y={94} side="left" lines={["bird লিখি।"]} />}
        {k >= 4 && <Bubble x={112} y={94} side="right" lines={["এই তো দোয়েল!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1b · A story scene for screen 1's setup, no task: Nasib says the phone
//      knows birds; Som says it only multiplies and adds; Nasib asks how many.

export function OnlySums({}: Story) {
  const s = useScene(3, [600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Nasib says the phone knows birds; Som says it only multiplies and adds; Nasib asks how many sums then">
        <Porch />
        <Person who="nasib" x={100} y={160} arm={k === 1 ? "point" : "down"} mood="smug" label />
        {k === 1 && <Bubble x={100} y={94} side="right" lines={["ফোন পাখি চেনে।", "ভিতরে AI আছে।"]} />}
        {k === 3 && <Bubble x={100} y={94} side="right" lines={["তাহলে কয়টা গুণ", "লাগলো, বল?"]} />}
        <Person who="som" x={k >= 2 ? 200 : 360} y={160} facing={-1} walking={k === 2} label />
        {k === 2 && <Bubble x={200} y={94} side="left" lines={["চেনে না। শুধু", "গুণ আর যোগ করে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The bet: how many sums did the phone do to find the twelve? Three piles,
//     each a picture: a handful, a sack, a hill. The picked pile lands beside
//     the phone with a "?" on it, then it is sealed. Nothing is marked; the
//     Finale settles it.

const B1_PILES = ["100 টার মতো", "10 লাখের মতো", "1 লাখ কোটির বেশি"];

/** a pile of beads, one sum each, in a 64 × 40 box */
function PileArt({ i }: { i: number }) {
  if (i === 0)
    return (
      <g>
        {[
          [26, 36],
          [32, 36],
          [38, 36],
          [29, 31],
          [35, 31],
          [32, 26],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={2.6} fill="#f59e0b" stroke="#b45309" strokeWidth={0.6} />
        ))}
      </g>
    );
  if (i === 1)
    return (
      <g>
        <path d="M18 39Q12 20 24 14H40Q52 20 46 39Z" fill="#d6b98c" stroke="#92400e" strokeWidth={1} />
        <path d="M24 14Q32 9 40 14" stroke="#92400e" strokeWidth={1.2} fill="none" />
        {[26, 31, 36].map((x) => (
          <circle key={x} cx={x} cy={12} r={2.2} fill="#f59e0b" stroke="#b45309" strokeWidth={0.5} />
        ))}
      </g>
    );
  const beads: XY[] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c <= r; c++) beads.push([32 - r * 3.4 + c * 6.8, 5 + r * 4.5]);
  return (
    <g>
      <path d="M32 2L2 39H62Z" fill="#fde68a" stroke="#b45309" strokeWidth={1} />
      {beads.map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={1.7} fill="#f59e0b" />
      ))}
    </g>
  );
}

export function SumsBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const seal = () => {
    setSealed(true);
    sfx.stamp();
    pass("বাজি সিল হলো। শেষে মিলিয়ে দেখবো।");
  };
  return (
    <>
      <svg viewBox="0 0 260 104" className="mx-auto block h-auto w-full max-w-[17rem]" role="img" aria-label="Ammu's phone with the twelve birds, and beside it the pile of sums you bet on, with a question mark">
        <Handphone x={14} y={10} s={1.15} screen="birds" />
        <path d="M70 50H104" stroke="#94a3b8" strokeWidth={1.4} strokeDasharray="3 3" />
        <path d="M104 50l-5 -3v6Z" fill="#94a3b8" />
        <rect x={110} y={8} width={140} height={88} rx={10} fill="white" stroke="#cbd5e1" />
        <text x={180} y={24} textAnchor="middle" fontSize={10} fontWeight={700} fill={INK}>
          কয়টা গুণ-যোগ?
        </text>
        {bet === null ? (
          <text x={180} y={66} textAnchor="middle" fontSize={26} fontWeight={800} fill="#94a3b8">
            ?
          </text>
        ) : (
          <g key={bet} className={POP}>
            <g transform="translate(140 30) scale(1.1)">
              <PileArt i={bet} />
            </g>
            <text x={180} y={88} textAnchor="middle" fontSize={9} fontWeight={700} fill="#b45309">
              {B1_PILES[bet]} ?
            </text>
          </g>
        )}
        {sealed && (
          <g className={POP}>
            <g transform="rotate(-12 222 30)">
              <rect x={196} y={22} width={52} height={17} rx={3} fill="white" stroke="#d97706" strokeWidth={1.6} />
              <text x={222} y={34} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#d97706">
                বাজি সিল
              </text>
            </g>
          </g>
        )}
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {B1_PILES.map((p, i) => (
          <button
            key={p}
            type="button"
            disabled={sealed}
            onClick={() => setBet(i)}
            className={`flex cursor-pointer flex-col items-center rounded-xl border-2 px-1 py-1.5 text-center text-sm leading-tight transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${
              bet === i ? "border-cat-blue bg-cat-blue/10" : bet !== null && sealed ? "border-border opacity-50" : "border-border hover:border-cat-blue/60"
            }`}
          >
            <svg viewBox="0 0 64 42" className="block h-auto w-16" aria-hidden="true">
              <PileArt i={i} />
            </svg>
            <span className="mt-1">{p}</span>
          </button>
        ))}
      </div>
      {!sealed ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={seal} disabled={bet === null} className={primaryBtn}>
            বাজি সিল করুন
          </button>
        </div>
      ) : (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-muted`}>বাজি সিল হলো। শেষে মিলিয়ে দেখবো।</div>
      )}
      <Task done={sealed}>একটা স্তূপ বেছে নিন, তারপর বাজি সিল করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the phone as a closed
//      box. The photo goes in, the word goes in, twelve birds come out, and
//      the middle stays a "?". It stops on the question.

const X1_SAY = [
  "ফোনের ভিতরটা আপাতত একটা বন্ধ বাক্স।",
  "একদিকে ঢুকলো আম্মুর ছবিগুলো।",
  "আরেকদিকে ঢুকলো একটা শব্দ, bird।",
  "বের হলো বারোটা পাখির ছবি।",
  "মাঝখানে কী হলো? শুধু গুণ-যোগ দিয়ে?",
];

export function BlackBox() {
  const s = useScene(4, [600, 1600, 2200, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1_SAY[k]}</span>}>
      <svg viewBox="0 0 280 120" className="mx-auto block h-auto w-full max-w-[17rem]" role="img" aria-label="the phone as a closed box: photos and the word bird go in, twelve birds come out, the middle is a question">
        <rect x={104} y={34} width={72} height={60} rx={10} fill="#1e293b" />
        <text x={140} y={48} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#cbd5e1">
          ফোনের ভিতর
        </text>
        <g style={{ transform: `translateX(${k >= 1 ? 62 : 0}px)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
          <g transform="translate(14 52)">
            <ThumbArt kind="doyel" />
          </g>
        </g>
        {k >= 2 && (
          <g className={FADE}>
            <g>
              <rect x={122} y={8} width={36} height={16} rx={4} fill="white" stroke="#e0664f" strokeWidth={1.4} />
              <text x={140} y={19.5} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#be123c">
                bird
              </text>
              <path d="M140 25V33" stroke="#e0664f" strokeWidth={1.4} />
            </g>
          </g>
        )}
        {k >= 3 &&
          [0, 1, 2, 3].map((i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 160}ms` }}>
              <g transform={`translate(${186 + (i % 2) * 26} ${40 + Math.floor(i / 2) * 26}) scale(${22 / 24})`}>
                <ThumbArt kind={TWELVE[i]} />
              </g>
            </g>
          ))}
        {k >= 3 && (
          <text x={264} y={100} textAnchor="end" fontSize={9} fontWeight={700} fill="#475569" className={FADE}>
            × 12
          </text>
        )}
        {k >= 4 && (
          <text x={140} y={84} textAnchor="middle" fontSize={30} fontWeight={800} fill="#fbbf24" className={POP}>
            ?
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: Nasib's first claim, the
//      phone reads the photo's name.

export function NasibNames({}: Story) {
  const s = useScene(2, [600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Nasib says the phone reads each photo's name, which says bird; Fahim opens the gallery">
        <Porch />
        <Person who="nasib" x={96} y={160} arm={k >= 1 ? "point" : "down"} mood="smug" label />
        {k === 1 && <Bubble x={96} y={94} side="right" lines={["ছবির নাম পড়ে! নামে", "bird লেখা থাকে।"]} />}
        <Person who="fahim" x={176} y={160} facing={-1} arm={k >= 2 ? "hold" : "down"} mood={k >= 2 ? "puzzled" : "plain"} label />
        {k >= 2 && (
          <g className={FADE}>
            <Handphone x={196} y={104} s={0.42} screen="gallery" />
          </g>
        )}
        {k >= 2 && <Bubble x={176} y={94} side="left" tone="think" lines={["দেখি তো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · Ammu's gallery, nine photos. A tap turns a photo over to show its file
//     name on the back. Three of them, the doyel's among them: every name is
//     IMG, a date and a time. No bird anywhere.

const X2_PICS: { kind: ThumbKind; name: string }[] = [
  { kind: "rice", name: "IMG_20250103_133012.jpg" },
  { kind: "kite", name: "IMG_20250106_162245.jpg" },
  { kind: "cat", name: "IMG_20250109_081530.jpg" },
  { kind: "tree", name: "IMG_20250111_101902.jpg" },
  { kind: "doyel", name: "IMG_20250112_073104.jpg" },
  { kind: "cake", name: "IMG_20250115_200741.jpg" },
  { kind: "boat", name: "IMG_20250118_171126.jpg" },
  { kind: "face", name: "IMG_20250120_094418.jpg" },
  { kind: "crow", name: "IMG_20250121_120355.jpg" },
];
const X2_DOYEL = 4;

export function FileNames() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const done = seen.length >= 3 && seen.includes(X2_DOYEL);
  const flip = (i: number) => {
    setOpen(open.includes(i) ? open.filter((o) => o !== i) : [...open, i]);
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (!done && next.length >= 3 && next.includes(X2_DOYEL)) pass("নামে শুধু তারিখ আর সময়। পাখি নাই।");
  };
  return (
    <>
      <div className="mx-auto grid max-w-[18rem] grid-cols-3 gap-1.5">
        {X2_PICS.map((p, i) => {
          const on = open.includes(i);
          return (
            <button key={p.name} type="button" onClick={() => flip(i)} aria-label={on ? p.name : "ছবিটা উল্টান"} className="aspect-square cursor-pointer [perspective:600px]">
              <span
                className={`relative block size-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${on ? "[transform:rotateY(180deg)]" : ""}`}
              >
                <span className="absolute inset-0 overflow-hidden rounded-lg [backface-visibility:hidden]">
                  <Thumb kind={p.kind} className="size-full" />
                </span>
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-[#1e293b] px-1 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span className="text-[0.65rem] text-[#94a3b8]">নাম</span>
                  <span className="font-mono text-[0.62rem] leading-tight break-all text-white">{p.name}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <Ticks
        items={[
          ["তিনটা ছবির নাম", seen.length >= 3],
          ["দোয়েলের নাম", seen.includes(X2_DOYEL)],
        ]}
      />
      <Task done={done}>তিনটা ছবি উল্টে নাম পড়ুন। দোয়েলেরটাও।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the doyel's file name
//      taken apart. IMG, the date, the time, and no bird in it.

const X2_PARTS: { t: string; say?: string }[] = [
  { t: "IMG", say: "image, মানে ছবি" },
  { t: "_" },
  { t: "20250112", say: "2025 সালের জানুয়ারি মাসের 12 তারিখ" },
  { t: "_" },
  { t: "073104", say: "সকাল 7 টা 31 মিনিট 04 second" },
  { t: ".jpg" },
];
/** which part lights up at beat k */
const X2_LIT = [-1, 0, 2, 4, -1];
const X2_SAY = ["দোয়েলের ছবির নাম।", "প্রথমে IMG।", "তারপর তারিখ।", "তারপর সময়।", "পাখি কোথাও নাই।"];

export function NameDecoded() {
  const s = useScene(4, [600, 2200, 2200, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X2_SAY[k]}</span>}>
      <div className="mx-auto max-w-[17rem]">
        <div className="relative flex justify-center rounded-lg bg-[#1e293b] px-2 py-2 font-mono text-[0.95rem] text-white">
          {X2_PARTS.map((p, i) => (
            <span
              key={i}
              className={`rounded px-px transition-colors duration-300 motion-reduce:transition-none ${X2_LIT[k] === i ? "bg-cat-amber text-[#0f1b2d]" : ""}`}
            >
              {p.t}
            </span>
          ))}
          {k >= 4 && <span className={`${POP} absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 bg-danger`} />}
        </div>
        <div className="mt-2 grid min-h-[4.5rem] gap-1 text-sm">
          {X2_PARTS.map((p, i) =>
            p.say && k >= X2_LIT.indexOf(i) && X2_LIT.indexOf(i) > 0 ? (
              <div key={i} className={`${FADE} flex items-baseline gap-2`}>
                <span className="w-16 shrink-0 text-right font-mono text-xs text-muted">{p.t}</span>
                <span>{p.say}</span>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · Zoom into the doyel. Four steps, each closer to its eye; the view
//     glides there. At the last step the squares carry their numbers: the eye
//     near 0, the glint in it 255, the white cheek high.

const X3_VIEW: [number, number, number][] = [
  [0, 0, 40],
  [22, 4, 16],
  [26, 8, 8],
  [28, 10, 5],
];
/** the photo's 1600 squares, drawn once */
const X3_CELLS = BIRD_PX.map((v, i) => <rect key={i} x={i % BIRD_COLS} y={Math.floor(i / BIRD_COLS)} width={1.02} height={1.02} fill={gray(v)} />);

export function ZoomBird() {
  const pass = useGate();
  const [level, setLevel] = useSeed("level", 0);
  const [x, y, w] = useTween(X3_VIEW[level], 700);
  const [vx, vy, vw] = X3_VIEW[level];
  const zoom = (d: 1 | -1) => {
    const next = Math.max(0, Math.min(3, level + d));
    setLevel(next);
    if (next === 3) pass("ছবি মানে সংখ্যার ছক। 0 কালো, 255 সাদা।");
  };
  let grid = "";
  if (level >= 2) {
    for (let i = 0; i <= vw; i++) grid += `M${vx + i} ${vy}V${vy + vw}M${vx} ${vy + i}H${vx + vw}`;
  }
  return (
    <>
      <svg
        viewBox={`${x} ${y} ${w} ${w}`}
        shapeRendering="crispEdges"
        className="mx-auto block aspect-square h-auto w-full max-w-[15rem] rounded-xl ring-1 ring-black/10"
        role="img"
        aria-label={level === 3 ? "the doyel's eye up close: 25 squares, each with its number" : "the doyel photo, zoomed in"}
      >
        {X3_CELLS}
        {grid && <path d={grid} stroke="white" strokeOpacity={0.5} strokeWidth={vw / 160} fill="none" className={FADE} />}
        {level === 3 &&
          Array.from({ length: 25 }, (_, j) => {
            const c = vx + (j % 5);
            const r = vy + Math.floor(j / 5);
            const v = BIRD_PX[r * BIRD_COLS + c];
            return (
              <text key={j} x={c + 0.5} y={r + 0.6} textAnchor="middle" fontSize={0.3} fontWeight={700} fontFamily="ui-monospace, monospace" fill={ink(v)} className={FADE}>
                {v}
              </text>
            );
          })}
      </svg>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button type="button" onClick={() => zoom(-1)} disabled={level === 0} className={quietBtn}>
          − zoom
        </button>
        <button type="button" onClick={() => zoom(1)} disabled={level === 3} className={primaryBtn}>
          + zoom
        </button>
      </div>
      <div className="mt-2 text-center text-sm text-muted">
        এখন দেখছেন <span className="font-mono">{vw} × {vw} = {vw * vw}</span> টা ঘর
      </div>
      <Task done={level === 3}>Zoom করতে থাকুন, যতক্ষণ না দোয়েলের চোখে সংখ্যা দেখা যায়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: how many numbers are in
//      one of Ammu's photos. 4000 across, 3000 down, 1 crore 20 lakh squares,
//      and three numbers a square in colour.

const X3_SAY = [
  "আম্মুর ফোনের একটা ছবি।",
  "পাশাপাশি 4000 টা ঘর।",
  "উপর-নিচে 3000 টা।",
  "মোট 4000 × 3000 = 1 কোটি 20 লাখ ঘর।",
  "রঙিন ছবিতে ঘরপ্রতি 3 টা সংখ্যা। লাল, সবুজ, নীল। মোট 3 কোটি 60 লাখ সংখ্যা।",
];

export function PixelCount() {
  const s = useScene(4, [600, 1600, 1600, 2400]);
  const k = s.k;
  let grid = "";
  for (let i = 1; i < 16; i++) grid += `M${70 + i * 8} 30V120`;
  for (let i = 1; i < 12; i++) grid += `M70 ${30 + i * 7.5}H190`;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3_SAY[k]}</span>}>
      <svg viewBox="0 0 260 136" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="one photo, 4000 squares across and 3000 down, three numbers per square in colour">
        {k >= 4 &&
          ["#fca5a5", "#86efac"].map((c, i) => (
            <rect key={c} x={70 + (2 - i) * 8} y={30 - (2 - i) * 8} width={120} height={90} rx={2} fill={c} stroke="#64748b" strokeWidth={0.6} className={POP} />
          ))}
        {k >= 4 && <rect x={70} y={30} width={120} height={90} rx={2} fill="#93c5fd" className={POP} />}
        <svg x={70} y={30} width={120} height={90} viewBox="0 5 40 30" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" opacity={k >= 4 ? 0.8 : 1}>
          {X3_CELLS}
        </svg>
        {k >= 3 && <path d={grid} stroke="white" strokeOpacity={0.55} strokeWidth={0.6} className={FADE} />}
        {k >= 1 && (
          <g className={FADE}>
            <path d="M70 22H190M70 18V26M190 18V26" stroke="#475569" strokeWidth={1} />
            <text x={130} y={16} textAnchor="middle" fontSize={9} fontWeight={700} fill="#475569">
              4000 ঘর
            </text>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d="M200 30V120M196 30H204M196 120H204" stroke="#475569" strokeWidth={1} />
            <text x={208} y={79} fontSize={9} fontWeight={700} fill="#475569">
              3000 ঘর
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: Nasib's real twist, bird
//      is a word, not a picture.

export function NasibWord({}: Story) {
  const s = useScene(2, [600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Nasib holds up the word bird: a photo may be numbers, but bird is a word; Fahim wonders how a word and a photo can be matched">
        <Porch />
        <Person who="nasib" x={96} y={160} arm={k >= 1 ? "hold" : "down"} mood="smug" label />
        {k >= 1 && <CastCard x={110} y={112} text="bird" tone="coral" />}
        {k === 1 && <Bubble x={96} y={94} side="right" lines={["ছবি না হয় সংখ্যা।", "bird তো শব্দ!"]} />}
        <Person who="fahim" x={186} y={160} facing={-1} mood={k >= 2 ? "puzzled" : "plain"} label />
        {k >= 2 && <Bubble x={186} y={94} side="left" tone="think" lines={["শব্দ আর ছবি", "মিলবে কীভাবে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · Five things as two numbers each: how much it flies, how much it lives
//     in water. A tap puts a thing's card on the paper and draws its arrow.
//     The birds and the word bird point one way; the ilish another.

const X4_SLOTS = ["উড়তে পারে", "পানিতে থাকে"];
const X4_THINGS: { name: string; v: XY; tone: Tone; at: [number, number]; word?: boolean }[] = [
  { name: "দোয়েল", v: [4, 1], tone: "blue", at: [-2, 14] },
  { name: "কাক", v: [5, 2], tone: "blue", at: [5, -2] },
  { name: "হাঁস", v: [3, 4], tone: "teal", at: [5, -4] },
  { name: "ইলিশ", v: [0, 5], tone: "teal", at: [8, 4] },
  { name: "bird", v: [5, 1], tone: "coral", at: [5, 4], word: true },
];
const X4_F = makeFrame(0, 5.6, 0, 5.6, 30, 18);

export function ThingCards() {
  const pass = useGate();
  const [placed, setPlaced] = useSeed<number[]>("placed", []);
  const last = placed.length ? X4_THINGS[placed[placed.length - 1]] : null;
  const place = (i: number) => {
    if (placed.includes(i)) return;
    const next = [...placed, i];
    setPlaced(next);
    if (next.length === X4_THINGS.length) pass("যা-ই হোক, শেষে সংখ্যার একটা list।");
  };
  return (
    <>
      <div className="mx-auto w-full max-w-[13.5rem]">
        <Plane f={X4_F} grid={1} ticks={1} label="paper with two axes, flies and lives in water; each placed thing is an arrow" className="my-0! max-w-none">
          <Label f={X4_F} at={[5.6, 0]} dy={22} anchor="end" size={9} className="fill-[#5a6b7d]">
            উড়তে পারে →
          </Label>
          <Label f={X4_F} at={[0, 5.6]} dx={4} dy={4} anchor="start" size={9} className="fill-[#5a6b7d]">
            ↑ পানিতে থাকে
          </Label>
          {placed.map((i) => {
            const t = X4_THINGS[i];
            return (
              <g key={t.name}>
                <Arrow f={X4_F} from={[0, 0]} to={t.v} tone={t.tone} draw />
                <Label f={X4_F} at={t.v} dx={t.at[0]} dy={t.at[1]} anchor="start" size={10} weight={700} className={`${POP} fill-[#0f1b2d]`}>
                  {t.name}
                </Label>
              </g>
            );
          })}
        </Plane>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {X4_THINGS.map((t, i) => {
          const on = placed.includes(i);
          return (
            <button
              key={t.name}
              type="button"
              onClick={() => place(i)}
              disabled={on}
              className={`cursor-pointer rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${
                on ? "border-cat-blue bg-cat-blue/10" : t.word ? "border-cat-coral/60 text-cat-coral hover:bg-cat-coral/5" : "border-border hover:border-cat-blue/60"
              }`}
            >
              {t.word ? (
                <>
                  <span className="font-mono">bird</span> শব্দ
                </>
              ) : (
                t.name
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 min-h-6 text-center text-[0.95rem]">
        {last && (
          <span key={last.name} className={FADE}>
            {last.name}: <span className="font-mono"><Tup v={last.v} of={X4_SLOTS} /></span>
          </span>
        )}
      </div>
      <Task done={placed.length === X4_THINGS.length}>পাঁচটাই tap করুন। Arrow গুলো কোন দিকে যায়, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the photo and the word
//      each become a list, and on paper the two arrows point almost the same
//      way. A photo and a word, matched without either being "understood".

const X4B_F = makeFrame(0, 5.2, 0, 2.6, 17, 0);
const X4B_SAY = [
  "একদিকে দোয়েলের ছবি, আরেকদিকে bird শব্দ।",
  "ছবি থেকে একটা list।",
  "শব্দ থেকেও একটা list। একই দুইটা ঘর।",
  "কাগজে আঁকলে দুইটা arrow।",
  "দুইটাই প্রায় একই দিকে। ছবি আর শব্দ মিলে গেলো।",
];

export function BothBecomeArrows() {
  const s = useScene(4, [600, 1600, 2200, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X4B_SAY[k]}</span>}>
      <svg viewBox="0 0 280 110" className="mx-auto block h-auto w-full max-w-[17rem]" role="img" aria-label="the doyel photo becomes the list (4, 1) and the word bird becomes (5, 1); drawn as arrows, they point almost the same way">
        <g transform="translate(8 14)">
          <ThumbArt kind="doyel" />
        </g>
        <rect x={4} y={70} width={32} height={18} rx={4} fill="white" stroke="#e0664f" strokeWidth={1.4} />
        <text x={20} y={82.5} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#be123c">
          bird
        </text>
        {k >= 1 && (
          <g className={FADE}>
            <path d="M40 26H62" stroke="#94a3b8" strokeWidth={1.2} />
            <CastCard x={88} y={26} text="(4, 1)" tone="blue" />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d="M40 79H62" stroke="#94a3b8" strokeWidth={1.2} />
            <CastCard x={88} y={79} text="(5, 1)" tone="coral" />
          </g>
        )}
        {k >= 3 && (
          <g transform="translate(150 20)">
            <rect x={0} y={0} width={X4B_F.W} height={X4B_F.H} rx={3} fill="white" stroke="#cbd5e1" />
            <path d={`M0 ${X4B_F.H}H${X4B_F.W}M0 0V${X4B_F.H}`} stroke="#0f1b2d" strokeOpacity={0.4} />
            <Arrow f={X4B_F} from={[0, 0]} to={[4, 1]} tone="blue" draw />
            <Arrow f={X4B_F} from={[0, 0]} to={[5, 1]} tone="coral" draw delay={300} />
            {k >= 4 && <path d={`M${X4B_F.sx(0)} ${X4B_F.sy(0)}L${X4B_F.sx(5.2)} ${X4B_F.sy(1.45)}L${X4B_F.sx(5.2)} ${X4B_F.sy(0.9)}Z`} fill="#f59e0b" opacity={0.18} className={FADE} />}
          </g>
        )}
        {k >= 4 && (
          <text x={206} y={78} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#b45309" className={FADE}>
            একই দিকে
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for the last step's setup, no task: night, the phone on
//       the table, charging. Its screen lights up photo after photo while a
//       counter climbs to 4000.

const S10_COUNT = ["", "1 / 4000", "2000 / 4000", "4000 / 4000"];
const S10_THUMB: ThumbKind[] = ["doyel", "doyel", "rice", "boat"];

export function NightCharge({}: Story) {
  const s = useScene(3, [600, 1800, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="night: Ammu's phone charges on the table, its screen lighting up photo after photo as a counter climbs to 4000">
        <rect width={320} height={180} fill="#0f172a" opacity={0.86} />
        <rect x={40} y={24} width={60} height={46} rx={3} fill="#1e3a5f" />
        <circle cx={82} cy={38} r={6} fill="#f8fafc" opacity={0.8} />
        <rect x={60} y={128} width={200} height={8} rx={2} fill="#78350f" />
        <path d="M76 136V170M244 136V170" stroke="#78350f" strokeWidth={4} />
        <path d="M168 126Q176 150 290 150V130" stroke="#475569" strokeWidth={1.6} fill="none" />
        <rect x={284} y={120} width={14} height={12} rx={2} fill="#e2e8f0" />
        {k >= 1 && <ellipse cx={160} cy={100} rx={46} ry={40} fill="#93c5fd" opacity={0.12} className={FADE} />}
        <Handphone x={143} y={66} s={0.85} screen={k >= 1 ? "glow" : "off"} thumb={S10_THUMB[k]} />
        {k >= 1 && <CastCard key={k} x={228} y={96} text={S10_COUNT[k]} tone="blue" />}
        {k >= 3 && <path d="M218 112l5 5l10 -10" stroke="#34d399" strokeWidth={2.4} fill="none" strokeLinecap="round" className={POP} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · The bet settled. Three sums revealed in turn, each counting up: one
//     photo made into a list (about 30 crore even for a small model),
//     times 4000 photos, then the search's own matching. The total lands on
//      the third pile.

const F_ROWS: { what: string; to: number; unit: string; words: string }[] = [
  { what: "একটা ছবিকে সংখ্যার list বানাতে", to: 30, unit: "কোটি", words: "প্রায় 30 কোটি গুণ-যোগ" },
  { what: "4000 টা ছবি, প্রতিটা একবার করে", to: 120000, unit: "কোটি", words: "30 কোটি × 4000 = 1 লাখ 20 হাজার কোটি" },
  { what: "Search এর সময় bird এর সাথে মিলানো: 4000 ছবি × 512 টা সংখ্যা", to: 2048000, unit: "", words: "মাত্র 20 লাখ 48 হাজার" },
];

export function Finale() {
  const pass = useGate();
  const [shown, setShown] = useSeed("shown", 0);
  const nums = useTween(
    F_ROWS.map((r, i) => (i < shown ? r.to : 0)),
    1400,
  );
  const next = () => {
    const n = shown + 1;
    setShown(n);
    if (n === F_ROWS.length) pass("1 লাখ কোটির বেশি। সব গুণ-যোগ।");
  };
  const done = shown === F_ROWS.length;
  return (
    <>
      <div className="mx-auto grid max-w-sm gap-1.5">
        {F_ROWS.map((r, i) => (
          <div key={r.what} className={`rounded-xl border-2 px-3 py-1.5 transition-colors duration-300 motion-reduce:transition-none ${i < shown ? "border-cat-blue/50 bg-cat-blue/5" : "border-dashed border-border"}`}>
            <div className="text-sm text-muted">{r.what}</div>
            {i < shown ? (
              <div className={FADE}>
                <span className="font-mono text-lg font-bold tabular-nums">{indian(nums[i])}</span>
                {r.unit && <span className="ml-1 font-semibold">{r.unit}</span>}
                <div className="text-xs text-muted">{r.words}</div>
              </div>
            ) : (
              <div className="font-mono text-lg text-muted">?</div>
            )}
          </div>
        ))}
      </div>
      {!done ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={next} className={primaryBtn}>
            {shown === 0 ? "গোনা শুরু করুন" : "পরের হিসাব"}
          </button>
        </div>
      ) : (
        <div className={`${FADE} mt-3 grid grid-cols-3 gap-2`}>
          {B1_PILES.map((p, i) => (
            <div key={p} className={`flex flex-col items-center rounded-xl border-2 px-1 py-1 text-center text-xs leading-tight ${i === 2 ? "win-pop border-accent bg-accent/10" : "border-border opacity-50"}`}>
              <svg viewBox="0 0 64 42" className="block h-auto w-12" aria-hidden="true">
                <PileArt i={i} />
              </svg>
              <span className="mt-0.5">{p}</span>
            </div>
          ))}
        </div>
      )}
      <Task done={done}>তিনটা হিসাব একটা একটা করে খুলুন। তারপর বাজির সাথে মিলান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for the last step's explanation, no task: the questions
//      this journey leaves open, one at a time, each a card with a "?". The
//      course answers them; this figure only asks.

const X5_QS = [
  "একটা ছবি ঠিক কীভাবে সংখ্যা হয়?",
  "একটা শব্দ কীভাবে arrow হয়?",
  "দুইটা arrow একই দিকে কি না, ফোন মাপে কীভাবে?",
  "কোন সংখ্যা কোথায় বসবে, ফোন শেখে কীভাবে?",
];
const X5_SAY = ["প্রথম প্রশ্ন।", "দ্বিতীয় প্রশ্ন।", "তৃতীয় প্রশ্ন।", "আর সবচেয়ে মজার প্রশ্ন।", "উত্তর গুলো সামনের lesson গুলোতে, একটা একটা করে unwrap হবে।"];

export function OpenQuestions() {
  const s = useScene(4, [600, 1600, 1600, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5_SAY[k]}</span>}>
      <div className="mx-auto grid max-w-[17rem] gap-1.5">
        {X5_QS.map((q, i) =>
          i <= k ? (
            <div key={q} className={`${FADE} flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-sm ${i === k && k < 4 ? "border-cat-amber bg-cat-amber/10" : "border-border"}`}>
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cat-amber/20 font-bold text-cat-amber">?</span>
              <span>{q}</span>
            </div>
          ) : (
            <div key={q} className="h-9 rounded-xl border-2 border-dashed border-border" />
          ),
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names).

export const fixtures: Fixtures = {
  BirdSearch: { scroll: { k: 2 }, typed: { k: 3 } },
  OnlySums: { som: { k: 2 } },
  SumsBet: { start: {}, picked: { bet: 2 }, sealed: { bet: 2, sealed: true } },
  BlackBox: { mid: { k: 2 } },
  FileNames: { start: {}, some: { open: [4], seen: [4] }, done: { open: [0, 4, 8], seen: [0, 4, 8] } },
  NameDecoded: { date: { k: 2 } },
  ZoomBird: { start: {}, near: { level: 2 }, eye: { level: 3 } },
  PixelCount: { total: { k: 3 } },
  ThingCards: { start: {}, two: { placed: [0, 3] }, all: { placed: [0, 1, 2, 3, 4] } },
  BothBecomeArrows: { cards: { k: 2 } },
  NightCharge: { mid: { k: 2 } },
  Finale: { start: {}, two: { shown: 2 }, all: { shown: 3 } },
  OpenQuestions: { mid: { k: 1 }, end: { k: 4 } },
};
