"use client";

import { useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, primaryBtn, quietBtn, usePlay, useScene, useSeed, useSeeded, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";

// Screens for "Physics 1.2 — দড়ির মাঝখানে 1500 বছরের ফাঁকা", told as a Journey.
//
// Tuesday after school. The book's নিজে করো asks for the great works of physics
// on a line, to scale. ফাহিমের দল strings a সুতা from wall to wall and clips
// রিনা's cards on it. The Greek cards go up (GreekCards); the Renaissance ones are
// already there; in between the rope is bare for about seventeen hundred years.
// নানা: ওই সময় দুনিয়ায় কেউ কিছু করে নাই। The reader bets why (TheGap), then a
// second rope drops below with the Indian, Muslim and Chinese cards (EastCards),
// the slow news of the time is acted out (SlowNews), the gap closes with
// Copernicus, Galileo and Newton (GapCloses), the reader pins the reasons
// (OneReason), answers নানা (YourAnswer), places three cards (TryRope), taps
// where zero was first truly used (ZeroTap), and the bet is opened (BetOpen).
// 10 steps.
//
// The machine: TimelineRope (makeRope, RopeLine, RopeCards, RopeBand, FullRope,
// DeedPanel, RopePlacer and the card lists) is built here and reused by 1.3, 1.4
// and 1.5, which add cards to the same poster rope. Only add exports; never
// rename or change their props.
//
// Words are the author's Banglish with the book's names and dates as the book
// prints them (ইবনে আল হাইয়াম, 'আল জাবির'). Bubbles are narrated the
// story-bangla-prose way. Scenes and figures are fixed ink.

type Story = { story?: boolean };

const INK = "#0f1b2d";
const MUTE = "#5a6b7d";

// ---------------------------------------------------------------------------
// The rope: years to x on a 320-wide sheet.

export type Span = [number, number];
export type Rope = { span: Span; y: number; x: (yr: number) => number; yearAt: (x: number) => number };

/** A rope for the years in `span`, strung at height y from x0 to x1. */
export function makeRope(span: Span, y: number, x0 = 14, x1 = 306): Rope {
  const [a, b] = span;
  return {
    span,
    y,
    x: (yr) => x0 + ((yr - a) / (b - a)) * (x1 - x0),
    yearAt: (x) => a + ((x - x0) / (x1 - x0)) * (b - a),
  };
}

/** a year as the book prints it: 624 BC, 1543 */
export const fmtYear = (y: number) => (y < 0 ? `${Math.round(-y)} BC` : `${Math.round(y)}`);

export type Tone = "greek" | "india" | "muslim" | "china" | "europe" | "modern";
export const TONE: Record<Tone, string> = {
  greek: "#2563eb",
  india: "#d97706",
  muslim: "#059669",
  china: "#dc2626",
  europe: "#7c3aed",
  modern: "#0f766e",
};

/**
 * A card on the poster rope. `year` is where it clips; `range` (for a card the
 * book gives no year) is where it is accepted; `till` draws a life bar.
 */
export type RopeCard = { id: string; name: string; year: number; label: string; tone: Tone; deed: string; range?: [number, number]; till?: number };

export const GREEK: RopeCard[] = [
  { id: "thales", name: "থেলিস", year: -624, label: "624 BC", tone: "greek", deed: "পুরাণের গল্প দিয়ে না, কারণ খুঁজে ব্যাখ্যা করতেন। সূর্যগ্রহণ কবে হবে, আগেই বলে দিয়েছিলেন। লোডস্টোন যে চুম্বক, সেটাও জানতেন।" },
  { id: "pythagoras", name: "পিথাগোরাস", year: -527, label: "527 BC", tone: "greek", deed: "জ্যামিতির সেই পিথাগোরাস। কম্পমান তার, মানে কাঁপতে থাকা তার নিয়েও মৌলিক কাজ করেছেন।" },
  { id: "democritus", name: "ডেমোক্রিটাস", year: -460, label: "460 BC", tone: "greek", deed: "ভাঙতে ভাঙতে এমন টুকরা, যেটা আর ভাঙে না। পদার্থের অবিভাজ্য একক। নাম দিলেন অ্যাটম।" },
  { id: "aristotle", name: "অ্যারিস্টটল", year: -385, label: "সাল নেই", tone: "greek", range: [-460, -310], deed: "সবকিছু মাটি, পানি, বাতাস আর আগুনে তৈরি। লোকে এই কথাটাই বেশি মানতো।" },
  { id: "aristarchus", name: "আরিস্তারাকস", year: -310, label: "310 BC", tone: "greek", deed: "মাঝখানে সূর্য, চারপাশে পৃথিবী ঘোরে। সূর্যকেন্দ্রিক এই ধারণা প্রথম তাঁর।" },
  { id: "archimedes", name: "আর্কিমিডিস", year: -287, label: "287 BC", tone: "greek", deed: "তরলে জিনিস উপরের দিকে একটা ঠেলা পায়, এখনো বইয়ে পড়ানো হয়। আবার আয়নায় রোদ জড়ো করে শত্রুর জাহাজে আগুন!" },
  { id: "eratosthenes", name: "ইরাতোস্থিনিস", year: -276, label: "276 BC", tone: "greek", deed: "সেই আমলেই পৃথিবীর ব্যাসার্ধ মেপে ফেলেছিলেন। তাও ঠিকঠাক।" },
];

export const EUROPE: RopeCard[] = [
  { id: "copernicus", name: "কপার্নিকাস", year: 1543, label: "1543", tone: "europe", deed: "বইয়ে লিখলেন, মাঝখানে সূর্য। প্রকাশক ধর্মযাজকদের ভয়ে ভূমিকায় লিখে দিলেন: এটা আসল ব্যাখ্যা না, শুধু একটা গাণিতিক সমাধান মাত্র!" },
  { id: "galileo", name: "গ্যালিলিও", year: 1564, till: 1642, label: "1564–1642", tone: "europe", deed: "আগে সূত্র, তারপর পরীক্ষা করে প্রমাণ। বিনিময়ে পেলেন চার্চের রাগ। শেষ জীবন কাটলো গৃহবন্দি হয়ে।" },
  { id: "newton", name: "নিউটন", year: 1687, label: "1687", tone: "europe", deed: "বলবিদ্যার তিন সূত্র, সাথে মহাকর্ষের সূত্র। লিবনিজের সাথে মিলে নতুন গণিত, ক্যালকুলাস।" },
];

export const EAST: RopeCard[] = [
  { id: "aryabhata", name: "আর্যভট্ট", year: 476, label: "476", tone: "india", deed: "গণিত আর জ্যোতির্বিদ্যা। শূন্যকে সত্যিকার অর্থে কাজে লাগানোর শুরু এখানে, ভারতবর্ষে।" },
  { id: "khwarizmi", name: "আল খোয়ারিজমি", year: 783, label: "783", tone: "muslim", deed: "বই লিখলেন, নাম 'আল জাবির'। সেখান থেকেই অ্যালজেবরা নামটা। হ্যাঁ, অংক বইয়ের সেই অ্যালজেবরা।" },
  { id: "masudi", name: "আল মাসুদি", year: 896, label: "896", tone: "muslim", deed: "প্রকৃতির ইতিহাস নিয়ে এনসাইক্লোপিডিয়া। একটা দুইটা না, 30 খণ্ড!" },
  { id: "haytham", name: "ইবনে আল হাইয়াম", year: 965, label: "965", tone: "muslim", deed: "তাঁকে বলা হয় আলোকবিজ্ঞানের স্থপতি। মানে আলোর বিজ্ঞানের ভিত গড়েছেন তিনি।" },
  { id: "shen", name: "শেন কুয়ো", year: 1031, label: "1031", tone: "china", deed: "চুম্বক নিয়ে কাজ। পথে দিক ঠিক করতে কম্পাস, এই কথা তিনি লিখে গেছেন।" },
];

/** the three the book names without a year; shown once the eastern cards are up */
export const EAST_MORE: RopeCard = {
  id: "omar",
  name: "ব্রহ্মগুপ্ত, ভাস্কর, ওমর খৈয়াম",
  year: 1100,
  label: "সাল নেই",
  tone: "muslim",
  deed: "এই তিনজনের সাল বইয়ে নেই। ব্রহ্মগুপ্ত আর ভাস্কর: গণিত, জ্যোতির্বিদ্যা। আর ওমর খৈয়াম? সবাই চেনে কবি হিসেবে। অথচ ছিলেন বড় মাপের গণিতবিদ, জ্যোতির্বিদ আর দার্শনিক।",
};

export const FULL: Span = [-700, 2030];
/** the eastern rope is the same centuries, magnified */
export const EAST_SPAN: Span = [400, 1100];

// ---------------------------------------------------------------------------
// Drawing the rope and its cards.

/** The string with a tick every `tick` years and a year label every `every`. */
export function RopeLine({ r, tick, every, labels = true, faint = false }: { r: Rope; tick: number; every: number; labels?: boolean; faint?: boolean }) {
  const [a, b] = r.span;
  const ticks: number[] = [];
  for (let yr = Math.ceil(a / tick) * tick; yr <= b; yr += tick) ticks.push(yr);
  return (
    <g className="pointer-events-none" opacity={faint ? 0.55 : 1}>
      <path d={`M${r.x(a) - 6} ${r.y}H${r.x(b) + 6}`} stroke="#a16207" strokeWidth={1.6} />
      <circle cx={r.x(a) - 6} cy={r.y} r={2} fill="#78350f" />
      <circle cx={r.x(b) + 6} cy={r.y} r={2} fill="#78350f" />
      {ticks.map((yr) => (
        <g key={yr}>
          <path d={`M${r.x(yr)} ${r.y - (yr % every === 0 ? 4 : 2)}V${r.y}`} stroke="#78350f" strokeWidth={0.8} />
          {labels && yr % every === 0 && (
            <text x={r.x(yr)} y={r.y - 6} textAnchor="middle" fontSize={6.5} fontFamily="ui-monospace, monospace" fill={MUTE}>
              {yr === 0 ? "0" : fmtYear(yr)}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

const cardW = (c: RopeCard) => Math.max(c.name.length * 4.3, c.label.length * 4.1) + 10;
const CARD_H = 20;
const LEVEL = 23;
/** hanging depth of each card, so neighbours never overlap */
function levels(r: Rope, cards: RopeCard[]): number[] {
  const order = cards.map((c, i) => i).sort((i, j) => r.x(cards[i].year) - r.x(cards[j].year));
  const right: number[] = [];
  const lv = cards.map(() => 0);
  for (const i of order) {
    const x = r.x(cards[i].year);
    const w = cardW(cards[i]);
    let l = right.findIndex((edge) => edge < x - w / 2 - 2);
    if (l === -1) l = right.length;
    right[l] = x + w / 2;
    lv[i] = l;
  }
  return lv;
}

/** One card hanging from its clip at (x, rope y), `lv` levels down. */
function HangCard({ c, x, ry, lv, state = "on" }: { c: RopeCard; x: number; ry: number; lv: number; state?: "on" | "bad" | "ghost" }) {
  const w = cardW(c);
  const top = ry + 7 + lv * LEVEL;
  const ink = state === "bad" ? "#e11d48" : TONE[c.tone];
  return (
    <g>
      <path d={`M${x} ${ry}V${top}`} stroke={ink} strokeWidth={0.8} strokeDasharray={state === "ghost" ? "2 2" : undefined} />
      <rect x={x - 2.5} y={ry - 2.5} width={5} height={5} rx={1} fill="#475569" />
      <rect x={x - w / 2} y={top} width={w} height={CARD_H} rx={3} fill="white" stroke={ink} strokeWidth={1.2} strokeDasharray={state === "ghost" ? "3 2" : undefined} />
      <text x={x} y={top + 8.5} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={INK}>
        {c.name}
      </text>
      <text x={x} y={top + 16.5} textAnchor="middle" fontSize={6.5} fontFamily={/[ঀ-৿]/.test(c.label) ? undefined : "ui-monospace, monospace"} fill={ink}>
        {c.label}
      </text>
    </g>
  );
}

/** The clipped cards: hanging with their names, or (compact) as pins on the string. */
export function RopeCards({ r, cards, compact = false, dim = [] }: { r: Rope; cards: RopeCard[]; compact?: boolean; dim?: string[] }) {
  const lv = levels(r, cards);
  return (
    <g className="pointer-events-none">
      {cards.map((c, i) => (
        <g key={c.id} className={POP} opacity={dim.includes(c.id) ? 0.3 : 1}>
          {compact ? (
            <>
              {c.till && <path d={`M${r.x(c.year)} ${r.y}H${r.x(c.till)}`} stroke={TONE[c.tone]} strokeWidth={3} strokeLinecap="round" opacity={0.5} />}
              <circle cx={r.x(c.year)} cy={r.y} r={2.6} fill={TONE[c.tone]} stroke="white" strokeWidth={0.6} />
            </>
          ) : (
            <HangCard c={c} x={r.x(c.year)} ry={r.y} lv={lv[i]} />
          )}
        </g>
      ))}
    </g>
  );
}

/** A stretch of the rope named from above: a bracket and a word, or (dashed) a gap with its "?". */
export function RopeBand({ r, from, to, label, tone, dashed = false, above = 12 }: { r: Rope; from: number; to: number; label: string; tone?: Tone; dashed?: boolean; above?: number }) {
  const ink = tone ? TONE[tone] : "#94a3b8";
  const y = r.y - above;
  return (
    <g className={`${FADE} pointer-events-none`}>
      <path d={`M${r.x(from)} ${y + 3}V${y}H${r.x(to)}V${y + 3}`} fill="none" stroke={ink} strokeWidth={1} strokeDasharray={dashed ? "3 2" : undefined} />
      <text x={(r.x(from) + r.x(to)) / 2} y={y - 3} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={ink}>
        {label}
      </text>
    </g>
  );
}

/**
 * The whole poster rope, compact: Greek pins, the Renaissance pins, and (if
 * `east`) the second rope below with the eastern pins. `gap` marks the bare
 * stretch with a "?".
 */
export function FullRope({ y = 34, east = false, eastY = 78, gap = false, europe = true, dim = [], children }: { y?: number; east?: boolean; eastY?: number; gap?: boolean; europe?: boolean; dim?: string[]; children?: ReactNode }) {
  const r = makeRope(FULL, y);
  const e = makeRope(FULL, eastY);
  return (
    <g>
      <RopeLine r={r} tick={100} every={500} />
      <RopeBand r={r} from={-624} to={-276} label="গ্রিক" tone="greek" above={16} />
      {europe && <RopeBand r={r} from={1543} to={1687} label="রেনেসাঁ" tone="europe" above={16} />}
      {gap && <RopeBand r={r} from={-276} to={1543} label="?" dashed above={16} />}
      <RopeCards r={r} cards={europe ? [...GREEK, ...EUROPE] : GREEK} compact dim={dim} />
      {east && (
        <g className={FADE}>
          <RopeLine r={e} tick={100} every={500} labels={false} />
          <text x={e.x(-650)} y={eastY + 12} fontSize={7} fontWeight={700} fill={MUTE}>
            ভারত · মুসলিম · চীন
          </text>
          <RopeCards r={e} cards={EAST} compact dim={dim} />
        </g>
      )}
      {children}
    </g>
  );
}

// ---------------------------------------------------------------------------
// A card's deed, acted out small (90 × 64) as t runs 0 → 1.

function Deed({ id, t }: { id: string; t: number }) {
  const p = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  switch (id) {
    case "thales":
      return (
        <g>
          <circle cx={26} cy={22} r={10} fill="#facc15" />
          <circle cx={56 - 30 * p(0, 0.6)} cy={22} r={10} fill="#1e293b" />
          <ellipse cx={62} cy={52} rx={10} ry={6} fill="#57534e" />
          <path d={`M${20 + 26 * p(0.5, 1)} 52h10`} stroke="#94a3b8" strokeWidth={2.4} strokeLinecap="round" />
        </g>
      );
    case "pythagoras": {
      const amp = Math.sin(t * Math.PI * 8) * (1 - t) * 7;
      return (
        <g>
          <path d="M8 56H40V24Z" fill="none" stroke="#2563eb" strokeWidth={1.6} />
          <path d="M34 56v-6h6" fill="none" stroke="#2563eb" strokeWidth={0.8} />
          <path d={`M52 14Q${66 + amp} 34 52 56`} fill="none" stroke="#b45309" strokeWidth={1.4} />
          <path d="M48 14h8M48 56h8" stroke="#334155" strokeWidth={2} />
        </g>
      );
    }
    case "democritus": {
      const n = Math.min(4, Math.floor(t * 5));
      const w = [40, 20, 10, 5, 2.5];
      return (
        <g>
          {Array.from({ length: n + 1 }, (_, i) => (
            <rect key={i} x={8 + [0, 44, 66, 78, 84][i]} y={40 - w[i] / 2} width={w[i]} height={w[i]} fill="#a8a29e" stroke="#57534e" strokeWidth={0.6} />
          ))}
          {t > 0.9 && (
            <text x={78} y={62} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#1d4ed8">
              অ্যাটম
            </text>
          )}
        </g>
      );
    }
    case "aristotle":
      return (
        <g>
          {t > 0.05 && <rect x={8} y={32} width={16} height={16} fill="#92400e" className={POP} />}
          {t > 0.3 && <path d="M38 30q-7 10 0 18q7 -8 0 -18Z" fill="#3b82f6" className={POP} />}
          {t > 0.55 && <path d="M50 38q6 -8 12 0t12 0" fill="none" stroke="#94a3b8" strokeWidth={2} className={POP} />}
          {t > 0.8 && <path d="M82 50q-8 -8 -2 -18q2 6 4 4q4 6 -2 14Z" fill="#f97316" className={POP} />}
        </g>
      );
    case "aristarchus": {
      const a = t * Math.PI * 2 - Math.PI / 2;
      return (
        <g>
          <circle cx={45} cy={32} r={24} fill="none" stroke="#94a3b8" strokeDasharray="2 2" />
          <circle cx={45} cy={32} r={8} fill="#facc15" />
          <circle cx={45 + 24 * Math.cos(a)} cy={32 + 24 * Math.sin(a)} r={4} fill="#2563eb" />
        </g>
      );
    }
    case "archimedes":
      return (
        <g>
          <path d="M14 12Q2 32 14 52" fill="none" stroke="#64748b" strokeWidth={3} />
          {[16, 32, 48].map((y) => (
            <path key={y} d={`M14 ${y}L${14 + (60 - 14) * p(0, 0.6)} ${y + (30 - y) * p(0, 0.6)}`} stroke="#facc15" strokeWidth={1} />
          ))}
          <path d="M60 50h26l-4 8h-18Z" fill="#78350f" />
          <path d="M72 50V16l12 26Z" fill="#f1f5f9" stroke="#94a3b8" />
          {t > 0.7 && <path d="M70 34q-4 -6 0 -12q2 4 4 2q2 6 -4 10Z" fill="#f97316" className={POP} />}
        </g>
      );
    case "eratosthenes":
      return (
        <g>
          <path d="M4 58Q45 42 86 58" fill="none" stroke="#65a30d" strokeWidth={2} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${14 + i * 30} 4v16`} stroke="#facc15" strokeWidth={1} />
          ))}
          <path d="M22 52V36" stroke="#334155" strokeWidth={1.6} />
          <path d="M66 52l-3 -16" stroke="#334155" strokeWidth={1.6} />
          <path d={`M66 52l${9 * p(0.2, 1)} -1.5`} stroke="#334155" strokeWidth={2.4} strokeOpacity={0.4} />
        </g>
      );
    case "copernicus":
      return (
        <g>
          <rect x={10} y={14} width={70} height={44} rx={2} fill="#fffbeb" stroke="#a16207" />
          <path d="M45 14v44" stroke="#a16207" strokeWidth={0.6} />
          <circle cx={27} cy={36} r={4} fill="#facc15" />
          <circle cx={27} cy={36} r={12} fill="none" stroke="#94a3b8" strokeWidth={0.6} />
          <circle cx={39} cy={36} r={2} fill="#2563eb" />
          <g style={{ transform: `translateY(${-44 + 44 * p(0.35, 0.8)}px)` }} opacity={p(0.3, 0.4)}>
            <rect x={46} y={14} width={34} height={44} fill="#fef2f2" stroke="#e11d48" strokeWidth={0.8} />
            <text x={63} y={33} textAnchor="middle" fontSize={5.6} fontWeight={700} fill="#be123c">
              শুধু গাণিতিক
            </text>
            <text x={63} y={41} textAnchor="middle" fontSize={5.6} fontWeight={700} fill="#be123c">
              সমাধান!
            </text>
          </g>
        </g>
      );
    case "galileo":
      return (
        <g>
          <rect x={4} y={6} width={26} height={14} rx={2} fill="#ede9fe" stroke="#7c3aed" />
          <text x={17} y={16} textAnchor="middle" fontSize={7} fontWeight={700} fill="#5b21b6">
            সূত্র
          </text>
          <path d="M34 26L84 54H34Z" fill="#e7e5e4" stroke="#78716c" />
          <circle cx={38 + 42 * p(0.2, 0.8)} cy={24 + 24 * p(0.2, 0.8)} r={3.5} fill="#2563eb" />
          {t > 0.85 && (
            <g className={POP}>
              <circle cx={78} cy={14} r={7} fill="#059669" />
              <path d="M74.5 14l2.5 2.6l4.5 -5" stroke="white" strokeWidth={1.6} fill="none" strokeLinecap="round" />
            </g>
          )}
        </g>
      );
    case "newton": {
      const a = Math.PI + t * Math.PI * 0.8;
      return (
        <g>
          <path d="M6 10Q16 6 26 12" stroke="#78350f" strokeWidth={2.4} fill="none" />
          <circle cx={16} cy={14 + 38 * p(0, 0.5)} r={3.5} fill="#dc2626" />
          <path d="M4 56h24" stroke="#65a30d" strokeWidth={2} />
          <circle cx={62} cy={36} r={9} fill="#2563eb" />
          <circle cx={62} cy={36} r={22} fill="none" stroke="#94a3b8" strokeDasharray="2 2" />
          <circle cx={62 + 22 * Math.cos(a)} cy={36 + 22 * Math.sin(a)} r={3} fill="#cbd5e1" stroke="#64748b" />
        </g>
      );
    }
    case "aryabhata":
      return (
        <g>
          <text x={45} y={30} textAnchor="middle" fontSize={22} fontWeight={800} fill="#d97706" opacity={p(0, 0.3)} fontFamily="ui-monospace, monospace">
            0
          </text>
          <text x={45} y={56} textAnchor="middle" fontSize={11} fontWeight={700} fill={INK} fontFamily="ui-monospace, monospace">
            {t < 0.45 ? "1" : t < 0.75 ? "10" : "100"}
          </text>
        </g>
      );
    case "khwarizmi":
      return (
        <g>
          <rect x={16} y={10} width={58} height={44} rx={3} fill="#ecfdf5" stroke="#059669" />
          <text x={45} y={36} textAnchor="middle" fontSize={9} fontWeight={700} fill="#047857" opacity={1 - p(0.4, 0.7)}>
            আল জাবির
          </text>
          <text x={45} y={36} textAnchor="middle" fontSize={9} fontWeight={700} fill="#047857" opacity={p(0.5, 0.8)}>
            algebra
          </text>
        </g>
      );
    case "masudi": {
      const n = Math.round(p(0, 0.9) * 30);
      return (
        <g>
          {Array.from({ length: n }, (_, i) => (
            <rect key={i} x={12 + (i % 15) * 4.4} y={i < 15 ? 42 : 22} width={3.6} height={16} rx={0.6} fill={["#059669", "#0d9488", "#047857"][i % 3]} />
          ))}
          <text x={80} y={62} textAnchor="end" fontSize={7} fontFamily="ui-monospace, monospace" fill={INK}>
            {n}
          </text>
        </g>
      );
    }
    case "haytham":
      return (
        <g>
          <path d="M10 44q-4 -10 4 -16q8 6 4 16Z" fill="#facc15" />
          <circle cx={46} cy={40} r={6} fill="#dc2626" />
          <path d={`M18 36L${18 + (40 - 18) * p(0, 0.45)} ${36 + (39 - 36) * p(0, 0.45)}`} stroke="#facc15" strokeWidth={1.2} />
          <path d={`M52 38L${52 + (74 - 52) * p(0.45, 0.9)} ${38 + (28 - 38) * p(0.45, 0.9)}`} stroke="#facc15" strokeWidth={1.2} />
          <path d="M72 28q6 -6 12 0q-6 6 -12 0Z" fill="white" stroke="#334155" />
          <circle cx={78} cy={28} r={2} fill="#334155" />
        </g>
      );
    case "shen":
      return (
        <g>
          <path d="M4 50q10 -4 20 0t20 0t20 0t20 0" fill="none" stroke="#38bdf8" strokeWidth={1.4} />
          <path d="M22 44h44l-6 8h-32Z" fill="#92400e" />
          <circle cx={44} cy={24} r={13} fill="white" stroke="#334155" strokeWidth={1.4} />
          <text x={44} y={14.5} textAnchor="middle" fontSize={5.5} fontWeight={700} fill="#dc2626">
            N
          </text>
          <g transform={`rotate(${120 * (1 - p(0.1, 0.9))} 44 24)`}>
            <path d="M44 14l2 10h-4Z" fill="#dc2626" />
            <path d="M44 34l2 -10h-4Z" fill="#94a3b8" />
          </g>
        </g>
      );
    case "omar":
      return (
        <g>
          <g opacity={1 - p(0.35, 0.65)}>
            <rect x={20} y={10} width={50} height={44} rx={2} fill="#fffbeb" stroke="#a16207" />
            {[20, 27, 34, 41].map((y) => (
              <path key={y} d={`M26 ${y}h${y % 2 ? 36 : 30}`} stroke="#a16207" strokeWidth={0.8} />
            ))}
          </g>
          <g opacity={p(0.45, 0.8)}>
            <rect x={20} y={10} width={50} height={44} rx={2} fill="#0f172a" />
            {[
              [30, 20],
              [44, 16],
              [56, 26],
              [48, 40],
              [34, 44],
            ].map(([x, y]) => (
              <circle key={`${x}${y}`} cx={x} cy={y} r={1.5} fill="#fde68a" />
            ))}
            <path d="M30 20L44 16L56 26L48 40L34 44" fill="none" stroke="#fde68a" strokeWidth={0.5} />
          </g>
        </g>
      );
    default:
      return null;
  }
}

function DeedPlay({ id }: { id: string }) {
  const [t] = useTween([1], 1600, [0]);
  return (
    <svg viewBox="0 0 90 64" className="block h-auto w-[5.5rem] shrink-0 rounded-lg bg-white" aria-hidden="true">
      <Deed id={id} t={useSeeded() ? 1 : t} />
    </svg>
  );
}

/** A card's deed, played small beside its words. Remount (key) to replay. */
export function DeedPanel({ card, hint }: { card: RopeCard | null; hint?: ReactNode }) {
  return (
    <div className="mt-2 flex min-h-[4.75rem] items-center gap-3 rounded-xl border border-border bg-foreground/[0.02] p-2">
      {card ? (
        <>
          <DeedPlay key={card.id} id={card.id} />
          <div key={`${card.id}t`} className={`${FADE} min-w-0 text-sm leading-snug`}>
            <b className="font-semibold">{card.name}</b> <span className={/[ঀ-৿]/.test(card.label) ? "text-muted" : "font-mono text-muted"}>{card.label}</span>
            <div>{card.deed}</div>
          </div>
        </>
      ) : (
        <div className="w-full text-center text-sm text-muted">{hint}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The placing machine: pick a card from the tray, tap the rope at its year. A
// card near enough slides to its year and clips on, and its deed plays; one too
// far off hangs red where it landed, then goes back to the tray.

type Drop = { id: string; year: number; ok: boolean };

export function RopePlacer({
  span,
  tick,
  every,
  ry,
  height,
  cards,
  tol,
  above,
  more,
  note,
  task,
  label,
}: {
  span: Span;
  tick: number;
  every: number;
  ry: number;
  height: number;
  cards: RopeCard[];
  tol: number;
  /** drawn under this rope's cards, in the same sheet (another rope, a bracket) */
  above?: ReactNode;
  /** a card shown in the deed panel once all are up */
  more?: RopeCard;
  note: string;
  task: string;
  label: string;
}) {
  const pass = useGate();
  const [placed, setPlaced] = useSeed<string[]>("placed", []);
  const [sel, setSel] = useSeed<string | null>("sel", null);
  const [drop, setDrop] = useSeed<Drop | null>("drop", null);
  const [last, setLast] = useSeed<string | null>("last", null);
  const [nope, setNope] = useSeed<Drop | null>("nope", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(380);
  const r = makeRope(span, ry);
  const byId = (id: string) => [...cards, ...(more ? [more] : [])].find((c) => c.id === id) ?? null;
  const up = cards.filter((c) => placed.includes(c.id));
  const all = placed.length === cards.length;

  const tap = (e: PointerEvent<SVGRectElement>) => {
    if (!sel || pl.running) return;
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const b = svg.getBoundingClientRect();
    const year = r.yearAt(((e.clientX - b.left) / b.width) * 320);
    const c = byId(sel);
    if (!c) return;
    const ok = c.range ? year >= c.range[0] - tol && year <= c.range[1] + tol : Math.abs(year - c.year) <= tol;
    setDrop({ id: c.id, year, ok });
    setNope(null);
    sfx.whoosh(0.2);
    pl.play(4, () => {
      setDrop(null);
      if (ok) {
        sfx.click();
        const next = [...placed, c.id];
        setPlaced(next);
        setSel(null);
        if (next.length === cards.length && more) setLast(more.id);
        else setLast(c.id);
        if (next.length === cards.length) pass(note);
      } else {
        setNope({ id: c.id, year, ok });
        setMiss(miss + 1);
      }
    });
  };

  const dc = drop ? byId(drop.id) : null;
  const dx = drop && dc ? r.x(drop.ok && pl.k >= 2 ? dc.year : Math.max(span[0], Math.min(span[1], drop.year))) : 0;
  const nc = nope ? byId(nope.id) : null;
  const shown = last ? byId(last) : null;

  return (
    <>
      <svg viewBox={`0 0 320 ${height}`} className="block h-auto w-full touch-manipulation select-none" role="img" aria-label={label}>
        <rect width={320} height={height} rx={10} fill="#f5efe6" />
        {above}
        <RopeLine r={r} tick={tick} every={every} />
        <RopeCards r={r} cards={up} />
        {drop && dc && (
          <g style={{ transform: `translateX(${dx}px)` }} className="transition-transform duration-300 ease-out motion-reduce:transition-none" opacity={!drop.ok && pl.k >= 3 ? 0.2 : 1}>
            <g className={!drop.ok && pl.k >= 2 ? "nudge" : undefined}>
              <HangCard c={dc} x={0} ry={r.y - 34} lv={0} state={!drop.ok && pl.k >= 2 ? "bad" : "on"} />
            </g>
          </g>
        )}
        <rect x={0} y={r.y - 16} width={320} height={34} fill="transparent" onPointerDown={tap} className={sel ? "cursor-crosshair" : undefined} />
        {sel && !drop && (
          <text x={160} y={height - 6} textAnchor="middle" fontSize={7.5} fill={MUTE} className={FADE}>
            দড়ির উপর card-এর সালে tap করুন
          </text>
        )}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {cards
          .filter((c) => !placed.includes(c.id))
          .map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSel(c.id)}
              disabled={pl.running}
              style={{ borderColor: sel === c.id ? TONE[c.tone] : undefined }}
              className={`cursor-pointer rounded-lg border-2 px-2 py-0.5 text-center leading-tight transition-colors disabled:cursor-default motion-reduce:transition-none ${sel === c.id ? "bg-cat-blue/10" : "border-border"}`}
            >
              <div className="text-sm font-semibold">{c.name}</div>
              <div className={`text-xs text-muted ${/[ঀ-৿]/.test(c.label) ? "" : "font-mono"}`}>{c.label}</div>
            </button>
          ))}
      </div>
      <DeedPanel card={shown} hint={all ? "" : "একটা card বাছুন, তারপর দড়ির উপর তার সালে tap করুন।"} />
      {nope && nc && !pl.running && (
        <Nope key={miss}>
          {nc.range
            ? `${nc.name} পড়লো ${fmtYear(nope.year)}-এর কাছে। বইয়ে সাল নেই, কিন্তু সেই সময়কার: ডেমোক্রিটাসের পরে, আরিস্তারাকসের আগে।`
            : `${nc.name} পড়লো ${fmtYear(nope.year)}-এর কাছে। Card-এ লেখা ${nc.label}। আরো ${nope.year < nc.year ? "ডানে" : "বামে"}।`}
        </Nope>
      )}
      <Task done={all && !pl.running}>{task}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: Tuesday after school. The
//      classroom wall; ফাহিম strings the সুতা from one wall to the other, marked
//      every hundred years; রিনা holds up her cards; নানা comes in and sits.

export function RopeUp({}: Story) {
  const s = useScene(3, [600, 2000, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="the classroom after school: Fahim strings a rope across the wall, Rina holds up her cards, Nana comes in and sits">
        <rect x={0} y={0} width={320} height={10} fill="#e7d7c1" />
        <rect x={112} y={16} width={96} height={30} rx={2} fill="#14532d" stroke="#78350f" strokeWidth={2} />
        <text x={160} y={35} textAnchor="middle" fontSize={8} fill="#e2e8f0">
          পদার্থবিজ্ঞানের ক্রমবিকাশ
        </text>
        {k >= 1 && <Draw d="M8 66Q160 72 312 66" ms={1200} className="stroke-[#a16207]" strokeWidth={1.6} />}
        {k >= 1 &&
          Array.from({ length: 28 }, (_, i) => (
            <path key={i} d={`M${12 + i * 10.7} ${67 + Math.sin((i / 27) * Math.PI) * 3}v4`} stroke="#78350f" strokeWidth={0.6} className={FADE} style={{ transitionDelay: `${600 + i * 20}ms` }} />
          ))}
        <Person who="fahim" x={k >= 1 ? 250 : 40} y={150} walking={k === 1} arm={k >= 1 ? "point" : "down"} label />
        <Person who="rina" x={120} y={150} arm={k >= 2 ? "hold" : "down"} label />
        {k >= 2 &&
          [0, 1, 2].map((i) => (
            <rect key={i} x={126 + i * 5} y={100 - i * 3} width={14} height={10} rx={1} fill="white" stroke={["#2563eb", "#d97706", "#7c3aed"][i]} className={POP} />
          ))}
        {k >= 3 && (
          <g className={FADE}>
            <path d="M170 150v-26h22v26M166 124h30" stroke="#78350f" strokeWidth={2.4} fill="none" />
          </g>
        )}
        <Person who="nana" x={k >= 3 ? 181 : 350} y={150} facing={-1} walking={k === 3} label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The Greek cards. The rope zoomed to 700 BC – 200 BC; the reader clips
//     seven cards at their years, and each card's deed plays as it clips.

export function GreekCards() {
  return (
    <RopePlacer
      span={[-700, -200]}
      tick={25}
      every={100}
      ry={26}
      height={132}
      cards={GREEK}
      tol={22}
      note="সাতটা গ্রিক card উঠলো দড়িতে।"
      task="একটা একটা card বাছুন, তারপর দড়ির উপর তার সালে tap করুন। সাতটাই।"
      label="the rope from 700 BC to 200 BC; tap it at a card's year to clip the card on"
    />
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: two ideas, one tested by
//      nobody. ডেমোক্রিটাস cuts a stone until it can't be cut, "অ্যাটম", and a
//      "?" hangs on it; অ্যারিস্টটল's four elements get the tick; then
//      সেলেউকাস's argument, a scroll, fades away.

const X1_SAY = [
  "ডেমোক্রিটাস ভাঙতে ভাঙতে পৌঁছালেন অবিভাজ্য এককে: অ্যাটম।",
  "কিন্তু প্রমাণ করার কোনো সুযোগ ছিল না। তাই সবাই মানলো না।",
  "অ্যারিস্টটলের মাটি, পানি, বাতাস, আগুন অনেক বেশি গ্রহণযোগ্য ছিল।",
  "আরিস্তারাকসের সূর্যকেন্দ্রিক ধারণা সেলেউকাস যুক্তি দিয়ে প্রমাণ করেছিলেন। সেই যুক্তি হারিয়ে গেছে।",
];

export function UntestedAtom() {
  const s = useScene(3, [600, 2200, 2200, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="Democritus' atom with a question mark, Aristotle's four elements with a tick, and Seleucus' scroll fading">
        <rect width={240} height={110} rx={10} fill="white" />
        {[40, 20, 10, 5].map((w, i) => (
          <rect key={w} x={[10, 56, 82, 98][i]} y={34 - w / 2} width={w} height={w} fill="#a8a29e" stroke="#57534e" strokeWidth={0.6} className={POP} style={{ transitionDelay: `${i * 250}ms` }} />
        ))}
        <circle cx={112} cy={34} r={2} fill="#1d4ed8" className={POP} style={{ transitionDelay: "1000ms" }} />
        <text x={112} y={52} textAnchor="middle" fontSize={8} fontWeight={700} fill="#1d4ed8">
          অ্যাটম
        </text>
        {k >= 1 && (
          <g className={POP}>
            <circle cx={128} cy={22} r={9} fill="#fef3c7" stroke="#d97706" />
            <text x={128} y={26} textAnchor="middle" fontSize={11} fontWeight={800} fill="#b45309">
              ?
            </text>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <rect x={150} y={20} width={12} height={12} fill="#92400e" />
            <path d="M176 18q-6 9 0 15q6 -6 0 -15Z" fill="#3b82f6" />
            <path d="M186 28q4 -6 8 0t8 0" fill="none" stroke="#94a3b8" strokeWidth={2} />
            <path d="M216 34q-7 -7 -2 -15q2 5 4 3q3 5 -2 12Z" fill="#f97316" />
            <circle cx={226} cy={16} r={7} fill="#059669" className={POP} />
            <path d="M223 16l2.2 2.4l4 -4.6" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          </g>
        )}
        {k >= 3 && (
          <g>
            <circle cx={60} cy={86} r={8} fill="#facc15" />
            <circle cx={60} cy={86} r={16} fill="none" stroke="#94a3b8" strokeDasharray="2 2" />
            <circle cx={76} cy={86} r={3} fill="#2563eb" />
            <g opacity={0.15} className="transition-opacity delay-700 duration-[1600ms] motion-reduce:transition-none starting:opacity-100">
              <rect x={110} y={70} width={70} height={32} rx={3} fill="#fffbeb" stroke="#a16207" />
              {[78, 85, 92].map((y) => (
                <path key={y} d={`M118 ${y}h54`} stroke="#a16207" strokeWidth={0.8} />
              ))}
            </g>
            <text x={206} y={90} textAnchor="middle" fontSize={7.5} fill={MUTE}>
              সেলেউকাস
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: নানা in his chair waves a
//      hand at the bare middle of the rope, the Greek cards on the left, the
//      Renaissance ones on the right.

export function NanaWaves({}: Story) {
  const s = useScene(2, [600, 2000, 2600]);
  const k = s.k;
  const card = (x: number, y: number, c: string) => <rect x={x} y={y} width={12} height={9} rx={1} fill="white" stroke={c} />;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Nana in his chair waves at the bare middle of the rope; Greek cards on the left, Renaissance cards on the right">
        <path d="M8 40Q160 46 312 40" stroke="#a16207" strokeWidth={1.6} fill="none" />
        {[14, 24, 34, 44, 50, 56, 62].map((x, i) => (
          <g key={x}>{card(x, 46 + (i % 3) * 11, "#2563eb")}</g>
        ))}
        {[262, 274, 290].map((x, i) => (
          <g key={x}>{card(x, 46 + (i % 2) * 11, "#7c3aed")}</g>
        ))}
        {k >= 1 && (
          <g className={FADE}>
            <path d="M78 34H256" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />
            <text x={167} y={30} textAnchor="middle" fontSize={11} fontWeight={800} fill="#94a3b8">
              ?
            </text>
          </g>
        )}
        <path d="M150 150v-26h22v26M146 124h30" stroke="#78350f" strokeWidth={2.4} fill="none" />
        <Person who="nana" x={161} y={150} arm={k >= 1 ? "wave" : "down"} label />
        <Person who="fahim" x={70} y={150} label />
        <Person who="rina" x={250} y={150} facing={-1} label />
        {k >= 2 && <Bubble x={161} y={84} lines={["ওই সময় দুনিয়ায়", "কেউ কিছু করে নাই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · The bet. The whole rope, compact: Greek pins, Renaissance pins, the gap
//     between them marked "?". Three answers; the pick is acted out on the
//     rope with its own "?", then sealed. Never marked here.

const G2_OPT = ["কেউ কিছু করে নাই", "কাজ অন্য কোথাও সরে গিয়েছিল", "কাজ হয়েছিল, কিন্তু হারিয়ে গেছে"];
/** the sealed pick, kept for the last step while the lesson is open */
let S2_BET: number | null = null;

function GapPick({ pick }: { pick: number | null }) {
  const r = makeRope(FULL, 38);
  return (
    <svg viewBox="0 0 320 112" className="block h-auto w-full" role="img" aria-label="the whole rope: Greek cards, Renaissance cards, and the bare stretch between them">
      <rect width={320} height={112} rx={10} fill="#f5efe6" />
      <FullRope y={38} gap />
      {pick === 0 && (
        <g key="a" className={FADE}>
          <circle cx={r.x(-100)} cy={r.y + 14} r={5} fill="none" stroke="#a8a29e" strokeDasharray="2 1" style={{ transform: "translateX(150px)" }} className="transition-transform duration-[2000ms] ease-linear motion-reduce:transition-none starting:translate-x-0" />
          <text x={(r.x(-276) + r.x(1543)) / 2} y={r.y + 36} textAnchor="middle" fontSize={8} fill={MUTE}>
            কিছুই না?
          </text>
        </g>
      )}
      {pick === 1 && (
        <g key="b" className={FADE}>
          <path d={`M${r.x(500)} ${r.y + 4}V${r.y + 34}`} stroke="#94a3b8" strokeDasharray="3 2" />
          <path d={`M${r.x(-200)} ${r.y + 42}H${r.x(1450)}`} stroke="#a16207" strokeWidth={1.2} strokeDasharray="4 3" />
          <text x={r.x(500) + 10} y={r.y + 30} fontSize={10} fontWeight={800} fill="#94a3b8">
            ?
          </text>
          <text x={r.x(-200)} y={r.y + 56} fontSize={7.5} fill={MUTE}>
            অন্য কোথাও?
          </text>
        </g>
      )}
      {pick === 2 && (
        <g key="c" className={FADE}>
          {[0, 400, 900].map((yr, i) => (
            <g key={yr} opacity={0.6}>
              <path d={`M${r.x(yr)} ${r.y}v${8 + i * 6}`} stroke="#94a3b8" strokeDasharray="2 2" />
              <rect x={r.x(yr) - 12} y={r.y + 8 + i * 6} width={24} height={14} rx={2} fill="white" stroke="#94a3b8" strokeDasharray="3 2" />
              <text x={r.x(yr)} y={r.y + 18 + i * 6} textAnchor="middle" fontSize={8} fontWeight={800} fill="#94a3b8">
                ?
              </text>
            </g>
          ))}
          <text x={r.x(500)} y={r.y + 58} textAnchor="middle" fontSize={7.5} fill={MUTE}>
            হারিয়ে যাওয়া card?
          </text>
        </g>
      )}
    </svg>
  );
}

export function TheGap() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const seal = () => {
    setSealed(true);
    S2_BET = pick;
    sfx.stamp();
    pass("বাজি সিল হলো। শেষে মিলিয়ে দেখবো।");
  };
  const look = (i: number): Look => (pick === i ? "picked" : sealed ? "dim" : "idle");
  return (
    <>
      <GapPick pick={pick} />
      <div className="mt-2 text-sm font-medium text-muted">276 BC থেকে 1543, দড়ি প্রায় ফাঁকা। কেন?</div>
      <div className="mt-1.5 grid gap-1.5">
        {G2_OPT.map((o, i) => (
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
      <Task done={sealed}>একটা উত্তর বাছুন। দড়িতে দেখুন সেটার মানে কী। তারপর বাজি সিল করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: how a formula fares. A
//      card goes up; tests come; it is kept, changed, or crossed out; then the
//      hope, a few formulas holding everything, stopped at "?".

const X2_SAY = [
  "প্রকৃতি দেখে প্রথমে একটা সূত্র দিয়ে ব্যাখ্যার চেষ্টা।",
  "তারপর পরীক্ষা-নিরীক্ষা। কখনো সূত্র গৃহীত হলো।",
  "কখনো বদলালো, কখনো বাদ পড়লো।",
  "স্বপ্ন একটাই: একদিন অল্প কয়েকটা সূত্রে সবকিছুর ব্যাখ্যা।",
];

export function FormulaFate() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  const card = (x: number, fill: string, stroke: string, text: string) => (
    <g className={POP}>
      <rect x={x} y={26} width={46} height={24} rx={3} fill={fill} stroke={stroke} />
      <text x={x + 23} y={42} textAnchor="middle" fontSize={8} fontWeight={700} fill={stroke}>
        {text}
      </text>
    </g>
  );
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X2_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="formula cards: one kept, one changed, one crossed out; then many phenomena feeding into a few formulas">
        <rect width={240} height={110} rx={10} fill="white" />
        {card(14, "#ede9fe", "#6d28d9", "সূত্র")}
        {k >= 1 && (
          <g>
            {card(80, "#ecfdf5", "#047857", "গৃহীত")}
            <path d="M62 38h16" stroke="#94a3b8" strokeWidth={1} />
          </g>
        )}
        {k >= 2 && (
          <g>
            {card(140, "#fffbeb", "#b45309", "বদলানো")}
            {card(192, "#fef2f2", "#be123c", "বাদ")}
            <path d="M196 30l38 16M234 30l-38 16" stroke="#be123c" strokeWidth={1.2} className={FADE} />
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            {[30, 60, 90, 150, 180, 210].map((x, i) => (
              <path key={x} d={`M${x} 64L${120 + (i - 2.5) * 6} 88`} stroke="#94a3b8" strokeWidth={0.8} />
            ))}
            <rect x={100} y={86} width={40} height={16} rx={8} fill="#1e3a8a" />
            <text x={120} y={97} textAnchor="middle" fontSize={8} fontWeight={700} fill="white">
              ?
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: সামিন reads the book aloud;
//      রিনা strings a second rope below the first, with new cards in her hand.

export function SaminReads({}: Story) {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Samin reads the book aloud; Rina strings a second rope below the first">
        <path d="M8 34Q160 40 312 34" stroke="#a16207" strokeWidth={1.6} fill="none" />
        {k >= 2 && <Draw d="M8 70Q160 76 312 70" ms={1100} className="stroke-[#a16207]" strokeWidth={1.4} />}
        {k >= 2 && (
          <text x={124} y={86} fontSize={7.5} fontWeight={700} fill={MUTE} className={FADE}>
            ভারত · মুসলিম · চীন
          </text>
        )}
        <Person who="samin" x={80} y={150} arm="hold" label />
        <rect x={86} y={104} width={16} height={11} rx={1} fill="#2563eb" />
        {k === 1 && <Bubble x={80} y={84} side="right" lines={["শুধু ভারতীয়, মুসলিম", "আর চীনা সভ্যতা…"]} />}
        <Person who="rina" x={k >= 2 ? 230 : 190} y={150} walking={k === 2} facing={-1} arm={k >= 2 ? "point" : "hold"} label />
        <Person who="nana" x={290} y={150} facing={-1} label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · The eastern cards. The top rope stays whole and compact; the stretch
//     400–1100 is bracketed and magnified into a second rope below, "ভারত ·
//     মুসলিম · চীন". The reader clips five dated cards there; once they are up,
//     the three the book names without a year come in the deed panel.

const E3_Y = 20;
const E3_RY = 72;

function EastBracket() {
  const top = makeRope(FULL, E3_Y);
  return (
    <g>
      <RopeLine r={top} tick={100} every={500} faint />
      <RopeCards r={top} cards={[...GREEK, ...EUROPE]} compact />
      <path d={`M${top.x(EAST_SPAN[0])} ${E3_Y + 3}L14 ${E3_RY - 14}M${top.x(EAST_SPAN[1])} ${E3_Y + 3}L306 ${E3_RY - 14}`} stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="3 2" />
      <rect x={top.x(EAST_SPAN[0])} y={E3_Y - 2} width={top.x(EAST_SPAN[1]) - top.x(EAST_SPAN[0])} height={4} fill="#f59e0b" opacity={0.35} />
      <text x={160} y={E3_RY - 16} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={MUTE}>
        ভারত · মুসলিম · চীন
      </text>
    </g>
  );
}

export function EastCards() {
  return (
    <RopePlacer
      span={EAST_SPAN}
      tick={25}
      every={100}
      ry={E3_RY}
      height={150}
      cards={EAST}
      tol={30}
      above={<EastBracket />}
      more={EAST_MORE}
      note="ফাঁকা ছিল না, আলোটা সরে গিয়েছিল।"
      task="নিচের দড়িতে পাঁচটা card-ই তাদের সালে লাগান।"
      label="the whole rope on top; its years 400 to 1100 magnified into a second rope below for India, the Muslim world and China"
    />
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the flame. It burns on
//      the Greek stretch, goes down to the second rope, runs along it through
//      India, the Muslim world and China, and comes back up at 1543.

const X3_SAY = [
  "গ্রিক দড়িতে জ্ঞানচর্চার আলো জ্বলছে।",
  "গ্রিক ধারা থামলো। আলোটা নেমে গেলো আরেক দড়িতে।",
  "ভারতীয়, মুসলিম আর চীনা সভ্যতা আলোটা বাঁচিয়ে রাখলো।",
  "1543-এ আলো আবার উপরের দড়িতে, ইউরোপে।",
];

export function FlameRelay() {
  const s = useScene(3, [600, 1800, 2200, 2000]);
  const k = s.k;
  const r = makeRope(FULL, 30);
  const e = makeRope(FULL, 80);
  const at: [number, number][] = [
    [r.x(-450), r.y],
    [e.x(200), e.y],
    [e.x(1031), e.y],
    [r.x(1600), r.y],
  ];
  const [fx, fy] = useTween(at[k], 900);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3_SAY[k]}</span>}>
      <svg viewBox="0 0 320 110" className="mx-auto block h-auto w-full max-w-[18rem]" role="img" aria-label="a flame on the Greek rope moves down to the eastern rope, along it, and back up at 1543">
        <rect width={320} height={110} rx={10} fill="white" />
        <RopeLine r={r} tick={100} every={500} />
        <RopeCards r={r} cards={[...GREEK, ...EUROPE]} compact />
        <RopeLine r={e} tick={100} every={500} labels={false} />
        <RopeCards r={e} cards={EAST} compact />
        <text x={e.x(-650)} y={e.y + 14} fontSize={7} fontWeight={700} fill={MUTE}>
          ভারত · মুসলিম · চীন
        </text>
        <g style={{ transform: `translate(${fx}px, ${fy - 8}px)` }}>
          <path d="M0 6q-6 -6 -1 -14q1 4 3 3q4 5 -2 11Z" fill="#f97316" />
          <circle cy={1} r={7} fill="#fdba74" opacity={0.35} />
        </g>
      </svg>
    </Scene>
  );
}

/** a robed scholar of old, not one of the cast: feet at (x, y) */
function Robed({ x, y, color = "#cbd5e1", arm = false }: { x: number; y: number; color?: string; arm?: boolean }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y - 34} r={6} fill="#c68e5f" />
      <path d={`M${x - 6} ${y - 38}q6 -8 12 0`} fill={color} />
      <path d={`M${x - 8} ${y}l2 -26h12l2 26Z`} fill={color} stroke="#64748b" strokeWidth={0.6} />
      <path d={arm ? `M${x + 5} ${y - 24}l10 -10` : `M${x + 5} ${y - 24}l4 10`} stroke="#c68e5f" strokeWidth={2.6} strokeLinecap="round" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 4 · Why the Greek rope went quiet, played on a small map: send a new idea
//     from one town to the next (it walks, day after day, the sun and moon
//     turning), copy a book by hand (one copy, the calendar leafing), speak
//     against belief (the bars come down). Passes once all three have played.

type Slow = "walk" | "copy" | "speak";
const N4: { id: Slow; btn: string; say: string }[] = [
  { id: "walk", btn: "খবর পাঠান", say: "নতুন idea চললো পায়ে হেঁটে। দিনের পর দিন। আজকে হলে? এক সেকেন্ড।" },
  { id: "copy", btn: "বই কপি করুন", say: "ছাপাখানা নাই। হাতে লিখে একটা কপি, মাসের পর মাস। তাই বইও হাতে গোনা।" },
  { id: "speak", btn: "প্রচলিত বিশ্বাসের বিরুদ্ধে বলুন", say: "নতুন কথা বললেন, আর দরজায় তালা। বিজ্ঞানীকে বন্দি করা, এমনকি পুড়িয়ে মারার ঘটনাও আছে।" },
];

function SlowMap({ mode, t }: { mode: Slow | null; t: number }) {
  const day = Math.floor(t * 12) % 2 === 0;
  return (
    <svg viewBox="0 0 300 130" className="block h-auto w-full" role="img" aria-label="two towns joined by a long road; a scribe's desk; a scientist">
      <rect width={300} height={130} rx={10} fill="#f5efe6" />
      <path d="M36 96Q90 40 150 80T264 60" fill="none" stroke="#d6b98c" strokeWidth={6} strokeLinecap="round" />
      {[
        [36, 96, "এক শহর"],
        [264, 60, "দূরের শহর"],
      ].map(([x, y, n]) => (
        <g key={n as string}>
          <path d={`M${(x as number) - 12} ${y}v-12l6 -6l6 6l6 -6l6 6v12Z`} fill="#e7d7c1" stroke="#a8a29e" />
          <text x={x as number} y={(y as number) + 12} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={INK}>
            {n}
          </text>
        </g>
      ))}
      {mode === "walk" && (
        <g>
          <circle cx={270} cy={18} r={8} fill={day ? "#facc15" : "#e2e8f0"} />
          {!day && <circle cx={274} cy={15} r={7} fill="#f5efe6" />}
          <circle
            r={5}
            fill="#2563eb"
            style={{ offsetPath: "path('M36 96Q90 40 150 80T264 60')", offsetDistance: `${t * 100}%` } as CSSProperties}
          />
        </g>
      )}
      {mode === "copy" && (
        <g>
          <rect x={120} y={98} width={60} height={6} fill="#92400e" />
          <rect x={126} y={86} width={22} height={12} fill="#fffbeb" stroke="#a16207" />
          <path d={`M129 ${89}h${16 * Math.min(1, t * 1.2)}M129 92h${16 * Math.max(0, Math.min(1, t * 1.2 - 0.3))}M129 95h${16 * Math.max(0, Math.min(1, t * 1.2 - 0.6))}`} stroke="#a16207" strokeWidth={0.8} />
          <path d={`M${142 + 6 * Math.sin(t * 40)} 84l6 -10`} stroke="#1f2937" strokeWidth={1.2} />
          <rect x={160} y={78} width={16} height={20} fill="white" stroke="#64748b" />
          <text x={168} y={86} textAnchor="middle" fontSize={5} fill={MUTE}>
            মাস
          </text>
          <text x={168} y={94} textAnchor="middle" fontSize={7} fontWeight={700} fill="#dc2626" fontFamily="ui-monospace, monospace">
            {Math.floor(t * 9) + 1}
          </text>
          {t >= 1 && <rect x={186} y={86} width={14} height={12} fill="#2563eb" className={POP} />}
        </g>
      )}
      {mode === "speak" && (
        <g>
          <Robed x={150} y={112} arm />
          <Bubble x={150} y={36} lines={["নতুন কথা!"]} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${128 + i * 11} ${40 + (1 - t) * -40}v${74}`} stroke="#334155" strokeWidth={2} />
          ))}
          <path d={`M124 ${40 + (1 - t) * -40}h52`} stroke="#334155" strokeWidth={2.4} />
        </g>
      )}
    </svg>
  );
}

function SlowRun({ mode }: { mode: Slow }) {
  const [t] = useTween([1], 2200, [0]);
  return <SlowMap mode={mode} t={useSeeded() ? 1 : t} />;
}

export function SlowNews() {
  const pass = useGate();
  const [mode, setMode] = useSeed<Slow | null>("mode", null);
  const [done, setDone] = useSeed<Slow[]>("done", []);
  const [runs, setRuns] = useState(0);
  const pl = usePlay(2300);
  const go = (m: Slow) => {
    if (pl.running) return;
    setMode(m);
    setRuns(runs + 1);
    if (m === "copy") sfx.pencil(1.2);
    if (m === "speak") sfx.thump();
    if (m === "walk") sfx.footstep();
    pl.play(1, () => {
      const next = done.includes(m) ? done : [...done, m];
      setDone(next);
      if (next.length === 3) pass("খবর চলতো পায়ে হেঁটে।");
    });
  };
  const cur = N4.find((n) => n.id === mode);
  return (
    <>
      {mode ? <SlowRun key={`${mode}${runs}`} mode={mode} /> : <SlowMap mode={null} t={0} />}
      <div className="mt-2 min-h-12 text-center text-[0.95rem]">
        {cur && !pl.running ? (
          <span key={cur.id} className={FADE}>
            {cur.say}
          </span>
        ) : (
          <span className="text-muted">{pl.running ? "…" : "তিনটা কাজ। তিনটাই করবেন সেই যুগের নিয়মে।"}</span>
        )}
      </div>
      <div className="mt-2 grid gap-1.5">
        {N4.map((n) => (
          <button key={n.id} type="button" onClick={() => go(n.id)} disabled={pl.running} className={`${quietBtn} h-10 justify-center text-sm`}>
            {n.btn}
          </button>
        ))}
      </div>
      <Ticks items={N4.map((n) => [n.btn, done.includes(n.id) && !(pl.running && mode === n.id)])} />
      <Task done={done.length === 3 && !pl.running}>তিনটা কাজই একবার করে দেখুন, সেই যুগে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: and yet it went on. A
//      scientist behind bars still writing; the page is passed out through the
//      bars to a student, who reads it.

const X4_SAY = [
  "বিজ্ঞানী বন্দি।",
  "তবুও লেখা থামে নি।",
  "পাতাটা বেরিয়ে গেলো আরেকজনের হাতে। জ্ঞানের খোঁজ থামে নি।",
];

export function KeptGoing() {
  const s = useScene(2, [600, 1800, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X4_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="a scientist behind bars writes; the page passes through the bars to a student">
        <rect width={240} height={110} rx={10} fill="white" />
        <Robed x={72} y={100} arm={k >= 1} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${40 + i * 13} 18V104`} stroke="#334155" strokeWidth={2} />
        ))}
        <path d="M36 18h72" stroke="#334155" strokeWidth={2.4} />
        {k >= 1 && <rect x={76} y={62} width={12} height={9} fill="#fffbeb" stroke="#a16207" className={POP} />}
        {k >= 2 && (
          <g>
            <rect x={80} y={62} width={12} height={9} fill="#fffbeb" stroke="#a16207" style={{ transform: "translateX(84px)" }} className="transition-transform duration-[1400ms] ease-out motion-reduce:transition-none starting:translate-x-0" />
            <Robed x={186} y={100} color="#fde68a" arm />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · The gap closes. The whole rope with both ropes; the three Renaissance
//     cards to open one by one. Each tap plays its deed: the publisher's
//     preface slides over Copernicus' sun, Galileo's formula meets its ramp,
//     Newton's apple falls and the moon goes round.

export function GapCloses() {
  const pass = useGate();
  const [open, setOpen] = useSeed<string[]>("open", []);
  const [cur, setCur] = useSeed<string | null>("cur", null);
  const pl = usePlay(1700);
  const r = makeRope(FULL, 34);
  const tap = (id: string) => {
    if (pl.running) return;
    setCur(id);
    sfx.flip();
    pl.play(1, () => {
      const next = open.includes(id) ? open : [...open, id];
      setOpen(next);
      if (next.length === 3) pass("সূত্র দাও, তারপর পরীক্ষা করে দেখাও।");
    });
  };
  const card = EUROPE.find((c) => c.id === cur) ?? null;
  return (
    <>
      <svg viewBox="0 0 320 96" className="block h-auto w-full" role="img" aria-label="the whole rope; the bare stretch now ends at 1543 where the Renaissance cards begin">
        <rect width={320} height={96} rx={10} fill="#f5efe6" />
        <FullRope y={34} east eastY={74} europe={false} />
        {EUROPE.filter((c) => open.includes(c.id) || c.id === cur).map((c) => (
          <g key={c.id} className={POP}>
            {c.till && <path d={`M${r.x(c.year)} ${r.y}H${r.x(c.till)}`} stroke={TONE.europe} strokeWidth={3} opacity={0.5} strokeLinecap="round" />}
            <circle cx={r.x(c.year)} cy={r.y} r={3} fill={TONE.europe} />
          </g>
        ))}
        {open.length === 3 && <RopeBand r={r} from={1543} to={1687} label="রেনেসাঁ" tone="europe" above={16} />}
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {EUROPE.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => tap(c.id)}
            disabled={pl.running}
            className={`cursor-pointer rounded-xl border-2 px-1 py-1.5 text-center leading-tight transition-colors disabled:cursor-default motion-reduce:transition-none ${
              cur === c.id ? "border-cat-violet bg-cat-violet/10" : open.includes(c.id) ? "border-accent/60" : "border-border hover:border-cat-violet/60"
            }`}
          >
            <div className="text-[0.95rem] font-semibold">{c.name}</div>
            <div className="font-mono text-xs text-muted">{c.label}</div>
          </button>
        ))}
      </div>
      <DeedPanel card={card} hint="একটা card খুলুন।" />
      <Ticks items={EUROPE.map((c) => [c.name, open.includes(c.id) && !(pl.running && cur === c.id)])} />
      <Task done={open.length === 3 && !pl.running}>তিনটা card-ই খুলে দেখুন, ফাঁকা কীভাবে শেষ হলো।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: testing is what changed.
//      ডেমোক্রিটাস's atom with its "?" on the left; Galileo's formula, then the
//      test, then the tick on the right; the name lands last.

const X5_SAY = [
  "ডেমোক্রিটাসের অ্যাটম: যাচাইয়ের উপায় নাই, তাই শুধু একটা মত।",
  "গ্যালিলিও: আগে সূত্র।",
  "তারপর পরীক্ষা করে প্রমাণ।",
  "এই ধারার জন্য গ্যালিলিওকে বলা হয় আধুনিক বিজ্ঞানের জনক।",
];

export function TestFirst() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5_SAY[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="Democritus' atom with a question mark beside Galileo's formula, test and tick">
        <rect width={240} height={110} rx={10} fill="white" />
        <circle cx={40} cy={50} r={4} fill="#1d4ed8" />
        <text x={40} y={70} textAnchor="middle" fontSize={8} fontWeight={700} fill="#1d4ed8">
          অ্যাটম
        </text>
        <circle cx={56} cy={36} r={8} fill="#fef3c7" stroke="#d97706" />
        <text x={56} y={40} textAnchor="middle" fontSize={10} fontWeight={800} fill="#b45309">
          ?
        </text>
        <path d="M90 14V96" stroke="#e2e8f0" />
        {k >= 1 && (
          <g className={POP}>
            <rect x={104} y={38} width={36} height={18} rx={3} fill="#ede9fe" stroke="#7c3aed" />
            <text x={122} y={50} textAnchor="middle" fontSize={8} fontWeight={700} fill="#5b21b6">
              সূত্র
            </text>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d="M148 34L200 64H148Z" fill="#e7e5e4" stroke="#78716c" />
            <circle cx={152} cy={32} r={3.5} fill="#2563eb" style={{ transform: "translate(40px, 26px)" }} className="transition-transform duration-1000 ease-in motion-reduce:transition-none starting:translate-0" />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <circle cx={218} cy={46} r={10} fill="#059669" />
            <path d="M213 46l3.5 3.5l6 -7" stroke="white" strokeWidth={2} fill="none" strokeLinecap="round" />
            <text x={165} y={90} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#5b21b6">
              আধুনিক বিজ্ঞানের জনক
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · One reason? The book's own question. Three signs over the gap: the
//     hand-copied scroll, the bars, and ডেমোক্রিটাস's untested card. The reader
//     drops the "কারণ" pin on each; every one is accepted and plays its effect
//     on the rope: a card that fades (সেলেউকাস's lost argument), a stretch
//     that goes grey (fewer people spoke up), an idea left hanging with a "?"
//     until the test arrives in 1564.

type Why = "copy" | "bars" | "test";
const O6: { id: Why; label: string; say: string }[] = [
  { id: "copy", label: "হাতে লেখা কপি", say: "কপি কম, তাই হারায় সহজে। সেলেউকাসের যুক্তি এভাবেই গেছে।" },
  { id: "bars", label: "বন্দি, পুড়িয়ে মারা", say: "বিশ্বাসের বিরুদ্ধে বলা মানে বিপদ। তাই নতুন কথা বলার লোকও কমলো।" },
  { id: "test", label: "পরীক্ষার উপায় নাই", say: "যাচাই না করলে কোনটা ঠিক, বুঝবেন কেমনে? পরীক্ষা এলো অনেক পরে, গ্যালিলিওর হাতে।" },
];

export function OneReason() {
  const pass = useGate();
  const [pins, setPins] = useSeed<Why[]>("pins", []);
  const [cur, setCur] = useSeed<Why | null>("cur", null);
  const pl = usePlay(1600);
  const r = makeRope(FULL, 36);
  const on = (w: Why) => pins.includes(w) || cur === w;
  const pin = (w: Why) => {
    if (pl.running) return;
    setCur(w);
    sfx.pop();
    pl.play(1, () => {
      const next = pins.includes(w) ? pins : [...pins, w];
      setPins(next);
      if (next.length === 3) pass("কারণ একটা না, কয়েকটা।");
    });
  };
  const sign = (w: Why, x: number) => (
    <g key={w} onClick={() => pin(w)} role="button" aria-label={O6.find((o) => o.id === w)?.label} className="cursor-pointer">
      <rect x={x - 30} y={72} width={60} height={30} rx={5} fill={on(w) ? "#fef3c7" : "white"} stroke={on(w) ? "#d97706" : "#94a3b8"} />
      {w === "copy" && (
        <g>
          <rect x={x - 8} y={77} width={16} height={12} fill="#fffbeb" stroke="#a16207" />
          <path d={`M${x - 5} 81h10M${x - 5} 84h8`} stroke="#a16207" strokeWidth={0.7} />
        </g>
      )}
      {w === "bars" && [0, 1, 2, 3].map((i) => <path key={i} d={`M${x - 9 + i * 6} 76v14`} stroke="#334155" strokeWidth={1.8} />)}
      {w === "test" && (
        <g>
          <circle cx={x - 4} cy={83} r={3} fill="#1d4ed8" />
          <text x={x + 6} y={87} textAnchor="middle" fontSize={10} fontWeight={800} fill="#b45309">
            ?
          </text>
        </g>
      )}
      <text x={x} y={99} textAnchor="middle" fontSize={6.5} fill={MUTE}>
        {O6.find((o) => o.id === w)?.label}
      </text>
      {on(w) && (
        <g className={POP}>
          <path d={`M${x + 22} 60v10`} stroke="#dc2626" strokeWidth={1.4} />
          <circle cx={x + 22} cy={58} r={4} fill="#dc2626" />
        </g>
      )}
    </g>
  );
  const s = O6.find((o) => o.id === cur);
  return (
    <>
      <svg viewBox="0 0 320 108" className="block h-auto w-full select-none" role="img" aria-label="the rope with three signs under the gap: hand copies, bars, no test; tap a sign to pin a reason on it">
        <rect width={320} height={108} rx={10} fill="#f5efe6" />
        <FullRope y={36} gap dim={on("test") ? ["democritus"] : []} />
        {on("copy") && (
          <g>
            <rect x={r.x(-200) - 14} y={r.y + 6} width={28} height={14} rx={2} fill="white" stroke="#2563eb" strokeDasharray="3 2" opacity={0.15} className="transition-opacity duration-[1400ms] motion-reduce:transition-none starting:opacity-100" />
            <text x={r.x(-200) - 16} y={r.y + 30} fontSize={6.5} fill={MUTE}>
              সেলেউকাস
            </text>
          </g>
        )}
        {on("bars") && <rect x={r.x(-276)} y={r.y - 4} width={r.x(1543) - r.x(-276)} height={8} fill="#64748b" opacity={0.25} className={FADE} />}
        {on("test") && (
          <g className={FADE}>
            <path d={`M${r.x(-460)} ${r.y + 6}Q${r.x(550)} ${r.y + 34} ${r.x(1564)} ${r.y + 6}`} fill="none" stroke="#7c3aed" strokeWidth={1} strokeDasharray="3 2" />
            <text x={r.x(1564)} y={r.y + 16} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#6d28d9">
              পরীক্ষা
            </text>
          </g>
        )}
        {sign("copy", 96)}
        {sign("bars", 176)}
        {sign("test", 256)}
      </svg>
      <div className="mt-2 min-h-12 text-center text-[0.95rem]">
        {s && !pl.running ? (
          <span key={s.id} className={FADE}>
            {s.say}
          </span>
        ) : (
          <span className="text-muted">{pl.running ? "…" : "লাল pin-টা কোন কারণের উপর বসাবেন? একটা একটা করে তিনটাতেই দেখুন।"}</span>
        )}
      </div>
      <Ticks items={O6.map((o) => [o.label, pins.includes(o.id) && !(pl.running && cur === o.id)])} />
      <Task done={pins.length === 3 && !pl.running}>প্রতিটা চিহ্নে একবার করে কারণের pin বসান। দড়িতে দেখুন কী হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn: answer নানা. Build the sentence from chips; "নানাকে বলুন" plays
//     each chip on the rope. A true chip lights its part (the eastern rope, the
//     flame moving east, the scroll and the "?"); a false one is contradicted
//     by the rope itself (the eastern cards shake, Galileo's card shakes) and
//     bounces out.

const Y7: { id: string; text: string; ok: boolean; nope: string }[] = [
  { id: "notempty", text: "ফাঁকা ছিল না", ok: true, nope: "" },
  { id: "sleep", text: "ওই সময় সবাই ঘুমিয়ে ছিল", ok: false, nope: "নিচের দড়ির card-গুলো কেঁপে উঠলো। ঘুমিয়ে থাকলে এরা কারা?" },
  { id: "east", text: "জ্ঞানচর্চা সরে গিয়েছিল পূর্বে", ok: true, nope: "" },
  { id: "knewall", text: "গ্রিকরা সব জেনে ফেলেছিল", ok: false, nope: "গ্যালিলিও আর নিউটনের card কেঁপে উঠলো। সব জানা থাকলে এত নতুন সূত্র এলো কোথা থেকে?" },
  { id: "hard", text: "লিখে রাখা আর যাচাই করা কঠিন ছিল", ok: true, nope: "" },
];

export function YourAnswer() {
  const pass = useGate();
  const [said, setSaid] = useSeed<string[]>("said", []);
  const [told, setTold] = useSeed("told", false);
  const [miss, setMiss] = useSeed("miss", 0);
  const [nope, setNope] = useSeed<string | null>("nope", null);
  const pl = usePlay(700);
  const n = pl.running ? pl.k : told ? said.length : 0;
  const played = said.slice(0, n);
  const bad = said.find((id) => !Y7.find((y) => y.id === id)?.ok);
  const good = !bad && said.length === 3;
  const r = makeRope(FULL, 30);
  const e = makeRope(FULL, 72);

  const add = (id: string) => {
    if (pl.running || said.includes(id)) return;
    sfx.tap();
    setTold(false);
    setNope(null);
    setSaid([...said, id]);
  };
  const tell = () => {
    if (pl.running || !said.length) return;
    setTold(true);
    setNope(null);
    pl.play(said.length, () => {
      if (good) pass("নানার কথার জবাব তৈরি।");
      else {
        // the false chip bounces out; the true ones stay
        setSaid(said.filter((id) => Y7.find((y) => y.id === id)?.ok));
        setTold(false);
        setNope(bad ?? null);
        setMiss(miss + 1);
      }
    });
  };
  const shake = (id: string) => played.includes(id);

  return (
    <>
      <svg viewBox="0 0 320 100" className="block h-auto w-full" role="img" aria-label="the whole rope and the eastern rope; each part of the answer lights up on them">
        <rect width={320} height={100} rx={10} fill="#f5efe6" />
        <RopeLine r={r} tick={100} every={500} />
        <g className={shake("knewall") ? "nudge" : undefined}>
          <RopeCards r={r} cards={[...GREEK, ...EUROPE]} compact />
        </g>
        <RopeLine r={e} tick={100} every={500} labels={false} />
        <g className={shake("sleep") ? "nudge" : undefined}>
          <RopeCards r={e} cards={EAST} compact />
        </g>
        {played.includes("notempty") && <rect x={e.x(476) - 6} y={e.y - 8} width={e.x(1031) - e.x(476) + 12} height={16} rx={8} fill="#f59e0b" opacity={0.25} className={FADE} />}
        {played.includes("east") && <Draw d={`M${r.x(-350)} ${r.y + 4}Q${r.x(0)} ${e.y} ${e.x(476)} ${e.y - 4}`} ms={600} className="stroke-[#f97316]" strokeWidth={1.4} />}
        {played.includes("hard") && (
          <g className={POP}>
            <rect x={r.x(600) - 9} y={r.y + 8} width={18} height={12} fill="#fffbeb" stroke="#a16207" />
            <text x={r.x(900)} y={r.y + 18} fontSize={10} fontWeight={800} fill="#b45309">
              ?
            </text>
          </g>
        )}
        <text x={e.x(-650)} y={e.y + 14} fontSize={7} fontWeight={700} fill={MUTE}>
          ভারত · মুসলিম · চীন
        </text>
      </svg>
      <div className="mt-2 min-h-[3.25rem] rounded-xl border-2 border-dashed border-border px-3 py-2 text-[0.95rem]">
        <span className="font-semibold">নানা, </span>
        {said.length ? (
          said.map((id, i) => (
            <span key={id} className={`${POP} mr-1 inline-block`}>
              {Y7.find((y) => y.id === id)?.text}
              {i < said.length - 1 ? ";" : "।"}
            </span>
          ))
        ) : (
          <span className="text-muted">নিচ থেকে কথা বাছুন…</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {Y7.filter((y) => !said.includes(y.id)).map((y) => (
          <button key={y.id} type="button" onClick={() => add(y.id)} disabled={pl.running || said.length >= 3} className="cursor-pointer rounded-full border-2 border-border px-3 py-1 text-sm transition-colors hover:border-cat-blue/60 disabled:cursor-default disabled:opacity-40">
            {y.text}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-2">
        <button type="button" onClick={() => setSaid([])} disabled={pl.running || !said.length || (told && good)} className={`${quietBtn} h-10`}>
          মুছে ফেলুন
        </button>
        <button type="button" onClick={tell} disabled={pl.running || said.length < 3 || (told && good)} className={`${primaryBtn} h-10`}>
          নানাকে বলুন
        </button>
      </div>
      {nope && !pl.running && (
        <Nope key={miss}>
          {Y7.find((y) => y.id === nope)?.nope} কথাটা বাদ দিলাম, আরেকটা যোগ করুন।
        </Nope>
      )}
      <Task done={told && good && !pl.running}>তিনটা কথা দিয়ে নানার জবাব বানান, তারপর নানাকে বলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it: three cards off the rope, three bare slots. Pick a card, tap a
//     slot. The right slot clips it; a wrong one shows the card in the wrong
//     century (the slot's year beside it) and নানা frowns, then it comes back.

const T8_CARDS = ["aryabhata", "copernicus", "khwarizmi"];
const T8_SLOTS = [
  { year: 476, row: 1 },
  { year: 783, row: 1 },
  { year: 1543, row: 0 },
];
const t8Card = (id: string) => [...EAST, ...EUROPE].find((c) => c.id === id) as RopeCard;

export function TryRope() {
  const pass = useGate();
  const [filled, setFilled] = useSeed<Record<number, string>>("filled", {});
  const [sel, setSel] = useSeed<string | null>("sel", null);
  const [drop, setDrop] = useSeed<{ id: string; slot: number } | null>("drop", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const [nope, setNope] = useSeed<{ id: string; slot: number } | null>("nope", null);
  const pl = usePlay(500);
  const r = makeRope(FULL, 30);
  const e = makeRope(FULL, 84);
  const used = Object.values(filled);
  const all = used.length === 3;

  const put = (slot: number) => {
    if (!sel || pl.running || filled[slot]) return;
    const ok = t8Card(sel).year === T8_SLOTS[slot].year;
    setDrop({ id: sel, slot });
    setNope(null);
    sfx.whoosh(0.2);
    pl.play(3, () => {
      setDrop(null);
      if (ok) {
        sfx.click();
        const next = { ...filled, [slot]: sel };
        setFilled(next);
        setSel(null);
        if (Object.keys(next).length === 3) pass("তিনটাই নিজের শতাব্দীতে।");
      } else {
        setNope({ id: sel, slot });
        setMiss(miss + 1);
      }
    });
  };

  const slotAt = (i: number) => {
    const s = T8_SLOTS[i];
    const rope = s.row ? e : r;
    return { x: rope.x(s.year) + (i === 1 ? 10 : i === 0 ? -10 : 0), y: rope.y + 8 + (i === 1 ? 14 : 0), rope };
  };
  const frown = drop !== null && pl.k >= 1 && t8Card(drop.id).year !== T8_SLOTS[drop.slot].year;

  return (
    <>
      <svg viewBox="0 0 320 140" className="block h-auto w-full select-none" role="img" aria-label="the whole rope and the eastern rope with three empty slots; pick a card and tap a slot">
        <rect width={320} height={140} rx={10} fill="#f5efe6" />
        <RopeLine r={r} tick={100} every={500} />
        <RopeCards r={r} cards={[...GREEK, ...EUROPE.filter((c) => c.id !== "copernicus")]} compact />
        <RopeLine r={e} tick={100} every={500} labels={false} />
        <RopeCards r={e} cards={EAST.filter((c) => !T8_CARDS.includes(c.id))} compact />
        <text x={e.x(-650)} y={e.y + 12} fontSize={7} fontWeight={700} fill={MUTE}>
          ভারত · মুসলিম · চীন
        </text>
        {T8_SLOTS.map((s, i) => {
          const { x, y, rope } = slotAt(i);
          const id = filled[i] ?? (drop?.slot === i && pl.k >= 1 ? drop.id : null);
          const bad = drop?.slot === i && id !== null && !filled[i] && t8Card(id).year !== s.year;
          return (
            <g key={s.year} onClick={() => put(i)} role="button" aria-label={`ফাঁকা ঘর ${i + 1}`} className={sel && !filled[i] ? "cursor-pointer" : undefined}>
              <path d={`M${rope.x(s.year)} ${rope.y}L${x} ${y}`} stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="2 2" />
              {id ? (
                <g className={bad ? "nudge" : POP}>
                  <rect x={x - 26} y={y} width={52} height={20} rx={3} fill="white" stroke={bad ? "#e11d48" : TONE[t8Card(id).tone]} strokeWidth={1.2} />
                  <text x={x} y={y + 9} textAnchor="middle" fontSize={7} fontWeight={700} fill={INK}>
                    {t8Card(id).name}
                  </text>
                  <text x={x} y={y + 17} textAnchor="middle" fontSize={6.5} fontFamily="ui-monospace, monospace" fill={bad ? "#e11d48" : MUTE}>
                    {t8Card(id).label}
                  </text>
                  {bad && (
                    <text x={x} y={y + 30} textAnchor="middle" fontSize={6.5} fill="#e11d48">
                      এই ঘর {s.year} সালের
                    </text>
                  )}
                </g>
              ) : (
                <rect x={x - 22} y={y} width={44} height={20} rx={3} fill="white" fillOpacity={0.6} stroke="#94a3b8" strokeDasharray="3 2" />
              )}
            </g>
          );
        })}
        <g transform="translate(296 116)">
          <circle r={11} fill="#c68e5f" />
          <path d="M-8 2q1 9 8 10q7 -1 8 -10q-3 4 -8 4q-5 0 -8 -4Z" fill="#e5e7eb" />
          <circle cx={-3.5} cy={-2} r={1.2} fill={INK} />
          <circle cx={3.5} cy={-2} r={1.2} fill={INK} />
          <path d={frown ? "M-6 -6l4 1.5M6 -6l-4 1.5" : "M-6 -5.5h4M2 -5.5h4"} stroke={INK} strokeWidth={1} />
        </g>
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {T8_CARDS.filter((id) => !used.includes(id)).map((id) => {
          const c = t8Card(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSel(id)}
              disabled={pl.running}
              style={{ borderColor: sel === id ? TONE[c.tone] : undefined }}
              className={`cursor-pointer rounded-lg border-2 px-2.5 py-0.5 text-center leading-tight disabled:cursor-default ${sel === id ? "bg-cat-blue/10" : "border-border"}`}
            >
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="font-mono text-xs text-muted">{c.label}</div>
            </button>
          );
        })}
      </div>
      {nope && !pl.running && (
        <Nope key={miss}>
          {t8Card(nope.id).name} গিয়ে বসলো {T8_SLOTS[nope.slot].year} সালের ঘরে। নানা ভুরু কোঁচকালেন। Card-এ লেখা {t8Card(nope.id).label}।
        </Nope>
      )}
      <Task done={all && !pl.running}>একটা card বাছুন, তারপর যে ফাঁকা ঘরে ওর সাল, সেখানে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The book's MCQ, answered on the rope: where was zero first truly used?
//     Five places to tap on the two ropes. The right one (ভারতবর্ষ) plays zero
//     turning 1 into 10 into 100; a wrong one shows that place's card and
//     sends the eye back along the rope.

const Z9: { id: string; name: string; year: number; row: 0 | 1; nope: string }[] = [
  { id: "greek", name: "গ্রিস", year: -450, row: 0, nope: "গ্রিক card-গুলো জ্যামিতি, অ্যাটম, আয়না নিয়ে। শূন্যের কথা ওখানে নাই।" },
  { id: "india", name: "ভারতবর্ষ", year: 476, row: 1, nope: "" },
  { id: "muslim", name: "মুসলিম বিশ্ব", year: 880, row: 1, nope: "আল খোয়ারিজমি 783 সালের। বই শূন্যের কাজটা দিয়েছে তার আগের একজনকে।" },
  { id: "china", name: "চীন", year: 1031, row: 1, nope: "শেন কুয়োর card-এ কম্পাস আর চুম্বক। শূন্য না।" },
  { id: "europe", name: "ইউরোপ", year: 1600, row: 0, nope: "কপার্নিকাস 1543 সালের। শূন্য তার এক হাজার বছর আগেই এসে গেছে।" },
];

export function ZeroTap() {
  const pass = useGate();
  const [pick, setPick] = useSeed<string | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(420);
  const r = makeRope(FULL, 30);
  const e = makeRope(FULL, 80);
  const won = pick === "india";
  const landed = pick !== null && !pl.running;

  const tap = (id: string) => {
    if (pl.running || won) return;
    setPick(id);
    sfx.tap();
    pl.play(4, () => {
      if (id === "india") pass("শূন্য: ভারতবর্ষ, আর্যভট্ট।");
      else setMiss(miss + 1);
    });
  };
  const z = Z9.find((p) => p.id === pick);
  const zx = z ? (z.row ? e : r).x(z.year) : 0;
  const zy = z ? (z.row ? e : r).y : 0;

  return (
    <>
      <svg viewBox="0 0 320 128" className="block h-auto w-full select-none" role="img" aria-label="the two ropes with five places to tap: Greece, India, the Muslim world, China, Europe">
        <rect width={320} height={128} rx={10} fill="#f5efe6" />
        <RopeLine r={r} tick={100} every={500} />
        <RopeCards r={r} cards={[...GREEK, ...EUROPE]} compact />
        <RopeLine r={e} tick={100} every={500} labels={false} />
        <RopeCards r={e} cards={EAST} compact />
        {Z9.map((p) => {
          const x = (p.row ? e : r).x(p.year);
          const y = (p.row ? e : r).y + (p.row ? 14 + (p.id === "muslim" ? 16 : 0) : 12);
          const w = p.name.length * 5 + 12;
          const lx = p.id === "india" ? x - 18 : p.id === "china" ? x + 22 : x;
          const look = pick === p.id && landed ? (p.id === "india" ? "right" : "wrong") : "idle";
          return (
            <g key={p.id} onClick={() => tap(p.id)} role="button" aria-label={p.name} className="cursor-pointer">
              <path d={`M${x} ${(p.row ? e : r).y + 2}L${lx} ${y}`} stroke="#94a3b8" strokeWidth={0.6} />
              <rect
                x={lx - w / 2}
                y={y}
                width={w}
                height={15}
                rx={7.5}
                fill={look === "right" ? "#059669" : look === "wrong" ? "#fef2f2" : "white"}
                stroke={look === "wrong" ? "#e11d48" : look === "right" ? "#059669" : "#94a3b8"}
                className={look === "wrong" ? "nudge" : undefined}
              />
              <text x={lx} y={y + 10.5} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={look === "right" ? "white" : INK}>
                {p.name}
              </text>
            </g>
          );
        })}
        {z && pl.running && (
          <text x={zx} y={zy - 8} textAnchor="middle" fontSize={14} fontWeight={800} fill="#d97706" fontFamily="ui-monospace, monospace" className={POP}>
            0
          </text>
        )}
        {won && landed && (
          <g className={FADE}>
            <text x={62} y={122} textAnchor="middle" fontSize={11} fontWeight={800} fill="#d97706" fontFamily="ui-monospace, monospace">
              1 → 10 → 100
            </text>
          </g>
        )}
      </svg>
      <div className="mt-2 text-sm font-medium text-muted">শূন্যকে সত্যিকার অর্থে ব্যবহার করার কাজটি কোথায় হয়েছিল? দড়িতে tap করুন।</div>
      {landed && !won && z && <Nope key={miss}>{z.nope}</Nope>}
      {landed && won && <div className={`${FADE} mt-2 text-[0.95rem] text-accent-text`}>একটা শূন্য বসলো, 1 হয়ে গেলো 10। আরেকটা, 100।</div>}
      <Task done={won && !pl.running}>দড়ির যে জায়গায় শূন্যের কাজ হয়েছিল, সেখানে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10a · A story scene for the last step's setup, no task: নানা takes off his
//       glasses and looks at the second rope a long while. He says nothing.

export function NanaGlasses({}: Story) {
  const s = useScene(2, [600, 2000, 2400]);
  const k = s.k;
  const card = (x: number, y: number, c: string) => <rect key={`${x}${y}`} x={x} y={y} width={12} height={9} rx={1} fill="white" stroke={c} />;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="Nana takes off his glasses and looks at the second rope; he says nothing">
        <path d="M8 30Q160 36 312 30" stroke="#a16207" strokeWidth={1.6} fill="none" />
        <path d="M8 70Q160 76 312 70" stroke="#a16207" strokeWidth={1.4} fill="none" />
        {[14, 24, 34, 44, 50].map((x, i) => card(x, 36 + (i % 3) * 11, "#2563eb"))}
        {[262, 274, 290].map((x, i) => card(x, 36 + (i % 2) * 11, "#7c3aed"))}
        {[130, 170, 184, 196, 208].map((x, i) => card(x, 77 + (i % 3) * 11, ["#d97706", "#059669", "#059669", "#059669", "#dc2626"][i]))}
        <Person who="nana" x={160} y={160} arm={k >= 1 ? "hold" : "down"} />
        {k === 0 && (
          <g fill="none" stroke={INK} strokeWidth={1}>
            <circle cx={156.6} cy={109} r={2.6} />
            <circle cx={163.4} cy={109} r={2.6} />
          </g>
        )}
        {k >= 1 && (
          <g fill="none" stroke={INK} strokeWidth={1} className={FADE}>
            <circle cx={167} cy={117} r={2.6} />
            <circle cx={173} cy={117} r={2.6} />
          </g>
        )}
        {k >= 2 && <rect x={120} y={66} width={100} height={40} rx={6} fill="#fde68a" opacity={0.25} className={FADE} />}
        <Person who="fahim" x={80} y={160} label />
        <Person who="rina" x={250} y={160} facing={-1} label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 10 · The bet opened. The sealed pick comes back; "বাজি খুলুন" plays the three
//      answers against the rope one by one: (a) the eastern cards light up, so
//      no; (b) the flame runs east, yes; (c) the lost argument fades, partly,
//      but it is not what emptied the rope.

const V10: { ok: "yes" | "no" | "part"; say: string }[] = [
  { ok: "no", say: "নিচের দড়িতে card-এর পর card। কাজ থামে নি, নানা।" },
  { ok: "yes", say: "জ্ঞানচর্চা সরে গিয়েছিল ভারত, মুসলিম বিশ্ব আর চীনে।" },
  { ok: "part", say: "কিছু সত্যিই হারিয়েছে, যেমন সেলেউকাসের যুক্তি। তবে দড়ি খালির আসল কারণ এটা না।" },
];

export function BetOpen() {
  const pass = useGate();
  const [bet] = useSeed<number | null>("bet", S2_BET);
  const [open, setOpen] = useSeed("open", false);
  const pl = usePlay(1100);
  const n = pl.running ? pl.k : open ? 3 : 0;
  const reveal = () => {
    if (open) return;
    setOpen(true);
    sfx.paper();
    pl.play(3, () => pass("ফাঁকা ছিল না, আলো সরে গিয়েছিল।"));
  };
  return (
    <>
      <svg viewBox="0 0 320 96" className="block h-auto w-full" role="img" aria-label="the whole rope and the eastern rope, lit one answer at a time">
        <rect width={320} height={96} rx={10} fill="#f5efe6" />
        <FullRope y={30} east eastY={70}>
          {n >= 1 && <rect x={makeRope(FULL, 70).x(476) - 6} y={62} width={makeRope(FULL, 70).x(1031) - makeRope(FULL, 70).x(476) + 12} height={16} rx={8} fill="#f59e0b" opacity={0.25} className={FADE} />}
          {n >= 2 && <Draw d={`M${makeRope(FULL, 30).x(-350)} 34Q${makeRope(FULL, 30).x(0)} 70 ${makeRope(FULL, 70).x(476)} 66`} ms={700} className="stroke-[#f97316]" strokeWidth={1.4} />}
          {n >= 3 && <rect x={makeRope(FULL, 30).x(-200) - 12} y={38} width={24} height={12} rx={2} fill="white" stroke="#2563eb" strokeDasharray="3 2" opacity={0.2} className="transition-opacity duration-1000 motion-reduce:transition-none starting:opacity-100" />}
        </FullRope>
      </svg>
      <div className="mt-2 grid gap-1.5">
        {G2_OPT.map((o, i) => {
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
      {open && bet === null && !pl.running && <div className={`${FADE} mt-2 text-center text-sm text-muted`}>মঙ্গলবারের বাজিটা মনে করে মিলিয়ে নিন।</div>}
      <Task done={open && !pl.running}>বাজি খুলে তিনটা উত্তর দড়ির সাথে মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for the last step's explanation, no task: the finished poster.
//       Greek cards, the flame going east along the second rope, and back at
//       1543; the stretch that is still empty (1700s–1800s) waits with a "?".

const X10_SAY = [
  "গ্রিক ধারা: প্রশ্ন, যুক্তি, জ্যামিতি।",
  "দেড় হাজার বছর: ভারত, মুসলিম বিশ্ব আর চীন।",
  "রেনেসাঁ: সূত্র, তারপর পরীক্ষা।",
  "দড়ির পরের অংশটা এখনো খালি।",
];

export function RopeRecap() {
  const s = useScene(3, [600, 1800, 1800, 2000]);
  const k = s.k;
  const r = makeRope(FULL, 40);
  const e = makeRope(FULL, 88);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X10_SAY[k]}</span>}>
      <svg viewBox="0 0 320 112" className="mx-auto block h-auto w-full max-w-[18rem]" role="img" aria-label="the finished poster: Greek, the eastern rope, the Renaissance, and an empty stretch after 1700 with a question mark">
        <rect width={320} height={112} rx={10} fill="white" />
        <RopeLine r={r} tick={100} every={500} />
        <RopeLine r={e} tick={100} every={500} labels={false} />
        <RopeCards r={r} cards={GREEK} compact />
        <RopeBand r={r} from={-624} to={-276} label="গ্রিক" tone="greek" above={16} />
        {k >= 1 && (
          <g className={FADE}>
            <RopeCards r={e} cards={EAST} compact />
            <text x={e.x(-650)} y={e.y + 14} fontSize={7} fontWeight={700} fill={MUTE}>
              ভারত · মুসলিম · চীন
            </text>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <RopeCards r={r} cards={EUROPE} compact />
            <RopeBand r={r} from={1543} to={1687} label="রেনেসাঁ" tone="europe" above={16} />
          </g>
        )}
        {k >= 3 && <RopeBand r={r} from={1760} to={2020} label="?" dashed above={26} />}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  RopeUp: { rope: { k: 1 }, cards: { k: 2 }, end: {} },
  GreekCards: {
    start: {},
    sel: { sel: "thales" },
    some: { placed: ["thales", "pythagoras", "democritus"], last: "democritus" },
    wrong: { placed: ["thales"], sel: "archimedes", nope: { id: "archimedes", year: -520, ok: false }, miss: 1, last: "thales" },
    all: { placed: GREEK.map((c) => c.id), last: "eratosthenes" },
  },
  UntestedAtom: { atom: { k: 1 }, end: {} },
  NanaWaves: { gap: { k: 1 }, end: {} },
  TheGap: { start: {}, a: { pick: 0 }, b: { pick: 1 }, c: { pick: 2, sealed: true } },
  FormulaFate: { mid: { k: 2 }, end: {} },
  SaminReads: { read: { k: 1 }, end: {} },
  EastCards: { start: {}, some: { placed: ["aryabhata", "khwarizmi"], last: "khwarizmi" }, all: { placed: EAST.map((c) => c.id), last: "omar" } },
  FlameRelay: { east: { k: 2 }, end: {} },
  SlowNews: { start: {}, walk: { mode: "walk", done: ["walk"] }, copy: { mode: "copy", done: ["walk", "copy"] }, speak: { mode: "speak", done: ["walk", "copy", "speak"] } },
  KeptGoing: { mid: { k: 1 }, end: {} },
  GapCloses: { start: {}, cop: { cur: "copernicus", open: ["copernicus"] }, all: { cur: "newton", open: ["copernicus", "galileo", "newton"] } },
  TestFirst: { mid: { k: 2 }, end: {} },
  OneReason: { start: {}, copy: { cur: "copy", pins: ["copy"] }, all: { cur: "test", pins: ["copy", "bars", "test"] } },
  YourAnswer: { start: {}, some: { said: ["notempty", "sleep"] }, wrong: { said: ["notempty", "east"], nope: "sleep", miss: 1 }, right: { said: ["notempty", "east", "hard"], told: true } },
  TryRope: { start: {}, sel: { sel: "aryabhata" }, wrong: { sel: "copernicus", nope: { id: "copernicus", slot: 1 }, miss: 1 }, all: { filled: { 0: "aryabhata", 1: "khwarizmi", 2: "copernicus" } } },
  ZeroTap: { start: {}, wrong: { pick: "muslim", miss: 1 }, right: { pick: "india" } },
  NanaGlasses: { glasses: { k: 1 }, end: {} },
  BetOpen: { start: { bet: 0 }, open: { bet: 0, open: true }, nobet: { bet: null, open: true } },
  RopeRecap: { east: { k: 1 }, end: {} },
};
