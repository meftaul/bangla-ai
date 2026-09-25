"use client";

import { useId, useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, LOOK, Nope, POP, Scene, Speech, pill, predictLook, primaryBtn, useScene, useSeed, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person, Robot, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Label, Plane, makeFrame, snap, type Frame, type XY } from "@/components/journey/plane";
import { BoxLine, Drop, Floor, Shade, Sun, keyMove, nice, polar, rot } from "./noon-journey";

// Screens for "Math for AI 4.3 — The box said 25", the discovery version of
// 04c_noon_shadow (see .claude/skills/pathshala-discovery and
// 04c1d_discovery_plan.md). The Name-it screens (FlatFloor, TurnThePaper,
// StickMarks) and the <Then> figures come from noon-journey.tsx.
//
// Karim's van is stuck in the mud and needs to roll 6 squares. Fahim's push
// gets 25 from the box, and the van is still stuck. The van only rolls along
// the road, so a push moves it by its shadow on the road; the box gives the
// road card's length times that. The reader pushes first (RollFour,
// BendFlags), compares three classmates' rules (WhoseRule), is taught it from
// Samin's and Rina's rules, tests a longer road card (LongerCard), fixes
// Shiku's first-number rule (ShikuFlag), and gets the van out with no graph
// paper at all (PondRope).
//
// The van is Karim's teal, the road card blue, a push coral. Tailwind only;
// drawn objects on the white sheets use fixed ink.

type Story = { story?: boolean };

const O: XY = [0, 0];
const RAD = Math.PI / 180;
const len = (v: readonly number[]) => Math.hypot(...v);
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
/** how far a push w moves the van along road v: its shadow on the road */
const roll = (v: XY, w: XY) => dot(v, w) / len(v);
const along = (v: XY, s: number): XY => [(v[0] / len(v)) * s, (v[1] / len(v)) * s];
const deg = (v: XY) => Math.atan2(v[1], v[0]) / RAD;
const VAN = "#0891b2";

// ---------------------------------------------------------------------------
// The road, the van (seen from above), and a flag, on graph paper.

function Road({ f, v, from = -1.2, to = 9 }: { f: Frame; v: XY; from?: number; to?: number }) {
  const a = along(v, from);
  const b = along(v, to);
  return (
    <g className="pointer-events-none">
      <path d={`M${f.sx(a[0])} ${f.sy(a[1])}L${f.sx(b[0])} ${f.sy(b[1])}`} strokeWidth={22} strokeLinecap="round" className="stroke-[#c8a27a]/45" />
      <path d={`M${f.sx(a[0])} ${f.sy(a[1])}L${f.sx(b[0])} ${f.sy(b[1])}`} strokeWidth={1} strokeDasharray="5 6" className="stroke-[#8a6a3d]/60" />
    </g>
  );
}

function Van({ f, v, s, stuck = false }: { f: Frame; v: XY; s: number; stuck?: boolean }) {
  const p = along(v, s);
  return (
    <g transform={`translate(${f.sx(p[0])} ${f.sy(p[1])}) rotate(${-deg(v)})`} className="pointer-events-none">
      {[-8, 8].map((x) => [-9, 9].map((y) => <rect key={`${x}${y}`} x={x - 3} y={y - 1.5} width={6} height={3} rx={1} fill="#1f2937" />))}
      <rect x={-12} y={-8} width={24} height={16} rx={3} fill={VAN} opacity={0.9} />
      <rect x={4} y={-6} width={6} height={12} rx={1.5} fill="#cffafe" />
      {stuck && <circle r={16} fill="none" stroke="#8a6a3d" strokeWidth={2} strokeDasharray="3 3" />}
    </g>
  );
}

function Flag({ f, v, s, tone = "ink" }: { f: Frame; v: XY; s: number; tone?: "ink" | "shiku" }) {
  const p = along(v, s);
  const x = f.sx(p[0]);
  const y = f.sy(p[1]);
  const c = tone === "shiku" ? "#7c3aed" : "#dc2626";
  return (
    <g className="pointer-events-none">
      <path d={`M${x} ${y}V${y - 24}`} stroke="#0f1b2d" strokeWidth={1.5} />
      <path d={`M${x} ${y - 24}l11 4l-11 4Z`} fill={c} />
      <circle cx={x} cy={y} r={2.5} fill="#0f1b2d" />
    </g>
  );
}

function Push({ f, w, drag }: { f: Frame; w: XY; drag?: boolean }) {
  return (
    <>
      <Arrow f={f} from={O} to={w} tone="coral" w={2.6} />
      {drag && <circle cx={f.sx(w[0])} cy={f.sy(w[1])} r={9} className="fill-cat-coral/15 stroke-cat-coral" strokeWidth={1.2} />}
    </>
  );
}

/** One line of what happened: the box's number, and how far the van really went. */
function LogRows({ rows, flags = false }: { rows: number[][]; flags?: boolean }) {
  if (!rows.length) return <div className="h-6" />;
  return (
    <div className="mx-auto mt-2 grid w-fit gap-0.5 text-sm">
      {rows.slice(-3).map((r, i) => (
        <div key={`${rows.length}-${i}`} className={i === Math.min(rows.length, 3) - 1 ? POP : "opacity-60"}>
          {flags ? (
            <>
              flag <b className="font-mono">{nice(r[0])}</b> · ভ্যান থামলো <b className="font-mono">{nice(r[1])}</b> এ
            </>
          ) : (
            <>
              dot product <b className="font-mono">{nice(r[0])}</b> · ভ্যান গড়ালো <b className="font-mono">{nice(r[1])}</b>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ponytail: the reader's flags from BendFlags, kept in memory for WhoseRule on
// the next screen. Lost on a reload (WhoseRule then leaves the "you" row out);
// the upgrade is to keep it in the Journey's saved progress.
const memory: { flags: [flag: number, stop: number][] } = { flags: [] };

// ---------------------------------------------------------------------------
// Story scenes. A village road in the monsoon, a mud patch, Karim's van seen
// from the side.

const SG = 150;

function SideVan({ x, y }: { x: number; y: number }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)` }} className="transition-transform duration-1000 motion-reduce:transition-none">
      <rect x={-34} y={-30} width={46} height={14} rx={2} fill="#a16207" />
      <rect x={12} y={-40} width={20} height={24} rx={3} fill={VAN} />
      <rect x={16} y={-36} width={12} height={9} rx={1.5} fill="#cffafe" />
      <circle cx={-22} cy={-8} r={8} fill="#1f2937" />
      <circle cx={22} cy={-8} r={8} fill="#1f2937" />
      <circle cx={-22} cy={-8} r={3} fill="#9ca3af" />
      <circle cx={22} cy={-8} r={3} fill="#9ca3af" />
    </g>
  );
}

function Mud() {
  return (
    <g className="pointer-events-none">
      <ellipse cx={130} cy={SG + 8} rx={100} ry={10} fill="#6b4f2a" />
      <ellipse cx={120} cy={SG + 6} rx={70} ry={6} fill="#7c5a31" />
      <text x={292} y={SG + 22} textAnchor="end" fontSize={8} fontWeight={700} fill="#14532d">
        শুকনা রাস্তা
      </text>
      <path d={`M232 ${SG + 2}H318`} stroke="#4d7c0f" strokeWidth={3} />
    </g>
  );
}

export function VanStuck({}: Story) {
  const s = useScene(5, [500, 1500, 1600, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="গ্রামের কাদা রাস্তা। করিমের ভ্যান আটকে আছে। ফাহিম ধাক্কা দেয়, dot product বলে 25, ভ্যান একটু নড়ে আবার থেমে যায়, এখনো কাদায়। করিম হাত তুলে দেখায়।">
        <Mud />
        <SideVan x={k >= 4 ? 150 : 120} y={SG + 6} />
        <Person who="karim" x={k >= 1 ? 228 : 344} y={SG} facing={-1} walking={k === 1} ms={1300} mood={k >= 5 ? "puzzled" : "plain"} arm={k >= 5 ? "point" : "down"} />
        <Person who="fahim" x={k >= 1 ? 58 : -24} y={SG} walking={k === 1} ms={1300} arm={k >= 3 ? "hold" : "down"} mood={k >= 4 ? "happy" : "plain"} />
        {k >= 3 && <CastCard x={70} y={SG - 80} text="dot product: 25" tone="amber" />}
        {k === 2 && <Bubble x={228} y={SG - 66} side="left" lines={["শুকনা রাস্তা পর্যন্ত", "6 ঘর গড়াইতে হইবো।"]} />}
        {k === 4 && <Bubble x={58} y={SG - 66} side="right" lines={["Dot product বলছে 25!", "6 এর চেয়ে অনেক বেশি।"]} />}
        {k >= 5 && <Bubble x={228} y={SG - 66} side="left" lines={["তাইলে ভ্যান এখনো", "কাদায় ক্যান?"]} />}
      </Stage>
    </StoryFrame>
  );
}

export function VanOut({}: Story) {
  const s = useScene(3, [500, 1600, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="করিম শুকনা পাড় থেকে 30 degree তে টানে, ভ্যান কাদা থেকে গড়িয়ে শুকনা রাস্তায় ওঠে, সবাই হাত নাড়ে।">
        <Mud />
        <SideVan x={k >= 2 ? 262 : 120} y={SG + 6} />
        <Person who="karim" x={296} y={SG} facing={-1} mood={k >= 2 ? "happy" : "plain"} arm={k >= 1 ? "hold" : "down"} />
        <Person who="fahim" x={40} y={SG} mood={k >= 2 ? "happy" : "plain"} arm={k >= 2 ? "wave" : "down"} />
        {k >= 3 && <Bubble x={40} y={SG - 66} side="right" lines={["Dot product 25, গড়ালো 5.", "Card টা ছিল 5 লম্বা!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1b · The bet as a picture, under the bet: the mud, the dry road 6 squares
//      on, and the box's 25 far down the road. The picked bet plays out as a
//      ghost van (glides to 25), a "fewer than 25" reach with a "?", or a "?"
//      that cuts the box off from the van. Nothing is marked.

const B1_X = (n: number) => 18 + (n / 26) * 230;

function BetStrip({ bet }: { bet: number | null }) {
  const [g] = useTween([bet === 0 ? 25 : 0], 1200);
  const INKS = "#0f1b2d";
  return (
    <svg viewBox="0 0 264 60" role="img" aria-label="0 তে কাদায় ভ্যান, 6 ঘর পর থেকে শুকনা রাস্তা, আর dot product এর 25 রাস্তার অনেক সামনে" className="mx-auto mt-2 block h-auto w-full max-w-[18rem]">
      <rect x={0.5} y={0.5} width={263} height={59} rx={6} fill="white" stroke="#cbd5e1" strokeWidth={0.8} />
      <rect x={B1_X(0) - 8} y={30} width={B1_X(26) - B1_X(0) + 8} height={11} rx={2} fill="#c8a27a" opacity={0.45} />
      <rect x={B1_X(0) - 8} y={29} width={B1_X(6) - B1_X(0) + 8} height={13} rx={4} fill="#7c5a31" opacity={0.65} />
      <path d={`M${B1_X(6)} 26V45`} stroke="#14532d" strokeWidth={1.5} strokeDasharray="3 2" />
      <text x={B1_X(6) + 4} y={53} fontSize={7.5} fontWeight={700} fill="#14532d">
        শুকনা রাস্তা
      </text>
      {[0, 6, 25].map((t) => (
        <text key={t} x={B1_X(t)} y={t === 6 ? 22 : 53} textAnchor="middle" fontSize={7.5} fill={INKS} fillOpacity={0.6} fontFamily="ui-monospace, monospace">
          {t}
        </text>
      ))}
      <path d={`M${B1_X(25)} 26V45`} stroke="#b45309" strokeWidth={1.2} strokeDasharray="2 2" />
      <text x={B1_X(25) - 14} y={14} textAnchor="middle" fontSize={8} fontWeight={700} fill="#b45309">
        dot product: 25
      </text>
      {bet === 2 && <path d={`M${B1_X(25) - 48} 11H${B1_X(25) + 20}`} stroke="#b45309" strokeWidth={1.2} className={FADE} />}
      {bet === 1 && <Draw d={`M${B1_X(0) + 8} 24H${B1_X(24)}`} strokeWidth={1.4} ms={900} className="stroke-[#2563eb] [stroke-dasharray:3_3]" />}
      <rect x={B1_X(0) - 7} y={31} width={14} height={9} rx={2} fill={VAN} />
      {bet === 0 && <rect x={B1_X(g) - 7} y={31} width={14} height={9} rx={2} fill="none" stroke={VAN} strokeWidth={1.3} strokeDasharray="2 2" />}
      {(bet === 1 || bet === 2) && (
        <text key={bet} x={bet === 1 ? B1_X(12) : B1_X(0)} y={bet === 1 ? 20 : 22} textAnchor="middle" fontSize={11} fontWeight={800} fill="#2563eb" className={POP}>
          ?
        </text>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 1 · The puzzle. Pick the question you want answered, then seal a bet on how
//     far the van really rolled. Unmarked; checked on the last screen.

const QUESTIONS = ["ভ্যান আসলে কতদূর গড়ালো?", "Dot product এর 25 মানে কী?", "ফাহিমের ধাক্কা কি বেশি দুর্বল?"];
const BETS = ["25 ঘর, dot product যেমন বললো", "25 ঘরের কম", "Dot product দেখে বলা যায় না"];

export function StuckBet() {
  const pass = useGate();
  const [q, setQ] = useSeed<number | null>("q", null);
  const [bet, setBet] = useSeed<number | null>("bet", null);

  return (
    <>
      {q === null ? (
        <>
          <div className="text-sm font-medium text-muted">আপনি সবচেয়ে বেশি কোনটা জানতে চান?</div>
          <div className="mt-2 grid gap-2">
            {QUESTIONS.map((o, i) => (
              <Choice key={o} n={i} look="idle" disabled={false} onClick={() => setQ(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </>
      ) : (
        <div className={FADE}>
          <div className="text-sm font-medium text-muted">ভালো প্রশ্ন। তিনটাই শেষে একই জায়গায় গিয়ে মেলে। তার আগে একটা বাজি: dot product বলেছে 25। ভ্যান কতদূর গড়ালো?</div>
          <BetStrip bet={bet} />
          <div className="mt-2 grid gap-2">
            {BETS.map((o, i) => (
              <Choice
                key={o}
                n={i}
                look={bet === i ? "picked" : bet !== null ? "dim" : "idle"}
                disabled={bet !== null}
                onClick={() => {
                  setBet(i);
                  pass("বাজি ধরা হয়ে গেলো। শেষে মিলিয়ে দেখবো।");
                }}
              >
                {o}
              </Choice>
            ))}
          </div>
        </div>
      )}
      <Task done={bet !== null}>একটা প্রশ্ন বেছে নিন। তারপর বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Try: the sandbox. Road card (4, 3); the reader drags Fahim's push
//     anywhere and presses Push. The van rolls along the road by the push's
//     shadow (no shadow drawn: that's for later), backwards or not at all when
//     it should. Unlocks after three pushes, right or wrong.

const FR = makeFrame(-3, 6, -3, 5, 29);
const ROAD: XY = [4, 3];

export function RollFour() {
  const pass = useGate();
  const [w, setW] = useSeed<XY>("w", [0, 3]);
  const [pushed, setPushed] = useSeed("pushed", false);
  const [log, setLog] = useSeed<number[][]>("log", []);
  const r = roll(ROAD, w);
  const [s] = useTween([pushed ? r : 0], 900);
  const four = log.some((x) => Math.abs(x[1] - 4) < 1e-9);

  const go = (p: XY) => {
    setPushed(false);
    setW(p);
  };
  const push = () => {
    if (pushed || (w[0] === 0 && w[1] === 0)) return;
    setPushed(true);
    const next = [...log, [dot(ROAD, w), r]];
    setLog(next);
    if (next.length === 3) setTimeout(() => pass("Dot product এর number আর গড়ানো এক জিনিস না।"), 900);
  };

  return (
    <>
      <Plane f={FR} ticks={0} label={`রাস্তার card (4, 3); ফাহিমের ধাক্কা (${w[0]}, ${w[1]})`} drag={{ down: (p) => go(snap(p, FR)), move: (p) => go(snap(p, FR)) }} onKey={keyMove(FR, w, go)} className="max-w-[19rem]">
        <Road f={FR} v={ROAD} />
        <Arrow f={FR} from={O} to={ROAD} tone="blue" w={2.2} faint />
        <Van f={FR} v={ROAD} s={s} />
        <Push f={FR} w={w} drag />
      </Plane>
      <div className="flex items-center justify-center gap-3">
        <BoxLine v={ROAD} w={w} live />
        <button type="button" onClick={push} disabled={pushed} className={primaryBtn}>
          ধাক্কা দিন
        </button>
      </div>
      <LogRows rows={log} />
      {four && <div className={`${POP} mt-1 text-center text-sm font-semibold text-accent-text`}>ঠিক 4 গড়ালো।</div>}
      <Task done={log.length >= 3}>ফাহিমের ধাক্কার মাথাটা যেদিকে ইচ্ছা টেনে নিন। তারপর “ধাক্কা দিন” চাপুন। ভ্যানটাকে ঠিক 4 গড়ানো যায়? তিনবার ধাক্কা দিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Try: a second road, card (2, 1). Plant a flag where you think the van
//     will stop, then push. Three tries, right or wrong. The flags are kept
//     for WhoseRule.

const FB = makeFrame(-3, 5, -2.5, 4.5, 30);
const BEND: XY = [2, 1];

export function BendFlags() {
  const pass = useGate();
  const [w, setW] = useSeed<XY>("w", [2, 3]);
  const [flag, setFlag] = useSeed("flag", 1.5);
  const [pushed, setPushed] = useSeed("pushed", false);
  const [log, setLog] = useSeed<number[][]>("log", []);
  const r = roll(BEND, w);
  const [s] = useTween([pushed ? r : 0], 900);

  const go = (p: XY) => {
    setPushed(false);
    setW(p);
  };
  const push = () => {
    if (pushed || (w[0] === 0 && w[1] === 0)) return;
    setPushed(true);
    const next = [...log, [flag, r]];
    setLog(next);
    memory.flags = next.map((x) => [x[0], x[1]]);
    if (next.length === 3) setTimeout(() => pass("এই রাস্তায় আগের guess গুলা মেলে না।"), 900);
  };

  return (
    <>
      <Plane f={FB} ticks={0} label={`রাস্তার card (2, 1); flag ${flag} এ; ধাক্কা (${w[0]}, ${w[1]})`} drag={{ down: (p) => go(snap(p, FB)), move: (p) => go(snap(p, FB)) }} onKey={keyMove(FB, w, go)} className="max-w-[18rem]">
        <Road f={FB} v={BEND} from={-3} to={6} />
        <Arrow f={FB} from={O} to={BEND} tone="blue" w={2.2} faint />
        <Flag f={FB} v={BEND} s={flag} />
        <Van f={FB} v={BEND} s={s} />
        <Push f={FB} w={w} drag />
      </Plane>
      <div className="mx-auto flex max-w-sm items-center gap-2 text-sm">
        <span className="shrink-0 text-muted">flag</span>
        <input type="range" min={-3} max={6} step={0.5} value={flag} aria-label="রাস্তার কোথায় flag পুঁতবেন" onChange={(e) => {
            setPushed(false);
            setFlag(Number(e.target.value));
          }} className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]" />
        <b className="w-8 font-mono">{nice(flag)}</b>
      </div>
      <div className="mt-1 flex items-center justify-center gap-3">
        <BoxLine v={BEND} w={w} live />
        <button type="button" onClick={push} disabled={pushed} className={primaryBtn}>
          ধাক্কা দিন
        </button>
      </div>
      <LogRows rows={log} flags />
      <Task done={log.length >= 3}>একটা ধাক্কা ঠিক করুন। ভ্যান যেখানে থামবে বলে মনে হয়, সেখানে flag পুঁতুন। তারপর ধাক্কা দিন। তিনবার।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Compare. One case on the (2, 1) road: push (2, 3), box 7, the van stops
//     at 3.13. Each rule plants its flag; the reader's own flags are there
//     too. Whose idea could grow, and why?

const CASE_STOP = 7 / Math.sqrt(5); // 3.13
const RULES = [
  { who: "ফাহিম", rule: "dot product যত বলে, তত গড়ায়", flag: 7 },
  { who: "সামিন", rule: "ধাক্কার first number যত, তত", flag: 2 },
  { who: "রিনা", rule: "dot product এর number ÷ 5", flag: 1.4 },
];
const GROW_WHY: Record<number, string> = {
  0: "ফাহিমের flag 7 এ, ভ্যান ছাড়িয়ে অনেক দূরে। প্রথম রাস্তাতেও মেলে নাই: dot product 25, গড়ালো 5।",
  1: "ধাক্কা কাগজের লাইন বরাবর শোয়ানো থাকলে? সামিনের নিয়ম কাজ করতো। কিন্তু এই রাস্তা উপরে উঠে গেছে। দেখুন, ওর flag আগেই থেমে গেছে।",
};
const REASONS = ["প্রথম রাস্তার card (4, 3) ছিল 5 লম্বা", "ফাহিম 5 জোরে ধাক্কা দেয়", "Dot product শুধু শোয়ানো রাস্তায় কাজ করে"];
const REASON_SHORT = ["card 5 লম্বা", "ধাক্কার জোর 5", "শুধু শোয়ানো রাস্তা"];
const REASON_WHY: Record<number, string> = {
  1: "ফাহিম একেকবার একেক জোরে ধাক্কা দিয়েছিল। তবু প্রথম রাস্তায় প্রতিটা ধাক্কায় ÷ 5 মিলে গেছে।",
  2: "প্রথম রাস্তাটাও তো উপরে উঠে গিয়েছিল। সেখানে dot product একবারও ভুল করে নাই।",
};

/** A picture choice: the picture across the whole button, its label under it (Choice's letter badge would squeeze it). */
function PicPick({ look, disabled, onClick, children }: { look: Look; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`block w-full cursor-pointer rounded-xl border-2 p-1.5 transition-[color,background-color,border-color] duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look]}`}>
      {children}
    </button>
  );
}

/**
 * 4b · The three reasons as pictures of the first road, (4, 3). Picked, each
 * plays what it claims: a tape along the card reads 5; a second, weaker push
 * still fits ÷ 5; the flat road tilts up to (4, 3) and the van still rolls
 * its 5. `on` plays it.
 */
function ReasonPic({ i, on }: { i: number; on: boolean }) {
  const ox = 12;
  const oy = 56;
  const u = 9.5;
  const P = (a: number, b: number) => `${ox + a * u} ${oy - b * u}`;
  const [tilt] = useTween([i === 2 && on ? 36.87 : 0], 900);
  const [roll] = useTween([i === 2 && on ? 5 : 0], 900);
  return (
    <svg viewBox="0 0 100 64" className="mx-auto block h-auto w-full max-w-[6.5rem]" aria-hidden="true">
      <rect x={0.5} y={0.5} width={99} height={63} rx={5} fill="white" stroke="#cbd5e1" strokeWidth={0.6} />
      {i < 2 && (
        <>
          <path d={`M${P(-0.6, -0.45)}L${P(8, 6)}`} stroke="#c8a27a" strokeOpacity={0.5} strokeWidth={8} strokeLinecap="round" />
          <path d={`M${P(0, 0)}L${P(4, 3)}`} stroke="#2563eb" strokeWidth={2} strokeLinecap="round" />
          <path d={`M${P(4, 3)}l-5 0.6l2.6 3.4Z`} fill="#2563eb" />
        </>
      )}
      {i === 0 && on && (
        <g>
          <Draw d={`M${P(-0.45, 0.6)}L${P(3.55, 3.6)}`} strokeWidth={3} ms={800} className="stroke-[#f59e0b]" />
          <text x={ox + 0.9 * u} y={oy - 3.6 * u} fontSize={10} fontWeight={800} fill="#b45309" fontFamily="ui-monospace, monospace" className={POP} style={{ transitionDelay: "600ms" }}>
            5
          </text>
        </g>
      )}
      {i === 1 && (
        <>
          <path d={`M${P(0, 0)}L${P(3.4, 4.2)}`} stroke="#e8590c" strokeWidth={1.8} strokeLinecap="round" />
          <text x={ox + 3.6 * u} y={oy - 4.6 * u} fontSize={8} fontWeight={800} fill="#be123c" fontFamily="ui-monospace, monospace">
            5
          </text>
          {on && (
            <g className={FADE}>
              <path d={`M${P(0, 0)}L${P(1, 2)}`} stroke="#e8590c" strokeWidth={1.8} strokeLinecap="round" />
              <text x={3} y={10} fontSize={8.5} fontWeight={700} fill="#15803d" fontFamily="ui-monospace, monospace">
                10÷5=2
              </text>
              <text x={97} y={oy + 4} textAnchor="end" fontSize={8.5} fontWeight={700} fill="#15803d" fontFamily="ui-monospace, monospace">
                25÷5=5
              </text>
            </g>
          )}
        </>
      )}
      {i === 2 && (
        <g style={{ transform: `rotate(${-tilt}deg)`, transformOrigin: `${ox}px ${oy}px` }}>
          <path d={`M${P(-0.6, 0)}L${P(8.5, 0)}`} stroke="#c8a27a" strokeOpacity={0.5} strokeWidth={8} strokeLinecap="round" />
          <rect x={ox + roll * u - 5} y={oy - 3.5} width={10} height={7} rx={1.5} fill={VAN} />
        </g>
      )}
      {i === 2 && on && roll > 4.95 && (
        <text x={97} y={51} textAnchor="end" fontSize={8.5} fontWeight={700} fill="#15803d" className={FADE}>
          <tspan x={97}>dot product 25,</tspan>
          <tspan x={97} dy={10}>গড়ালো 5</tspan>
        </text>
      )}
    </svg>
  );
}

function Strip({ flag, stop, tone = "ink", rolling = false }: { flag: number; stop: number; tone?: "ink" | "you"; rolling?: boolean }) {
  const x = (n: number) => 12 + ((n + 1) / 9) * 196;
  const off = Math.abs(flag - stop) > 0.05;
  // a picked row rolls its van again from 0 (the row is re-keyed per pick), then the miss is drawn
  const [at] = useTween([stop], 900, rolling ? [0] : undefined);
  const landed = Math.abs(at - stop) < 0.02;
  return (
    <svg viewBox="0 0 220 30" className="block h-auto w-full max-w-[13rem]" aria-hidden="true">
      <path d="M6 22H214" stroke="#c8a27a" strokeOpacity={0.6} strokeWidth={10} strokeLinecap="round" />
      <rect x={x(at) - 7} y={17} width={14} height={10} rx={2} fill={VAN} />
      {rolling && landed && off && <path d={`M${x(flag)} 13H${x(stop)}`} stroke="#dc2626" strokeWidth={1.6} strokeDasharray="3 2" className={FADE} />}
      <path d={`M${x(flag)} 22V4`} stroke="#0f1b2d" strokeWidth={1.3} />
      <path d={`M${x(flag)} 4l8 3l-8 3Z`} fill={tone === "you" ? "#2563eb" : off ? "#dc2626" : "#16a34a"} />
    </svg>
  );
}

export function WhoseRule() {
  const pass = useGate();
  const [mine] = useState(() => memory.flags);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [why, setWhy] = useSeed<number | null>("why", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const grow = pick === 2;
  const avgMiss = mine.length ? mine.reduce((a, [f, s]) => a + Math.abs(f - s), 0) / mine.length : null;

  return (
    <>
      <div className="text-center text-sm text-muted">
        রাস্তা (2, 1), ধাক্কা (2, 3), dot product <b className="font-mono text-foreground">7</b>. ভ্যান থামলো <b className="font-mono text-foreground">3.13</b> এ।
      </div>
      <div className="mx-auto mt-2 grid max-w-sm gap-1.5">
        {RULES.map((r, i) => (
          <div key={r.who} className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-colors motion-reduce:transition-none ${pick === i ? (i === 2 ? "bg-accent/10" : "nudge bg-danger/10") : ""}`}>
            <div className="w-28 shrink-0 text-sm leading-tight">
              <b>{r.who}</b>
              <div className="text-xs text-muted">{r.rule}</div>
            </div>
            <Strip key={pick === i ? `p${miss}` : "rest"} flag={r.flag} stop={CASE_STOP} rolling={pick === i} />
          </div>
        ))}
        {avgMiss !== null && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-28 shrink-0 text-sm leading-tight">
              <b>আপনি</b>
              <div className="text-xs text-muted">আপনার flag average এ {nice(avgMiss)} দূরে পড়েছে</div>
            </div>
            <Strip flag={mine[mine.length - 1][0]} stop={mine[mine.length - 1][1]} tone="you" />
          </div>
        )}
      </div>
      {!grow ? (
        <>
          <div className="mt-3 text-sm font-medium text-muted">তিনজনেরই মেলে নাই। কার idea টা ঠিক করে নিলে সব রাস্তায় কাজ করবে?</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {RULES.map((r, i) => (
              <Choice
                key={r.who}
                n={i}
                look={pick === i ? "wrong" : "idle"}
                disabled={false}
                onClick={() => {
                  setPick(i);
                  if (i !== 2) setMiss(miss + 1);
                }}
              >
                {r.who}
              </Choice>
            ))}
          </div>
          {pick !== null && <Nope key={miss}>{GROW_WHY[pick]}</Nope>}
        </>
      ) : (
        <div className={FADE}>
          <div className="mt-3 text-sm font-medium text-muted">প্রথম রাস্তায় রিনার ÷ 5 একদম মিলে গিয়েছিল। 5 কেন?</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {REASONS.map((o, i) => (
              <PicPick
                key={o}
                look={why === i ? (i === 0 ? "right" : "wrong") : "idle"}
                disabled={why === 0}
                onClick={() => {
                  setWhy(i);
                  if (i === 0) setTimeout(() => pass("রিনার 5 ছিল প্রথম রাস্তার card এর length।"), 1100);
                  else setMiss(miss + 1);
                }}
              >
                <span className="sr-only">{o}</span>
                <ReasonPic key={why === i ? `on${miss}` : "off"} i={i} on={why === i} />
                <span className="mt-1 block text-center text-xs leading-tight">{REASON_SHORT[i]}</span>
              </PicPick>
            ))}
          </div>
          {why !== null && why !== 0 && <Nope key={miss}>{REASON_WHY[why]}</Nope>}
          {why === 0 && <div className={`${FADE} mt-2 text-center text-sm`}>আর এই রাস্তার card (2, 1) মাত্র 2.24 লম্বা। তাই এখানে ÷ 5 ভুল number।</div>}
        </div>
      )}
      <Task done={why === 0}>কার idea টা সব রাস্তায় চালানো যায়? বেছে নিন। তারপর বেছে নিন, প্রথম রাস্তায় ওটা কেন মিলেছিল।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The twist. Karim's road card for the same road is (8, 6), twice as
//     long. Same push, (4, 3). Predict the roll; the box doubles to 50, the
//     van stops at 5 again.

const FL = makeFrame(-1, 9, -1, 7, 21);
const LONG: XY = [8, 6];
const G_LONG = ["আরো দূরে", "ঠিক 5", "অর্ধেক"];

export function LongerCard() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [pushed, setPushed] = useSeed("pushed", false);
  const [s] = useTween([pushed ? 5 : 0], 900);

  return (
    <>
      <Plane f={FL} ticks={0} label="রাস্তার card (8, 6), ধাক্কা (4, 3)" className="max-w-[17rem]">
        <Road f={FL} v={LONG} from={-1} to={10} />
        <Arrow f={FL} from={O} to={LONG} tone="blue" w={2.6} />
        <Van f={FL} v={LONG} s={s} />
        <Arrow f={FL} from={O} to={ROAD} tone="coral" w={2.6} />
      </Plane>
      <div className="flex justify-center">
        <BoxLine v={LONG} w={ROAD} />
      </div>
      {guess !== null && !pushed && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setPushed(true);
              setTimeout(() => pass("Card লম্বা, dot product বড়। গড়ানো একই।"), 900);
            }}
            className={`${primaryBtn} ${FADE}`}
          >
            ধাক্কা দিন
          </button>
        </div>
      )}
      {pushed && <div className={`${FADE} mt-2 text-center text-sm`}>Dot product 50, আগের 25 এর দ্বিগুণ। ভ্যান আবারও গড়ালো <b className="font-mono">5</b>.</div>}
      <div className="mt-3 text-sm font-medium text-muted">আগে ছিল dot product 25, গড়ালো 5। এই card দিয়ে ভ্যান কতদূর গড়াবে?</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {G_LONG.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, pushed, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={pushed}>আগে guess করুন। তারপর ধাক্কা দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Teach Shiku. Shiku uses Samin's first-number rule on the (2, 1) road.
//     The reader taps the broken step, then picks what to divide the box's 7
//     by. Shiku plants the flag there and pushes; the van stops at 3.13.

const W_CASE: XY = [2, 3];
const FS = makeFrame(-1.2, 4.2, -0.8, 3.4, 27);
const SHIKU_STEPS = ["First number বলে রাস্তা ধরে কতদূর।", "ধাক্কা (2, 3), তাই ভ্যান গড়াবে 2।", "আমি 2 এ flag পুঁতে ধাক্কা দিই।"];
const DIVS = [
  { text: "5", n: 5, why: "5 ছিল প্রথম রাস্তার length।" },
  { text: "2", n: 2, why: "2 হলো ধাক্কার first number." },
  { text: "2.24", n: Math.sqrt(5), why: "" },
];

/** the van rolling from 0 to `to` when it mounts; re-key it to roll again */
function M9Van({ f, v, to }: { f: Frame; v: XY; to: number }) {
  const [s] = useTween([to], 900, [0]);
  return <Van f={f} v={v} s={s} />;
}

export function ShikuFlag() {
  const pass = useGate();
  const [broken, setBroken] = useSeed<number | null>("broken", null);
  const [div, setDiv] = useSeed<number | null>("div", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const flag = div === null ? 2 : 7 / DIVS[div].n;
  // Shiku's flag glides to each new guess; the van rolls again from 0 on each pick
  // (M9Van is re-keyed), always to where the push really sends it
  const [fs] = useTween([flag], 700);
  const fixed = div === 2;

  return (
    <>
      <Plane f={FS} ticks={0} label={`রাস্তার card (2, 1); Shiku র flag ${nice(flag)} এ; ভ্যান থামে 3.13 এ`} className="my-2 max-w-[14rem]">
        <Road f={FS} v={BEND} from={-1.3} to={4.6} />
        <Arrow f={FS} from={O} to={BEND} tone="blue" w={2.2} faint />
        {broken === 0 && (
          <g>
            <Draw d={`M${FS.sx(0)} ${FS.sy(0)}H${FS.sx(2)}`} strokeWidth={2} ms={700} className="stroke-[#7c3aed] [stroke-dasharray:4_3]" />
            <text x={FS.sx(2) + 3} y={FS.sy(0) + 12} fontSize={7.5} fontWeight={700} className={`${FADE} pointer-events-none fill-[#7c3aed]`}>
              কাগজ বরাবর 2
            </text>
            <Drop f={FS} from={W_CASE} to={along(BEND, CASE_STOP)} />
          </g>
        )}
        <Push f={FS} w={W_CASE} />
        <M9Van key={div ?? "none"} f={FS} v={BEND} to={CASE_STOP} />
        <g key={`f${miss}`} className={POP}>
          <Flag f={FS} v={BEND} s={fs} tone="shiku" />
        </g>
      </Plane>
      <Speech who="Shiku" initial="S" tint="teal" tone={fixed ? "good" : "plain"}>
        {fixed ? "7 ÷ 2.24 = 3.13. ভ্যান ঠিক আমার flag এ এসে থামলো।" : div === null ? "আমার flag 2 এ। এতে কোনো ভুল নাই।" : `আমার flag ${nice(flag)} এ। ঠিক আছে তো?`}
      </Speech>
      {broken !== 0 ? (
        <>
          <div className="mt-2 grid gap-1.5">
            {SHIKU_STEPS.map((t, i) => (
              <Choice
                key={t}
                n={i}
                look={broken === i ? (i === 0 ? "right" : "wrong") : "idle"}
                disabled={false}
                onClick={() => {
                  setBroken(i);
                  if (i !== 0) setMiss(miss + 1);
                }}
              >
                {t}
              </Choice>
            ))}
          </div>
          {broken !== null && broken !== 0 && <Nope key={miss}>ওই ধাপটা তো আগের ধাপ থেকেই আসে। Shiku প্রথম ভুলটা করে কোথায়?</Nope>}
        </>
      ) : (
        <div className={FADE}>
          <div className="mt-2 text-sm font-medium text-muted">Dot product বলছে 7। রাস্তার card টা 2.24 লম্বা। Shiku র নিয়মটা ঠিক করে দিন: 7 ÷ কত?</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DIVS.map((d, i) => (
              <Choice
                key={d.text}
                n={i}
                look={div === i ? (i === 2 ? "right" : "wrong") : "idle"}
                disabled={fixed}
                onClick={() => {
                  setDiv(i);
                  if (i === 2) pass("7 ÷ রাস্তার length 2.24 = 3.13.");
                  else setMiss(miss + 1);
                }}
              >
                <span className="font-mono text-lg">{d.text}</span>
              </Choice>
            ))}
          </div>
          {div !== null && div !== 2 && (
            <Nope key={miss}>
              Shiku র flag গেলো {nice(flag)} এ, কিন্তু ভ্যান থামলো 3.13 এ। {DIVS[div].why}
            </Nope>
          )}
        </div>
      )}
      <Task done={fixed}>Shiku কোন ধাপে ভুল করলো? সেখানে tap করুন। তারপর ওর নিয়মটা ঠিক করে দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · Use it. No graph paper in the mud. Karim pulls with 7 from the dry
//      bank; where he stands sets the angle to the road (30°, 60°, 90°). The
//      van rolls 7 × the stick card's number and is out if that reaches 6.

const FP = makeFrame(-1, 8.2, -0.9, 7.6, 28);
const SPOTS = [
  { deg: 30, card: 0.866 },
  { deg: 60, card: 0.5 },
  { deg: 90, card: 0 },
];
const FLAT: XY = [1, 0];

export function PondRope() {
  const pass = useGate();
  const [spot, setSpot] = useSeed<number | null>("spot", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const got = spot === null ? 0 : 7 * SPOTS[spot].card;
  const [s] = useTween([got], 1000);
  const out = got >= 6;

  const stand = (i: number) => {
    setSpot(i);
    if (7 * SPOTS[i].card >= 6) setTimeout(() => pass("7 × 0.866 = 6.06. ভ্যান কাদা থেকে উঠে গেলো।"), 1000);
    else setMiss(miss + 1);
  };

  return (
    <>
      <Plane f={FP} grid={0} axes={false} label={spot === null ? "কাদায় করিমের ভ্যান; পাড়ে তিনটা শুকনা জায়গা" : `করিম টানছে ${SPOTS[spot].deg}° থেকে; ভ্যান গড়ালো ${nice(got)}`} className="max-w-[18rem]">
        <rect x={FP.sx(-1)} y={FP.sy(0.7)} width={7 * FP.u} height={1.4 * FP.u} className="fill-[#7c5a31]/50" />
        <rect x={FP.sx(6)} y={FP.sy(0.7)} width={2.2 * FP.u} height={1.4 * FP.u} className="fill-[#4d7c0f]/40" />
        <text x={FP.sx(7.1)} y={FP.sy(-0.4) + 8} textAnchor="middle" fontSize={8} fontWeight={700} className="fill-[#14532d]">
          শুকনা
        </text>
        <path d={`M${FP.sx(6)} ${FP.sy(0.7)}V${FP.sy(-0.7)}`} strokeWidth={1.5} strokeDasharray="3 3" className="stroke-[#14532d]" />
        {spot !== null && <path d={`M${FP.sx(0)} ${FP.sy(0)}L${FP.sx(7 * Math.cos(SPOTS[spot].deg * RAD))} ${FP.sy(7 * Math.sin(SPOTS[spot].deg * RAD))}`} strokeWidth={2} className="stroke-[#78350f]" />}
        <Van f={FP} v={FLAT} s={s} stuck={spot !== null && !out && Math.abs(s - got) < 1e-6} />
        {SPOTS.map((p, i) => {
          const at = polar(7, p.deg);
          return (
            <g key={p.deg} onClick={() => stand(i)} className="cursor-pointer">
              <circle cx={FP.sx(at[0])} cy={FP.sy(at[1])} r={13} className={spot === i ? "fill-[#0891b2]/30 stroke-[#0891b2]" : "fill-[#4d7c0f]/20 stroke-[#4d7c0f]"} strokeWidth={1.5} />
              <text x={FP.sx(at[0])} y={FP.sy(at[1]) + 3.5} textAnchor="middle" fontSize={9} fontWeight={700} className="pointer-events-none fill-[#0f1b2d] font-mono">
                {p.deg}°
              </text>
            </g>
          );
        })}
        {spot !== null && <Drop f={FP} from={polar(7, SPOTS[spot].deg)} />}
      </Plane>
      <div className="flex justify-center gap-2">
        {SPOTS.map((p, i) => (
          <button key={p.deg} type="button" onClick={() => stand(i)} disabled={out} className={pill(spot === i)}>
            {p.deg}°
          </button>
        ))}
      </div>
      <div className="mt-2 h-6 text-center font-mono text-[0.95rem]">
        {spot !== null && (
          <span key={spot} className={FADE}>
            7 × {SPOTS[spot].card} = <b className={out ? "text-accent-text" : "text-danger"}>{nice(got)}</b> <span className="font-sans">{out ? "≥ 6, বের হয়ে গেছে!" : "< 6, এখনো আটকা"}</span>
          </span>
        )}
      </div>
      {spot !== null && !out && <Nope key={miss}>দড়ি জোরেই টানছে। কিন্তু টানের বেশিটাই যাচ্ছে পাশের দিকে। ভ্যানকে সরায় শুধু রাস্তার উপরে টানের shadow টুকু।</Nope>}
      <Task done={out}>করিম পাড়ের কোথায় দাঁড়ালে ভ্যান অন্তত 6 গড়াবে? বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// More story scenes, on the same muddy road.

// 4a · A story scene for screen 4's setup, no task: Fahim, Samin and Rina by
//      the stuck van, each saying their rule; then the reader's own flag.

/** a small flag on the stage, pole foot at (x, y) */
function M4Flag({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g className={POP}>
      <path d={`M${x} ${y}V${y - 22}`} stroke="#0f1b2d" strokeWidth={1.4} />
      <path d={`M${x} ${y - 22}l11 4l-11 4Z`} fill={color} />
    </g>
  );
}

export function RulesArrive({}: Story) {
  const s = useScene(4, [500, 2200, 2200, 2200, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="কাদায় করিমের ভ্যান। ফাহিম বলে, dot product যত বলে ভ্যান তত গড়াবে। সামিন বলে, ধাক্কার first number যত, তত। রিনা বলে, dot product এর number ভাগ 5। তারপর আপনার flag টাও কাদায় পোঁতা হয়।">
        <Mud />
        <SideVan x={120} y={SG + 6} />
        <Person who="fahim" x={36} y={SG} arm={k === 1 ? "point" : "down"} mood={k === 1 ? "smug" : "plain"} />
        <Person who="samin" x={206} y={SG} facing={-1} arm={k === 2 ? "point" : "down"} />
        <Person who="rina" x={270} y={SG} facing={-1} arm={k === 3 ? "point" : "down"} />
        {k === 1 && <Bubble x={36} y={SG - 66} side="right" lines={["Dot product যত বলে,", "ভ্যান তত গড়াবে।"]} />}
        {k === 2 && <Bubble x={206} y={SG - 66} lines={["ধাক্কার first number", "যত, তত গড়াবে।"]} />}
        {k === 3 && <Bubble x={270} y={SG - 66} side="left" lines={["Dot product এর number ÷ 5.", "ওইটুকুই গড়াবে।"]} />}
        {k >= 4 && (
          <>
            <M4Flag x={172} y={SG + 6} color="#2563eb" />
            <text x={172} y={SG + 22} textAnchor="middle" fontSize={8} fontWeight={700} fill="#1d4ed8" className={FADE}>
              আপনি
            </text>
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 8a · A story scene for screen 8's setup, no task: Fahim holds the old road
//      card (4, 3); Karim walks up with his own, (8, 6); the two drawn as
//      arrows point the same way, one twice as long.

export function KarimCard({}: Story) {
  const s = useScene(3, [500, 1500, 1500, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="আটকে থাকা ভ্যানের পাশে ফাহিমের হাতে রাস্তার card (4, 3)। করিম একই রাস্তার আরেকটা card নিয়ে আসে, (8, 6)। Arrow হিসাবে আঁকলে দুইটা একই দিকে যায়, আর করিমেরটা দ্বিগুণ লম্বা।">
        <Mud />
        <SideVan x={120} y={SG + 6} />
        <Person who="fahim" x={40} y={SG} arm="hold" />
        <CastCard x={76} y={SG - 38} text="(4, 3)" tone="blue" />
        <Person who="karim" x={k >= 1 ? 250 : 344} y={SG} facing={-1} walking={k === 1} ms={1300} arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && <CastCard x={212} y={SG - 38} text="(8, 6)" tone="blue" />}
        {k >= 3 && (
          <g>
            <Draw d="M66 90L86 75" strokeWidth={2.4} ms={600} className="stroke-[#2563eb]" />
            <Draw d="M192 90L232 60" strokeWidth={2.4} ms={900} className="stroke-[#2563eb]" />
            <path d="M86 75l-6.5 1l3.3 4.2Z M232 60l-6.5 1l3.3 4.2Z" fill="#2563eb" className={FADE} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 9a · A story scene for screen 9's setup, no task: Shiku rolls up to the
//      stuck van, plants his flag at 2, and is sure of it.

export function ShikuSure({}: Story) {
  const s = useScene(3, [500, 1500, 1400, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="Robot Shiku আটকে থাকা ভ্যানের কাছে আসে, একটু সামনে একটা বেগুনি flag পোঁতে, আর বলে ভ্যান থামবে 2 এ; এতে ওর কোনো সন্দেহ নাই।">
        <Mud />
        <SideVan x={120} y={SG + 6} />
        <Robot x={k >= 1 ? 214 : 344} y={SG} walking={k === 1} ms={1300} />
        {k >= 2 && <M4Flag x={180} y={SG + 6} color="#7c3aed" />}
        {k >= 3 && <Bubble x={214} y={SG - 44} side="left" lines={["ভ্যান থামবে 2 এ।", "এতে কোনো ভুল নাই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 10a · A story scene for screen 10's setup, no task: no paper, no box.
//       Karim climbs the dry bank, the rope runs back to the van, and the
//       spring balance on it reads 7. Where he stands is the screen's job.

export function RopeBank({}: Story) {
  const s = useScene(3, [500, 1500, 1400, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="গভীর কাদায় করিমের ভ্যান আটকে আছে। করিম রাস্তার পাশের শুকনা পাড়ে ওঠে, ভ্যান থেকে একটা দড়ি ওর হাতে, দড়ির spring balance এ 7।">
        <Mud />
        <path d="M232 150Q246 128 268 126H320V150Z" fill="#4d7c0f" opacity={0.85} />
        <SideVan x={120} y={SG + 6} />
        <Person who="karim" x={k >= 1 ? 286 : 176} y={k >= 1 ? 127 : SG} facing={-1} walking={k === 1} ms={1300} arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && <Draw d="M152 136L277 90" strokeWidth={1.6} ms={800} className="stroke-[#78350f]" />}
        {k >= 3 && (
          <g className={POP}>
            <rect x={203} y={105} width={16} height={11} rx={2} fill="#e5e7eb" stroke="#0f1b2d" strokeWidth={1} transform="rotate(-20 211 110)" />
            <text x={211} y={113.5} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#0f1b2d" fontFamily="ui-monospace, monospace" transform="rotate(-20 211 110)">
              7
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 11a · A story scene for the ending, no task: the van is out on the dry road;
//       Mami walks up with the two recipes and asks why they should always
//       agree. It stops on the question (4.4 answers it).

/** cast's Card, in a sans font so Bangla renders: centred at (x, y), tone ink on white */
function M11Card({ x, y, text, ink }: { x: number; y: number; text: string; ink: string }) {
  const width = text.length * 5.2 + 14;
  return (
    <g className={POP}>
      <rect x={x - width / 2} y={y - 9} width={width} height={18} rx={3} fill="white" stroke={ink} strokeWidth={1.4} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={ink}>
        {text}
      </text>
    </g>
  );
}

export function MamiWhy({}: Story) {
  const s = useScene(3, [500, 1500, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ভ্যান শুকনা রাস্তায় উঠে গেছে। মামি এগিয়ে আসেন। Dot product গুণ করে জোড়ায় জোড়ায়; লাঠি মাপে length আর angle। মামি জিজ্ঞেস করেন, দুইটা সবসময় একই number দিবে কেন।">
        <Mud />
        <SideVan x={262} y={SG + 6} />
        <Person who="fahim" x={40} y={SG} mood="happy" />
        <Person who="mami" x={k >= 1 ? 150 : -24} y={SG} walking={k === 1} ms={1300} arm={k >= 3 ? "point" : "down"} mood={k >= 3 ? "puzzled" : "plain"} />
        {k >= 2 && <M11Card x={82} y={24} text="dot product: জোড়ায় জোড়ায়" ink="#b45309" />}
        {k >= 2 && <M11Card x={232} y={24} text="stick: angle" ink="#be123c" />}
        {k >= 3 && <Bubble x={150} y={SG - 66} lines={["সবসময় একই number", "আসবে কেন?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures (watch-only).

// 5a · A figure for screen 5's explanation, no task: the flat road, the push
//      (2, 3); the sun drops its tip onto the road; the van rolls just that
//      far; that stretch is the push's shadow.

const X5_F = makeFrame(-0.6, 3.8, -0.9, 3.4, 26);
const X5_V: XY = [3, 0];
const X5_W: XY = [2, 3];
const X5_SAY = [
  "রাস্তাটা কাগজের সাথে শোয়ানো। ফাহিমের ধাক্কা w উপরের দিকে হেলে আছে।",
  "সূর্য w এর মাথা থেকে সোজা নিচে রাস্তার উপরে দাগ নামায়।",
  "ভ্যান শুধু রাস্তা ধরেই গড়াতে পারে। দাগটা যেখানে পড়েছে, ঠিক সেখানে থামে।",
  "এইটুকুই রাস্তার উপরে ধাক্কার shadow।",
];

export function VanShadow() {
  const s = useScene(3, [500, 1600, 1800, 1800]);
  const k = s.k;
  const f = X5_F;
  const [go] = useTween([k >= 2 ? 2 : 0], 900);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5_SAY[k]}</span>}>
      <Plane f={f} grid={1} axes={false} label="শোয়ানো রাস্তা, 3 লম্বা; ধাক্কা (2, 3); ওর মাথা থেকে দাগ রাস্তায় পড়ে 2 এ; ভ্যান গড়ায় 2 পর্যন্ত" className="my-0! max-w-[10rem]">
        {k >= 1 && (
          <g className={FADE}>
            <Sun f={f} />
          </g>
        )}
        <Road f={f} v={X5_V} from={-0.6} to={3.8} />
        <Arrow f={f} from={O} to={X5_V} tone="blue" w={2.2} faint />
        {k >= 1 && (
          <g className={FADE}>
            <Shade f={f} b={2} y={0} />
            <Drop f={f} from={X5_W} />
          </g>
        )}
        <Van f={f} v={X5_V} s={go} />
        <Arrow f={f} from={O} to={X5_W} tone="coral" w={2.6} />
        <Label f={f} at={X5_W} dx={8} dy={-2} anchor="start" className="fill-cat-coral">
          w
        </Label>
        {k >= 3 && (
          <text x={f.sx(1)} y={f.sy(0) + 22} textAnchor="middle" fontSize={9} fontWeight={700} className={`${FADE} pointer-events-none fill-[#b45309]`}>
            shadow
          </text>
        )}
      </Plane>
    </Scene>
  );
}

// 5b · A figure for screen 5's explanation, no task: the box on the flat
//      road, slot by slot. The 0 × 3 goes to 0; what's left is 3 × the
//      shadow, and the 3 is the road's length.

const X5B_SAY = ["Dot product, জোড়ায় জোড়ায়: রাস্তা (3, 0), ধাক্কা (2, 3)।", "রাস্তার দ্বিতীয় number 0। তাই ওই অংশটা 0।", "বাকি থাকে 3 × shadow।", "আর এই 3 হলো রাস্তার length।"];

export function BoxThree() {
  const s = useScene(3, [500, 1800, 1800, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5B_SAY[k]}</span>}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 font-mono text-lg">
          <span className="text-muted">dot product =</span>
          <span className={`inline-block rounded-md px-1 ${k >= 2 ? "bg-cat-blue/10" : ""}`}>
            <span className="text-cat-blue">3</span> × <span className={k >= 2 ? "rounded bg-[#f59e0b]/25 px-0.5" : ""}>2</span>
          </span>
          <span className={`transition-opacity duration-700 motion-reduce:transition-none ${k >= 1 ? "opacity-35" : ""}`}>
            + <span className={k >= 1 ? "line-through" : ""}>0 × 3</span>
          </span>
          {k >= 1 && <span className={`${POP} inline-block text-sm text-muted`}>(= 0)</span>}
        </div>
        <svg viewBox="0 0 160 30" className="block h-auto w-full max-w-[10rem]" aria-hidden="true">
          <rect x={0.5} y={0.5} width={159} height={29} rx={4} fill="white" stroke="#cbd5e1" strokeWidth={0.6} />
          <path d="M14 18H146" stroke="#2563eb" strokeWidth={2.4} strokeLinecap="round" />
          <path d="M146 18l-6 -3.5v7Z" fill="#2563eb" />
          {k >= 2 && <path d="M14 23H102" stroke="#f59e0b" strokeWidth={4} strokeLinecap="round" opacity={0.85} className={FADE} />}
          {k >= 3 &&
            [0, 1, 2, 3].map((t) => (
              <g key={t} className={POP} style={{ transitionDelay: `${t * 150}ms` }}>
                <path d={`M${14 + t * 44} 9v6`} stroke="#0f1b2d" strokeWidth={1} />
                <text x={14 + t * 44} y={8} textAnchor="middle" fontSize={7} fill="#0f1b2d" fontFamily="ui-monospace, monospace">
                  {t}
                </text>
              </g>
            ))}
        </svg>
      </div>
    </Scene>
  );
}

// 6a · A figure for screen 6's explanation, no task: the (2, 1) road and the
//      push (2, 3); the paper turns until the road is flat; the sun's drop
//      meets the road square (a projection); the van rolls to 3.13 there.

const X6_F = makeFrame(-0.6, 3.7, -0.8, 3.3, 30);
const X6_PHI = deg(BEND); // 26.57°
const X6_W = rot(W_CASE, -X6_PHI); // (3.13, 1.79) on the turned paper
const X6_SAY = [
  "(2, 1) রাস্তা, আর ধাক্কা (2, 3)।",
  "রাস্তা শুয়ে না পড়া পর্যন্ত কাগজটা ঘুরান।",
  "সূর্য w এর মাথা থেকে রাস্তায় দাগ নামায়। দাগটা রাস্তার সাথে right angle এ মেলে। এটাই projection.",
  "দাগটা পড়ে 3.13 এ। ভ্যান ঠিক যেখানে থেমেছিল।",
];

export function SquareDrop() {
  const s = useScene(3, [500, 1600, 2200, 1800]);
  const k = s.k;
  const f = X6_F;
  const [go] = useTween([k >= 3 ? CASE_STOP : 0], 900);
  const foot = [f.sx(X6_W[0]), f.sy(0)];
  const clip = `sq${useId().replace(/:/g, "")}`;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6_SAY[k]}</span>}>
      <Plane f={f} grid={0} axes={false} label="(2, 1) রাস্তা ঘুরিয়ে শোয়ানো; ধাক্কার মাথা থেকে right angle এ দাগ পড়ে 3.13 এ; ভ্যান সেখানেই থামে" className="my-0! max-w-[10.5rem]">
        <defs>
          <clipPath id={clip}>
            <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} rx={3} />
          </clipPath>
        </defs>
        {k >= 2 && (
          <g className={FADE}>
            <Sun f={f} />
          </g>
        )}
        <g clipPath={`url(#${clip})`}>
        <g style={{ transform: `rotate(${k >= 1 ? X6_PHI : 0}deg)`, transformOrigin: `${f.sx(0)}px ${f.sy(0)}px` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${f.sx(i)} ${f.sy(-0.4)}V${f.sy(3.2)}M${f.sx(-0.4)} ${f.sy(i)}H${f.sx(3.4)}`} strokeWidth={0.6} className="stroke-cat-blue/25" />
          ))}
          <Road f={f} v={BEND} from={-0.6} to={4} />
          <Arrow f={f} from={O} to={BEND} tone="blue" w={2.2} faint />
          <Van f={f} v={BEND} s={go} />
          <Arrow f={f} from={O} to={W_CASE} tone="coral" w={2.6} />
        </g>
        </g>
        {k >= 2 && (
          <g className={FADE}>
            <Floor f={f} />
            <Drop f={f} from={X6_W} />
            <path d={`M${foot[0] - 8} ${foot[1]}v-8h8`} strokeWidth={1.2} className="fill-none stroke-[#0f1b2d]" />
          </g>
        )}
        {k >= 3 && (
          <text x={foot[0]} y={foot[1] + 18} textAnchor="middle" fontSize={9.5} fontWeight={700} className={`${FADE} pointer-events-none fill-[#b45309] font-mono`}>
            3.13
          </text>
        )}
      </Plane>
    </Scene>
  );
}

// 6b · A figure for screen 6's explanation, no task: the box is the road's
//      length × the shadow on both roads: 2.24 × 3.13 = 7 here; the first
//      card (4, 3) is 5 long, so its 25 was 5 × 5, and Rina's ÷ 5 took the
//      5 back out.

const X6B_SAY = [
  "(2, 1) রাস্তায়: length × shadow, 2.24 × 3.13 = 7. এটাই dot product.",
  "প্রথম রাস্তার card (4, 3) 5 লম্বা।",
  "তাই ওর dot product ছিল গড়ানোর 5 গুণ: 25 = 5 × 5।",
  "এজন্যই প্রথম রাস্তায় রিনার ÷ 5 মিলে গিয়েছিল।",
];

function X6BCard({ to, tape, on }: { to: XY; tape: string; on: boolean }) {
  const u = 11;
  const [x2, y2] = [8 + to[0] * u, 44 - to[1] * u];
  const l = Math.hypot(to[0], to[1]);
  const [nx, ny] = [(-to[1] / l) * 5, (-to[0] / l) * 5];
  return (
    <svg viewBox="0 0 60 50" className="block h-auto w-14 shrink-0" aria-hidden="true">
      <rect x={0.5} y={0.5} width={59} height={49} rx={4} fill="white" stroke="#cbd5e1" strokeWidth={0.6} />
      <path d={`M8 44L${x2} ${y2}`} stroke="#2563eb" strokeWidth={2} strokeLinecap="round" />
      {on && <Draw d={`M${8 + nx} ${44 + ny}L${x2 + nx} ${y2 + ny}`} strokeWidth={2.4} ms={700} className="stroke-[#f59e0b]" />}
      {on && (
        <text x={(8 + x2) / 2 + nx * 2.6} y={(44 + y2) / 2 + ny * 2.6 + 3} textAnchor="middle" fontSize={8} fontWeight={800} fill="#b45309" fontFamily="ui-monospace, monospace" className={FADE}>
          {tape}
        </text>
      )}
    </svg>
  );
}

export function RinaFive() {
  const s = useScene(3, [500, 2400, 1800, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6B_SAY[k]}</span>}>
      <div className="mx-auto grid w-fit gap-2">
        <div className="flex items-center gap-2">
          <X6BCard to={[2, 1]} tape="2.24" on />
          <div className="font-mono text-[0.95rem]">
            2.24 × 3.13 = <b>7</b>
          </div>
        </div>
        <div className={`flex items-center gap-2 transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>
          <X6BCard to={[4, 3]} tape="5" on={k >= 1} />
          <div className="font-mono text-[0.95rem]">
            {k >= 2 && (
              <span className={FADE}>
                25 = <span className="text-cat-blue">5</span> × 5
              </span>
            )}
            {k >= 3 && (
              <div className={`${POP} mt-0.5 rounded-md bg-accent/10 px-1.5 text-accent-text`}>
                <span className="font-sans text-xs">রিনা </span>25 ÷ 5 = 5
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// 8b · A figure for screen 8's explanation, no task: the same road, the same
//      push; Karim's card is 10 long, so the box says 50 = 10 × 5; divided by
//      the card's length it is the van's 5 again.

const X8_F = makeFrame(-0.6, 8.8, -0.6, 6.9, 16);
const X8_SAY = [
  "একই রাস্তা, একই ধাক্কা (4, 3)। ভ্যান থেমেছিল 5 এ।",
  "করিমের card (8, 6) 10 লম্বা। আগের 5 এর দ্বিগুণ।",
  "Dot product গুণ করে card এর length দিয়ে: 50 = 10 × 5.",
  "Length দিয়ে ভাগ করে দিন: 50 ÷ 10 = 5। এটাই আসল গড়ানো।",
];
const X8_TXT = ["dot product 50", "dot product 50", "50 = 10 × 5", "50 ÷ 10 = 5"];

export function DivideBack() {
  const s = useScene(3, [500, 1800, 2000, 2200]);
  const k = s.k;
  const f = X8_F;
  // the tape runs beside the card, 0.7 squares off to its upper left
  const off: XY = [-0.42, 0.56];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X8_SAY[k]}</span>}>
      <Plane f={f} grid={1} axes={false} label="রাস্তার card (8, 6), 10 লম্বা; ধাক্কা (4, 3); ভ্যান 5 এ; dot product 50, 10 দিয়ে ভাগ করলে 5" className="my-0! max-w-[11rem]">
        <Road f={f} v={LONG} from={-0.6} to={10.5} />
        <Arrow f={f} from={O} to={LONG} tone="blue" w={2.4} />
        <Arrow f={f} from={O} to={ROAD} tone="coral" w={2.6} />
        <Van f={f} v={LONG} s={5} />
        {k >= 1 && (
          <g>
            <Draw d={`M${f.sx(off[0])} ${f.sy(off[1])}L${f.sx(8 + off[0])} ${f.sy(6 + off[1])}`} strokeWidth={3} ms={800} className="stroke-[#f59e0b]" />
            <text x={f.sx(4 + off[0] * 2.4)} y={f.sy(3 + off[1] * 2.4)} textAnchor="middle" fontSize={10} fontWeight={800} className={`${FADE} pointer-events-none fill-[#b45309] font-mono`}>
              10
            </text>
          </g>
        )}
        <text key={k} x={f.sx(-0.3)} y={f.sy(6.3)} fontSize={10.5} fontWeight={700} className={`${FADE} pointer-events-none font-mono ${k >= 3 ? "fill-[#15803d]" : "fill-[#0f1b2d]"}`}>
          {X8_TXT[k]}
        </text>
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names).

export const fixtures: Fixtures = {
  VanStuck: { start: { k: 0 }, end: { k: 5 } },
  VanOut: { end: { k: 3 } },
  StuckBet: { start: {}, q: { q: 0 }, sealed: { q: 0, bet: 1 }, far: { q: 0, bet: 0 }, cant: { q: 0, bet: 2 } },
  RollFour: { start: {}, pushed: { w: [4, 3], pushed: true, log: [[0, 0], [10, 2], [25, 5]] } },
  BendFlags: { start: {}, pushed: { w: [2, 3], flag: 1.5, pushed: true, log: [[1.5, 3.13]] } },
  WhoseRule: { start: {}, wrong: { pick: 1, miss: 1 }, grow: { pick: 2 }, strong: { pick: 2, why: 1, miss: 1 }, flat: { pick: 2, why: 2, miss: 1 }, done: { pick: 2, why: 0 } },
  LongerCard: { start: {}, guessed: { guess: 0 }, pushed: { guess: 0, pushed: true } },
  ShikuFlag: { start: {}, broken: { broken: 0 }, wrong: { broken: 0, div: 0, miss: 1 }, fixed: { broken: 0, div: 2 } },
  PondRope: { start: {}, wrong: { spot: 1, miss: 1 }, out: { spot: 0 } },
  RulesArrive: { samin: { k: 2 }, end: { k: 4 } },
  KarimCard: { start: { k: 0 }, end: { k: 3 } },
  ShikuSure: { end: { k: 3 } },
  RopeBank: { walk: { k: 1 }, end: { k: 3 } },
  MamiWhy: { end: { k: 3 } },
  VanShadow: { start: { k: 0 }, drop: { k: 1 }, end: { k: 3 } },
  BoxThree: { zero: { k: 1 }, end: { k: 3 } },
  SquareDrop: { start: { k: 0 }, drop: { k: 2 }, end: { k: 3 } },
  RinaFive: { first: { k: 1 }, end: { k: 3 } },
  DivideBack: { start: { k: 0 }, end: { k: 3 } },
};
