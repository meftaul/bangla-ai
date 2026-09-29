"use client";

import { useEffect, useId, useState } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Draw, FADE, Nope, POP, Scene, Ticks, primaryBtn, quietBtn, usePlay, useScene, useSeed, useSeeded, useTween, type Fixtures } from "@/components/journey/kit";
import { Bubble, Person, Stage, Stall, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";

// Screens for "Physics 1.1 — মেলার কোন stall পদার্থবিজ্ঞান না?", told as a Journey.
//
// Monday, the school by the Brahmaputra in Mymensingh. Twelve stalls are chalked
// on the field for Friday's science fair, and রশিদ স্যার says the physics club may
// hang its banner on every stall that is physics. নাসিব: chemistry and biology
// are separate, there is no physics in them. The reader bets which stalls get a
// banner (FairMap), then earns the answer piece by piece: the tower of sciences
// (chemistry on physics, biology on chemistry), matter all the way down to
// quarks, the six kinds of energy, the five hybrid stalls, the nine branches on
// two shelves. Then the map again with no help (YourTurn), a phone battery as a
// new case (TryIt), and the bet settled (BetSettle): eleven banners, one poetry
// stall. 9 steps.
//
// The fair map (FairField, STALLS, StallIcon) is exported for 1.6, which comes
// back to the same field.
//
// Words are the author's Banglish with the book's Bangla terms kept word for
// word (students sit exams in them). Bubbles are narrated the story-bangla-prose
// way. Every scene and figure is fixed ink, the same in light and dark.

type Story = { story?: boolean };

const INK = "#0f1b2d";
const MUTE = "#5a6b7d";

// ---------------------------------------------------------------------------
// The fair: twelve stalls, the icon on each, and whether it is physics.

export type IconKind = "salt" | "leaf" | "scope" | "heart" | "bond" | "quake" | "xray" | "chip" | "radio" | "speaker" | "stove" | "poem";
export type StallDef = { id: IconKind; name: string; physics: boolean; why: string };

export const STALLS: StallDef[] = [
  { id: "salt", name: "রসায়ন", physics: true, why: "দাঁড়িয়ে আছে পদার্থবিজ্ঞানের উপর" },
  { id: "leaf", name: "জীববিজ্ঞান", physics: true, why: "রসায়নের উপর, তার নিচে পদার্থবিজ্ঞান" },
  { id: "scope", name: "Astrophysics", physics: true, why: "Astronomy + পদার্থবিজ্ঞান" },
  { id: "heart", name: "Biophysics", physics: true, why: "জীববিজ্ঞান + পদার্থবিজ্ঞান" },
  { id: "bond", name: "Chemical Physics", physics: true, why: "রসায়ন + পদার্থবিজ্ঞান" },
  { id: "quake", name: "Geophysics", physics: true, why: "ভূ-তত্ত্ব + পদার্থবিজ্ঞান" },
  { id: "xray", name: "Medical Physics", physics: true, why: "চিকিৎসাবিজ্ঞান + পদার্থবিজ্ঞান" },
  { id: "chip", name: "ইলেকট্রনিক্স", physics: true, why: "কঠিন অবস্থার পদার্থবিজ্ঞান" },
  { id: "radio", name: "রেডিও", physics: true, why: "বিদ্যুৎ ও চৌম্বক বিজ্ঞান" },
  { id: "speaker", name: "সাউন্ড বক্স", physics: true, why: "শব্দবিজ্ঞান" },
  { id: "stove", name: "রান্নার চুলা", physics: true, why: "তাপ ও তাপগতিবিজ্ঞান" },
  { id: "poem", name: "কবিতা", physics: false, why: "কবিতা লেখা পদার্থ-শক্তির হিসাব না" },
];
const TRUTH = STALLS.map((s, i) => (s.physics ? i : -1)).filter((i) => i >= 0);

/** A stall's picture, about 20 units across, centred at (x, y). */
export function StallIcon({ kind, x, y, s = 1 }: { kind: IconKind; x: number; y: number; s?: number }) {
  const line = { stroke: "#334155", strokeWidth: 1, fill: "none", strokeLinecap: "round" as const };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      {kind === "salt" && (
        <>
          <rect x={-8} y={-1} width={6} height={6} fill="white" stroke="#64748b" strokeWidth={0.8} />
          <rect x={-2} y={-6} width={7} height={7} fill="white" stroke="#64748b" strokeWidth={0.8} />
          <rect x={3} y={1} width={5} height={5} fill="white" stroke="#64748b" strokeWidth={0.8} />
        </>
      )}
      {kind === "leaf" && (
        <>
          <path d="M-8 6Q-8 -8 8 -8Q8 6 -8 6Z" fill="#22c55e" stroke="#15803d" strokeWidth={0.8} />
          <path d="M-8 6L5 -5" stroke="#15803d" strokeWidth={0.8} />
        </>
      )}
      {kind === "scope" && (
        <>
          <path d="M-8 4L6 -5" stroke="#334155" strokeWidth={4.5} strokeLinecap="round" />
          <path d="M-2 1L-6 9M-2 1L2 9" {...line} />
          <circle cx={8} cy={-8} r={1.5} fill="#eab308" />
        </>
      )}
      {kind === "heart" && <path d="M0 7C-10 0 -9 -8 -4 -8C-2 -8 0 -6 0 -4C0 -6 2 -8 4 -8C9 -8 10 0 0 7Z" fill="#e11d48" />}
      {kind === "bond" && (
        <>
          <path d="M-5 0H5" stroke="#334155" strokeWidth={1.8} />
          <circle cx={-6} cy={0} r={4} fill="#3b82f6" />
          <circle cx={6} cy={0} r={4.5} fill="#f97316" />
        </>
      )}
      {kind === "quake" && (
        <>
          <path d="M-10 6H10" stroke="#78350f" strokeWidth={1} />
          <path d="M-10 0h4l2 -6l3 11l3 -9l2 4h6" fill="none" stroke="#b45309" strokeWidth={1.4} strokeLinejoin="round" />
        </>
      )}
      {kind === "xray" && (
        <>
          <rect x={-8} y={-8} width={16} height={16} rx={1.5} fill="#1e293b" />
          <path d="M-3 6V-1M3 6V-1M-3 -1l-1.5 -4.5M3 -1l1.5 -4.5M0 -1V-6" stroke="white" strokeWidth={1.3} strokeLinecap="round" />
        </>
      )}
      {kind === "chip" && (
        <>
          <rect x={-6} y={-6} width={12} height={12} rx={1} fill="#1f2937" />
          {[-3, 0, 3].map((d) => (
            <path key={d} d={`M${d} -6v-3M${d} 6v3M-6 ${d}h-3M6 ${d}h3`} stroke="#64748b" strokeWidth={1} />
          ))}
        </>
      )}
      {kind === "radio" && (
        <>
          <path d="M4 -4L9 -11" stroke="#334155" strokeWidth={1} />
          <rect x={-9} y={-4} width={18} height={11} rx={2} fill="#92400e" />
          <circle cx={-3} cy={1.5} r={3} fill="#fde68a" />
          <path d="M3 -1h4M3 2h4M3 5h4" stroke="#fde68a" strokeWidth={0.9} />
        </>
      )}
      {kind === "speaker" && (
        <>
          <rect x={-7} y={-9} width={14} height={18} rx={2} fill="#334155" />
          <circle cy={2.5} r={4} fill="#94a3b8" />
          <circle cy={-5} r={1.8} fill="#94a3b8" />
        </>
      )}
      {kind === "stove" && (
        <>
          <path d="M-8 -7h16l-2 7h-12Z" fill="#78716c" />
          <path d="M-4 8q-2 -4 1 -6q0 3 3 3q1 -2 3 -3q2 4 -1 6Z" fill="#f97316" />
        </>
      )}
      {kind === "poem" && (
        <>
          <rect x={-7} y={-8} width={13} height={16} rx={1} fill="#fffbeb" stroke="#a16207" strokeWidth={0.8} />
          <path d="M-4 -4h7M-4 -1h6M-4 2h7M-4 5h4" stroke="#a16207" strokeWidth={0.8} />
          <path d="M9 -10L3 4" stroke="#1f2937" strokeWidth={1.2} />
        </>
      )}
    </g>
  );
}

// The map: four columns, three rows of chalked plots on the field.
const MAP_X = [42, 120, 198, 276];
const MAP_Y = [66, 132, 198];
export const mapAt = (i: number): [number, number] => [MAP_X[i % 4], MAP_Y[Math.floor(i / 4)]];

/** How a stall shows after a check: agreed, a banner that should not be there, or one that is missing. */
export type Mark = "ok" | "extra" | "missing" | "ring" | "dim" | null;

/** The club's banner on its pole, feet at (x, y). `ask` puts a "?" on it (a bet), `fall` knocks it over. */
function Flag({ x, y, ask = false, fall = false, ghost = false }: { x: number; y: number; ask?: boolean; fall?: boolean; ghost?: boolean }) {
  return (
    <g className={ghost ? FADE : POP}>
      <g
        style={{ transform: fall ? `translate(${x}px, ${y}px) rotate(78deg) translate(${-x}px, ${-y}px)` : "none", transformOrigin: "0 0" }}
        className="transition-transform duration-700 ease-in motion-reduce:transition-none"
        opacity={ghost ? 0.9 : 1}
      >
        <path d={`M${x} ${y}V${y - 38}`} stroke={ghost ? "#e11d48" : "#475569"} strokeWidth={1.4} strokeDasharray={ghost ? "2 2" : undefined} />
        <path
          d={`M${x} ${y - 38}h15l-3 5l3 5h-15Z`}
          fill={ghost ? "white" : "#2563eb"}
          stroke={ghost ? "#e11d48" : "#1e3a8a"}
          strokeWidth={0.8}
          strokeDasharray={ghost ? "2 2" : undefined}
        />
        {!ghost && !ask && (
          <g fill="none" stroke="white" strokeWidth={0.7}>
            <ellipse cx={x + 6.5} cy={y - 33} rx={4} ry={1.6} />
            <ellipse cx={x + 6.5} cy={y - 33} rx={4} ry={1.6} transform={`rotate(60 ${x + 6.5} ${y - 33})`} />
            <ellipse cx={x + 6.5} cy={y - 33} rx={4} ry={1.6} transform={`rotate(-60 ${x + 6.5} ${y - 33})`} />
          </g>
        )}
        {ask && (
          <text x={x + 6.5} y={y - 30} textAnchor="middle" fontSize={8} fontWeight={800} fill="white">
            ?
          </text>
        )}
      </g>
    </g>
  );
}

/** A tick or a cross, drawn (glyphs render as emoji on some systems), centred at (x, y). */
function Verdict({ x, y, ok }: { x: number; y: number; ok: boolean }) {
  return (
    <g className={POP}>
      <circle cx={x} cy={y} r={6.5} fill={ok ? "#059669" : "#e11d48"} />
      <path d={ok ? `M${x - 3} ${y}l2.2 2.4l4 -4.6` : `M${x - 2.6} ${y - 2.6}l5.2 5.2M${x + 2.6} ${y - 2.6}l-5.2 5.2`} stroke="white" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  );
}

/**
 * The school field with the twelve chalked stalls. `banners` are the stall
 * indices flying a banner; `onTap` makes the stalls tappable; `marks` shows a
 * check's verdict per stall; `ask` draws the banners as a sealed bet.
 */
export function FairField({
  banners,
  onTap,
  marks,
  ask = false,
  label,
}: {
  banners: number[];
  onTap?: (i: number) => void;
  marks?: Mark[];
  ask?: boolean;
  label: string;
}) {
  return (
    <svg viewBox="0 0 320 210" className="block h-auto w-full select-none" role="img" aria-label={label}>
      <rect width={320} height={210} rx={12} fill="#86c06c" />
      {STALLS.map((st, i) => {
        const [x, y] = mapAt(i);
        const m = marks?.[i] ?? null;
        const on = banners.includes(i);
        return (
          <g
            key={st.id}
            onClick={onTap ? () => onTap(i) : undefined}
            className={onTap ? "cursor-pointer" : undefined}
            opacity={m === "dim" ? 0.45 : 1}
            role={onTap ? "button" : undefined}
            aria-label={onTap ? `${st.name}${on ? ", banner আছে" : ""}` : undefined}
          >
            <rect
              x={x - 36}
              y={y - 58}
              width={72}
              height={62}
              rx={4}
              fill="white"
              fillOpacity={m === "ring" ? 0.35 : 0.1}
              stroke={m === "ring" ? "#f59e0b" : "white"}
              strokeWidth={m === "ring" ? 2 : 1}
              strokeOpacity={0.85}
              strokeDasharray={m === "ring" ? undefined : "4 3"}
            />
            <path d={`M${x - 22} ${y - 36}L${x - 18} ${y - 46}H${x + 18}L${x + 22} ${y - 36}Z`} fill="#fde68a" stroke="#92400e" strokeWidth={0.8} />
            <rect x={x - 20} y={y - 36} width={40} height={24} fill="#fffbeb" stroke="#92400e" strokeWidth={0.8} />
            <StallIcon kind={st.id} x={x} y={y - 24} />
            <text x={x} y={y - 2} textAnchor="middle" fontSize={7.6} fontWeight={700} fill={INK}>
              {st.name}
            </text>
            {on && <Flag x={x + 25} y={y - 12} ask={ask} fall={m === "extra"} />}
            {m === "missing" && <Flag x={x + 25} y={y - 12} ghost />}
            {(m === "ok" || m === "extra" || m === "missing") && <Verdict x={x - 27} y={y - 48} ok={m === "ok"} />}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// People who are not in the cast: রশিদ স্যার wears মামা's look, আপা is the
// cast's আপা; both get their own name under their feet.

function NameTag({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
      {text}
    </text>
  );
}

/** An X-ray film held up, top-left at (x, y): a dark sheet, and the hand's bones glowing when `lit`. */
function XrayFilm({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g className={POP}>
      <rect x={x} y={y} width={22} height={26} rx={1.5} fill="#1e293b" stroke="#475569" strokeWidth={0.8} />
      <g opacity={lit ? 1 : 0.25} className="transition-opacity duration-700 motion-reduce:transition-none">
        <path
          d={`M${x + 8} ${y + 23}V${y + 14}M${x + 14} ${y + 23}V${y + 14}M${x + 8} ${y + 14}l-3 -8M${x + 11} ${y + 14}V${y + 4}M${x + 14} ${y + 14}l3 -8`}
          stroke="white"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

/** a half-built bamboo frame, feet at (x, y) */
function Bamboo({ x, y, w = 44, half = false }: { x: number; y: number; w?: number; half?: boolean }) {
  return (
    <g className="pointer-events-none" stroke="#a16207" strokeWidth={2.2} strokeLinecap="round">
      <path d={`M${x} ${y}V${y - 46}M${x + w} ${y}V${y - (half ? 30 : 46)}`} />
      {!half && <path d={`M${x - 3} ${y - 44}H${x + w + 3}`} />}
      <path d={`M${x} ${y - 20}H${x + w}`} strokeWidth={1.6} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: Monday on the field. Bamboo
//      frames half up and twelve plots in chalk; রশিদ স্যার gives the banner rule;
//      আপা holds an X-ray film to the sun; নাসিব comes with the bundle of
//      banners under his arm and says chemistry and biology have no physics.

export function FieldMorning({}: Story) {
  const s = useScene(3, [600, 2400, 2400]);
  const k = s.k;
  useEffect(() => {
    if (k === 2) sfx.paper();
  }, [k]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="the school field on Monday: bamboo frames half up, chalk plots on the grass; Rashid sir gives the banner rule, Apa holds an X-ray film to the sun, and Nasib arrives with the banners">
        <circle cx={286} cy={28} r={11} fill="#fde047" />
        <Bamboo x={18} y={150} />
        <Bamboo x={228} y={150} w={40} half />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={22 + i * 76} y={156} width={56} height={14} fill="none" stroke="white" strokeWidth={1.2} strokeDasharray="4 3" />
        ))}
        <Person who="apa" x={42} y={150} arm={k >= 2 ? "hold" : "down"} />
        <NameTag x={42} y={150} text="আপা" />
        {k >= 2 && <XrayFilm x={46} y={86} lit={k >= 2} />}
        {k >= 2 && <path d="M280 36L72 96" stroke="#fde047" strokeWidth={1.2} strokeDasharray="3 3" className={FADE} />}
        <Person who="mama" x={122} y={150} arm={k === 1 ? "point" : "down"} />
        <NameTag x={122} y={150} text="রশিদ স্যার" />
        {k === 1 && <Bubble x={122} y={84} lines={["পদার্থবিজ্ঞানের stall-এ", "club-এর banner।"]} />}
        <Person who="fahim" x={186} y={150} label />
        <Person who="nasib" x={k >= 3 ? 256 : 350} y={150} facing={-1} walking={k === 3} arm="hold" mood="smug" label />
        {k >= 3 && (
          <g className={FADE}>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={234} y={108 + i * 3} width={18} height={3} rx={1.5} fill={["#2563eb", "#1d4ed8", "#3b82f6"][i]} />
            ))}
          </g>
        )}
        {k >= 3 && <Bubble x={256} y={84} side="left" lines={["কেমিস্ট্রি-বায়োলজি", "আলাদা। physics নাই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The bet. The map with twelve stalls; the reader taps the stalls they
//     think are physics (a banner pops up on each; a second tap takes it down)
//     and seals the bet. Sealing puts a "?" on every banner. Nothing is marked;
//     the last step settles it.

/** the sealed bet, kept for the last step while the lesson is open */
let S1_BET: number[] | null = null;

export function FairMap() {
  const pass = useGate();
  const [banners, setBanners] = useSeed<number[]>("banners", []);
  const [sealed, setSealed] = useSeed("sealed", false);

  const tap = (i: number) => {
    if (sealed) return;
    sfx.tap();
    setBanners(banners.includes(i) ? banners.filter((b) => b !== i) : [...banners, i]);
  };
  const seal = () => {
    setSealed(true);
    S1_BET = banners;
    sfx.stamp();
    pass("বাজি সিল হলো। একটা একটা stall-এ হেঁটে দেখি।");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[22rem]">
        <FairField banners={banners} onTap={sealed ? undefined : tap} ask={sealed} label="the fair map: twelve stalls; tap one to put the physics club's banner on it" />
      </div>
      <div className="mt-1.5 text-center text-sm text-muted">
        হাতে banner: <span className="font-mono">{12 - banners.length}</span> টা
      </div>
      {!sealed ? (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={seal} className={primaryBtn}>
            {banners.length ? "বাজি সিল করুন" : "একটাতেও না। সিল করুন"}
          </button>
        </div>
      ) : (
        <div className={`${FADE} mt-2 text-center text-[0.95rem] text-muted`}>
          বাজি সিল: <span className="font-mono">{banners.length}</span> টা stall-এ banner। শেষে মিলিয়ে দেখবো।
        </div>
      )}
      <Task done={sealed}>যে stall-গুলো পদার্থবিজ্ঞান মনে হয়, tap করে banner বসান। তারপর বাজি সিল করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: what science is. The lab
//      machines fade; a hand holds a lens over a leaf and the veins grow in it;
//      then the two stamps, accept or reject.

const X1_SAY = [
  "বিজ্ঞান বললেই চোখে ভাসে যন্ত্রপাতি, ল্যাবরেটরি।",
  "অথচ আসল জিনিস যন্ত্র না। দেখার ধরন: দৃষ্টিভঙ্গি।",
  "কখনো খুঁটিয়ে পর্যবেক্ষণ, কখনো পরীক্ষা, কখনো যুক্তি দিয়ে বিশ্লেষণ।",
  "তারপর মেনে নেওয়া, নয়তো বাদ দেওয়া।",
];

export function LensLeaf() {
  const s = useScene(3, [600, 1800, 2200, 2200]);
  const k = s.k;
  const clip = useId();
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="lab machines fade; a lens over a leaf shows its veins; then accept or reject">
        <rect width={240} height={110} rx={10} fill="white" />
        <g opacity={k >= 1 ? 0.15 : 1} className="transition-opacity duration-700 motion-reduce:transition-none">
          <path d="M30 88h24l-6 -26v-18h-12v18z" fill="#bae6fd" stroke="#334155" strokeWidth={1} />
          <rect x={70} y={48} width={34} height={40} rx={3} fill="#e2e8f0" stroke="#334155" strokeWidth={1} />
          <circle cx={80} cy={60} r={4} fill="#94a3b8" />
          <rect x={86} y={70} width={12} height={4} fill="#94a3b8" />
          <path d="M150 88h30M165 88V40l10 -10" stroke="#334155" strokeWidth={3} fill="none" />
          <rect x={170} y={24} width={10} height={16} rx={2} fill="#475569" transform="rotate(-40 175 32)" />
        </g>
        {k >= 1 && (
          <g className={FADE}>
            <path d="M96 84Q90 44 136 34Q146 74 96 84Z" fill="#22c55e" stroke="#15803d" strokeWidth={1.2} />
            <path d="M96 84L132 40M108 70l-8 -10M116 60l-10 -8M114 64l12 2M122 52l10 2" stroke="#15803d" strokeWidth={0.9} fill="none" />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <defs>
              <clipPath id={clip}>
                <circle cx={118} cy={58} r={17} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clip})`}>
              <rect x={100} y={40} width={36} height={36} fill="#4ade80" />
              <path d="M96 90L140 30M110 70l-14 -14M120 58l-16 -10M118 64l18 4M126 50l16 2" stroke="#166534" strokeWidth={1.8} fill="none" />
            </g>
            <circle cx={118} cy={58} r={17} fill="none" stroke="#334155" strokeWidth={2.5} />
            <path d="M130 70l16 16" stroke="#92400e" strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <circle cx={186} cy={42} r={10} fill="#059669" />
            <path d="M181 42l3.5 3.5l6 -7" stroke="white" strokeWidth={2} fill="none" strokeLinecap="round" />
            <circle cx={212} cy={42} r={10} fill="#e11d48" />
            <path d="M208 38l8 8M216 38l-8 8" stroke="white" strokeWidth={2} strokeLinecap="round" />
            <text x={186} y={66} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK}>
              গ্রহণ
            </text>
            <text x={212} y={66} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK}>
              বাদ
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2 · নাসিব's first point: are chemistry and biology really separate? A tower of
//     blocks from the book: পদার্থবিজ্ঞান at the bottom, রসায়ন on it, জীববিজ্ঞান
//     on that, "অন্য অনেক বিষয়" on top. The reader pulls each named block out;
//     whatever stood on it falls. Passes once all three have been pulled.

const T2_BLOCKS = [
  { name: "পদার্থবিজ্ঞান", w: 150, h: 32, fill: "#2563eb" },
  { name: "রসায়ন", w: 128, h: 30, fill: "#d97706" },
  { name: "জীববিজ্ঞান", w: 106, h: 28, fill: "#16a34a" },
  { name: "অন্য অনেক বিষয়", w: 84, h: 22, fill: "#94a3b8" },
];
const T2_GROUND = 176;
const T2_CX = 110;
/** the top of block i when the tower stands */
const t2Top = (i: number) => T2_GROUND - T2_BLOCKS.slice(0, i + 1).reduce((a, b) => a + b.h, 0);
/** a fallen block's small tilt, by its place in the pile */
const T2_TILT = [-5, 6, -4];
/** where the pulled block parks: small, top left */
const T2_PARK: [number, number] = [62, 24];
/** where the fallen blocks pile up: on the ground, right of the tower */
const T2_PILE = 246;

/** block i's transform once `pulled` is out: parked, fallen on the pile, or standing */
function t2Move(i: number, pulled: number | null, phase: number) {
  const b = T2_BLOCKS[i];
  const cy = t2Top(i) + b.h / 2;
  if (pulled === i && phase >= 3) return `translate(${T2_PARK[0] - T2_CX}px, ${T2_PARK[1] - cy}px) scale(0.5)`;
  if (pulled !== null && i > pulled && phase >= 6) {
    const m = i - pulled - 1;
    const below = T2_BLOCKS.slice(pulled + 1, i).reduce((a, x) => a + x.h, 0);
    const ty = T2_GROUND - below - b.h / 2;
    return `translate(${T2_PILE - T2_CX}px, ${ty - cy}px) rotate(${T2_TILT[m] ?? 0}deg)`;
  }
  return "none";
}
const T2_SAY = [
  "পদার্থবিজ্ঞান সরালো: উপরের সব পড়ে গেলো।",
  "রসায়ন সরালো: জীববিজ্ঞান আর তার উপরেরটা পড়লো। নিচের পদার্থবিজ্ঞান দাঁড়িয়ে।",
  "জীববিজ্ঞান সরালো: শুধু উপরেরটা পড়লো। রসায়ন আর পদার্থবিজ্ঞান দাঁড়িয়ে।",
];
const T2_TICK = ["জীববিজ্ঞান", "রসায়ন", "পদার্থবিজ্ঞান"];

export function Tower() {
  const pass = useGate();
  const [pulled, setPulled] = useSeed<number | null>("pulled", null);
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const pl = usePlay(170);
  const phase = pulled === null ? 0 : pl.running ? pl.k : 10;

  useEffect(() => {
    if (pl.running && pl.k === 6 && pulled !== null && pulled < 3) sfx.thump();
  }, [pl.running, pl.k, pulled]);

  const pull = (i: number) => {
    if (pl.running) return;
    sfx.scrape(0.4);
    setPulled(i);
    const next = tried.includes(i) ? tried : [...tried, i];
    setTried(next);
    pl.play(10, () => {
      if (next.length === 3) pass("নিচের block সরালে সব পড়ে।");
    });
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[20rem]">
        <svg viewBox="0 0 300 190" className="block h-auto w-full select-none overflow-hidden" role="img" aria-label="a tower of blocks: physics at the bottom, chemistry on it, biology on that; tap a block to pull it out">
          <rect width={300} height={190} rx={10} fill="#f5efe6" />
          <rect y={T2_GROUND} width={300} height={14} fill="#c8a27a" />
          {T2_BLOCKS.map((b, i) => {
            const out = pulled === i && phase >= 3;
            const pullable = i < 3;
            return (
              <g
                key={b.name}
                onClick={pullable ? () => pull(i) : undefined}
                role={pullable ? "button" : undefined}
                aria-label={pullable ? `${b.name} টেনে বের করুন` : undefined}
                className={`transition-[transform,opacity] duration-500 ease-in motion-reduce:transition-none ${pullable ? "cursor-pointer" : ""}`}
                opacity={out ? 0.45 : 1}
                style={{ transform: t2Move(i, pulled, phase), transformOrigin: `${T2_CX}px ${t2Top(i) + b.h / 2}px` }}
              >
                <rect x={T2_CX - b.w / 2} y={t2Top(i)} width={b.w} height={b.h} rx={3} fill={b.fill} stroke="#0f172a" strokeOpacity={0.35} />
                <text x={T2_CX} y={t2Top(i) + b.h / 2 + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="white">
                  {b.name}
                </text>
              </g>
            );
          })}
          {pulled === null && (
            <text x={T2_PILE} y={120} textAnchor="middle" fontSize={8.5} fill={MUTE}>
              block tap করে
              <tspan x={T2_PILE} dy={11}>
                টেনে দেখুন
              </tspan>
            </text>
          )}
        </svg>
      </div>
      <div className="mt-2 min-h-11 text-center text-[0.95rem]">
        {pulled !== null && !pl.running ? (
          <span key={`${pulled}-${tried.length}`} className={FADE}>
            {T2_SAY[pulled]}
          </span>
        ) : (
          <span className="text-muted">{pl.running ? "…" : "তিনটা block, কোনটা টানলে কী পড়ে?"}</span>
        )}
      </div>
      <Ticks items={[2, 1, 0].map((i, j) => [T2_TICK[j], tried.includes(i) && !(pl.running && pulled === i)])} />
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {[2, 1, 0].map((i) => (
          <button key={i} type="button" onClick={() => pull(i)} disabled={pl.running} className={`${quietBtn} h-9 px-3.5 text-sm`}>
            {T2_BLOCKS[i].name}
          </button>
        ))}
      </div>
      <Task done={tried.length === 3 && !pl.running}>তিনটা block-ই একটা একটা করে টেনে দেখুন। কোনটা সরালে বাকিগুলো পড়ে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the oldest and the most
//      fundamental. A stargazer under a night sky, long before the other
//      sciences had names; the stars join into a pattern, জ্যোতির্বিদ্যা; then the
//      tower builds up from the bottom.

const X2_SAY = [
  "অন্য শাখাগুলো দানা বাঁধার অনেক আগে মানুষ আকাশ দেখতো।",
  "আকাশ দেখে হিসাব, মানে জ্যোতির্বিদ্যা। পদার্থবিজ্ঞানেরই শাখা। তাই সবচেয়ে প্রাচীন।",
  "প্রথমে পদার্থবিজ্ঞান।",
  "তার উপর রসায়ন, তার উপর জীববিজ্ঞান। নিচেরটা সবচেয়ে মৌলিক (Fundamental)।",
];
const X2_STARS: [number, number][] = [
  [30, 22],
  [52, 14],
  [74, 26],
  [96, 18],
  [84, 42],
];

export function OldestTower() {
  const s = useScene(3, [600, 2200, 1400, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X2_SAY[k]}</span>}>
      <svg viewBox="0 0 240 120" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="a stargazer at night; the stars form a pattern; the tower of sciences builds up from physics">
        <rect width={240} height={120} rx={10} fill="#0f172a" />
        <rect y={100} width={240} height={20} fill="#1f2d1f" />
        {X2_STARS.map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={1.8} fill="#fde68a" />
        ))}
        {k >= 1 && <Draw d={`M${X2_STARS.map(([x, y]) => `${x} ${y}`).join("L")}`} ms={900} className="stroke-[#fde68a]/70" strokeWidth={0.8} />}
        {k >= 1 && (
          <text x={62} y={58} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#fde68a" className={FADE}>
            জ্যোতির্বিদ্যা
          </text>
        )}
        {/* the stargazer, a robed silhouette pointing up */}
        <g fill="#cbd5e1">
          <circle cx={40} cy={74} r={5} />
          <path d="M34 100l2 -20h8l2 20Z" />
          <path d="M44 82l10 -14" stroke="#cbd5e1" strokeWidth={2.4} strokeLinecap="round" />
        </g>
        {T2_BLOCKS.slice(0, 3).map((b, i) =>
          k >= 2 + (i === 0 ? 0 : 1) ? (
            <g key={b.name} className={POP} style={{ transitionDelay: `${i > 1 ? 300 : 0}ms` }}>
              <rect x={178 - b.w / 3} y={100 - (i + 1) * 20} width={(b.w * 2) / 3} height={19} rx={2} fill={b.fill} />
              <text x={178} y={100 - (i + 1) * 20 + 13} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="white">
                {b.name}
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: at the chemistry stall a
//      bowl of salt; সামিন reads from the book; নাসিব picks up a grain.

export function SaltBowl({}: Story) {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="at the chemistry stall: a bowl of salt on the table; Samin reads from the book, Nasib holds up a grain">
        <rect x={120} y={112} width={84} height={6} rx={2} fill="#92400e" />
        <path d="M128 118v32M196 118v32" stroke="#92400e" strokeWidth={3} />
        <path d="M146 112q16 12 32 0Z" fill="#e2e8f0" stroke="#64748b" />
        <path d="M150 111q12 -6 24 0Z" fill="white" />
        <Person who="samin" x={84} y={150} arm="hold" label />
        <rect x={90} y={104} width={16} height={11} rx={1} fill="#2563eb" />
        <path d="M98 104v11" stroke="white" strokeWidth={0.8} />
        {k === 1 && <Bubble x={84} y={84} side="right" lines={["পদার্থবিজ্ঞান পদার্থ", "নিয়ে কাজ করে।"]} />}
        <Person who="nasib" x={244} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} mood={k >= 2 ? "smug" : "plain"} label />
        {k >= 2 && <rect x={230} y={104} width={4} height={4} fill="white" stroke="#64748b" strokeWidth={0.6} className={POP} />}
        {k >= 2 && <Bubble x={244} y={84} side="left" lines={["পদার্থ মানে তো", "চোখে দেখা জিনিস।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · Matter all the way down. A lens over a grain of salt; each tap of "আরো
//     ভিতরে" zooms: the old picture swells and fades, the next one grows in.
//     দানা → অণু-পরমাণু → পরমাণু → ইলেকট্রন, প্রোটন, নিউট্রন → কোয়ার্ক → স্ট্রিং?
//     The ladder beside it lights the rung. Passes on the last rung.

const Z3_RUNGS = ["লবণের দানা", "অণু-পরমাণু", "একটা পরমাণু", "ইলেকট্রন, প্রোটন, নিউট্রন", "কোয়ার্ক", "স্ট্রিং?"];
const Z3_SAY = [
  "চোখে দেখা একটা দানা।",
  "এক দানা মানে সারি সারি পরমাণু। গুনে শেষ করা যাবে না।",
  "মাঝখানে ছোট্ট নিউক্লিয়াস, চারপাশে ইলেকট্রন।",
  "নিউক্লিয়াসের ভিতরে প্রোটন আর নিউট্রন।",
  "একটা প্রোটনের ভিতরে তিনটা কোয়ার্ক।",
  "তারও ভিতরে কাঁপতে থাকা সুতার মতো স্ট্রিং? এখনো কেউ জানে না।",
];

function Z3Pic({ lv }: { lv: number }) {
  if (lv === 0)
    return (
      <g>
        <path d="M-22 -8l22 -12l22 12l-22 12Z" fill="#f8fafc" stroke="#94a3b8" />
        <path d="M-22 -8v24l22 12v-24Z" fill="#e2e8f0" stroke="#94a3b8" />
        <path d="M22 -8v24l-22 12v-24Z" fill="#cbd5e1" stroke="#94a3b8" />
      </g>
    );
  if (lv === 1)
    return (
      <g>
        {Array.from({ length: 25 }, (_, i) => {
          const r = Math.floor(i / 5);
          const c = i % 5;
          const big = (r + c) % 2 === 0;
          return <circle key={i} cx={-40 + c * 20} cy={-40 + r * 20} r={big ? 8 : 5} fill={big ? "#22c55e" : "#a855f7"} />;
        })}
      </g>
    );
  if (lv === 2)
    return (
      <g fill="none" stroke="#93c5fd" strokeWidth={1}>
        <ellipse rx={44} ry={16} />
        <ellipse rx={44} ry={16} transform="rotate(60)" />
        <ellipse rx={44} ry={16} transform="rotate(-60)" />
        <circle r={5} fill="#f97316" stroke="none" />
        <circle cx={44} r={3} fill="#3b82f6" stroke="none" />
        <circle cx={-22} cy={-24} r={3} fill="#3b82f6" stroke="none" />
        <circle cx={-18} cy={28} r={3} fill="#3b82f6" stroke="none" />
      </g>
    );
  if (lv === 3)
    return (
      <g>
        {[
          [-10, -8, 1],
          [8, -10, 0],
          [0, 4, 1],
          [-14, 8, 0],
          [14, 6, 1],
          [4, 18, 0],
          [-4, -20, 0],
          [18, -6, 1],
        ].map(([x, y, p], i) => (
          <circle key={i} cx={x} cy={y} r={10} fill={p ? "#ef4444" : "#94a3b8"} stroke="#0f172a" strokeOpacity={0.3} />
        ))}
        <circle cx={-44} cy={-34} r={3} fill="#3b82f6" />
        <text x={-44} y={-40} textAnchor="middle" fontSize={7} fill="white">
          e
        </text>
        <text x={-10} y={-5} textAnchor="middle" fontSize={8} fontWeight={700} fill="white">
          p
        </text>
        <text x={8} y={-7} textAnchor="middle" fontSize={8} fontWeight={700} fill="white">
          n
        </text>
      </g>
    );
  if (lv === 4)
    return (
      <g>
        <circle r={38} fill="#fecaca" stroke="#ef4444" strokeWidth={1.5} />
        {[
          [-14, -10, "#dc2626"],
          [14, -10, "#16a34a"],
          [0, 14, "#2563eb"],
        ].map(([x, y, c]) => (
          <circle key={`${x}${y}`} cx={x as number} cy={y as number} r={7} fill={c as string} />
        ))}
      </g>
    );
  return (
    <g>
      <path d="M-30 0C-30 -24 -10 -10 0 -26C10 -10 30 -24 30 0C30 24 10 10 0 26C-10 10 -30 24 -30 0Z" fill="none" stroke="#a855f7" strokeWidth={2} />
      <text y={6} textAnchor="middle" fontSize={20} fontWeight={800} fill="#a855f7">
        ?
      </text>
    </g>
  );
}

export function SaltZoom() {
  const pass = useGate();
  const [lv, setLv] = useSeed("lv", 0);
  const [was, setWas] = useState(0);
  const pl = usePlay(55);
  const clip = useId();
  const going = pl.running;
  // the old picture swells and fades for four ticks, then the new one grows in
  const inward = lv > was;
  const old = going && pl.k < 4;
  const pic = old ? was : lv;
  const t = going ? (old ? pl.k / 4 : (pl.k - 4) / 4) : 1;
  const scale = old ? (inward ? 1 + t * 2.5 : 1 - t * 0.6) : going ? (inward ? 0.35 + t * 0.65 : 2 - t) : 1;
  const opacity = old ? 1 - t : going ? t : 1;

  const go = (d: 1 | -1) => {
    const next = Math.max(0, Math.min(5, lv + d));
    if (next === lv || going) return;
    sfx.lens();
    setWas(lv);
    setLv(next);
    pl.play(8, () => {
      if (next === 5) pass("পদার্থ মানে শুধু চোখে দেখা জিনিস না।");
    });
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="w-[9.5rem] shrink-0">
          <svg viewBox="-70 -70 140 140" className="block h-auto w-full" role="img" aria-label={`the lens on: ${Z3_RUNGS[pic]}`}>
            <defs>
              <clipPath id={clip}>
                <circle r={60} />
              </clipPath>
            </defs>
            <circle r={60} fill="#0f172a" />
            <g clipPath={`url(#${clip})`}>
              <g transform={`scale(${scale})`} opacity={opacity}>
                <Z3Pic lv={pic} />
              </g>
            </g>
            <circle r={60} fill="none" stroke="#475569" strokeWidth={5} />
          </svg>
        </div>
        <ol className="min-w-0 flex-1 space-y-1 text-sm">
          {Z3_RUNGS.map((r, i) => (
            <li
              key={r}
              className={`rounded-lg border px-2 py-0.5 transition-colors duration-300 motion-reduce:transition-none ${
                i === lv ? "border-cat-blue bg-cat-blue/10 font-semibold" : i < lv ? "border-transparent text-muted" : "border-transparent text-muted/50"
              }`}
            >
              {r}
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-2 min-h-11 text-center text-[0.95rem]">
        <span key={lv} className={FADE}>
          {Z3_SAY[lv]}
        </span>
      </div>
      <div className="mt-2 flex justify-center gap-2">
        <button type="button" onClick={() => go(-1)} disabled={lv === 0 || going} className={quietBtn}>
          বাইরে
        </button>
        <button type="button" onClick={() => go(1)} disabled={lv === 5 || going} className={primaryBtn}>
          আরো ভিতরে
        </button>
      </div>
      <Task done={lv === 5 && !going}>লবণের দানার ভিতরে ঢুকতে থাকুন, যতক্ষণ না সিঁড়ি শেষ হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the book's two words,
//      পদার্থ and শক্তি, and what passes between them, মিথস্ক্রিয়া (Interaction).

const X3_SAY = [
  "এক পাশে পদার্থ: দানা থেকে কোয়ার্ক পর্যন্ত।",
  "আরেক পাশে শক্তি।",
  "একটা আরেকটার উপর কাজ করে। এর নাম মিথস্ক্রিয়া (Interaction)।",
  "এই তিনটা নিয়েই পদার্থবিজ্ঞান।",
];

export function TwoWords() {
  const s = useScene(3, [600, 1400, 2200, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="matter on one side, energy on the other, arrows both ways between them: interaction">
        <rect width={240} height={110} rx={10} fill="white" />
        <g className={POP}>
          <circle cx={50} cy={50} r={30} fill="#eff6ff" stroke="#2563eb" strokeWidth={1.5} />
          <StallIcon kind="salt" x={50} y={44} s={1.3} />
          <text x={50} y={72} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#1d4ed8">
            পদার্থ
          </text>
        </g>
        {k >= 1 && (
          <g className={POP}>
            <circle cx={190} cy={50} r={30} fill="#fffbeb" stroke="#d97706" strokeWidth={1.5} />
            <path d="M194 28l-10 18h8l-6 16l14 -20h-8l6 -14Z" fill="#f59e0b" />
            <text x={190} y={72} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#b45309">
              শক্তি
            </text>
          </g>
        )}
        {k >= 2 && (
          <g>
            <Draw d="M84 42H152l-6 -5M152 42l-6 5" ms={600} className="stroke-[#7c3aed]" strokeWidth={1.8} />
            <Draw d="M156 58H88l6 -5M88 58l6 5" delay={400} ms={600} className="stroke-[#7c3aed]" strokeWidth={1.8} />
            <text x={120} y={34} textAnchor="middle" fontSize={8} fontWeight={700} fill="#6d28d9" className={FADE}>
              মিথস্ক্রিয়া
            </text>
            <text x={120} y={72} textAnchor="middle" fontSize={7.5} fill="#6d28d9" className={FADE}>
              (Interaction)
            </text>
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={70} y={86} width={100} height={17} rx={8} fill="#1e3a8a" />
            <text x={120} y={98} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">
              পদার্থবিজ্ঞান
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · Six jars of energy from the book, six pictures. The reader picks a jar,
//     then taps the picture it belongs to. The right one plays: the slingshot
//     fires, the marble knocks the block over, the mango falls, the needle turns
//     north, the sun flares, the watch hands glow. A wrong one plays what that
//     would mean: the rubber goes slack, the marble stops short, the mango
//     floats up, the needle wanders, the sun goes grey, the dial stays dark.

type Pic = "sling" | "marble" | "mango" | "compass" | "sun" | "dial";
const E4_JARS: { jar: string; pic: Pic }[] = [
  { jar: "স্থিতিশক্তি", pic: "sling" },
  { jar: "গতিশক্তি", pic: "marble" },
  { jar: "মাধ্যাকর্ষণ", pic: "mango" },
  { jar: "বিদ্যুৎ চৌম্বকীয়", pic: "compass" },
  { jar: "সবল নিউক্লিয়ার", pic: "sun" },
  { jar: "দুর্বল নিউক্লিয়ার", pic: "dial" },
];
/** the pictures in their shuffled places: indices into E4_JARS */
const E4_ORDER = [2, 3, 0, 5, 1, 4];
const E4_NAME: Record<Pic, string> = {
  sling: "টানা গুলতি",
  marble: "গড়ানো মার্বেল",
  mango: "গাছের আম",
  compass: "কম্পাস",
  sun: "সূর্যের ভিতর",
  dial: "অন্ধকারে ঘড়ির কাঁটা",
};
const E4_NOPE: Record<Pic, string> = {
  sling: "রাবার ঢিলা হয়ে গেলো, ঢিল পায়ের কাছেই পড়লো। টেনে রাখা রাবারে শক্তি জমা থাকে। কোন বয়ামে জমা শক্তি?",
  marble: "মার্বেল মাঝপথে থেমে গেলো। চলতে থাকা জিনিসের শক্তি কোন বয়ামে?",
  mango: "আম উপরে ভেসে গেলো! আমকে নিচে টানে কে?",
  compass: "কাঁটা এলোমেলো ঘুরে যেখানে সেখানে থামলো। কাঁটা ঘোরায় পৃথিবীর চুম্বক।",
  sun: "সূর্য নিভে গেলো। সূর্যের ভিতরে নিউক্লিয়াস জোড়া লাগে খুব জোরালো বলে।",
  dial: "কাঁটা অন্ধকারই থাকলো। ঘড়ির রঙের নিউক্লিয়াস খুব ধীরে বদলায়, তাতেই আলো। জোরালো না, দুর্বল।",
};

/** One picture, 90 × 60, in a state: at rest, playing right, playing wrong, or done. */
function E4Pic({ pic, st }: { pic: Pic; st: "idle" | "go" | "bad" | "done" }) {
  const ok = st === "go" || st === "done";
  const bad = st === "bad";
  const tr = "transition-transform duration-1000 ease-out motion-reduce:transition-none";
  return (
    <svg viewBox="0 0 90 60" className="block h-auto w-full" aria-hidden="true">
      <rect width={90} height={60} rx={6} fill={pic === "sun" || pic === "dial" ? "#0f172a" : "#f0f9ff"} />
      {pic === "sling" && (
        <>
          <path d="M26 56V36l-6 -12M26 36l6 -12" stroke="#78350f" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d={ok ? "M20 24L32 24" : bad ? "M20 24Q18 44 24 48Q30 44 32 24" : "M20 24L10 34L32 24"} stroke="#b45309" strokeWidth={1.4} fill="none" />
          <circle cx={10} cy={34} r={3} fill="#57534e" style={{ transform: ok ? "translate(70px, -14px)" : bad ? "translate(12px, 20px)" : "none" }} className={tr} />
        </>
      )}
      {pic === "marble" && (
        <>
          <path d="M4 50H86" stroke="#64748b" strokeWidth={1.4} />
          <circle cx={12} cy={45} r={5} fill="#2563eb" style={{ transform: ok ? "translateX(52px)" : bad ? "translateX(18px)" : "none" }} className={tr} />
          <rect x={70} y={30} width={6} height={20} fill="#d97706" style={{ transform: ok ? "rotate(72deg)" : "none", transformOrigin: "76px 50px" }} className="transition-transform delay-700 duration-500 motion-reduce:transition-none" />
        </>
      )}
      {pic === "mango" && (
        <>
          <path d="M0 8Q30 4 60 12" stroke="#78350f" strokeWidth={3} fill="none" />
          <path d="M36 8q10 -6 16 2q-8 4 -16 -2Z" fill="#16a34a" />
          <path d="M4 56H86" stroke="#65a30d" strokeWidth={3} />
          <g style={{ transform: ok ? "translateY(34px)" : bad ? "translateY(-20px)" : "none" }} className={`transition-transform duration-1000 ${bad ? "ease-out" : "ease-in"} motion-reduce:transition-none`}>
            <ellipse cx={44} cy={18} rx={5} ry={6.5} fill="#eab308" />
          </g>
        </>
      )}
      {pic === "compass" && (
        <>
          <circle cx={45} cy={30} r={22} fill="white" stroke="#334155" strokeWidth={2} />
          <text x={45} y={14} textAnchor="middle" fontSize={7} fontWeight={700} fill="#dc2626">
            N
          </text>
          <g style={{ transform: `rotate(${ok ? 0 : bad ? 230 : 115}deg)`, transformOrigin: "45px 30px" }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
            <path d="M45 13l3 17h-6Z" fill="#dc2626" />
            <path d="M45 47l3 -17h-6Z" fill="#94a3b8" />
          </g>
        </>
      )}
      {pic === "sun" && (
        <>
          <circle cx={45} cy={30} r={ok ? 24 : 20} fill={bad ? "#475569" : "#f97316"} opacity={ok ? 0.35 : 0} className="transition-all duration-700 motion-reduce:transition-none" />
          <circle cx={45} cy={30} r={17} fill={bad ? "#475569" : "#f59e0b"} className="transition-colors duration-700 motion-reduce:transition-none" />
          <circle cx={39} cy={30} r={3} fill="#fef3c7" style={{ transform: ok ? "translateX(6px)" : "none" }} className={tr} />
          <circle cx={51} cy={30} r={3} fill="#fef3c7" style={{ transform: ok ? "translateX(-6px)" : "none" }} className={tr} />
        </>
      )}
      {pic === "dial" && (
        <>
          <circle cx={45} cy={30} r={20} fill="#1e293b" stroke="#64748b" strokeWidth={2} />
          <path d="M45 30V16M45 30l9 5" stroke={ok ? "#a3e635" : "#334155"} strokeWidth={2.4} strokeLinecap="round" className="transition-colors duration-700 motion-reduce:transition-none" />
          {[0, 90, 180, 270].map((a) => (
            <circle key={a} cx={45 + 15 * Math.sin((a * Math.PI) / 180)} cy={30 - 15 * Math.cos((a * Math.PI) / 180)} r={1.5} fill={ok ? "#a3e635" : "#334155"} />
          ))}
          {ok && <circle cx={58} cy={18} r={1.6} fill="#fde68a" style={{ transform: "translate(18px, -12px)" }} className={tr} />}
        </>
      )}
    </svg>
  );
}

export function EnergyShelf() {
  const pass = useGate();
  const [matched, setMatched] = useSeed<number[]>("matched", []);
  const [sel, setSel] = useSeed<number | null>("sel", null);
  const [anim, setAnim] = useSeed<{ at: number; ok: boolean } | null>("anim", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const [nope, setNope] = useSeed<Pic | null>("nope", null);
  const pl = usePlay(1300);

  const tapPic = (at: number) => {
    if (sel === null || pl.running || matched.includes(at)) return;
    const ok = sel === at;
    setAnim({ at, ok });
    setNope(null);
    if (ok) sfx.pop();
    pl.play(1, () => {
      if (ok) {
        const next = [...matched, at];
        setMatched(next);
        setSel(null);
        setAnim(null);
        if (next.length === 6) pass("শক্তিও শুধু চেনা কয়েকটা না।");
      } else {
        setAnim(null);
        setNope(E4_JARS[at].pic);
        setMiss(miss + 1);
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap justify-center gap-1.5">
        {E4_JARS.map((j, i) => {
          const done = matched.includes(i);
          return (
            <button
              key={j.jar}
              type="button"
              disabled={done || pl.running}
              onClick={() => setSel(i)}
              className={`cursor-pointer rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors disabled:cursor-default motion-reduce:transition-none ${
                done ? "border-accent/40 text-accent-text opacity-60" : sel === i ? "border-cat-amber bg-cat-amber/15" : "border-border hover:border-cat-amber/60"
              }`}
            >
              {j.jar}
            </button>
          );
        })}
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {E4_ORDER.map((at) => {
          const done = matched.includes(at);
          const st = anim?.at === at ? (anim.ok ? "go" : "bad") : done ? "done" : "idle";
          return (
            <button
              key={at}
              type="button"
              onClick={() => tapPic(at)}
              disabled={sel === null || done || pl.running}
              className={`cursor-pointer rounded-xl border-2 p-1 text-center transition-colors disabled:cursor-default motion-reduce:transition-none ${
                done ? "border-accent" : st === "bad" ? "border-danger/60" : sel !== null ? "border-cat-amber/50 hover:border-cat-amber" : "border-border"
              }`}
            >
              <E4Pic pic={E4_JARS[at].pic} st={st} />
              <div className="mt-0.5 text-xs leading-tight text-muted">{E4_NAME[E4_JARS[at].pic]}</div>
              {done && <div className={`${FADE} text-xs font-semibold text-accent-text`}>{E4_JARS[at].jar}</div>}
            </button>
          );
        })}
      </div>
      {nope && !pl.running && <Nope key={miss}>{E4_NOPE[nope]}</Nope>}
      <Task done={matched.length === 6 && !pl.running}>একটা বয়াম বাছুন, তারপর তার ছবিতে tap করুন। ছয়টাই মেলান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the six jars on a shelf.
//      The first four are the familiar ones; the last two lead into the
//      nucleus, and the sun burns on them.

const X4_JARS = ["স্থিতি", "গতি", "মাধ্যাকর্ষণ", "বিদ্যুৎ-চৌম্বক", "সবল", "দুর্বল"];
const X4_SAY = [
  "ছয়টা বয়াম, ছয় রকম শক্তি।",
  "প্রথম চারটা চেনা। রোজ চোখের সামনে।",
  "শেষ দুইটা কাজ করে পরমাণুর একদম মাঝখানে, নিউক্লিয়াসে।",
  "অথচ সূর্য জ্বলছে এই দুইটার জোরে।",
];

export function JarShelf() {
  const s = useScene(3, [600, 1800, 2200, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X4_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="six jars of energy on a shelf; the last two lead into an atom's nucleus and to the sun">
        <rect width={240} height={110} rx={10} fill="white" />
        <rect x={8} y={62} width={224} height={5} rx={2} fill="#a16207" />
        {X4_JARS.map((j, i) => {
          const x = 26 + i * 38;
          const lit = (k >= 1 && i < 4) || (k >= 2 && i >= 4);
          return (
            <g key={j}>
              <rect x={x - 14} y={26} width={28} height={36} rx={5} fill={lit ? (i < 4 ? "#dbeafe" : "#fde68a") : "#f1f5f9"} stroke="#64748b" className="transition-colors duration-500 motion-reduce:transition-none" />
              <rect x={x - 10} y={20} width={20} height={7} rx={2} fill="#94a3b8" />
              <text x={x} y={48} textAnchor="middle" fontSize={j.length > 6 ? 5.8 : 7} fontWeight={700} fill={INK}>
                {j}
              </text>
            </g>
          );
        })}
        {k >= 1 && (
          <text x={83} y={80} textAnchor="middle" fontSize={8} fontWeight={700} fill="#1d4ed8" className={FADE}>
            চেনা চারটা
          </text>
        )}
        {k >= 2 && (
          <g className={POP}>
            <circle cx={197} cy={90} r={12} fill="#fff7ed" stroke="#d97706" />
            {[
              [-4, -3],
              [4, -3],
              [0, 4],
            ].map(([dx, dy]) => (
              <circle key={`${dx}${dy}`} cx={197 + dx} cy={90 + dy} r={3.2} fill={dx === 0 ? "#94a3b8" : "#ef4444"} />
            ))}
            <path d="M184 67l6 12M210 67l-6 12" stroke="#d97706" strokeWidth={1} strokeDasharray="2 2" />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <circle cx={130} cy={92} r={12} fill="#f59e0b" />
            <circle cx={130} cy={92} r={16} fill="#f97316" opacity={0.3} />
            <path d="M184 90H148" stroke="#d97706" strokeWidth={1.2} />
            <path d="M152 86l-5 4l5 4" stroke="#d97706" strokeWidth={1.2} fill="none" />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: আপা holds the X-ray film up
//      to the sun, the bones show white; ফাহিম leans in.

export function ApaXray({}: Story) {
  const s = useScene(2, [600, 2000, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="Apa holds an X-ray film up to the sun at the Medical Physics stall; the bones show white; Fahim leans in">
        <circle cx={40} cy={28} r={12} fill="#fde047" />
        <Stall x={236} y={150} sign="Medical Physics" color="#0d9488" w={96} />
        <Person who="apa" x={138} y={150} arm="hold" facing={-1} />
        <NameTag x={138} y={150} text="আপা" />
        <XrayFilm x={108} y={80} lit={k >= 1} />
        {k >= 1 && <path d="M50 34L110 86" stroke="#fde047" strokeWidth={1.4} strokeDasharray="3 3" className={FADE} />}
        <Person who="fahim" x={k >= 1 ? 86 : 60} y={150} walking={k === 1} label />
        {k >= 2 && <Bubble x={138} y={84} side="right" lines={["হাড়ে রশ্মি আটকায়,", "তাই হাড়টা সাদা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · The five hybrid stalls. Tap a stall and its picture plays the physics
//     inside it: starlight into a telescope, a heartbeat's electric trace, two
//     atoms pulled into a bond, a quake wave reaching the seismograph, an X-ray
//     beam through a hand. Then its sign fills in: X + পদার্থবিজ্ঞান = name.

const W5 = [
  { at: 2, left: "Astronomy", what: "তারার আলো ভেঙে রং, দূরের তারা কী দিয়ে তৈরি বোঝা যায়" },
  { at: 3, left: "জীববিজ্ঞান", what: "হৃদস্পন্দনের বৈদ্যুতিক সংকেত" },
  { at: 4, left: "রসায়ন", what: "দুইটা পরমাণু, মাঝে বিদ্যুতের টান" },
  { at: 5, left: "ভূ-তত্ত্ব", what: "মাটির ভিতর দিয়ে ভূমিকম্পের তরঙ্গ" },
  { at: 6, left: "চিকিৎসাবিজ্ঞান", what: "হাতের ভিতর দিয়ে X-ray রশ্মি" },
];

/** the stall's physics acted out, t = 0…1 */
function W5Play({ i, t }: { i: number; t: number }) {
  const ecg = "M10 70h40l6 -4l6 4h8l5 -34l7 54l5 -20h10l6 -6l6 6h40l6 -4l6 4h8l5 -34l7 54l5 -20h10l6 -6l6 6h36";
  return (
    <svg viewBox="0 0 280 120" className="block h-auto w-full" aria-hidden="true">
      <rect width={280} height={120} rx={10} fill={i === 0 ? "#0f172a" : "#f8fafc"} />
      {i === 0 && (
        <>
          <circle cx={36} cy={28} r={5} fill="#fde68a" />
          <circle cx={36} cy={28} r={9} fill="#fde68a" opacity={0.3} />
          <path d={`M42 32L${42 + (170 - 42) * t} ${32 + (84 - 32) * t}`} stroke="#fde68a" strokeWidth={1.4} strokeDasharray="4 3" />
          <path d="M170 88L222 58" stroke="#94a3b8" strokeWidth={10} strokeLinecap="round" />
          <path d="M196 74l-10 30M196 74l10 30" stroke="#94a3b8" strokeWidth={2} />
          {t > 0.9 &&
            ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"].map((c, j) => (
              <rect key={c} x={226 + j * 7} y={36} width={7} height={16} fill={c} className={FADE} />
            ))}
        </>
      )}
      {i === 1 && (
        <>
          <path d="M40 82C14 62 18 38 32 38C38 38 40 44 40 48C40 44 42 38 48 38C62 38 66 62 40 82Z" fill="#e11d48" style={{ transform: `scale(${t > 0.3 && t < 0.45 ? 1.12 : 1})`, transformOrigin: "40px 60px" }} />
          <path d={ecg} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} fill="none" stroke="#059669" strokeWidth={1.6} transform="translate(60 -10) scale(0.8)" />
        </>
      )}
      {i === 2 && (
        <>
          <circle cx={60 + 60 * t} cy={60} r={18} fill="#3b82f6" />
          <circle cx={220 - 60 * t} cy={60} r={22} fill="#f97316" />
          {t > 0.85 && <path d="M136 60H142" stroke="#0f172a" strokeWidth={4} className={FADE} />}
          {t > 0.2 && t < 0.85 && <path d={`M${80 + 60 * t} 60H${196 - 60 * t}`} stroke="#7c3aed" strokeWidth={1} strokeDasharray="3 3" />}
        </>
      )}
      {i === 3 && (
        <>
          <rect y={70} width={280} height={50} fill="#d6b98c" />
          <rect y={92} width={280} height={28} fill="#a16207" opacity={0.5} />
          <circle cx={30} cy={100} r={4} fill="#b91c1c" />
          <path d={`M30 96${Array.from({ length: 12 }, (_, j) => `q${10} ${j % 2 ? 8 : -8} 20 0`).join("")}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, t * 1.3)} fill="none" stroke="#b91c1c" strokeWidth={1.4} />
          <rect x={210} y={30} width={56} height={34} rx={3} fill="white" stroke="#334155" />
          <path d={`M214 47h${Math.max(0, (t - 0.7) / 0.3) * 48 * 0.3}${t > 0.75 ? "l3 -10l4 20l4 -18l4 14l3 -8h10" : ""}`} fill="none" stroke="#0f172a" strokeWidth={1} />
        </>
      )}
      {i === 4 && (
        <>
          <rect x={20} y={14} width={34} height={20} rx={3} fill="#475569" />
          <path d={`M54 26L${54 + 150 * t} ${26 + 50 * t}`} stroke="#a855f7" strokeWidth={6} opacity={0.35} />
          <path d="M120 60q8 -6 20 -4l30 2q6 2 0 6l-24 4q-18 4 -26 -8Z" fill="#fcd9b6" stroke="#c68e5f" />
          <rect x={200} y={54} width={50} height={50} rx={2} fill="#1e293b" />
          {t > 0.8 && <path d="M212 90V74M222 92V70M232 90V72M212 74l-2 -8M232 72l2 -8" stroke="white" strokeWidth={2.2} strokeLinecap="round" className={FADE} />}
        </>
      )}
    </svg>
  );
}

function W5Stage({ i }: { i: number }) {
  const [t] = useTween([1], 1400, [0]);
  // a preview renders without effects, so it shows the played-out picture
  return <W5Play i={i} t={useSeeded() ? 1 : t} />;
}

export function StallWalk() {
  const pass = useGate();
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const pl = usePlay(1500);

  const visit = (i: number) => {
    if (pl.running) return;
    sfx.tap();
    setCur(i);
    pl.play(1, () => {
      const next = seen.includes(i) ? seen : [...seen, i];
      setSeen(next);
      if (next.length === 5) pass("পাঁচটাই পদার্থবিজ্ঞান + আরেকটা শাখা।");
    });
  };
  const st = cur === null ? null : STALLS[W5[cur].at];
  const shown = cur !== null && !pl.running;

  return (
    <>
      <div className="grid grid-cols-5 gap-1">
        {W5.map((w, i) => (
          <button
            key={w.at}
            type="button"
            onClick={() => visit(i)}
            disabled={pl.running}
            className={`cursor-pointer rounded-lg border-2 px-0.5 py-1 transition-colors disabled:cursor-default motion-reduce:transition-none ${
              cur === i ? "border-cat-blue bg-cat-blue/10" : seen.includes(i) ? "border-accent/60" : "border-border hover:border-cat-blue/60"
            }`}
            aria-label={STALLS[w.at].name}
          >
            <svg viewBox="-16 -14 32 28" className="mx-auto block h-7 w-auto" aria-hidden="true">
              <StallIcon kind={STALLS[w.at].id} x={0} y={0} s={1.1} />
            </svg>
            <div className="truncate text-[0.62rem] leading-tight">{STALLS[w.at].name}</div>
          </button>
        ))}
      </div>
      <div className="mt-2 overflow-hidden rounded-xl">
        {cur === null ? (
          <div className="grid aspect-[7/3] place-items-center rounded-xl bg-foreground/[0.04] text-sm text-muted">একটা stall-এ tap করুন।</div>
        ) : (
          <W5Stage key={`${cur}-${seen.length}`} i={cur} />
        )}
      </div>
      <div className="mt-2 min-h-14 text-center">
        {st && shown && (
          <div key={cur} className={FADE}>
            <div className="text-sm text-muted">{W5[cur ?? 0].what}</div>
            <div className="mt-1 text-[0.95rem] font-semibold">
              {W5[cur ?? 0].left} + <span className="text-cat-blue">পদার্থবিজ্ঞান</span> = {st.name}
            </div>
          </div>
        )}
      </div>
      <Ticks items={W5.map((w, i) => [STALLS[w.at].name, seen.includes(i)])} />
      <Task done={seen.length === 5 && !pl.running}>পাঁচটা stall-এই tap করে দেখুন, ভিতরে কোন পদার্থবিজ্ঞান চলছে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: from war to space. A
//      cannon, a phone's chip, a rocket rising; one bar under all three:
//      পদার্থবিজ্ঞান.

const X5_SAY = [
  "যুদ্ধের তাণ্ডব।",
  "আপনার হাতের phone: ইলেকট্রনিক্স, এই সভ্যতার সবচেয়ে বড় অবদান।",
  "মহাকাশ অভিযান।",
  "তিনটার নিচেই পদার্থবিজ্ঞান।",
];

export function WarToSpace() {
  const s = useScene(3, [600, 1600, 2200, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="a cannon, a phone chip and a rising rocket, with physics under all three">
        <rect width={240} height={110} rx={10} fill="white" />
        <g className={POP}>
          <path d="M18 72l36 -14l3 8l-36 14Z" fill="#475569" />
          <circle cx={30} cy={80} r={8} fill="#78350f" />
          {k === 0 && <circle cx={62} cy={58} r={5} fill="#f97316" className={POP} />}
        </g>
        {k >= 1 && (
          <g className={POP}>
            <rect x={104} y={36} width={32} height={52} rx={5} fill="#1f2937" />
            <rect x={108} y={42} width={24} height={36} rx={2} fill="#60a5fa" />
            <StallIcon kind="chip" x={120} y={60} s={0.9} />
          </g>
        )}
        {k >= 2 && (
          <g style={{ transform: k >= 2 ? "translateY(-14px)" : "none" }} className="transition-transform duration-1000 ease-out motion-reduce:transition-none">
            <path d="M196 30q8 12 8 34h-16q0 -22 8 -34Z" fill="#e2e8f0" stroke="#475569" />
            <path d="M188 64l-6 10h8ZM204 64l6 10h-8Z" fill="#dc2626" />
            <path d="M192 76q4 10 8 0" fill="#f97316" />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={14} y={94} width={212} height={12} rx={6} fill="#1e3a8a" />
            <text x={120} y={103} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="white">
              পদার্থবিজ্ঞান
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · Nine branch cards, two shelves. One card at a time; the reader sends it
//     to চিরায়ত or আধুনিক. A right one slides onto its shelf; a wrong one lands,
//     wobbles and slides back. The আধুনিক shelf carries its label: কোয়ান্টাম
//     বলবিজ্ঞান আর আপেক্ষিক তত্ত্ব লাগে।

const B6: { name: string; modern: boolean; nope: string }[] = [
  { name: "বলবিজ্ঞান", modern: false, nope: "বলবিজ্ঞান ঠেলা, টান, চলা নিয়ে। চোখের সামনের জগৎ।" },
  { name: "কণা পদার্থবিজ্ঞান", modern: true, nope: "কণা মানে পরমাণুর চেয়েও ছোট জিনিস। ওখানে কোয়ান্টাম লাগে।" },
  { name: "শব্দবিজ্ঞান", modern: false, nope: "শব্দ শোনা যায়, মাপা যায়। চোখের-কানের সামনের জগৎ।" },
  { name: "নিউক্লীয় পদার্থবিজ্ঞান", modern: true, nope: "নিউক্লিয়াস পরমাণুর একদম মাঝখানে। ওখানে কোয়ান্টাম লাগে।" },
  { name: "তাপ ও তাপগতিবিজ্ঞান", modern: false, nope: "তাপ হাতে লাগে, থার্মোমিটারে মাপা যায়। চোখের সামনের জগৎ।" },
  { name: "আণবিক ও পারমাণবিক পদার্থবিজ্ঞান", modern: true, nope: "অণু আর পরমাণুর ভিতরের কথা। ওখানে কোয়ান্টাম লাগে।" },
  { name: "বিদ্যুৎ ও চৌম্বক বিজ্ঞান", modern: false, nope: "চুম্বক, ব্যাটারি, তার। চোখের সামনের জগৎ।" },
  { name: "কঠিন অবস্থার পদার্থবিজ্ঞান", modern: true, nope: "কঠিন জিনিসের ভিতরে ইলেকট্রন কীভাবে চলে, সেই কথা। পরমাণুর জগৎ, কোয়ান্টাম লাগে।" },
  { name: "আলোক বিজ্ঞান", modern: false, nope: "আলো, আয়না, লেন্স। চোখের সামনের জগৎ।" },
];

export function TwoShelves() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [fly, setFly] = useSeed<{ modern: boolean; ok: boolean } | null>("fly", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const [nope, setNope] = useSeed<number | null>("nope", null);
  const pl = usePlay(650);
  const done = at >= B6.length;
  const card = B6[Math.min(at, B6.length - 1)];

  const send = (modern: boolean) => {
    if (pl.running || done) return;
    const ok = card.modern === modern;
    setFly({ modern, ok });
    setNope(null);
    sfx.slip();
    pl.play(ok ? 1 : 2, () => {
      setFly(null);
      if (ok) {
        const next = at + 1;
        setAt(next);
        if (next === B6.length) pass("পাঁচ আর চার: চিরায়ত, আধুনিক।");
      } else {
        setNope(at);
        setMiss(miss + 1);
      }
    });
  };

  const onShelf = (modern: boolean) => B6.slice(0, at).filter((b) => b.modern === modern);
  // where the card sits: centre, flown to a side, or (a wrong one) on its way back
  const dx = fly && (fly.ok || pl.k < 1) ? (fly.modern ? 36 : -36) : 0;

  const shelf = (modern: boolean) => (
    <div className={`flex min-h-[9.5rem] flex-col rounded-xl border-2 p-2 ${modern ? "border-cat-violet/40 bg-cat-violet/5" : "border-cat-amber/40 bg-cat-amber/5"}`}>
      <div className="text-center text-[0.95rem] font-bold">{modern ? "আধুনিক" : "চিরায়ত"}</div>
      <div className="mb-1 text-center text-xs leading-tight text-muted">{modern ? "লাগে কোয়ান্টাম বলবিজ্ঞান বা আপেক্ষিক তত্ত্ব" : "চোখের সামনের জগৎ"}</div>
      <div className="flex flex-col gap-1">
        {onShelf(modern).map((b) => (
          <div key={b.name} className={`${POP} rounded-md bg-surface px-1.5 py-0.5 text-center text-xs leading-tight shadow-sm ring-1 ring-black/5`}>
            {b.name}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="relative h-14">
        {!done && (
          <div
            key={at}
            style={{ transform: `translateX(${dx}%)` }}
            className={`${POP} absolute inset-x-0 mx-auto w-56 rounded-xl border-2 bg-surface px-3 py-2 text-center text-[0.95rem] font-semibold shadow-sm transition-transform duration-500 ease-out motion-reduce:transition-none ${
              fly && !fly.ok ? "nudge border-danger/60" : "border-cat-blue"
            }`}
          >
            {card.name}
          </div>
        )}
        {done && <div className={`${FADE} pt-3 text-center text-[0.95rem] text-accent-text`}>নয়টা card-ই তাকে উঠলো।</div>}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {shelf(false)}
        {shelf(true)}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => send(false)} disabled={pl.running || done} className={`${quietBtn} justify-center`}>
          চিরায়ত তাকে
        </button>
        <button type="button" onClick={() => send(true)} disabled={pl.running || done} className={`${quietBtn} justify-center`}>
          আধুনিক তাকে
        </button>
      </div>
      {nope !== null && !pl.running && <Nope key={miss}>{B6[nope].nope}</Nope>}
      <Task done={done && !pl.running}>প্রতিটা শাখার card ঠিক তাকে পাঠান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the two shelves with a
//      picture per branch; then the label for the new shelf drops on: the two
//      theories it stands on.

const X6_SAY = [
  "চিরায়ত তাকে পাঁচটা: বল, শব্দ, তাপ, বিদ্যুৎ-চুম্বক, আলো।",
  "আধুনিক তাকে চারটা: অণু-পরমাণু, নিউক্লিয়াস, কঠিন অবস্থা, কণা।",
  "আধুনিক তাক দাঁড়িয়ে দুইটা নতুন তত্ত্বের উপর।",
];

export function ShelfSplit() {
  const s = useScene(2, [600, 2000, 2200]);
  const k = s.k;
  const left = ["ball", "wave", "flame", "magnet", "lens"];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="the classical shelf with five pictures and the modern shelf with four; a label drops on the modern shelf: quantum mechanics and relativity">
        <rect width={240} height={110} rx={10} fill="white" />
        <rect x={8} y={74} width={108} height={5} rx={2} fill="#d97706" />
        <text x={62} y={94} textAnchor="middle" fontSize={9} fontWeight={700} fill="#b45309">
          চিরায়ত (Classical)
        </text>
        {left.map((p, i) => {
          const x = 20 + i * 21;
          return (
            <g key={p} className={POP} style={{ transitionDelay: `${i * 120}ms` }}>
              {p === "ball" && <circle cx={x} cy={64} r={7} fill="#2563eb" />}
              {p === "wave" && <path d={`M${x - 8} 64q4 -8 8 0t8 0`} fill="none" stroke="#0d9488" strokeWidth={2} />}
              {p === "flame" && <path d={`M${x} 56q-7 8 -3 14q3 3 6 0q4 -6 -3 -14Z`} fill="#f97316" />}
              {p === "magnet" && <path d={`M${x - 6} 56v10a6 6 0 0 0 12 0v-10h-4v10a2 2 0 0 1 -4 0v-10Z`} fill="#dc2626" />}
              {p === "lens" && <ellipse cx={x} cy={63} rx={3.5} ry={9} fill="#bae6fd" stroke="#0369a1" />}
            </g>
          );
        })}
        {k >= 1 && (
          <g className={FADE}>
            <rect x={124} y={74} width={108} height={5} rx={2} fill="#7c3aed" />
            <text x={178} y={94} textAnchor="middle" fontSize={9} fontWeight={700} fill="#6d28d9">
              আধুনিক (Modern)
            </text>
            <g fill="none" stroke="#7c3aed" strokeWidth={0.9}>
              <ellipse cx={138} cy={63} rx={9} ry={3.5} />
              <ellipse cx={138} cy={63} rx={9} ry={3.5} transform="rotate(60 138 63)" />
              <ellipse cx={138} cy={63} rx={9} ry={3.5} transform="rotate(-60 138 63)" />
            </g>
            <circle cx={164} cy={61} r={3} fill="#ef4444" />
            <circle cx={169} cy={65} r={3} fill="#94a3b8" />
            <circle cx={161} cy={66} r={3} fill="#ef4444" />
            <StallIcon kind="chip" x={192} y={63} s={0.8} />
            <path d="M210 70q6 -12 18 -14" fill="none" stroke="#7c3aed" strokeWidth={1.2} strokeDasharray="2 2" />
            <circle cx={228} cy={56} r={1.8} fill="#7c3aed" />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <rect x={122} y={10} width={112} height={32} rx={6} fill="#ede9fe" stroke="#7c3aed" />
            <text x={178} y={23} textAnchor="middle" fontSize={8} fontWeight={700} fill="#5b21b6">
              কোয়ান্টাম বলবিজ্ঞান
            </text>
            <text x={178} y={35} textAnchor="middle" fontSize={8} fontWeight={700} fill="#5b21b6">
              + আপেক্ষিক তত্ত্ব
            </text>
            <path d="M178 42v8" stroke="#7c3aed" strokeWidth={1.2} />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn. The map again, empty; the reader banners the stalls with no
//     help, then checks. The check walks the map stall by stall and says what
//     is inside each one. A banner on the poetry stall falls over; a physics
//     stall left bare gets a red ghost banner. Fix and check again.

const Y7_NOPE_EXTRA = "কবিতার stall-এর banner পড়ে গেলো। কবিতা লেখায় পদার্থ আর শক্তির কোন কাজটা হচ্ছে?";
/** what a bare physics stall has inside, said when its banner is missing */
const Y7_MISS: Partial<Record<IconKind, string>> = {
  salt: "রসায়নের stall-এ banner নাই। Block-এর tower মনে আছে? রসায়ন দাঁড়িয়ে আছে পদার্থবিজ্ঞানের উপর।",
  leaf: "জীববিজ্ঞানের stall-এ banner নাই। Tower-এ জীববিজ্ঞানের নিচে রসায়ন, তার নিচে পদার্থবিজ্ঞান।",
  chip: "ইলেকট্রনিক্সে banner নাই। Chip-এর কঠিন পদার্থের ভিতর দিয়ে ইলেকট্রন চলে। এটা কঠিন অবস্থার পদার্থবিজ্ঞান।",
  radio: "রেডিওতে banner নাই। তার ছাড়াই খবর আসে বিদ্যুৎ আর চুম্বকের ঢেউয়ে। বিদ্যুৎ ও চৌম্বক বিজ্ঞান।",
  speaker: "সাউন্ড বক্সে banner নাই। ভিতরের পর্দা কেঁপে বাতাসে শব্দ ছড়ায়। এটা শব্দবিজ্ঞান।",
  stove: "রান্নার চুলায় banner নাই। আগুনের তাপ হাঁড়িতে যায়, পানি ফোটে। এটা তাপ ও তাপগতিবিজ্ঞান।",
};
const y7Missing = (i: number) => Y7_MISS[STALLS[i].id] ?? `${STALLS[i].name}-এ banner নাই। নামের মধ্যেই physics: ${STALLS[i].why}।`;

export function YourStalls() {
  const pass = useGate();
  const [banners, setBanners] = useSeed<number[]>("banners", []);
  const [checked, setChecked] = useSeed("checked", false);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(220);
  const n = pl.running ? pl.k : checked ? 12 : 0;

  const marks: Mark[] = STALLS.map((st, i) => {
    if (i >= n) return null;
    const on = banners.includes(i);
    return on === st.physics ? "ok" : on ? "extra" : "missing";
  });
  const wrong = STALLS.findIndex((st, i) => banners.includes(i) !== st.physics);
  const allRight = wrong === -1;

  const tap = (i: number) => {
    if (pl.running) return;
    sfx.tap();
    setChecked(false);
    setBanners(banners.includes(i) ? banners.filter((b) => b !== i) : [...banners, i]);
  };
  const check = () => {
    if (pl.running) return;
    setChecked(true);
    pl.play(12, () => {
      if (allRight) pass("বারোটার এগারোটাই পদার্থবিজ্ঞান।");
      else setMiss(miss + 1);
    });
  };
  const cur = pl.running && n > 0 ? n - 1 : null;

  return (
    <>
      <div className="mx-auto w-full max-w-[22rem]">
        <FairField banners={banners} onTap={tap} marks={marks} label="the fair map again; tap stalls to put banners, then check" />
      </div>
      <div className="mt-1.5 min-h-10 text-center text-sm">
        {cur !== null ? (
          <span key={cur} className={FADE}>
            <b>{STALLS[cur].name}:</b> {STALLS[cur].why}
          </span>
        ) : (
          <span className="text-muted">
            হাতে banner: <span className="font-mono">{12 - banners.length}</span> টা
          </span>
        )}
      </div>
      <div className="mt-1 flex justify-center">
        <button type="button" onClick={check} disabled={pl.running || (checked && allRight)} className={primaryBtn}>
          মিলিয়ে দেখুন
        </button>
      </div>
      {checked && !pl.running && !allRight && <Nope key={miss}>{banners.includes(11) ? Y7_NOPE_EXTRA : y7Missing(wrong)}</Nope>}
      <Task done={checked && allRight && !pl.running}>কারো সাহায্য ছাড়া banner বসান। তারপর মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for Your turn's explanation, no task: the poetry stall. A
//      reciter; sound waves leave the mouth and get a tag, শব্দবিজ্ঞান; the page
//      of words gets none.

const X7_SAY = [
  "কবিতার stall-এ একজন আবৃত্তি করছে।",
  "গলা থেকে শব্দ বের হয়ে বাতাসে ছড়ায়। ওটুকু অবশ্য শব্দবিজ্ঞান।",
  "কিন্তু কবিতার আসল জিনিস মানে আর ছন্দ। ওটা পদার্থ-শক্তির হিসাব না।",
];

export function PoemStall() {
  const s = useScene(2, [600, 2200, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X7_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="a reciter at the poetry stall; the sound waves get the tag acoustics; the page of the poem gets none">
        <rect width={240} height={110} rx={10} fill="white" />
        <Person who="rina" x={56} y={100} arm="hold" />
        <rect x={62} y={54} width={16} height={20} rx={1} fill="#fffbeb" stroke="#a16207" strokeWidth={0.8} />
        <path d="M65 59h10M65 63h9M65 67h10" stroke="#a16207" strokeWidth={0.7} />
        {k >= 1 && (
          <g>
            {[0, 1, 2].map((j) => (
              <Draw key={j} d={`M${76 + j * 12} ${40 - j * 4}q8 8 0 16`} delay={j * 200} ms={500} className="stroke-[#0d9488]" strokeWidth={1.6} />
            ))}
            <g className={POP}>
              <rect x={112} y={28} width={62} height={16} rx={8} fill="#ccfbf1" stroke="#0d9488" />
              <text x={143} y={39} textAnchor="middle" fontSize={8} fontWeight={700} fill="#0f766e">
                শব্দবিজ্ঞান
              </text>
            </g>
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <rect x={150} y={56} width={60} height={42} rx={2} fill="#fffbeb" stroke="#a16207" />
            <text x={180} y={70} textAnchor="middle" fontSize={7.5} fill="#78350f">
              কথার মানে
            </text>
            <text x={180} y={82} textAnchor="middle" fontSize={7.5} fill="#78350f">
              ছন্দ
            </text>
            <circle cx={214} cy={56} r={8} fill="white" stroke="#94a3b8" />
            <text x={214} y={60} textAnchor="middle" fontSize={10} fontWeight={800} fill={MUTE}>
              –
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it: a new stall, "মোবাইল ফোনের ব্যাটারি". The reader puts branch chips
//     into the battery and switches the phone on. Only রসায়ন + বিদ্যুৎ ও চৌম্বক +
//     কঠিন অবস্থার lights the screen: a chip that doesn't belong pops back out,
//     a missing one leaves its slot red and the phone dark.

const P8 = [
  { name: "রসায়ন", short: "রসায়ন", need: true, role: "রসায়ন নাই মানে ভিতরে বিক্রিয়া নাই। charge আসবে কোথা থেকে?" },
  { name: "শব্দবিজ্ঞান", short: "", need: false, role: "Battery গান গায় না। শব্দবিজ্ঞানের কাজ নাই।" },
  { name: "বিদ্যুৎ ও চৌম্বক", short: "বিদ্যুৎ-চুম্বক", need: true, role: "তারে বিদ্যুৎ না চললে phone পর্যন্ত কিছুই পৌঁছায় না।" },
  { name: "জীববিজ্ঞান", short: "", need: false, role: "Battery-র ভিতরে জ্যান্ত কিছু নাই।" },
  { name: "কঠিন অবস্থার", short: "কঠিন অবস্থা", need: true, role: "Battery-র দুই মাথা বিশেষ কঠিন পদার্থের। ওদের খবর রাখে কঠিন অবস্থার পদার্থবিজ্ঞান।" },
  { name: "নিউক্লীয়", short: "", need: false, role: "Battery-তে নিউক্লিয়াস ভাঙেও না, জোড়াও লাগে না।" },
];

export function TryBattery() {
  const pass = useGate();
  const [inside, setInside] = useSeed<number[]>("inside", []);
  const [tried, setTried] = useSeed("tried", false);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(160);
  const extra = inside.filter((i) => !P8[i].need);
  const missing = P8.map((_, i) => i).filter((i) => P8[i].need && !inside.includes(i));
  const good = extra.length === 0 && missing.length === 0;
  const settled = tried && !pl.running;
  const lit = settled && good;

  const toggle = (i: number) => {
    if (pl.running) return;
    sfx.tap();
    setTried(false);
    setInside(inside.includes(i) ? inside.filter((x) => x !== i) : [...inside, i]);
  };
  const run = () => {
    if (pl.running) return;
    setTried(true);
    sfx.click();
    pl.play(8, () => {
      if (good) pass("battery-র ভিতরে তিন শাখা একসাথে।");
      else {
        setInside(inside.filter((i) => P8[i].need));
        setMiss(miss + 1);
      }
    });
  };
  // the charge bar fills while it runs, as far as the right chips carry it
  const fill = pl.running ? (pl.k / 8) * (3 - missing.length) / 3 : lit ? 1 : 0;
  const slots = P8.map((p, i) => ({ ...p, i })).filter((p) => p.need);

  return (
    <>
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 100 170" className="block h-auto w-[6.5rem] shrink-0" role="img" aria-label={lit ? "the phone's screen lights up" : "a phone with its battery open; the screen is dark"}>
          <rect x={6} y={4} width={88} height={162} rx={12} fill="#1f2937" />
          <rect x={12} y={14} width={76} height={62} rx={4} fill={lit ? "#60a5fa" : "#0f172a"} className="transition-colors duration-500 motion-reduce:transition-none" />
          {lit && (
            <text x={50} y={50} textAnchor="middle" fontSize={10} fontWeight={700} fill="white" className={FADE}>
              চালু
            </text>
          )}
          <rect x={16} y={84} width={68} height={76} rx={4} fill="#e5e7eb" />
          <rect x={16} y={160 - 76 * fill} width={68} height={76 * fill} rx={4} fill="#86efac" />
          {slots.map((p, j) => {
            const on = inside.includes(p.i);
            const red = settled && !on;
            return (
              <g key={p.name}>
                <rect x={20} y={88 + j * 24} width={60} height={20} rx={3} fill={on ? "#1e3a8a" : "white"} stroke={red ? "#e11d48" : "#94a3b8"} strokeDasharray={on ? undefined : "3 2"} strokeWidth={red ? 1.6 : 1} />
                {on && (
                  <text x={50} y={101 + j * 24} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white" className={POP}>
                    {p.short}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 text-sm text-muted">কোন কোন শাখা ভিতরে যাবে?</div>
          <div className="flex flex-wrap gap-1.5">
            {P8.map((p, i) => {
              const on = inside.includes(i);
              const popping = pl.running && on && !p.need && pl.k >= 5;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => toggle(i)}
                  disabled={pl.running || lit}
                  className={`cursor-pointer rounded-full border-2 px-2.5 py-1 text-sm font-semibold transition-colors disabled:cursor-default motion-reduce:transition-none ${
                    popping ? "nudge border-danger bg-danger/10" : on ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5">
            <button type="button" onClick={run} disabled={pl.running || lit || inside.length === 0} className={primaryBtn}>
              phone চালু করুন
            </button>
          </div>
        </div>
      </div>
      {settled && !good && (
        <Nope key={miss}>
          {extra.length ? `${P8[extra[0]].role} বের করে দিলাম। ` : ""}
          {missing.length ? `phone অন্ধকার। ${P8[missing[0]].role}` : "আবার চালু করে দেখুন।"}
        </Nope>
      )}
      <Task done={lit}>যে শাখাগুলো battery-র ভিতরে কাজ করে, সেগুলো দিয়ে phone চালু করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for Try it's explanation, no task: a battery cut open. Two
//      solid ends, charge crossing inside, and current round the wire outside
//      lighting a bulb.

const X8_SAY = [
  "দুই মাথায় বিশেষ কঠিন পদার্থ। ওদের খবর রাখে কঠিন অবস্থার পদার্থবিজ্ঞান।",
  "ভিতরে রাসায়নিক বিক্রিয়া: charge এক মাথা থেকে আরেক মাথায় যায়। এটা রসায়ন।",
  "বাইরের তারে বিদ্যুৎ প্রবাহ, phone পর্যন্ত। এটা বিদ্যুৎ ও চৌম্বক বিজ্ঞান।",
];

export function BatteryInside() {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X8_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="a battery cut open: two solid ends, charge moving inside, current in the wire outside lighting a bulb">
        <rect width={240} height={110} rx={10} fill="white" />
        <rect x={40} y={50} width={120} height={46} rx={6} fill="#f1f5f9" stroke="#334155" strokeWidth={1.5} />
        {[0, 1].map((side) => (
          <g key={side}>
            {Array.from({ length: 12 }, (_, j) => (
              <circle key={j} cx={(side ? 146 : 50) + (j % 3) * 5} cy={58 + Math.floor(j / 3) * 9} r={2} fill={side ? "#dc2626" : "#475569"} />
            ))}
          </g>
        ))}
        {k >= 1 &&
          [0, 1, 2].map((j) => (
            <circle key={j} cx={70} cy={62 + j * 12} r={2.6} fill="#d97706" style={{ transform: "translateX(66px)", transitionDelay: `${j * 250}ms` }} className="transition-transform duration-[1400ms] ease-in-out motion-reduce:transition-none" />
          ))}
        {k >= 2 && (
          <g>
            <Draw d="M55 50V24H190V40" ms={700} className="stroke-[#334155]" strokeWidth={1.6} />
            <Draw d="M190 60V90H160" ms={500} delay={500} className="stroke-[#334155]" strokeWidth={1.6} />
            <circle cx={190} cy={50} r={9} fill="#fde047" stroke="#334155" className={POP} />
            {[0, 1, 2, 3].map((j) => (
              <circle key={j} cx={70 + j * 30} cy={24} r={2} fill="#2563eb" className={POP} style={{ transitionDelay: `${300 + j * 120}ms` }} />
            ))}
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for the last step's setup, no task: by afternoon the
//      banners are up. The poetry stall has only a paper garland. নাসিব ties the
//      chemistry stall's banner himself, and says nothing.

export function BannersUp({}: Story) {
  const s = useScene(2, [600, 2000, 2600]);
  const k = s.k;
  const flag = (x: number) => (
    <g className={POP}>
      <path d={`M${x} 86V58`} stroke="#475569" strokeWidth={1.4} />
      <path d={`M${x} 58h16l-3 5l3 5h-16Z`} fill="#2563eb" />
    </g>
  );
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="the field in the afternoon: banners on the stalls, a paper garland on the poetry stall; Nasib ties the chemistry stall's banner himself">
        <Stall x={46} y={150} sign="রসায়ন" color="#d97706" w={62} />
        <Stall x={126} y={150} sign="রেডিও" color="#2563eb" w={62} />
        <Stall x={206} y={150} sign="Geophysics" color="#16a34a" w={62} />
        <Stall x={284} y={150} sign="কবিতা" color="#db2777" w={56} />
        {k >= 1 && flag(142)}
        {k >= 1 && flag(222)}
        <path d="M258 90q13 8 26 0q13 8 26 0" fill="none" stroke="#f472b6" strokeWidth={1.6} strokeDasharray="1 3" strokeLinecap="round" />
        {k >= 2 && flag(62)}
        <Person who="nasib" x={k >= 2 ? 84 : 110} y={164} walking={k === 2} arm={k >= 2 ? "hold" : "down"} facing={-1} label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9 · The bet settled. The sealed bet comes back on the map (the "?" banners);
//     "বাজি খুলুন" walks all twelve stalls and marks each one against the truth.

export function BetSettle() {
  const pass = useGate();
  const [bet] = useSeed<number[] | null>("bet", S1_BET);
  const [open, setOpen] = useSeed("open", false);
  const pl = usePlay(240);
  const n = pl.running ? pl.k : open ? 12 : 0;
  const shown = bet ?? TRUTH;
  const marks: Mark[] = STALLS.map((st, i) => (i >= n ? null : bet === null ? (st.physics ? "ok" : "dim") : shown.includes(i) === st.physics ? "ok" : shown.includes(i) ? "extra" : "missing"));
  const agree = bet === null ? 0 : STALLS.filter((st, i) => bet.includes(i) === st.physics).length;

  const reveal = () => {
    if (open) return;
    setOpen(true);
    pl.play(12, () => pass("এগারোটা banner, একটা কবিতার stall।"));
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[22rem]">
        <FairField banners={shown} marks={marks} ask={!open} label="your sealed bet on the fair map, checked stall by stall" />
      </div>
      <div className="mt-2 min-h-10 text-center text-[0.95rem]">
        {!open && <span className="text-muted">{bet ? "এই হলো সোমবার সকালের বাজি।" : "সোমবার সকালের বাজিটা মনে করুন।"}</span>}
        {open && !pl.running && (
          <span className={FADE}>
            {bet ? (
              <>
                বারোটার মধ্যে <b className="font-mono">{agree}</b> টা মিললো। ঠিক উত্তর: এগারোটা banner, শুধু কবিতার stall বাদ।
              </>
            ) : (
              <>এগারোটা banner, শুধু কবিতার stall বাদ। আপনার বাজির সাথে মিলিয়ে নিন।</>
            )}
          </span>
        )}
      </div>
      {!open && (
        <div className="mt-1 flex justify-center">
          <button type="button" onClick={reveal} className={primaryBtn}>
            বাজি খুলুন
          </button>
        </div>
      )}
      <Task done={open && !pl.running}>বাজি খুলে একটা একটা stall মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for the last step's explanation, no task: why each stall got
//      its banner, group by group on the map: the tower, the five with physics
//      in their name, the four that are a branch's work, and the poem.

const X9_SAY = [
  "বারোটা stall। এক এক করে দেখি।",
  "রসায়ন আর জীববিজ্ঞান: দাঁড়িয়ে আছে পদার্থবিজ্ঞানের উপর।",
  "পাঁচটার নামেই physics: আরেকটা শাখা + পদার্থবিজ্ঞান।",
  "ইলেকট্রনিক্স, রেডিও, সাউন্ড বক্স, চুলা: প্রতিটা একটা শাখার কাজ।",
  "আর বাকি? শুধু কবিতা।",
];
const X9_GROUP = [
  [0, 1],
  [2, 3, 4, 5, 6],
  [7, 8, 9, 10],
  [11],
];

export function WhyEach() {
  const s = useScene(4, [600, 1800, 2000, 2200, 1800]);
  const k = s.k;
  // the group this beat is about is ringed; the poem, when its turn comes, is greyed
  const marks: Mark[] = STALLS.map((_, i) => (k > 0 && X9_GROUP[k - 1].includes(i) ? (i === 11 ? "dim" : "ring") : null));
  const banners = TRUTH.filter((i) => X9_GROUP.findIndex((grp) => grp.includes(i)) < k);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X9_SAY[k]}</span>}>
      <div className="mx-auto w-full max-w-[16rem]">
        <FairField banners={banners} marks={marks} label="the map, group by group: the tower, the five hybrids, the four branch stalls, and the poem" />
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  FieldMorning: { rule: { k: 1 }, xray: { k: 2 }, end: {} },
  FairMap: { start: {}, picked: { banners: [2, 3, 6, 9] }, sealed: { banners: [2, 3, 6, 9, 10], sealed: true } },
  LensLeaf: { start: { k: 0 }, lens: { k: 2 }, end: {} },
  Tower: { start: {}, top: { pulled: 2, tried: [2] }, bottom: { pulled: 0, tried: [2, 1, 0] } },
  OldestTower: { sky: { k: 1 }, end: {} },
  SaltBowl: { read: { k: 1 }, end: {} },
  SaltZoom: { start: {}, atom: { lv: 2 }, quark: { lv: 4 }, end: { lv: 5 } },
  TwoWords: { mid: { k: 2 }, end: {} },
  EnergyShelf: { start: {}, sel: { sel: 2 }, wrong: { sel: 0, nope: "mango", miss: 1 }, some: { matched: [2, 3, 0] }, all: { matched: [0, 1, 2, 3, 4, 5] } },
  JarShelf: { mid: { k: 2 }, end: {} },
  ApaXray: { lit: { k: 1 }, end: {} },
  StallWalk: { start: {}, astro: { cur: 0, seen: [0] }, xray: { cur: 4, seen: [0, 1, 2, 3, 4] } },
  WarToSpace: { mid: { k: 1 }, end: {} },
  TwoShelves: { start: {}, some: { at: 5 }, wrong: { at: 7, nope: 7, miss: 1 }, done: { at: 9 } },
  ShelfSplit: { mid: { k: 1 }, end: {} },
  YourStalls: { start: {}, poem: { banners: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], checked: true, miss: 1 }, gap: { banners: [2, 3, 4, 5, 6, 7, 8], checked: true, miss: 1 }, right: { banners: TRUTH, checked: true } },
  PoemStall: { mid: { k: 1 }, end: {} },
  TryBattery: { start: {}, extra: { inside: [0, 2], tried: true, miss: 1 }, right: { inside: [0, 2, 4], tried: true } },
  BatteryInside: { mid: { k: 1 }, end: {} },
  BannersUp: { flags: { k: 1 }, end: {} },
  BetSettle: { start: { bet: [2, 3, 6, 9, 10] }, open: { bet: [2, 3, 6, 9, 10], open: true }, nobet: { bet: null, open: true } },
  WhyEach: { tower: { k: 1 }, hybrids: { k: 2 }, end: {} },
};
