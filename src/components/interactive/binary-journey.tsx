"use client";

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  Draw,
  FADE,
  Nope,
  POP,
  Speech,
  Ticks,
  pill,
  predictLook,
  primaryBtn,
  quietBtn,
  useCountUp,
  usePlay,
} from "@/components/journey/kit";
import { bn } from "./figure-kit";

// Screens for "Math for AI 1.2 — বাইনারি", told as a Journey.
//
// The old side lesson's story (binary-figures.tsx), one beat per screen, and
// then carried on to where the main lesson promises it goes: load-shedding at
// ten, Samin's window across the lane, no phone balance. A dimmer can't be read
// from across the lane; on/off always can. Bulbs double the messages (the
// reader finds every pattern, builds the doubling, predicts four bulbs, grows
// the tree). Then the patterns become numbers: every bulb gets a price tag, a
// pattern means the sum of its switched-on bulbs, and the reader picks the tags
// and watches each pattern land on the number it makes. Only doubling (1, 2, 4,
// 8…) wastes no pattern and skips no number. Eight bulbs top out at 255.
//
// The window is night in both themes, so the bulbs, glass and lane use fixed
// colours; everything around them uses the site's theme tokens. Tailwind only.
// SVG/DOM rather than canvas, so the Bangla labels shape.

/** Bulb values for k bulbs, leftmost (biggest) first. */
const placesOf = (k: number) => Array.from({ length: k }, (_, j) => 1 << (k - 1 - j));
const bitsOf = (n: number, k: number) => placesOf(k).map((w) => (n & w) !== 0);
const binary = (n: number, k: number) => bitsOf(n, k).map((b) => (b ? "1" : "0")).join("");
const spoken = (n: number, k: number) => bitsOf(n, k).map((b) => (b ? "on" : "off")).join(", ");

// The codebook. Index = the pattern read as a binary number, so the two-bulb
// code is exactly the first four rows of the three-bulb one (the doubling
// lesson, in data form) and its first two rows are the one-bulb code.
const MESSAGES = [
  "আব্বু বাসায় নেই",
  "আব্বু বাসায় আছে",
  "আব্বু মুদির দোকানে গেছেন",
  "আম্মুও বাসায় নেই",
  "কাল বিকেলে মাঠে খেলা আছে",
  "বল্টু ব্যাট আনবে",
  "বল্টু ব্যাট না আনলে তুই আনিস",
  "বলটা না হয় আমিই আনবো",
];

function Samin(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="সামিন" initial="স" tint="teal" {...props} />;
}

/** Enter / Space on a focused SVG shape, like a button. */
const pressKey = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
};

// ---------------------------------------------------------------------------
// Bulbs. They always sit in a night window, so their colours are fixed.

const GLASS = "M20 4a14 14 0 0 0-8.2 25.4c1.6 1.2 2.7 3 2.7 5V37h11v-2.6c0-2 1.1-3.8 2.7-5A14 14 0 0 0 20 4z";

function Bulb({ on, className = "" }: { on: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 40 52"
      aria-hidden="true"
      className={`block h-auto transition-[filter] duration-300 motion-reduce:transition-none ${
        on ? "drop-shadow-[0_0_10px_rgba(251,191,36,0.85)]" : ""
      } ${className}`}
    >
      <path
        d={GLASS}
        strokeWidth={1.5}
        className={`transition-[fill,stroke] duration-300 ${on ? "fill-[#fcd34d] stroke-[#f59e0b]" : "fill-white/5 stroke-white/40"}`}
      />
      <path
        d="M16.5 27l1.8-5.5 1.7 4 1.7-4 1.8 5.5"
        strokeWidth={1.1}
        strokeLinejoin="round"
        className={`fill-none ${on ? "stroke-[#b45309]" : "stroke-white/25"}`}
      />
      <path d="M15 40.5h10M15.5 44.5h9M17.5 48.5h5" strokeWidth={2.2} strokeLinecap="round" className="fill-none stroke-white/45" />
    </svg>
  );
}

/** A night window: the frame every bulb row sits in. */
function Pane({ label, children, className = "" }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className="min-w-0">
      {label ? <div className="mb-1.5 text-center text-sm font-medium text-muted">{label}</div> : null}
      <div className={`relative overflow-hidden rounded-2xl bg-[#0b1226] px-3 py-4 ring-4 ring-[#334155] ${className}`}>{children}</div>
    </div>
  );
}

/**
 * A row of bulbs, leftmost biggest. With `onToggle` each is a switch. `under`
 * writes something below a bulb (its value, its digit).
 */
function Bulbs({
  n,
  k,
  onToggle,
  under,
  size = "w-12 sm:w-14",
}: {
  n: number;
  k: number;
  onToggle?: (w: number) => void;
  under?: (w: number, on: boolean) => ReactNode;
  size?: string;
}) {
  return (
    <div className="flex items-end justify-center gap-1 sm:gap-2" role={onToggle ? "group" : "img"} aria-label={spoken(n, k)}>
      {placesOf(k).map((w, j) => {
        const on = (n & w) !== 0;
        const body = (
          <>
            <Bulb on={on} className={size} />
            {under ? <span className="mt-1 block text-center font-mono text-sm text-white/80">{under(w, on)}</span> : null}
          </>
        );
        return onToggle ? (
          <button
            key={w}
            type="button"
            aria-pressed={on}
            aria-label={`বাঁ থেকে ${bn(j + 1)} নম্বর বাল্ব`}
            onClick={() => onToggle(w)}
            className="cursor-pointer rounded-xl p-1 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbbf24]"
          >
            {body}
          </button>
        ) : (
          <div key={w} className="p-1">
            {body}
          </div>
        );
      })}
    </div>
  );
}

/** A pattern in miniature, on the page. `lead` is an extra bulb slid in front. */
function Dots({ n, k, lead, small = false }: { n: number; k: number; lead?: "off" | "on"; small?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center ${small ? "gap-0.5" : "gap-1"}`} role="img" aria-label={`${lead ? `${lead}, ` : ""}${spoken(n, k)}`}>
      {lead ? <Dot on={lead === "on"} lead small={small} /> : null}
      {bitsOf(n, k).map((b, j) => (
        <Dot key={j} on={b} small={small} />
      ))}
    </span>
  );
}

function Dot({ on, lead = false, small = false }: { on: boolean; lead?: boolean; small?: boolean }) {
  return (
    <i
      className={`inline-block ${small ? "size-2.5" : "size-3.5"} rounded-full transition-colors duration-300 ${
        on ? "bg-[#fbbf24] shadow-[0_0_6px_rgba(251,191,36,0.9)]" : "border border-foreground/30 bg-foreground/5"
      } ${lead ? `${POP} ring-2 ring-cat-violet ring-offset-1 ring-offset-surface` : ""}`}
    />
  );
}

// Across the lane. Samin sees your window small and far away, with the shop
// light below spilling into it — which is exactly what makes a dimmer useless.

function Halo({ level, className = "" }: { level: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{ opacity: level }}
      className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(252,211,77,0.95),transparent_62%)] transition-opacity duration-700 motion-reduce:transition-none ${className}`}
    />
  );
}

function ShopLight() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 animate-pulse bg-linear-to-t from-[#fb923c]/45 to-transparent"
    />
  );
}

/** Your window and what Samin makes of it, side by side. `level` is 0 (off) to 1 (full). */
function TwoWindows({ level }: { level: number }) {
  return (
    <div className="mx-auto my-5 grid w-full max-w-md grid-cols-2 gap-4">
      <Pane label="আপনার জানালা" className="grid aspect-[4/3] place-items-center">
        <Halo level={level * 0.85} />
        <div className="relative transition-opacity duration-700" style={{ opacity: level ? 0.35 + 0.65 * level : 1 }}>
          <Bulb on={level > 0} className="w-12" />
        </div>
      </Pane>
      <Pane label="সামিনের চোখে" className="grid aspect-[4/3] place-items-center">
        <Halo level={level * 0.6} className="blur-sm" />
        <ShopLight />
        <div
          className="relative size-4 rounded-full bg-[#fde68a] blur-[2px] transition-opacity duration-700"
          style={{ opacity: level ? 0.25 + 0.6 * level : 0 }}
        />
        <span className="absolute bottom-1.5 left-0 w-full text-center text-[0.7rem] text-white/60">নিচে দোকানের আলো</span>
      </Pane>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · Ten at night. The lane goes dark; find Samin's window across it.

const LW = 320;
const LH = 200;
const GROUND = 176;
type Bldg = { x: number; y: number; w: number; tank: number };
const YOURS: Bldg = { x: 14, y: 58, w: 108, tank: 26 };
const THEIRS: Bldg = { x: 198, y: 66, w: 108, tank: 272 };
const WW = 30;
const WH = 22;
const winsOf = (b: Bldg) => [0, 1, 2].flatMap((r) => [0, 1].map((c) => ({ x: b.x + 14 + c * 50, y: b.y + 16 + r * 32, r, c })));
const MY_WIN = { x: YOURS.x + 64, y: YOURS.y + 16 };
const HIS_WIN = { x: THEIRS.x + 14, y: THEIRS.y + 16 };
const STARS: [number, number][] = [
  [30, 18], [62, 32], [100, 14], [138, 28], [176, 12], [212, 34], [240, 16], [304, 24], [118, 46], [192, 50],
];

/** Someone standing at a window, as a silhouette. */
function Person({ x, y }: { x: number; y: number }) {
  return (
    <g className={POP}>
      <circle cx={x} cy={y + 9} r={3.2} className="fill-[#94a3b8]" />
      <path d={`M${x - 6} ${y + WH}Q${x} ${y + 10} ${x + 6} ${y + WH}Z`} className="fill-[#94a3b8]" />
    </g>
  );
}

export function LoadShedding() {
  const pass = useGate();
  const [dark, setDark] = useState(false);
  const [found, setFound] = useState(false);
  const [miss, setMiss] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDark(true), 1600);
    return () => clearTimeout(t);
  }, []);

  const tap = (his: boolean) => {
    if (!dark || found) return;
    if (his) {
      setFound(true);
      pass("ওই তো সামিন! ফোনে balance নাই, কিন্তু জানালা দিয়ে দুইজন দুইজনকে দেখতে পাচ্ছেন।");
    } else setMiss((m) => m + 1);
  };

  return (
    <>
      <div className="mx-auto my-5 w-full max-w-md overflow-hidden rounded-2xl ring-1 ring-foreground/15">
        <svg viewBox={`0 0 ${LW} ${LH}`} role="group" aria-label="a lane at night between your building and Samin's" className="block h-auto w-full select-none">
          <rect width={LW} height={LH} className={`transition-[fill] duration-1000 ${dark ? "fill-[#050914]" : "fill-[#1e3a5f]"}`} />
          {dark &&
            STARS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={0.9} style={{ transitionDelay: `${800 + i * 60}ms` }} className={`fill-white/80 ${FADE}`} />
            ))}
          <rect x={0} y={GROUND} width={LW} height={LH - GROUND} className="fill-[#1f2937]" />
          {/* the street light */}
          <polygon
            points={`155,94 165,94 188,${GROUND} 132,${GROUND}`}
            className={`fill-[#fde68a]/15 transition-opacity duration-500 ${dark ? "opacity-0" : "opacity-100"}`}
          />
          <line x1={160} y1={GROUND} x2={160} y2={92} strokeWidth={2} className="stroke-[#475569]" />
          <circle cx={160} cy={91} r={3.5} className={`transition-[fill] duration-500 ${dark ? "fill-[#334155]" : "fill-[#fde68a]"}`} />

          {[YOURS, THEIRS].map((b, bi) => (
            <g key={bi}>
              <rect x={b.tank} y={b.y - 19} width={18} height={14} rx={2} className="fill-[#334155]" />
              <rect x={b.x - 4} y={b.y - 5} width={b.w + 8} height={6} className="fill-[#475569]" />
              <rect x={b.x} y={b.y} width={b.w} height={GROUND - b.y} className="fill-[#334155]" />
              {winsOf(b).map((w, wi) => {
                const mine = bi === 0 && w.r === 0 && w.c === 1;
                const his = bi === 1 && w.r === 0 && w.c === 0;
                return (
                  <rect
                    key={wi}
                    x={w.x}
                    y={w.y}
                    width={WW}
                    height={WH}
                    rx={1.5}
                    role={mine ? undefined : "button"}
                    tabIndex={mine || !dark || found ? -1 : 0}
                    aria-label={mine ? undefined : `${bi === 0 ? "আপনার বিল্ডিং" : "ওপারের বিল্ডিং"}, ${bn(w.r + 1)} তলার জানালা`}
                    onClick={mine ? undefined : () => tap(his)}
                    onKeyDown={mine ? undefined : pressKey(() => tap(his))}
                    strokeWidth={mine && dark ? 1.5 : 0}
                    style={{ transitionDelay: dark ? `${(bi * 6 + wi) * 70}ms` : "0ms" }}
                    className={`transition-[fill] duration-300 focus-visible:outline-none ${
                      dark ? "fill-[#0f172a]" : "fill-[#fcd34d]"
                    } ${mine ? "stroke-cat-teal" : dark && !found ? "cursor-pointer hover:fill-[#1e293b]" : ""}`}
                  />
                );
              })}
            </g>
          ))}

          {dark && (
            <text x={MY_WIN.x + WW / 2} y={MY_WIN.y - 4} textAnchor="middle" className={`${FADE} fill-[#5eead4] text-[9px] font-semibold delay-700`}>
              আপনি
            </text>
          )}
          {found && (
            <g>
              <Draw
                d={`M${MY_WIN.x + WW} ${MY_WIN.y + 11}L${HIS_WIN.x} ${HIS_WIN.y + 11}`}
                strokeWidth={1}
                ms={700}
                className="stroke-white/40 [stroke-dasharray:3_3]"
              />
              <Person x={MY_WIN.x + 9} y={MY_WIN.y} />
              <Person x={HIS_WIN.x + 21} y={HIS_WIN.y} />
              <text x={HIS_WIN.x + WW / 2} y={HIS_WIN.y - 4} textAnchor="middle" className={`${POP} fill-[#5eead4] text-[9px] font-semibold`}>
                সামিন
              </text>
            </g>
          )}
          <text x={10} y={16} className="fill-white/70 text-[10px] font-semibold">
            রাত ১০টা
          </text>
          {dark && (
            <text x={LW - 10} y={16} textAnchor="end" className={`${POP} fill-[#fca5a5] text-[10px] font-bold`}>
              লোডশেডিং!
            </text>
          )}
        </svg>
      </div>
      <Task done={found}>
        {dark ? "আপনার জানালার (সবুজ দাগ দেওয়া) ঠিক মুখোমুখি জানালাটায় tap করুন — ওটাই সামিনের।" : "একটু অপেক্ষা করুন…"}
      </Task>
      {miss > 0 && !found && <Nope key={miss}>উঁহু। আপনার জানালার ঠিক মুখোমুখি, গলির ওপারে।</Nope>}
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The dimmer. "A bit" and "a bit more" don't survive the lane.

const DIM = [
  { id: 5, level: 0.45, say: "৫টা — dimmer একটু ঘোরান", reply: "৫টা নাকি ৬টা? নিচের দোকানের আলোয় ঠিক বুঝলাম না।" },
  { id: 6, level: 0.62, say: "৬টা — আরেকটু ঘোরান", reply: "এটা কি আগেরটার চেয়ে বেশি? আমার চোখে তো একই রকম।" },
];

export function DimmerFails() {
  const pass = useGate();
  const [sent, setSent] = useState<number[]>([]);
  const [cur, setCur] = useState<number | null>(null);
  const [n, setN] = useState(0);
  const d = DIM.find((x) => x.id === cur);

  const send = (id: number) => {
    setCur(id);
    setN((k) => k + 1);
    const t = sent.includes(id) ? sent : [...sent, id];
    setSent(t);
    if (t.length === DIM.length) pass("“একটু” আর “আরেকটু”-র তফাত গলির ওপার থেকে বোঝা যায় না। Dimmer বাদ।");
  };

  return (
    <>
      <TwoWindows level={d?.level ?? 0} />
      <div className="text-sm font-medium text-muted">সামিনকে বোঝান:</div>
      <div className="mt-2 flex flex-col gap-2">
        {DIM.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => send(x.id)}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left transition-colors duration-200 ${
              x.id === cur ? "border-cat-teal bg-cat-teal/10" : "border-border hover:border-cat-teal/60"
            }`}
          >
            <span>{x.say}</span>
            {sent.includes(x.id) && <span className="ml-auto text-danger">✕</span>}
          </button>
        ))}
      </div>
      {d && (
        <Samin key={n} tone="bad">
          {d.reply}
        </Samin>
      )}
      <Task done={sent.length === DIM.length}>
        দুইটাই পাঠিয়ে দেখুন ({bn(sent.length)}/{bn(DIM.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · On or off, though, Samin never gets wrong — even through the shop light.

const FLIPS = 4;

export function OnOffSure() {
  const pass = useGate();
  const [on, setOn] = useState(false);
  const [flips, setFlips] = useState(0);

  const flip = () => {
    setOn(!on);
    const f = flips + 1;
    setFlips(f);
    if (f === FLIPS) pass("Switched on নাকি switched off — এটা সামিন কখনো ভুল দেখবে না। ঝামেলা একটাই: একটা বাল্বে মাত্র দুইটা কথা।");
  };

  return (
    <>
      <TwoWindows level={on ? 1 : 0} />
      <div className="flex justify-center">
        <button type="button" onClick={flip} className={primaryBtn} aria-pressed={on}>
          {on ? "Switch off করুন" : "Switch on করুন"}
        </button>
      </div>
      <div className="mx-auto mt-4 grid max-w-xs gap-1.5">
        {[0, 1].map((v) => (
          <div
            key={v}
            className={`flex items-center gap-3 rounded-lg border px-3 py-1.5 transition-colors duration-300 ${
              (on ? 1 : 0) === v ? "border-[#f59e0b] bg-[#fbbf24]/10" : "border-border"
            }`}
          >
            <Dots n={v} k={1} />
            <span>{MESSAGES[v]}</span>
          </div>
        ))}
      </div>
      {flips > 0 && (
        <Samin key={flips} tone="good">
          {on ? "Switched on! মানে আব্বু বাসায় আছে।" : "Switched off — মানে আব্বু বাসায় নেই।"}
        </Samin>
      )}
      <Task done={flips >= FLIPS}>
        বাল্বটা কয়েকবার switch on-off করুন ({bn(Math.min(flips, FLIPS))}/{bn(FLIPS)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4, 5 · Find every pattern two (then three) bulbs can make. The codebook
//        fills in as each one turns up; "all off" counts from the start.

export function FindPatterns({ bulbs }: { bulbs: 2 | 3 }) {
  const pass = useGate();
  const total = 1 << bulbs;
  const [n, setN] = useState(0);
  const [found, setFound] = useState<number[]>([0]);
  const [touched, setTouched] = useState(false);

  const toggle = (w: number) => {
    const v = n ^ w;
    setN(v);
    setTouched(true);
    if (!found.includes(v)) {
      const f = [...found, v];
      setFound(f);
      if (f.length === total)
        pass(bulbs === 2 ? "৪টা pattern, ৪টা মেসেজ — এক বাল্বের দ্বিগুণ।" : "৮টা pattern! আবার দ্বিগুণ।");
    }
  };

  return (
    <>
      <div className="mx-auto my-5 max-w-xs">
        <Pane label="আপনার জানালা · বাল্বে tap করুন">
          <Bulbs n={n} k={bulbs} onToggle={toggle} />
        </Pane>
      </div>
      {touched && (
        <Samin key={n} tone="good">
          বুঝছি — {MESSAGES[n]}।
        </Samin>
      )}
      <div className="mt-4 text-sm font-medium text-muted">
        দুইজনের লিস্ট · {bn(found.length)}/{bn(total)}টা pattern পাওয়া গেছে
      </div>
      <ol className="mt-2 grid gap-1.5">
        {Array.from({ length: total }, (_, v) => {
          const got = found.includes(v);
          return (
            <li
              key={v}
              className={`flex items-center gap-3 rounded-lg border px-3 py-1.5 text-[0.95rem] transition-colors duration-300 ${
                !got ? "border-dashed border-border text-muted" : v === n ? "border-[#f59e0b] bg-[#fbbf24]/10" : "border-border"
              }`}
            >
              {got ? (
                <>
                  <Dots n={v} k={bulbs} />
                  <span key="m" className={FADE}>
                    {MESSAGES[v]}
                  </span>
                  {bulbs === 3 && v >= 4 ? (
                    <span className="ml-auto shrink-0 rounded-full bg-cat-violet/15 px-2 text-xs font-semibold text-cat-violet">নতুন</span>
                  ) : v === 0 ? (
                    <span className="ml-auto shrink-0 text-xs text-muted">সব off-ও একটা pattern</span>
                  ) : null}
                </>
              ) : (
                <span>? এখনো পাওয়া যায়নি</span>
              )}
            </li>
          );
        })}
      </ol>
      <Task done={found.length === total}>
        বাল্বগুলো on-off করে সবগুলো আলাদা pattern খুঁজে বের করুন ({bn(found.length)}/{bn(total)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Why it doubles, acted out in three presses: copy the list, OFF in front
//     of one copy, ON in front of the other.

const DBL_BTN = ["লিস্টটার একটা কপি করুন", "প্রথম কপির সামনে একটা switched off বাল্ব বসান", "দ্বিতীয় কপির সামনে একটা switched on বাল্ব বসান"];

export function Doubling() {
  const pass = useGate();
  const [step, setStep] = useState(0);

  const next = () => {
    const s = step + 1;
    setStep(s);
    if (s === 3) pass("পুরনো ৪টা + নতুন ৪টা = ৮। প্রতিটা নতুন বাল্ব ঠিক এই কাজটাই করে।");
  };

  const copy = (half: 0 | 1) => {
    const lead = half === 0 ? (step >= 2 ? "off" : undefined) : step >= 3 ? "on" : undefined;
    const fresh = half === 1 && step >= 3;
    return (
      <div
        className={`rounded-xl border-2 p-3 transition-colors duration-500 ${
          half === 1 ? `${FADE} starting:translate-x-6 transition-[opacity,translate,border-color]` : ""
        } ${fresh ? "border-cat-violet/50 bg-cat-violet/5" : "border-border"}`}
      >
        <div className="mb-2 text-sm font-medium text-muted">
          {half === 0 ? (step >= 1 ? "কপি ১" : "আগের লিস্ট") : "কপি ২"}
          {lead ? (lead === "off" ? " · সামনে off" : " · সামনে on") : ""}
        </div>
        <ol className="grid gap-1.5">
          {[0, 1, 2, 3].map((v) => (
            <li key={v} className="flex items-center gap-2.5 text-[0.93rem]">
              <Dots n={v} k={2} lead={lead} />
              <span key={String(fresh)} className={`${FADE} ${half === 1 && !fresh ? "text-muted line-through" : ""}`}>
                {MESSAGES[fresh ? 4 + v : v]}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <>
      <div className="my-5 grid gap-3 sm:grid-cols-2">
        {copy(0)}
        {step >= 1 && copy(1)}
      </div>
      {step === 1 || step === 2 ? (
        <div className="rounded-xl bg-cat-amber/10 px-3.5 py-2.5 text-[0.95rem] leading-snug transition duration-300 starting:opacity-0">
          একই pattern-এর তো দুইটা মানে হতে পারে না! কপি দুইটাকে আলাদা করতে হবে।
        </div>
      ) : null}
      {step === 3 && (
        <div className={`${POP} text-center font-mono text-3xl font-bold`}>
          ৪ + ৪ = ৮
        </div>
      )}
      {step < 3 && (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={next} className={primaryBtn}>
            {DBL_BTN[step]}
          </button>
        </div>
      )}
      <Task done={step === 3}>তিনটা ধাপে লিস্টটাকে দ্বিগুণ করুন ({bn(step)}/{bn(3)})</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Four bulbs: guess from the tally, then watch it built from three.

const FOUR_OPTIONS = [9, 10, 12, 16];
const FOUR_RIGHT = 3;

export function PredictFour() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const build = usePlay(1100);
  const phase = build.k; // 1 the eight · 2 copied · 3 fronted · 4 counted
  const over = guess !== null && phase === 4;

  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    build.play(4, () =>
      pass(
        i === FOUR_RIGHT
          ? "ঠিক ধরেছেন — ১৬! সামনে off-ওয়ালা ৮টা আর সামনে on-ওয়ালা ৮টা।"
          : "বাল্বগুলো বলছে ১৬। সামনে off-ওয়ালা ৮টা আর সামনে on-ওয়ালা ৮টা।",
      ),
    );
  };

  const tally: [string, string][] = [
    ["১টা বাল্ব", "২"],
    ["২টা বাল্ব", "৪"],
    ["৩টা বাল্ব", "৮"],
    ["৪টা বাল্ব", over ? "১৬" : "?"],
  ];

  return (
    <>
      <div className="my-5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2">
        {tally.map(([who, count], i) => (
          <span key={who} className="inline-flex items-center gap-1.5">
            {i > 0 && <span className="text-sm text-muted">{i === 3 && !over ? "× ?" : "× ২"} →</span>}
            <span
              className={`inline-flex flex-col items-center rounded-xl border-2 px-3 py-1.5 ${
                i === 3 ? (over ? "win-pop border-accent bg-accent/10" : "border-dashed border-foreground/40") : "border-border"
              }`}
            >
              <b className="font-mono text-xl">{count}</b>
              <span className="text-xs text-muted">{who}</span>
            </span>
          </span>
        ))}
      </div>

      {phase > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          {[0, 1].map((half) =>
            phase >= half + 1 ? (
              <div key={half} className={`rounded-xl border-2 border-border p-3 ${FADE}`}>
                <div className="mb-2 text-sm font-medium text-muted">
                  {phase >= 3 ? (half ? "সামনে on" : "সামনে off") : half ? "কপি" : "৩ বাল্বের ৮টা"}
                </div>
                <div className="grid gap-1.5">
                  {Array.from({ length: 8 }, (_, v) => (
                    <Dots key={v} n={v} k={3} lead={phase >= 3 ? (half ? "on" : "off") : undefined} />
                  ))}
                </div>
              </div>
            ) : (
              <div key={half} />
            ),
          )}
        </div>
      )}
      {over && <div className={`${POP} mb-3 text-center font-mono text-2xl font-bold`}>৮ + ৮ = ১৬</div>}

      <div className="text-sm font-medium text-muted">৪টা বাল্বে কয়টা মেসেজ?</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {FOUR_OPTIONS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, FOUR_RIGHT)} disabled={guess !== null} onClick={() => choose(i)}>
            <span className="font-mono text-lg">{bn(o)}টা</span>
          </Choice>
        ))}
      </div>
      <Task done={over}>আগে guess করুন — তারপর ৩ বাল্ব থেকে ৪ বাল্ব বানিয়ে মিলিয়ে দেখা হবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The arithmetic as a tree: each bulb forks every branch in two. Each new
//     bulb sets off a tour that lights the branches one at a time, root to
//     pattern, counting them; after that the reader can point at any row to
//     light its branch.

const TREE_K = 4;
const TW = 320;
const TH = 236;
const TOP = 26;
const SPAN = TH - TOP - 8;
const LX = [16, 72, 128, 184, 238];
const PAT_X = 256;
const NODE_R = [0, 6.5, 5.5, 4.4, 3.4];
/** Per segment of a lit branch, so the whole branch traces in well under a tour step. */
const TRACE_MS = 90;
/** Vertical position of node j on level L (level 0 is the start). */
const nodeY = (level: number, j: number) => TOP + ((j + 0.5) * SPAN) / (1 << level);

export function BranchTree() {
  const pass = useGate();
  const [shown, setShown] = useState(1);
  const [pick, setPick] = useState<number | null>(null);
  const tour = usePlay(520);
  const levels = Array.from({ length: shown }, (_, i) => i + 1);
  const count = 1 << shown;
  // the branch lit right now: the tour's while it runs, else the reader's
  const lit = tour.running ? (tour.k >= 0 ? tour.k : null) : pick;
  /** The node branch `lit` passes through on level L. */
  const litAt = (L: number) => (lit ?? 0) >> (shown - L);

  const add = () => {
    const s = shown + 1;
    setShown(s);
    setPick(null);
    // start one step early, so the new branches finish drawing before the tour lights them
    tour.play(1 << s, undefined, -1);
    if (s === TREE_K) pass("প্রতিটা বাল্ব প্রতিটা ডালকে দুই ভাগ করে — তাই প্রতিবার × ২।");
  };

  const choose = (j: number) => {
    if (tour.running) tour.play(0);
    setPick(j);
  };

  return (
    <>
      <div className="mx-auto mt-5 mb-2 w-full max-w-md">
        <svg
          viewBox={`0 0 ${TW} ${TH}`}
          role="group"
          aria-label={`a tree of choices for ${shown} bulbs: ${count} branches`}
          onPointerLeave={(e) => e.pointerType === "mouse" && !tour.running && setPick(null)}
          className="block h-auto w-full"
        >
          {levels.map((L) => (
            <text key={L} x={LX[L]} y={12} textAnchor="middle" className={`${FADE} fill-muted text-[9px]`}>
              বাল্ব {bn(L)}
            </text>
          ))}
          <text x={PAT_X + 12} y={12} textAnchor="middle" className="fill-muted text-[9px]">
            pattern
          </text>
          <g className={`transition-opacity duration-300 motion-reduce:transition-none ${lit === null ? "" : "opacity-30"}`}>
            {levels.map((L) =>
              Array.from({ length: 1 << L }, (_, j) => (
                <Draw
                  key={`e${L}-${j}`}
                  d={`M${LX[L - 1]} ${nodeY(L - 1, j >> 1)}L${LX[L]} ${nodeY(L, j)}`}
                  strokeWidth={1.4}
                  ms={500}
                  className={j & 1 ? "stroke-[#f59e0b]" : "stroke-foreground/35"}
                />
              )),
            )}
            {levels.map((L) =>
              Array.from({ length: 1 << L }, (_, j) => (
                <circle
                  key={`n${L}-${j}`}
                  cx={LX[L]}
                  cy={nodeY(L, j)}
                  r={NODE_R[L]}
                  strokeWidth={1}
                  style={{ transitionDelay: "350ms" }}
                  className={`${POP} ${j & 1 ? "fill-[#fbbf24] stroke-[#f59e0b]" : "fill-surface stroke-foreground/40"}`}
                />
              )),
            )}
          </g>
          <text x={(LX[0] + LX[1]) / 2 - 2} y={(nodeY(0, 0) + nodeY(1, 0)) / 2 - 3} textAnchor="middle" className="fill-muted text-[9px]">
            off
          </text>
          <text x={(LX[0] + LX[1]) / 2 - 2} y={(nodeY(0, 0) + nodeY(1, 1)) / 2 + 11} textAnchor="middle" className="fill-[#d97706] text-[9px]">
            on
          </text>
          <circle cx={LX[0]} cy={nodeY(0, 0)} r={3} className="fill-foreground/60" />

          {/* the lit branch, traced from the start to its pattern */}
          {lit !== null && (
            <g key={`${shown}-${lit}`}>
              <rect
                x={PAT_X - 5}
                y={nodeY(shown, lit) - 5}
                width={(shown - 1) * 7 + 10}
                height={10}
                rx={5}
                className="fill-cat-amber/20"
              />
              {levels.map((L) => (
                <Draw
                  key={L}
                  d={`M${LX[L - 1]} ${nodeY(L - 1, litAt(L) >> 1)}L${LX[L]} ${nodeY(L, litAt(L))}`}
                  strokeWidth={3}
                  ms={TRACE_MS}
                  delay={(L - 1) * TRACE_MS}
                  className={litAt(L) & 1 ? "stroke-[#f59e0b]" : "stroke-foreground/80"}
                />
              ))}
              {levels.map((L) => (
                <circle
                  key={`n${L}`}
                  cx={LX[L]}
                  cy={nodeY(L, litAt(L))}
                  r={NODE_R[L] + 1}
                  strokeWidth={1.6}
                  style={{ transitionDelay: `${L * TRACE_MS}ms`, transitionDuration: "150ms" }}
                  className={`${FADE} ${litAt(L) & 1 ? "fill-[#fbbf24] stroke-[#b45309]" : "fill-surface stroke-foreground"}`}
                />
              ))}
            </g>
          )}

          {/* each branch of the newest level, read back as the pattern it spells */}
          <g key={shown}>
            {Array.from({ length: count }, (_, j) => (
              <g key={j} className={`transition-opacity duration-300 motion-reduce:transition-none ${lit === null || lit === j ? "" : "opacity-30"}`}>
                {bitsOf(j, shown).map((b, k) => (
                  <circle
                    key={k}
                    cx={PAT_X + k * 7}
                    cy={nodeY(shown, j)}
                    r={2.6}
                    strokeWidth={0.8}
                    style={{ transitionDelay: "500ms" }}
                    className={`${FADE} ${b ? "fill-[#fbbf24]" : "fill-foreground/10 stroke-foreground/30"}`}
                  />
                ))}
              </g>
            ))}
          </g>

          {/* one full-width band per branch, so any row is easy to point at */}
          {Array.from({ length: count }, (_, j) => (
            <rect
              key={`b${shown}-${j}`}
              x={0}
              y={TOP + (j * SPAN) / count}
              width={TW}
              height={SPAN / count}
              tabIndex={0}
              role="button"
              aria-label={`ডাল ${bn(j + 1)}: ${spoken(j, shown)}`}
              onPointerEnter={() => choose(j)}
              onClick={() => choose(j)}
              onFocus={() => choose(j)}
              className="cursor-pointer fill-transparent outline-none focus-visible:fill-foreground/5"
            />
          ))}
        </svg>
      </div>
      <div className="mb-3 flex min-h-7 flex-wrap items-center justify-center gap-x-1.5 text-sm">
        {lit === null ? (
          <span className="text-muted">কোনো ডালে tap করুন, পুরো পথটা জ্বলে উঠবে</span>
        ) : (
          <>
            <span className="text-muted">
              ডাল {bn(lit + 1)}/{bn(count)}:
            </span>
            {bitsOf(lit, shown).map((b, i) => (
              <span key={i} className="font-mono">
                {i > 0 && <span className="text-muted">→ </span>}
                <b className={b ? "text-[#d97706]" : ""}>{b ? "on" : "off"}</b>
              </span>
            ))}
          </>
        )}
      </div>
      <div className="text-center font-mono text-2xl font-bold">
        {Array.from({ length: shown }, () => "২").join(" × ")} = {bn(1 << shown)}
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={add} disabled={shown >= TREE_K} className={primaryBtn}>
          + আরেকটা বাল্ব
        </button>
      </div>
      <Task done={shown >= TREE_K}>
        চারটা বাল্ব পর্যন্ত যোগ করে দেখুন ({bn(shown)}/{bn(TREE_K)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9, 10 · Price tags. Every bulb gets a value, and a pattern means the sum of
//         its switched-on bulbs. The reader picks the newest (leftmost) bulb's
//         value and watches every pattern drop onto the number it adds up to.
//         A wrong value either lands two patterns on one number (a pattern
//         wasted) or leaves a number no pattern can say. Only doubling does
//         neither — which is the whole reason the values go 1, 2, 4, 8.

const TAG = {
  2: { options: [1, 2, 3], right: 2 },
  3: { options: [3, 4, 5, 6], right: 4 },
};

export function PriceTag({ bulbs }: { bulbs: 2 | 3 }) {
  const pass = useGate();
  const { options, right } = TAG[bulbs];
  const [pick, setPick] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const total = 1 << bulbs;
  // the bulbs to its right are already worth what they turn out to be (1, 2)
  const lead = 1 << (bulbs - 1);
  const worth = (w: number) => (w === lead ? (pick ?? 0) : w);

  const sumOf = (p: number) => placesOf(bulbs).reduce((a, w) => a + (p & w ? worth(w) : 0), 0);
  const max = placesOf(bulbs).reduce((a, w) => a + worth(w), 0);
  const slots = Array.from({ length: max + 1 }, (_, s) =>
    Array.from({ length: total }, (_, p) => p).filter((p) => sumOf(p) === s),
  );
  const twice = slots.findIndex((ps) => ps.length > 1);
  const hole = slots.findIndex((ps) => ps.length === 0);

  const choose = (v: number) => {
    setPick(v);
    if (v === right) {
      setSolved(true);
      pass(bulbs === 2 ? "২! চারটা pattern, চারটা আলাদা সংখ্যা: ০ থেকে ৩।" : "৪! আটটা pattern, আটটা আলাদা সংখ্যা: ০ থেকে ৭।");
    }
  };

  return (
    <>
      <div className="mx-auto my-5 max-w-xs">
        <Pane label="প্রতিটা বাল্বের গায়ে একটা দাম">
          <Bulbs
            n={0}
            k={bulbs}
            under={(w) =>
              w === lead ? (
                <span className="rounded-full bg-cat-violet px-2 font-bold text-white">{pick === null ? "?" : bn(pick)}</span>
              ) : (
                bn(w)
              )
            }
          />
        </Pane>
      </div>

      <div className="text-center text-sm font-medium text-muted">বাঁয়ের বাল্বটার দাম কত হবে?</div>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {options.map((v) => (
          <button key={v} type="button" aria-pressed={v === pick} onClick={() => choose(v)} className={pill(v === pick)}>
            দাম {bn(v)}
          </button>
        ))}
      </div>

      {pick === null ? (
        <div className="mt-5 text-center text-[0.95rem] text-muted">
           এমন একটা দাম বেছে নাও যেন নিচের দুইটা শর্তই মেলে
        </div>
      ) : (
        <>
          <div className="mt-5 text-sm font-medium text-muted">প্রতিটা pattern কোন সংখ্যা বোঝাচ্ছে:</div>
          {/* keyed by the pick, so every new value drops the patterns in again */}
          <div key={pick} className="mt-2 flex flex-wrap justify-center gap-1.5">
            {slots.map((ps, s) => (
              <div
                key={s}
                className={`flex w-14 flex-col items-center gap-1 rounded-xl border-2 px-1 pt-1.5 pb-1 ${
                  ps.length > 1
                    ? "border-danger/60 bg-danger/5"
                    : ps.length === 0
                      ? "border-dashed border-danger/40"
                      : "border-accent/40 bg-accent/5"
                }`}
              >
                <div className="flex min-h-12 flex-col items-center justify-end gap-1">
                  {ps.map((p) => (
                    <span key={p} className={`block ${POP}`} style={{ transitionDelay: `${p * 140}ms` }}>
                      <Dots n={p} k={bulbs} small />
                    </span>
                  ))}
                  {ps.length === 0 && <span className="text-xs text-danger/80">ফাঁকা</span>}
                </div>
                <b className="font-mono text-lg">{bn(s)}</b>
              </div>
            ))}
          </div>
          {twice >= 0 ? (
            <Nope key={`twice-${pick}`}>{bn(twice)} বলার দুইটা উপায় হয়ে গেল — একটা pattern নষ্ট!</Nope>
          ) : hole >= 0 ? (
            <Nope key={`hole-${pick}`}>{bn(hole)} বলার কোনো উপায়ই নাই!</Nope>
          ) : (
            <div className={`${FADE} mt-2 text-center text-[0.95rem] font-medium text-accent-text`}>
              প্রতিটা সংখ্যা ঠিক একবার করে। কোনো pattern নষ্ট নাই, মাঝে কোনো ফাঁকাও নাই।
            </div>
          )}
        </>
      )}
      <Ticks
        items={[
          ["কোনো সংখ্যা দুইবার না", pick !== null && twice < 0],
          ["মাঝে কোনো ফাঁকা নাই", pick !== null && hole < 0],
        ]}
      />
      <Task done={solved}>বাঁয়ের বাল্বের এমন একটা দাম খুঁজুন, যাতে দুইটা শর্তই মেলে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11 · Make numbers: switch bulbs until their values add up to the target.

const TARGETS = [5, 6, 3];

export function MakeNumber() {
  const pass = useGate();
  const [n, setN] = useState(0);
  const [k, setK] = useState(0);
  const target: number | undefined = TARGETS[k];
  const lit = placesOf(3).filter((w) => n & w);

  const toggle = (w: number) => {
    const v = n ^ w;
    setN(v);
    if (target !== undefined && v === target) {
      setK(k + 1);
      if (k + 1 === TARGETS.length) pass("যেকোনো সংখ্যা মানে কয়েকটা বাল্বের দাম যোগ করা — কোনটা on থাকবে, কোনটা off।");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {TARGETS.map((t, i) => (
          <span
            key={t}
            className={`rounded-full border-2 px-3.5 py-1 font-mono text-lg font-semibold transition-colors duration-300 ${
              i < k ? "border-accent bg-accent/10 text-accent-text" : i === k ? "border-foreground" : "border-border text-muted"
            }`}
          >
            {i < k ? "✓ " : ""}
            {bn(t)}
          </span>
        ))}
      </div>
      <div className="mx-auto my-5 max-w-xs">
        <Pane label="আপনার জানালা">
          <Bulbs n={n} k={3} onToggle={toggle} under={(w) => bn(w)} />
        </Pane>
      </div>
      <div className="text-center">
        <div className="text-sm text-muted">0 আর 1 দিয়ে লিখলে</div>
        <div className="font-mono text-3xl font-bold tracking-[0.35em]">{binary(n, 3)}</div>
        <div className="mt-1 font-mono text-xl text-muted">
          {lit.length ? lit.map((w) => bn(w)).join(" + ") : "০"} = <b className="text-foreground">{bn(n)}</b>
        </div>
      </div>
      <Task done={k >= TARGETS.length}>
        {target !== undefined ? (
          <>
            বাল্ব on-off করে <b className="font-mono">{bn(target)}</b> বানান।
          </>
        ) : (
          "তিনটাই বানিয়ে ফেলেছেন!"
        )}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 12 · Samin's reply, four bulbs — the value of the fourth is left for the
//      reader to work out. The question itself is a Check in the MDX.

export function SaminSignal() {
  return (
    <div className="mx-auto my-5 max-w-xs">
      <Pane label="সামিনের জানালা">
        <Bulbs n={0b1011} k={4} size="w-10 sm:w-12" under={(w) => (w === 8 ? "?" : bn(w))} />
      </Pane>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 13 · Eight bulbs, worth 128 down to 1. Light them all: 255.

export function EightBulbs() {
  const pass = useGate();
  const [n, setN] = useState(0);
  const lit = placesOf(8).filter((w) => n & w);

  const toggle = (w: number) => {
    const v = n ^ w;
    setN(v);
    if (v === 255) pass("সবগুলো switched on হলে 255। এর বেশি এই আটটা বাল্ব দিয়ে বলাই যায় না।");
  };

  return (
    <>
      <div className="mx-auto my-5 max-w-lg">
        <Pane label="আটটা বাল্ব">
          <Bulbs n={n} k={8} onToggle={toggle} size="w-7 sm:w-10" under={(w) => <span className="text-[0.65rem] sm:text-xs">{w}</span>} />
        </Pane>
      </div>
      <div className="text-center">
        <div className="font-mono text-lg tracking-widest text-muted">{binary(n, 8)}</div>
        <div className="mt-1 font-mono text-sm break-words text-muted">{lit.length ? lit.join(" + ") : "0"}</div>
        <div key={n === 255 ? "full" : "not"} className={`font-mono text-4xl font-bold ${n === 255 ? "win-pop text-accent-text" : ""}`}>
          {n}
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={() => setN(0)} className={quietBtn}>
          ↺ সব off
        </button>
      </div>
      <Task done={n === 255}>আটটা বাল্বই switch on করুন — কত হয়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 14 · Last picture: eight bulbs counting from 0 all the way to 255.

function FinaleReel({ onReplay }: { onReplay: () => void }) {
  const n = useCountUp(255, 28);
  return (
    <>
      <div className="mx-auto my-5 max-w-lg">
        <Pane>
          <Bulbs n={n} k={8} size="w-7 sm:w-10" under={(w, on) => <span className={on ? "text-[#fcd34d]" : ""}>{on ? 1 : 0}</span>} />
        </Pane>
      </div>
      <div className="text-center font-mono text-4xl font-bold tabular-nums">{n}</div>
      {n === 255 && (
        <div className={`${FADE} mt-2 text-center`}>
          <div className="text-muted">২৫৬টা pattern — 0 থেকে 255</div>
          <button
            type="button"
            onClick={onReplay}
            className="mt-3 cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            ↺ আবার দেখুন
          </button>
        </div>
      )}
    </>
  );
}

export function Finale() {
  const [run, setRun] = useState(0);
  return <FinaleReel key={run} onReplay={() => setRun((r) => r + 1)} />;
}
