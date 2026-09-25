"use client";

import { useEffect, useState } from "react";

import { Loop, Bubble, Card as CastCard, Person, Robot, Stage, Stall, StoryFrame, Tree, Building } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Laptop, Nope, Out, POP, Scene, Speech, Ticks, pill, predictLook, primaryBtn, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { INK, INK_SOFT, sg } from "@/components/journey/plane";
import { bn } from "./figure-kit";

// Screens for "Math for AI 3.7 — গ্রামের ফাঁদ, ডাক্তার আপার stall", told as a Journey.
//
// ডাক্তার আপা's "তোমার twin কে?" matches A (172, 68) with the nearest of
// B (190, 69) and C (173, 78). Two volunteers run the same program, one in kg
// and one in grams, and both are right, yet their twins differ. Turning a unit
// dial shows why: the formula prices 1 cm the same as 1 of whatever weight unit
// was typed. A 10 kg gap is big in one crowd and small in another, so the
// reader builds each feature's own yardstick (the spread: gaps from the
// average, squared, averaged, rooted: 10 cm and 12 kg), measures in
// yardsticks (C wins, 0.84 vs 1.80), and sees every unit cancel. Then z-scores
// on a relabelled ruler, the honest caveat (a 5 kg yardstick flips the twin),
// sorting the two "normalise"s apart, and the module's bag of seven lessons.
//
// Tailwind only; the screens have no sheets, the pictures are strips and
// rulers in divs. The <Then> figures (1¼–1¾, 2¼–2½, 3¼–3½, 4½–4¾, 5½, 6½–6¾,
// 7½–7¾, 8¼–8¾, 9½–9¾, 10¼–10¾) play by themselves, watch-only: the
// explanation's own numbers and cast, acted out paragraph by paragraph.

/** a machine number, at most two decimals, no trailing zeros */
const sh = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return r < 0 ? `−${-r}` : `${r}`;
};
/** big numbers get commas, small ones two decimals */
const big = (n: number) => (Math.abs(n) < 100 ? n.toFixed(2) : Math.round(n).toLocaleString("en-US"));

// The stall. Cards run (height cm, weight).
type Two = [number, number];
const PEOPLE: { n: string; v: Two }[] = [
  { n: "A", v: [172, 68] },
  { n: "B", v: [190, 69] },
  { n: "C", v: [173, 78] },
];
const A = PEOPLE[0].v;
const [, B, C] = PEOPLE.map((p) => p.v);
/** distance from A when weight is written in a unit `k` times smaller than kg */
const rawD = (p: Two, k: number) => Math.hypot(p[0] - A[0], (p[1] - A[1]) * k);

const UNITS = [
  { name: "মণ", k: 1 / 37.32, dec: 2 },
  { name: "kg", k: 1, dec: 0 },
  { name: "pound", k: 2.2046, dec: 1 },
  { name: "gram", k: 1000, dec: 0 },
];
const inUnit = (kg: number, u: number) => {
  const { k, dec } = UNITS[u];
  const n = kg * k;
  return n >= 1000 ? Math.round(n).toLocaleString("en-US") : n.toFixed(dec);
};

// The yardsticks from screen 4.
const YARD: Two = [10, 12];
/** distance from A measured in yardsticks */
const yardD = (p: Two, yw = YARD[1]) => Math.hypot((p[0] - A[0]) / YARD[0], (p[1] - A[1]) / yw);

/** Two bars, A→B and A→C, the shorter one in teal. */
function TwinBars({ dB, dC, fmt = big }: { dB: number; dC: number; fmt?: (n: number) => string }) {
  const top = Math.max(dB, dC);
  const twin = dB < dC ? "B" : "C";
  return (
    <div className="mx-auto mt-3 grid max-w-sm gap-2">
      {(
        [
          ["B", dB],
          ["C", dC],
        ] as const
      ).map(([n, d]) => (
        <div key={n} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-sm">
          <span className="text-muted">A থেকে {n}</span>
          <span className="h-3 overflow-hidden rounded-full bg-foreground/5">
            <span
              className={`block h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${n === twin ? "bg-cat-teal" : "bg-foreground/25"}`}
              style={{ width: `${(d / top) * 100}%` }}
            />
          </span>
          <span className="font-mono">{fmt(d)}</span>
        </div>
      ))}
    </div>
  );
}

function PersonCards({ u = 1 }: { u?: number }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {PEOPLE.map((p) => (
        <div key={p.n} className={`rounded-xl border-2 px-1.5 py-2 text-center ${p.n === "A" ? "border-cat-violet/50" : "border-border"}`}>
          <b className="text-lg">{p.n}</b>
          <div className="text-xs text-muted">উচ্চতা (cm)</div>
          <div className="font-mono text-sm">{p.v[0]}</div>
          <div className="text-xs text-muted">ওজন ({UNITS[u].name})</div>
          <div key={u} className={`${FADE} font-mono text-sm`}>
            {inUnit(p.v[1], u)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props for the story scenes (the 1a–9a sections), drawn here because the
// shared cast has none of them: the stall's visitors A, B and C (strangers,
// so not the recurring cast), a laptop, the unit dial, a yardstick, a word tag
// and a দাঁড়িপাল্লা. Fixed ink, like everything on a Stage.

const S_INK = "#0f1b2d";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** Whether the reader asked for less motion; the walking bob stays still then. */
function useStill() {
  const [still, setStill] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser's motion setting, which the server render cannot see
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return still;
}

const S_LOOK = {
  A: { shirt: "#7c3aed", skin: "#d8a47a" },
  B: { shirt: "#475569", skin: "#c68e5f" },
  C: { shirt: "#ea580c", skin: "#e0ac7e" },
};

/**
 * One of the stall's visitors, feet at (x, y), their letter under their feet.
 * `tall` stretches them (B is 190 cm), `wide` fattens them (C is 78 kg). A
 * `ghost` is a dashed stranger with a "?" for a crowd we haven't met.
 */
function S_Visitor({
  who,
  x,
  y,
  tall = 1,
  wide = 1,
  facing = 1,
  walking = false,
  mood = "plain",
  hold = false,
  ghost = false,
  ms = 1400,
}: {
  who: "A" | "B" | "C";
  x: number;
  y: number;
  tall?: number;
  wide?: number;
  facing?: 1 | -1;
  walking?: boolean;
  mood?: "plain" | "puzzled" | "happy";
  hold?: boolean;
  ghost?: boolean;
  ms?: number;
}) {
  const still = useStill();
  const move = walking && !still;
  const run = `${x},${y}`;
  const look = S_LOOK[who];
  const bw = 18 * wide;
  const line = ghost ? { fill: "none", stroke: "#78716c", strokeDasharray: "2.5 2", strokeWidth: 1.2 } : null;
  return (
    <g
      style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }}
      className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none"
    >
      <g transform={`scale(${facing} ${tall})`}>
        <g>
          <Loop on={move} run={run} ms={ms} type="translate" values="0 0;0 -1.5;0 0" dur={0.25} />
          {line ? (
            <>
              <path d="M-3.5 -22V-1M3.5 -22V-1" {...line} />
              <rect x={-bw / 2} y={-40} width={bw} height={20} rx={5} {...line} />
              <circle cy={-51} r={9} {...line} />
            </>
          ) : (
            <>
              {[-1, 1].map((side) => (
                <g key={side}>
                  <Loop on={move} run={run} ms={ms} type="rotate" values={`${side * 20} ${side * 3.5} -22;${-side * 20} ${side * 3.5} -22;${side * 20} ${side * 3.5} -22`} dur={0.5} />
                  <path d={`M${side * 3.5} -22V-1`} strokeWidth={5} strokeLinecap="round" stroke="#1f2937" />
                </g>
              ))}
              <rect x={-bw / 2} y={-40} width={bw} height={20} rx={5} fill={look.shirt} />
              <path d={`M${-bw / 2 + 1} -38l-3 14`} strokeWidth={4} strokeLinecap="round" stroke={look.skin} />
              <path d={hold ? `M${bw / 2 - 1} -37l9 -6` : `M${bw / 2 - 1} -38l3 14`} strokeWidth={4} strokeLinecap="round" stroke={look.skin} />
              <circle cy={-51} r={9} fill={look.skin} />
              <path d="M-9.5 -52q0 -11 9.5 -11t9.5 11q-6 -6 -19 0Z" fill="#292524" />
              <circle cx={-3.4} cy={-51} r={1.2} fill={S_INK} />
              <circle cx={3.4} cy={-51} r={1.2} fill={S_INK} />
              {mood === "puzzled" && <path d="M1 -56l4 -1.5" stroke={S_INK} strokeWidth={1} />}
              <path d={mood === "puzzled" ? "M-3 -45l6 -1" : mood === "happy" ? "M-3 -45.5q3 3 6 0" : "M-2.5 -45h5"} fill="none" stroke={S_INK} strokeWidth={1.2} strokeLinecap="round" />
            </>
          )}
        </g>
      </g>
      {ghost ? (
        <text y={-47 * tall} textAnchor="middle" fontSize={11} fontWeight={800} fill="#57534e">
          ?
        </text>
      ) : (
        <text y={11} textAnchor="middle" fontSize={9} fontWeight={800} fill={look.shirt}>
          {who}
        </text>
      )}
    </g>
  );
}

/** A laptop standing on a counter at (x, y): the lid and its dark screen, lines in green. */
function S_Laptop({ x, y, w = 40, h = 22, lines, fs = 7.5 }: { x: number; y: number; w?: number; h?: number; lines: string[]; fs?: number }) {
  const top = y - h - 3;
  return (
    <g className="pointer-events-none">
      <rect x={x - w / 2} y={top} width={w} height={h} rx={2.5} fill="#1e293b" />
      <rect x={x - w / 2 + 2.5} y={top + 2.5} width={w - 5} height={h - 5} rx={1} fill="#0f172a" />
      <path d={`M${x - w / 2 - 4} ${y}l3 -3H${x + w / 2 + 1}l3 3Z`} fill="#94a3b8" />
      {lines.map((l, i) => (
        <text key={`${i}${l}`} x={x} y={top + 2.5 + (h - 5) / 2 + (i - (lines.length - 1) / 2) * (fs + 2.5) + fs * 0.35} textAnchor="middle" fontSize={fs} fontWeight={700} fontFamily={/[\u0980-\u09FF]/.test(l) ? "inherit" : "ui-monospace, monospace"} fill="#86efac" className={FADE}>
          {l}
        </text>
      ))}
    </g>
  );
}

const S_UNITS = ["মণ", "kg", "pound", "gram"];
const S_DIAL_AT = [-75, -27, 27, 75];

/** The unit dial, centred at (x, y), its pointer on unit `at` (it turns there). */
function S_Dial({ x, y, at, r = 22 }: { x: number; y: number; at: number; r?: number }) {
  return (
    <g className={POP}>
      <circle cx={x} cy={y} r={r} fill="#334155" stroke="#0f172a" strokeWidth={2} />
      {S_DIAL_AT.map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return (
          <g key={a}>
            <path d={`M${x + (r - 5) * Math.sin(rad)} ${y - (r - 5) * Math.cos(rad)}L${x + r * Math.sin(rad)} ${y - r * Math.cos(rad)}`} stroke="white" strokeWidth={1.4} />
            <text x={x + (r + 15) * Math.sin(rad)} y={y - (r + 13) * Math.cos(rad) + 3} textAnchor="middle" fontSize={8.5} fontWeight={i === at ? 800 : 600} fill={i === at ? "#1d4ed8" : "#44403c"}>
              {S_UNITS[i]}
            </text>
          </g>
        );
      })}
      <g style={{ transform: `rotate(${S_DIAL_AT[at]}deg)`, transformOrigin: `${x}px ${y}px` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
        <path d={`M${x} ${y + 4}V${y - r + 6}`} stroke="#fbbf24" strokeWidth={3} strokeLinecap="round" />
      </g>
      <circle cx={x} cy={y} r={4} fill="#fbbf24" />
    </g>
  );
}

/** A yardstick from x to x + w at height y: a striped bar, its name to the left. */
function S_Stick({ x, y, w, label, color = "#0d9488", anchor = "end" }: { x: number; y: number; w: number; label?: string; color?: string; anchor?: "end" | "above" }) {
  return (
    <g className={POP}>
      <rect x={x} y={y - 4} width={w} height={8} rx={1.5} fill="#fef3c7" stroke={color} strokeWidth={1.4} />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M${x + (w * (i + 0.5)) / 5} ${y - 4}v${i === 2 ? 5 : 3}`} stroke={color} strokeWidth={1} />
      ))}
      {label && (
        <text x={anchor === "end" ? x - 5 : x + w / 2} y={anchor === "end" ? y + 3 : y - 8} textAnchor={anchor === "end" ? "end" : "middle"} fontSize={8.5} fontWeight={700} fill={color}>
          {label}
        </text>
      )}
    </g>
  );
}

/** A word on a little signboard, centred at (x, y), with a peg down to what it names. */
function S_Tag({ x, y, text, peg = 0 }: { x: number; y: number; text: string; peg?: number }) {
  const w = text.length * 5.6 + 16;
  return (
    <g className={POP}>
      {peg > 0 && <path d={`M${x} ${y + 9}v${peg}`} stroke="#7c3aed" strokeWidth={1.2} strokeDasharray="2 2" />}
      <rect x={x - w / 2} y={y - 9} width={w} height={18} rx={9} fill="#7c3aed" />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="white">
        {text}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the last afternoon at
//      ডাক্তার আপা's health stall. A, B and C join the crowd, আপা calls the
//      game, then the two laptops on the counter answer, and they disagree.
//      Which laptop is wrong is the widget's question, so the scene stops at
//      the disagreement.

const S1_Y = 150;
const S1_AT = { A: 226, B: 262, C: 298 };
const S1_OFF = 380;

export function TwinStall({}: Story) {
  const s = useScene(5, [600, 1600, 2600, 1300, 1500]);
  const k = s.k;
  const screen = (twin: string) => (k < 3 ? [] : k === 3 ? ["চলছে…"] : ["twin:", twin]);

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="the last afternoon at ডাক্তার আপা's stall: A, B and C join the crowd, and the two laptops on the counter give two different twins">
        <Tree x={16} y={S1_Y} s={0.9} />
        <Stall x={100} y={S1_Y} w={110} sign="তোমার twin কে?" color="#0d9488" />
        <S_Laptop x={76} y={126} lines={screen("C")} />
        <S_Laptop x={124} y={126} lines={screen("B")} />
        <Person who="apa" x={178} y={S1_Y} facing={1} arm={k === 2 ? "wave" : "down"} mood={k >= 5 ? "puzzled" : "happy"} label />
        {k === 2 && <Bubble x={178} y={S1_Y - 66} lines={["উচ্চতা আর ওজন দিন,", "twin খুঁজে দেবো!"]} />}
        {k >= 5 && <Bubble x={178} y={S1_Y - 66} lines={["দুই laptop,", "দুই রকম কথা!"]} />}
        <S_Visitor who="A" x={k >= 1 ? S1_AT.A : S1_OFF} y={S1_Y} facing={-1} walking={k === 1} mood={k >= 4 ? "puzzled" : "plain"} />
        <S_Visitor who="B" x={k >= 1 ? S1_AT.B : S1_OFF + 36} y={S1_Y} tall={1.1} facing={-1} walking={k === 1} />
        <S_Visitor who="C" x={k >= 1 ? S1_AT.C : S1_OFF + 72} y={S1_Y} wide={1.25} facing={-1} walking={k === 1} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · Two laptops, one program. সামিন types weights in kg, তানভীর in grams.
//     Whose program is wrong? Run both: the sums are all right, the twins differ.

const LAPTOPS = [
  { who: "সামিন", file: "kg.csv", k: 1 },
  { who: "তানভীর", file: "gram.csv", k: 1000 },
];
const WRONG_GUESS = ["সামিনের (kg)", "তানভীরের (gram)", "কারোটাই না"];

export function KgVsGram() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed<number[]>("ran", []);
  const both = ran.length === 2;

  const run = (i: number) => {
    if (ran.includes(i)) return;
    const next = [...ran, i];
    setRan(next);
    if (next.length === 2) pass("বদলেছে শুধু ওজনের unit, আর twin।");
  };

  return (
    <>
      <Speech who="ডাক্তার আপা" initial="ডা" tint="teal">
        দুইটা laptop-এ একই program, আর মানুষও সেই একই তিনজন। তাহলে twin দুই রকম আসে কীভাবে? নিশ্চয়ই কারো program-এ ভুল আছে।
      </Speech>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {LAPTOPS.map((l, i) => {
          const on = ran.includes(i);
          const dB = rawD(B, l.k);
          const dC = rawD(C, l.k);
          return (
            <div key={l.file} className="flex flex-col items-center gap-2">
              <div className="text-sm text-muted">{l.who}-এর laptop</div>
              <Laptop file={l.file}>
                {PEOPLE.map((p) => (
                  <Out key={p.n} tone="plain">
                    {p.n} ({p.v[0]}, {(p.v[1] * l.k).toLocaleString("en-US")})
                  </Out>
                ))}
                {on && (
                  <>
                    <Out>A→B {big(dB)}</Out>
                    <Out>A→C {big(dC)}</Out>
                    <Out tone="ok">A-এর twin: {dB < dC ? "B" : "C"}</Out>
                  </>
                )}
              </Laptop>
              {guess !== null && (
                <button type="button" disabled={on} onClick={() => run(i)} className={`${primaryBtn} ${FADE} h-9 px-4 text-sm`}>
                  {on ? "চলেছে" : "চালান"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-sm font-medium text-muted">বলুন তো, কার program-এ ভুল আছে বলে মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {WRONG_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, both, 2)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {both && guess !== null && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
          {guess === 2
            ? "ঠিক ধরেছেন। দুইটা হিসাবই নিখুঁত, তবু দুইটা laptop দুই রকম twin দেখাচ্ছে।"
            : "হিসাবগুলো একবার মিলিয়ে দেখুন, কোথাও ভুল নাই। বর্গ, যোগ, root, সব ঠিকঠাক। তবুও twin আলাদা!"}
        </div>
      )}
      <Task done={both}>আগে বলুন কার ভুল বলে মনে হয়, তারপর দুইটা program-ই চালিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1¼ · A figure for screen 1's explanation, no task: what changed between the
//      two laptops. Their tables side by side: names and heights match cell
//      for cell, only তানভীর's weight column is a thousand times bigger, and
//      under each table its own twin, C and B.

const X1_SIDES = [
  { who: "সামিনের laptop", unit: "kg", k: 1, twin: "C" },
  { who: "তানভীরের laptop", unit: "gram", k: 1000, twin: "B" },
];
const X1_SAY = [
  "একই তিনজন, একই program, দুইটা laptop।",
  "একই তিনজন, একই program, দুইটা laptop।",
  "নাম মিলছে, উচ্চতাও ঘরে ঘরে হুবহু এক।",
  "বদলেছে শুধু একটা column। তানভীর ওজন লিখেছে gram-এ।",
];
const X1_TINT = "transition-colors duration-500 motion-reduce:transition-none";

export function OneChange() {
  const s = useScene(4, [600, 1400, 1700, 2300]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 4 ? X1_SAY[k] : <span className={FADE}>হিসাব দুই জায়গাতেই নিখুঁত। তবু twin দুই রকম।</span>}>
      <div className={`grid grid-cols-2 gap-2 transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>
        {X1_SIDES.map((side, si) => {
          const hot = si === 1 && k >= 3;
          return (
            <div key={side.unit} className="rounded-xl border border-border px-1 py-1.5">
              <div className="text-center text-xs text-muted">{side.who}</div>
              <table className="mx-auto mt-0.5 text-center text-sm tabular-nums">
                <thead>
                  <tr className="text-[0.7rem] text-muted">
                    <th />
                    <th className="px-1.5 font-normal">cm</th>
                    <th className={`px-1.5 ${X1_TINT} ${hot ? "font-semibold text-cat-coral" : "font-normal"}`}>{side.unit}</th>
                  </tr>
                </thead>
                <tbody>
                  {PEOPLE.map((p) => (
                    <tr key={p.n}>
                      <td className="pr-1 font-semibold">{p.n}</td>
                      <td className={`px-1.5 font-mono ${X1_TINT} ${k >= 2 ? "bg-cat-teal/10 text-cat-teal" : ""}`}>{p.v[0]}</td>
                      <td className={`px-1.5 font-mono ${X1_TINT} ${hot ? "bg-cat-coral/15 text-cat-coral" : ""}`}>{(p.v[1] * side.k).toLocaleString("en-US")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-0.5 h-5 text-center text-sm">
                {k >= 4 && (
                  <span className={FADE}>
                    Twin <b className={si === 0 ? "text-cat-teal" : "text-cat-coral"}>{side.twin}</b>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the callback to 3.2's
//      noon at this same stall. A, B and C on a sheet of (height, weight) gaps
//      from A, in kg: C is nearest. Then only the weight cell is multiplied by
//      1000; the sheet stretches upward (the camera pulls back to keep C in
//      view), the height gaps squeeze to nothing, C ends 10,000 away and B
//      1,000, and the nearest string jumps from C to B.

const SC_AX = 26; // A's spot on the sheet
const SC_AY = 134;
/** pixels per unit once the weight cell is multiplied by m: C, 10·m up, stays under the top */
const scPx = (m: number) => Math.min(8, 118 / (10 * m));
const SC_CM = Array.from({ length: 13 }, (_, i) => i * 2);
const SC_KG = Array.from({ length: 16 }, (_, i) => i);

export function GramStretch() {
  const s = useScene(3, [500, 1400, 2800]);
  const k = s.k;
  const [t] = useTween([k >= 2 ? 1 : 0], k >= 2 ? 2400 : 1);
  const m = 1000 ** t;
  const px = scPx(m);
  const at = (p: Two): [number, number] => [SC_AX + (p[0] - A[0]) * px, SC_AY - (p[1] - A[1]) * m * px];
  const dB = rawD(B, m);
  const dC = rawD(C, m);
  const near = dB < dC ? "B" : "C";
  const grid =
    SC_CM.map((c) => `M${SC_AX + c * px} 8V${SC_AY}`).join("") +
    SC_KG.filter((w) => SC_AY - w * m * px > 8)
      .map((w) => `M${SC_AX} ${SC_AY - w * m * px}H230`)
      .join("");
  const unit = t < 0.001 ? "ওজন, kg-তে" : t > 0.999 ? "ওজন, gram-এ" : `ওজন × ${Math.round(m)}`;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "kg-তে লিখলে A-এর সবচেয়ে কাছে C, মাত্র 10 দূরে।"
        ) : k === 2 ? (
          "এবার শুধু ওজনের ঘরটা 1000 দিয়ে গুণ, মানে kg থেকে gram। কাগজটা খাড়া দিকে টানা হচ্ছে।"
        ) : (
          <span className={FADE}>C চলে গেল 10,000 দূরে, আর B মাত্র 1,000। মানুষ একই, অথচ twin এখন B।</span>
        )
      }
    >
      <svg viewBox="0 0 240 150" role="img" aria-label="A, B and C on a sheet of height and weight gaps; multiplying only the weight by 1000 stretches it upward until B is nearer than C" className="mx-auto block h-auto w-full max-w-[14rem]">
        <rect x={6} y={4} width={228} height={142} rx={3} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        <path d={grid} strokeWidth={0.6} className="fill-none stroke-cat-blue/25" />
        <path d={`M${SC_AX} 8V${SC_AY}H230`} strokeWidth={1.2} className="fill-none stroke-[#0f1b2d]/50" />
        <text x={228} y={143} textAnchor="end" fontSize={8.5} className={INK_SOFT}>
          উচ্চতা, cm-এ
        </text>
        <text x={228} y={15} textAnchor="end" fontSize={8.5} className={INK_SOFT}>
          {unit}
        </text>
        {k >= 1 &&
          PAIRS.map(({ n, p }) => {
            const [x, y] = at(p);
            return (
              <line
                key={n}
                x1={SC_AX}
                y1={SC_AY}
                x2={x}
                y2={y}
                strokeWidth={n === near ? 2.6 : 1.5}
                strokeDasharray={n === near ? undefined : "4 3"}
                strokeLinecap="round"
                className={`${FADE} ${n === near ? "stroke-cat-teal" : "stroke-[#94a3b8]"}`}
              />
            );
          })}
        <circle cx={SC_AX} cy={SC_AY} r={4.5} className="fill-cat-violet" />
        <text x={SC_AX - 7} y={SC_AY + 4} textAnchor="end" fontSize={11} fontWeight={700} className="fill-cat-violet">
          A
        </text>
        {PAIRS.map(({ n, p }) => {
          const [x, y] = at(p);
          return (
            <g key={n}>
              <circle cx={x} cy={y} r={4} className={INK} />
              <text x={x + 7} y={y + 4} fontSize={11} fontWeight={700} className={INK}>
                {n}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-center gap-4 text-sm">
        {PAIRS.map(({ n }) => (
          <span key={n} className={n === near && k >= 1 ? "font-semibold text-cat-teal" : "text-muted"}>
            A থেকে {n} <span className="font-mono">{big(n === "B" ? dB : dC)}</span>
          </span>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 1¾ · A story scene for screen 1b's setup (it was screen 1's explanation),
//      no task: the question the journey lives on, left open. A stands between B and C; সামিনের laptop draws a
//      line on the ground from A to C, তানভীরের from A to B, and A is left
//      asking which twin is real, and which laptop to believe.

const X1B_Y = 150;
const X1B_AT = { B: 112, A: 160, C: 208 };
const X1B_DESK = [
  { x: 44, name: "সামিন", twin: "C", color: "#0d9488" },
  { x: 276, name: "তানভীর", twin: "B", color: "#e11d48" },
];

export function WhichTwin({}: Story) {
  const s = useScene(4, [600, 1500, 1600, 2000, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="A stands between B and C; সামিন's laptop says C is A's twin, তানভীর's says B, and A wonders which twin is real and which laptop to believe">
        {X1B_DESK.map((d, i) => (
          <g key={d.name}>
            <rect x={d.x - 28} y={122} width={56} height={4} rx={1} fill="#92400e" />
            <path d={`M${d.x - 23} 126V150M${d.x + 23} 126V150`} stroke="#78350f" strokeWidth={2.5} />
            <S_Laptop x={d.x} y={122} w={50} h={28} lines={k > i ? ["twin", `= ${d.twin}`] : []} />
            {k > i && <rect x={d.x - 20} y={128} width={40} height={3} rx={1.5} fill={d.color} className={FADE} />}
            <text x={d.x} y={162} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={S_INK}>
              {d.name}
            </text>
          </g>
        ))}
        <S_Visitor who="B" x={X1B_AT.B} y={X1B_Y} tall={1.1} />
        <S_Visitor who="A" x={X1B_AT.A} y={X1B_Y} mood={k >= 3 ? "puzzled" : "plain"} />
        <S_Visitor who="C" x={X1B_AT.C} y={X1B_Y} wide={1.25} facing={-1} />
        {k >= 1 && <Draw d={`M${X1B_AT.A + 7} 166Q${(X1B_AT.A + X1B_AT.C) / 2} 181 ${X1B_AT.C - 7} 166`} ms={700} strokeWidth={2.4} className="stroke-[#0d9488]" />}
        {k >= 2 && <Draw d={`M${X1B_AT.A - 7} 166Q${(X1B_AT.A + X1B_AT.B) / 2} 181 ${X1B_AT.B + 7} 166`} ms={700} strokeWidth={2.4} className="stroke-[#e11d48]" />}
        {k === 3 && <Bubble x={X1B_AT.A} y={X1B_Y - 66} tone="think" lines={["আমার আসল twin", "B, না C?"]} />}
        {k >= 4 && <Bubble x={X1B_AT.A} y={X1B_Y - 66} tone="think" lines={["কোন laptop-এর কথা", "বিশ্বাস করবো?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: the many ways to weigh.
//      A sack of ধান goes on the old দাঁড়িপাল্লা against a মণ weight, ডাক্তার
//      আপা holds up a foreign medicine box that says pound, then the four units
//      go onto a dial and it starts to turn. Which twin each unit gives is the
//      widget's.

const S2_Y = 150;

/** the old দাঁড়িপাল্লা, post at x: a sack of ধান on the left pan, a মণ weight on the right */
function S2Balance({ x, loaded }: { x: number; loaded: boolean }) {
  const pans = [x - 34, x + 34];
  return (
    <g className="pointer-events-none">
      <rect x={x - 2} y={S2_Y - 62} width={4} height={62} fill="#78350f" />
      <rect x={x - 12} y={S2_Y - 4} width={24} height={4} rx={1} fill="#78350f" />
      <path d={`M${x - 40} ${S2_Y - 62}H${x + 40}`} stroke="#92400e" strokeWidth={3} strokeLinecap="round" />
      <circle cx={x} cy={S2_Y - 62} r={3} fill="#b45309" />
      {pans.map((px) => (
        <g key={px}>
          <path d={`M${px} ${S2_Y - 62}L${px - 11} ${S2_Y - 34}M${px} ${S2_Y - 62}L${px + 11} ${S2_Y - 34}`} stroke="#a8a29e" strokeWidth={0.9} />
          <path d={`M${px - 14} ${S2_Y - 34}q14 8 28 0Z`} fill="#b45309" />
        </g>
      ))}
      {loaded && (
        <>
          <g className={POP}>
            <path d={`M${pans[0] - 11} ${S2_Y - 35}q-1 -16 4 -22l-2 -4h18l-2 4q5 6 4 22Z`} fill="#d6b98c" stroke="#a16207" strokeWidth={1} />
            <text x={pans[0]} y={S2_Y - 42} textAnchor="middle" fontSize={8} fontWeight={700} fill="#78350f">
              ধান
            </text>
          </g>
          <g className={POP}>
            <path d={`M${pans[1] - 10} ${S2_Y - 35}l3 -16h14l3 16Z`} fill="#44403c" />
            <text x={pans[1]} y={S2_Y - 39} textAnchor="middle" fontSize={8} fontWeight={700} fill="white">
              মণ
            </text>
          </g>
        </>
      )}
    </g>
  );
}

export function WaysToWeigh({}: Story) {
  const s = useScene(5, [600, 1700, 1800, 1500, 1300]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="ways to weigh: a sack of ধান against a মণ weight, a medicine box that says pound, then মণ, kg, pound and gram on a dial that turns">
        <S2Balance x={62} loaded={k >= 1} />
        <Person who="apa" x={156} y={S2_Y} arm={k >= 2 ? "hold" : "down"} mood={k >= 2 ? "happy" : "plain"} label />
        {k >= 2 && (
          <g className={POP}>
            <rect x={170} y={96} width={34} height={22} rx={2} fill="white" stroke="#be123c" strokeWidth={1.2} />
            <path d="M176 103h6M179 100v6" stroke="#be123c" strokeWidth={1.8} />
            <text x={195} y={105} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#be123c">
              Rx
            </text>
            <text x={187} y={114.5} textAnchor="middle" fontSize={7.5} fontWeight={800} fill={S_INK}>
              pound
            </text>
          </g>
        )}
        {k >= 3 && <S_Dial x={256} y={88} r={24} at={k === 3 ? 1 : k === 4 ? 2 : 3} />}
        {k >= 3 && (
          <text x={256} y={132} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#44403c" className={FADE}>
            ওজনের unit
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · The unit dial: মণ, kg, pound, gram. Turn through all four. C, C, B, B: the formula prices 1 cm like 1 of the unit.

export function UnitDial() {
  const pass = useGate();
  const [u, setU] = useSeed("u", 1);
  const [seen, setSeen] = useSeed<number[]>("seen", [1]);
  const { k, name } = UNITS[u];
  const dB = rawD(B, k);
  const dC = rawD(C, k);

  const turn = (i: number) => {
    setU(i);
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (next.length === UNITS.length) pass("Unit বদলালে twin বদলায়।");
  };

  return (
    <>
      <PersonCards u={u} />
      <TwinBars dB={dB} dC={dC} />
      <div key={u} className={`${FADE} mt-2 text-center text-[0.95rem]`}>
        এই হিসাবে উচ্চতার 1 cm পার্থক্য আর ওজনের 1 {name} পার্থক্য, দুইটার দাম সমান। Twin <b>{dB < dC ? "B" : "C"}</b>।
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {UNITS.map((x, i) => (
          <button key={x.name} type="button" aria-pressed={u === i} onClick={() => turn(i)} className={`${pill(u === i)} font-sans`}>
            {x.name}
          </button>
        ))}
      </div>
      <Ticks items={UNITS.map((x, i) => [x.name, seen.includes(i)])} />
      <Task done={seen.length === UNITS.length}>চারটা unit-এই ওজন লিখে দেখুন, twin কে হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2¼ · A figure for screen 2's explanation, no task: the price the formula
//      quietly sets. Its two squared gaps, then a দাঁড়িপাল্লা with 1 cm on
//      one pan and 1 kg on the other, level. Write grams instead: the weight
//      on the right shrinks to a speck, and the beam still doesn't move.

const X2_PAN = [56, 184];
const X2_SAY = [
  "দূরত্বের formula: দুইটা পার্থক্যের বর্গ, তারপর যোগ।",
  "দূরত্বের formula: দুইটা পার্থক্যের বর্গ, তারপর যোগ।",
  "যোগটা চুপচাপ ধরে নিয়েছে, উচ্চতার 1 ঘর আর ওজনের 1 ঘর সমান দামি।",
  "ওজন gram-এ লিখলেও পাল্লা সমান। এবার 1 cm আর 1 gram সমান দামি!",
];

export function EqualPrice() {
  const s = useScene(4, [600, 1600, 2400, 2600]);
  const k = s.k;
  const gram = k >= 3;

  return (
    <Scene scene={s} caption={k < 4 ? X2_SAY[k] : <span className={FADE}>কেউ কাউকে জিজ্ঞেস করেনি। Formula নিজে থেকেই এটা ধরে নিয়েছে।</span>}>
      <div className={`flex flex-wrap items-center justify-center gap-1 text-sm transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>
        <span>দূরত্ব² =</span>
        <span className="rounded-md bg-cat-blue/10 px-1.5 text-cat-blue">(উচ্চতার পার্থক্য)²</span>
        <span>+</span>
        <span className="rounded-md bg-cat-violet/10 px-1.5 text-cat-violet">(ওজনের পার্থক্য)²</span>
      </div>
      <svg viewBox="0 0 240 92" role="img" aria-label="a balance with 1 cm on one pan and 1 kg on the other, level; the kg becomes a tiny gram and the beam stays level" className="mx-auto mt-2 block h-auto w-full max-w-[14rem]">
        <rect x={2} y={2} width={236} height={88} rx={6} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        {k >= 2 && (
          <g className={FADE}>
            <rect x={106} y={83} width={28} height={4} rx={1} fill="#78350f" />
            <path d="M120 84V18" stroke="#78350f" strokeWidth={3} />
            <path d={`M${X2_PAN[0]} 18H${X2_PAN[1]}`} stroke="#92400e" strokeWidth={3} strokeLinecap="round" />
            <circle cx={120} cy={18} r={3.2} fill="#b45309" />
            {X2_PAN.map((px) => (
              <g key={px}>
                <path d={`M${px} 18L${px - 17} 62M${px} 18L${px + 17} 62`} stroke="#a8a29e" strokeWidth={0.9} />
                <path d={`M${px - 21} 62q21 9 42 0Z`} fill="#b45309" />
              </g>
            ))}
            <rect x={X2_PAN[0] - 13} y={40} width={26} height={22} rx={2} fill="#1d4ed8" />
            <text x={X2_PAN[0]} y={55} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="white">
              1 cm
            </text>
            <g style={{ transform: `scale(${gram ? 0.3 : 1})`, transformOrigin: `${X2_PAN[1]}px 62px` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
              <rect x={X2_PAN[1] - 13} y={40} width={26} height={22} rx={2} fill="#7c3aed" />
            </g>
            <text key={gram ? "g" : "kg"} x={X2_PAN[1]} y={gram ? 50 : 55} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={gram ? "#7c3aed" : "white"} className={FADE}>
              {gram ? "1 gram" : "1 kg"}
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the Mars Climate Orbiter
//      side quest. The planned pass, safely high over Mars; one team's pounds
//      read as metric bend the real path low; the orbiter flies it into the
//      air of Mars, and is gone.

type SP = [number, number];
const MM_FROM: SP = [12, 22];
const MM_TO: SP = [288, 22];
const MM_PLAN: SP = [150, 82]; // Bézier handles: the plan passes at y 52,
const MM_REAL: SP = [150, 130]; // the real path at y 76, inside the air
const MM_STARS: SP[] = [
  [34, 62],
  [58, 118],
  [96, 34],
  [206, 16],
  [262, 76],
  [276, 124],
  [226, 104],
  [30, 136],
  [130, 14],
];
/** a point `t` of the way along the curve from MM_FROM to MM_TO pulled by `c` */
const mmAt = (c: SP, t: number): SP => {
  const u = 1 - t;
  return [u * u * MM_FROM[0] + 2 * u * t * c[0] + t * t * MM_TO[0], u * u * MM_FROM[1] + 2 * u * t * c[1] + t * t * MM_TO[1]];
};
const MM_LOW = mmAt(MM_REAL, 0.5);
/** the handle for the real path's first half, up to its lowest point */
const MM_HALF: SP = [(MM_FROM[0] + MM_REAL[0]) / 2, (MM_FROM[1] + MM_REAL[1]) / 2];

export function MarsMiss() {
  const s = useScene(4, [600, 1500, 1700, 2000]);
  const k = s.k;
  const [t] = useTween([k >= 3 ? 0.5 : 0], k >= 3 ? 1800 : 1);
  const [ox, oy] = mmAt(MM_REAL, t);
  const say = [
    "পরিকল্পনা ছিল মঙ্গলের ওপর দিয়ে নিরাপদ উচ্চতায় যাওয়া।",
    "পরিকল্পনা ছিল মঙ্গলের ওপর দিয়ে নিরাপদ উচ্চতায় যাওয়া।",
    "কিন্তু এক দল লিখলো pound-এ, আরেক দল পড়লো metric ধরে। পথ নেমে এলো অনেক নিচে।",
    "Spaceship-টা চললো সেই নিচু পথে, মঙ্গলের বাতাসের একদম ভেতর দিয়ে।",
  ];

  return (
    <Scene scene={s} caption={k < 4 ? say[k] : <span className={FADE}>সংখ্যাগুলো ঠিকই ছিল, শুধু unit মেলেনি। Spaceship-টার আর কোনো খোঁজ পাওয়া যায়নি।</span>}>
      <svg viewBox="0 0 300 146" role="img" aria-label="Mars Climate Orbiter: the planned path passes high over Mars, the real one dips into its air and the craft is lost" className="mx-auto block h-auto w-full max-w-[16rem]">
        <rect x={0} y={0} width={300} height={146} rx={10} strokeWidth={1} className="fill-[#0f1b2d] stroke-[#334155]" />
        {MM_STARS.map(([x, y]) => (
          <circle key={`${x} ${y}`} cx={x} cy={y} r={0.9} className="fill-white/70" />
        ))}
        <circle cx={150} cy={112} r={41} className="fill-[#f59e0b]/15" />
        <circle cx={150} cy={112} r={32} className="fill-[#b4532a]" />
        <text x={150} y={122} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-white/90">
          মঙ্গল
        </text>
        {k >= 1 && (
          <g className={FADE}>
            <path d={`M${MM_FROM} Q${MM_PLAN} ${MM_TO}`} strokeWidth={1.6} strokeDasharray="5 4" className="fill-none stroke-[#5eead4]" />
            <text x={236} y={60} textAnchor="middle" fontSize={9.5} className="fill-[#5eead4]">
              পরিকল্পনার পথ
            </text>
          </g>
        )}
        {k >= 2 && (
          <>
            <Draw d={`M${MM_FROM} Q${MM_HALF} ${MM_LOW}`} ms={900} strokeWidth={2} className="stroke-[#fb923c]" />
            <text x={60} y={86} textAnchor="middle" fontSize={9.5} className={`${FADE} fill-[#fb923c]`}>
              আসল পথ
            </text>
          </>
        )}
        {k < 4 ? (
          <g transform={`translate(${ox} ${oy})`}>
            <rect x={-7} y={-1.5} width={4} height={3} className="fill-[#93c5fd]" />
            <rect x={3} y={-1.5} width={4} height={3} className="fill-[#93c5fd]" />
            <rect x={-3} y={-2.5} width={6} height={5} rx={1} className="fill-[#e2e8f0]" />
          </g>
        ) : (
          <g className={POP}>
            <circle cx={MM_LOW[0]} cy={MM_LOW[1]} r={9} strokeWidth={1.5} className="fill-none stroke-[#fb923c]" />
            <circle cx={MM_LOW[0]} cy={MM_LOW[1]} r={4} className="fill-[#fbbf24]" />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: the easy fix, and why it
//      isn't one. সামিন says "always kg", ডাক্তার আপা asks why cm and kg
//      should be worth the same, then A and C step up with their weights and
//      the 10 kg between them waits for the real question: a lot, or a little?

const S3_Y = 150;
const S3_AT = { samin: 40, apa: 104, A: 206, C: 274 };

export function AlwaysKg({}: Story) {
  const s = useScene(5, [600, 2600, 2800, 1600, 1600]);
  const k = s.k;
  const card = S3_Y - 76;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সামিন says always write kg, ডাক্তার আপা asks why cm and kg should be worth the same, and A and C step up 10 kg apart: is that a lot or a little?">
        <Stall x={156} y={S3_Y} w={68} color="#0d9488" />
        <Person who="samin" x={S3_AT.samin} y={S3_Y} arm={k === 1 ? "wave" : "down"} mood={k === 1 ? "happy" : k >= 2 ? "puzzled" : "plain"} label />
        {k === 1 && <Bubble x={S3_AT.samin} y={S3_Y - 66} side="right" lines={["সবসময় kg-তে লিখবো!"]} />}
        <Person who="apa" x={S3_AT.apa} y={S3_Y} facing={k >= 3 ? 1 : -1} mood={k === 2 ? "puzzled" : "plain"} arm={k >= 4 ? "point" : "down"} label />
        {k === 2 && <Bubble x={S3_AT.apa} y={S3_Y - 66} lines={["cm আর kg সমান দাম", "পাবে কেন?"]} />}
        {k >= 5 && <Bubble x={S3_AT.apa} y={S3_Y - 66} tone="think" lines={["10 kg কি অনেক,", "নাকি অল্প?"]} />}
        <S_Visitor who="A" x={k >= 3 ? S3_AT.A : 360} y={S3_Y} facing={-1} walking={k === 3} hold={k >= 4} />
        <S_Visitor who="C" x={k >= 3 ? S3_AT.C : 400} y={S3_Y} wide={1.25} facing={-1} walking={k === 3} hold={k >= 4} />
        {k >= 4 && (
          <>
            <CastCard x={S3_AT.A} y={card} text="68 kg" />
            <CastCard x={S3_AT.C} y={card} text="78 kg" />
            <g className={FADE}>
              <path d={`M${S3_AT.A} ${card - 14}v-6H${S3_AT.C}v6`} fill="none" stroke="#be123c" strokeWidth={1.4} />
              <text x={(S3_AT.A + S3_AT.C) / 2} y={card - 24} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#be123c">
                10 kg
              </text>
            </g>
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · Two crowds on weight strips. Is a 10 kg gap a lot? In class seven
//     (36–48 kg) yes; from class one to the teachers (18–92 kg) no.

const LO = 10;
const HI = 100;
const at = (kg: number) => `${((kg - LO) / (HI - LO)) * 100}%`;
const CROWDS = [
  { name: "শুধু ক্লাস সেভেন", w: [36, 38, 39, 40, 41, 42, 43, 44, 46, 48], from: 37, right: 0 },
  { name: "ক্লাস ওয়ান থেকে শিক্ষক পর্যন্ত সবাই", w: [18, 24, 31, 38, 45, 53, 60, 68, 79, 92], from: 50, right: 1 },
];
const CALLS = ["অনেক বড় পার্থক্য", "তেমন কিছু না"];
const CROWD_NOPE = [
  "এই দলে প্রায় সবাই 36 থেকে 48 kg-এর মধ্যে। 10 kg মানে তো দলের এক মাথা থেকে প্রায় আরেক মাথা!",
  "এখানে ওজন 18 থেকে 92 kg পর্যন্ত ছড়ানো। পাশাপাশি দুইজনের মাঝেই অনেক সময় এর কাছাকাছি ফাঁক থাকে।",
];

export function TwoCrowds() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<(number | null)[]>("picks", [null, null]);
  const [miss, setMiss] = useSeed<{ c: number; n: number } | null>("miss", null);
  const ok = CROWDS.map((c, i) => picks[i] === c.right);

  const pick = (ci: number, v: number) => {
    if (ok[ci]) return;
    if (v !== CROWDS[ci].right) {
      setMiss({ c: ci, n: (miss?.n ?? 0) + 1 });
      return;
    }
    setMiss(null);
    const next = picks.map((p, i) => (i === ci ? v : p));
    setPicks(next);
    if (next.every((p, i) => p === CROWDS[i].right)) pass("বড় না ছোট, বোঝা যায় group-টা কতটা spread out তা দেখে।");
  };

  return (
    <>
      {CROWDS.map((c, ci) => (
        <div key={c.name} className="mt-4 rounded-2xl border border-border px-3 py-3">
          <div className="text-sm font-semibold">{c.name}</div>
          <div className="relative mx-2 mt-3 h-12">
            <div className="absolute inset-x-0 top-6 h-px bg-foreground/30" />
            <div
              className="absolute top-2 h-8 rounded-md border-x-2 border-cat-coral bg-cat-coral/15"
              style={{ left: at(c.from), width: `${(10 / (HI - LO)) * 100}%` }}
            />
            <div className="absolute top-[-0.6rem] -translate-x-1/2 font-mono text-[0.7rem] text-cat-coral" style={{ left: at(c.from + 5) }}>
              10 kg
            </div>
            {c.w.map((w, i) => (
              <span key={i} className="absolute top-6 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cat-blue" style={{ left: at(w) }} />
            ))}
            {[20, 40, 60, 80, 100].map((t) => (
              <span key={t} className="absolute top-8 -translate-x-1/2 font-mono text-[0.65rem] text-muted" style={{ left: at(t) }}>
                {t}
              </span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CALLS.map((o, i) => (
              <button
                key={o}
                type="button"
                disabled={ok[ci]}
                onClick={() => pick(ci, i)}
                className={`${pill(picks[ci] === i)} font-sans ${ok[ci] && picks[ci] !== i ? "opacity-40" : ""}`}
              >
                {o}
              </button>
            ))}
          </div>
          {miss?.c === ci && <Nope key={miss.n}>{CROWD_NOPE[ci]}</Nope>}
        </div>
      ))}
      <Task done={ok.every(Boolean)}>প্রতিটা দলের জন্য বলুন তো, লাল দাগের 10 kg পার্থক্যটা বড় না ছোট।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3¼ · A figure for screen 3's explanation, no task: the same 10 kg laid on
//      both crowds. Over class seven it covers nearly the whole crowd, one end
//      to the other; along class one to the teachers it has to be laid down
//      more than seven times to get across.

const x3X = (kg: number) => 18 + (kg - 10) * 2.95;
const X3_W10 = x3X(20) - x3X(10);
const X3_ROWS = [
  { y: 42, label: "শুধু ক্লাস সেভেন", w: CROWDS[0].w, on: 1 },
  { y: 100, label: "ক্লাস ওয়ান থেকে শিক্ষক পর্যন্ত সবাই", w: CROWDS[1].w, on: 3 },
];
const X3_SAY = [
  "শুধু ক্লাস সেভেন। সবার ওজন কাছাকাছি।",
  "শুধু ক্লাস সেভেন। সবার ওজন কাছাকাছি।",
  "এখানে 10 kg মানে প্রায় দলের এক মাথা থেকে আরেক মাথা।",
  "এবার ক্লাস ওয়ান থেকে শিক্ষক পর্যন্ত সবাই।",
];

export function TenKgSpan() {
  const s = useScene(4, [600, 1300, 2000, 1400, 3000]);
  const k = s.k;
  const [n] = useTween([k >= 4 ? 7.4 : 0], k >= 4 ? 2600 : 1);

  return (
    <Scene scene={s} caption={k < 4 ? X3_SAY[k] : <span className={FADE}>একই 10 kg এখানে সাতবার বসিয়েও দলটা পার হওয়া যায় না। প্রায় কিছুই না।</span>}>
      <svg viewBox="0 0 300 130" role="img" aria-label="a 10 kg bracket covers class seven's weights end to end, but must be laid more than seven times to cross the whole school's" className="mx-auto block h-auto w-full max-w-[17.5rem]">
        <rect x={2} y={2} width={296} height={126} rx={5} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        {X3_ROWS.map((r) => (
          <g key={r.y}>
            <text x={14} y={r.y - 22} fontSize={9.5} className={INK_SOFT}>
              {r.label}
            </text>
            <path d={`M12 ${r.y}H288`} strokeWidth={1} className="stroke-[#0f1b2d]/35" />
            {k >= r.on &&
              r.w.map((w, j) => (
                <circle key={j} cx={x3X(w)} cy={r.y} r={3} className={`${POP} fill-cat-blue`} style={{ transitionDelay: `${j * 50}ms` }} />
              ))}
          </g>
        ))}
        {k >= 2 && (
          <g className={POP}>
            <rect x={x3X(37)} y={30} width={X3_W10} height={24} rx={2} fill="#e11d48" fillOpacity={0.14} stroke="#e11d48" strokeWidth={1.4} />
            <text x={x3X(42)} y={66} textAnchor="middle" fontSize={9.5} fontWeight={700} className="fill-[#e11d48] font-mono">
              10 kg
            </text>
          </g>
        )}
        {k >= 4 &&
          Array.from({ length: Math.ceil(n) }, (_, i) => {
            const f = Math.min(1, n - i);
            return (
              <g key={i}>
                <rect x={x3X(18 + 10 * i)} y={88} width={X3_W10 * f} height={24} fill="#e11d48" fillOpacity={i % 2 ? 0.07 : 0.16} stroke="#e11d48" strokeWidth={1} />
                {f === 1 && (
                  <text x={x3X(23 + 10 * i)} y={123} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-[#e11d48] font-mono">
                    {i + 1}
                  </text>
                )}
              </g>
            );
          })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: a yardstick made from
//      the data, not bought at the bazaar. The market's 1 kg weight, the same
//      for every crowd, is set aside; each crowd's gaps from its own average
//      are drawn, and they fold into one stick per crowd: short for class
//      seven, long for the whole school.

const X3B_ROWS = [
  { y: 64, label: "ক্লাস সেভেন", w: CROWDS[0].w },
  { y: 112, label: "ক্লাস ওয়ান থেকে শিক্ষক", w: CROWDS[1].w },
].map((r) => {
  const avg = r.w.reduce((a, b) => a + b, 0) / r.w.length;
  const sd = Math.sqrt(r.w.reduce((a, b) => a + (b - avg) ** 2, 0) / r.w.length);
  return { ...r, avg, sd };
});
const X3B_SAY = [
  "বাজারের বাটখারা সব দলের জন্য একই মাপ, দল যেমনই হোক।",
  "বাজারের বাটখারা সব দলের জন্য একই মাপ, দল যেমনই হোক।",
  "তার বদলে data-র দিকে তাকাই। দলটা কতটা ছড়ানো?",
  "Average থেকে প্রত্যেকে কতটা দূরে, সবার পার্থক্য।",
];

export function DataStick() {
  const s = useScene(4, [600, 1800, 1700, 2000, 2200]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 4 ? X3B_SAY[k] : <span className={FADE}>তা থেকেই দলের নিজের scale। ছড়ানো দলে লম্বা, কাছাকাছি দলে ছোট।</span>}>
      <svg viewBox="0 0 300 136" role="img" aria-label="a market's 1 kg weight is set aside; each crowd's gaps from its average fold into its own yardstick, short for class seven and long for the whole school" className="mx-auto block h-auto w-full max-w-[17.5rem]">
        <rect x={2} y={2} width={296} height={132} rx={5} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        {k >= 1 && (
          <g className={`${POP} transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "opacity-45" : ""}`}>
            <path d="M16 34l4 -17h16l4 17Z" fill="#44403c" />
            <path d="M24 17q4 -7 8 0" fill="none" stroke="#44403c" strokeWidth={2} />
            <text x={28} y={30} textAnchor="middle" fontSize={7} fontWeight={700} fill="white">
              1 kg
            </text>
            <text x={48} y={29} fontSize={9.5} className={INK_SOFT}>
              বাজারের বাটখারা, সব দলে একই
            </text>
          </g>
        )}
        {k >= 2 && <Draw d="M12 24H180" ms={500} strokeWidth={1.6} className="stroke-[#e11d48]" />}
        {X3B_ROWS.map((r, ri) => (
          <g key={r.y}>
            <text x={14} y={r.y - 12} fontSize={9.5} className={INK_SOFT}>
              {r.label}
            </text>
            <path d={`M12 ${r.y}H288`} strokeWidth={1} className="stroke-[#0f1b2d]/35" />
            {k >= 2 && (
              <>
                {r.w.map((w, j) => (
                  <circle key={j} cx={x3X(w)} cy={r.y} r={2.6} className={`${POP} fill-cat-blue`} style={{ transitionDelay: `${ri * 300 + j * 40}ms` }} />
                ))}
                <path d={`M${x3X(r.avg)} ${r.y - 6}v12`} strokeWidth={2} className={`${FADE} stroke-cat-violet`} />
              </>
            )}
            {k === 3 &&
              r.w.map((w, j) => {
                const [a, b] = [x3X(r.avg), x3X(w)];
                return <Draw key={j} d={`M${a} ${r.y + 1}Q${(a + b) / 2} ${r.y + 1 + Math.min(20, Math.abs(b - a) * 0.45)} ${b} ${r.y + 1}`} delay={j * 60} ms={400} strokeWidth={1.1} className="stroke-cat-blue" />;
              })}
            {k >= 4 && (
              <g className={POP}>
                <rect x={x3X(r.avg)} y={r.y + 6} width={r.sd * 2.95} height={7} rx={1.5} fill="#fef3c7" stroke="#0d9488" strokeWidth={1.3} />
                <text x={x3X(r.avg) + r.sd * 2.95 + 5} y={r.y + 13} fontSize={9.5} fontWeight={700} fill="#0d9488">
                  scale 
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A figure for screen 3's explanation (the classroom side quest): another
//      class's five heights all sit within 158–162 cm, so the group's normal
//      difference is 2–3 cm and a 170 cm newcomer lands far outside it; the
//      same five's weights spread about 10 kg — each feature's scale comes
//      from its own data.

const x3cH = (cm: number) => 22 + (cm - 156) * 14.2; // 156…174 cm across the sheet
const x3cW = (kg: number) => 22 + (kg - 30) * 9.15; // 30…58 kg
const X3C_HEIGHTS = [160, 162, 161, 159, 158];
const X3C_NEW = 170;
const X3C_WEIGHTS = [39, 42, 45, 47, 49];
const X3C_SAY = [
  "মেলার সেই দল না — আরেকটা class, আরেক দল।",
  "পাঁচজনের height: সবাই 158 থেকে 162-এর মধ্যে।",
  "মাঝখানে 160, মানে সবারই 2–3 cm এদিক-সেদিক।",
  "এবার নতুন কেউ 170 cm নিয়ে এলে? দলের normal range-এর বেশ দূরে।",
];

export function NewStudent() {
  const s = useScene(4, [600, 1600, 2200, 2400, 2400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 4 ? X3C_SAY[k] : <span className={FADE}>আর weight-এ ছড়ানো প্রায় 10 kg। প্রতিটা feature-এর scale তার নিজের data-ই ঠিক করবে।</span>}>
      <svg viewBox="0 0 300 150" role="img" aria-label="another class's five heights sit within 158 to 162 cm, so a 170 cm newcomer lands far outside the 2 to 3 cm normal difference; the same five's weights spread about 10 kg" className="mx-auto block h-auto w-full max-w-[17.5rem]">
        <rect x={2} y={2} width={296} height={146} rx={5} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        <text x={14} y={26} fontSize={9.5} className={INK_SOFT}>
          আরেক class-এর height (cm)
        </text>
        <path d="M12 52H288" strokeWidth={1} className="stroke-[#0f1b2d]/35" />
        {k >= 1 && X3C_HEIGHTS.map((h, j) => <circle key={h} cx={x3cH(h)} cy={52} r={3} className={`${POP} fill-cat-blue`} style={{ transitionDelay: `${j * 50}ms` }} />)}
        {k >= 2 && (
          <g className={POP}>
            <rect x={x3cH(158)} y={42} width={x3cH(162) - x3cH(158)} height={20} rx={2} fill="#fef3c7" stroke="#0d9488" strokeWidth={1.3} />
            <text x={(x3cH(158) + x3cH(162)) / 2} y={72} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#0d9488" className="font-mono">
              2–3 cm
            </text>
          </g>
        )}
        {k >= 3 && (
          <>
            <path d={`M${x3cH(163)} 52H${x3cH(169)}`} strokeDasharray="4 3" strokeWidth={1.2} className={`${FADE} fill-none stroke-[#e11d48]`} />
            <circle cx={x3cH(X3C_NEW)} cy={52} r={3.6} className={`${POP} fill-[#e11d48]`} />
            <text x={x3cH(X3C_NEW)} y={38} textAnchor="middle" fontSize={9.5} fontWeight={700} className={`${POP} fill-[#e11d48] font-mono`}>
              170 cm
            </text>
          </>
        )}
        <text x={14} y={100} fontSize={9.5} className={INK_SOFT}>
          একই পাঁচজনের weight (kg)
        </text>
        <path d="M12 126H288" strokeWidth={1} className="stroke-[#0f1b2d]/35" />
        {k >= 4 && (
          <>
            {X3C_WEIGHTS.map((w, j) => (
              <circle key={w} cx={x3cW(w)} cy={126} r={3} className={`${POP} fill-cat-blue`} style={{ transitionDelay: `${j * 50}ms` }} />
            ))}
            <rect x={x3cW(39)} y={116} width={x3cW(49) - x3cW(39)} height={20} rx={2} fill="#fef3c7" stroke="#0d9488" strokeWidth={1.3} />
            <text x={x3cW(49) + 6} y={130} fontSize={9.5} fontWeight={700} fill="#0d9488" className={`${POP} font-mono`}>
              ≈ 10 kg
            </text>
          </>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: the school's five walk in,
//      each as tall as their card says, hold up their heights, and the five
//      cards fly into one column of a table: not one person's card any more,
//      everyone's height together. The spread is the widget's to find.

const S4_Y = 150;
const S4_KIDS: { who: "samin" | "rina" | "fahim" | "som" | "nasib"; h: number; x: number }[] = [
  { who: "samin", h: 155, x: 26 },
  { who: "rina", h: 165, x: 76 },
  { who: "fahim", h: 170, x: 126 },
  { who: "som", h: 175, x: 176 },
  { who: "nasib", h: 185, x: 226 },
];
const S4_COL_X = 284;
const S4_ROW = (i: number) => 58 + i * 17;

export function FiveHeights({}: Story) {
  const s = useScene(4, [600, 1900, 1600, 1600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="the school's five walk in and hold up their heights, 155 to 185 cm, and the cards fly into one column of a table">
        <Building x={4} y={S4_Y} w={150} h={70} color="#fde68a" />
        {k >= 3 && (
          <g className={FADE}>
            <rect x={S4_COL_X - 25} y={32} width={50} height={110} rx={4} fill="white" stroke={k >= 4 ? "#1d4ed8" : "#cbd5e1"} strokeWidth={k >= 4 ? 2 : 1} />
            <text x={S4_COL_X} y={45} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#44403c">
              উচ্চতা
            </text>
          </g>
        )}
        {k >= 4 && (
          <text x={S4_COL_X} y={160} textAnchor="middle" fontSize={9} fontWeight={800} fill="#1d4ed8" className={FADE}>
            একটা column
          </text>
        )}
        {S4_KIDS.map((c, i) => {
          const sc = c.h / 170;
          const [cx, cy] = k >= 3 ? [S4_COL_X, S4_ROW(i)] : [c.x, S4_Y - 63 * sc - 14];
          return (
            <g key={c.who}>
              <Person who={c.who} x={k >= 1 ? c.x : -40 - (4 - i) * 40} y={S4_Y} scale={sc} walking={k === 1} ms={1600} arm={k === 2 ? "hold" : "down"} label={k >= 2} />
              {k >= 2 && (
                <g style={{ transform: `translate(${cx}px, ${cy}px)`, transitionDelay: `${i * 120}ms` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
                  <CastCard x={0} y={0} text={`${c.h}`} tone="blue" />
                </g>
              )}
            </g>
          );
        })}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · The spread machine, one COLUMN at a time. Average, gaps from it, squares,
//     the average of the squares, root: heights 10 cm, then weights 12 kg.
//     (The same number as ‖gaps‖ ÷ √5, without ever showing √5.)

const FIVE = [
  { n: "সামিন", v: [155, 52] },
  { n: "রিনা", v: [165, 64] },
  { n: "ফাহিম", v: [170, 70] },
  { n: "সোম", v: [175, 76] },
  { n: "নাসিব", v: [185, 88] },
];
const COLS = [
  { k: "উচ্চতা", of: "উচ্চতার", unit: "cm" },
  { k: "ওজন", of: "ওজনের", unit: "kg" },
];
const STAGES = ["Average বের করুন", "Average থেকে পার্থক্য", "পার্থক্যের বর্গ", "বর্গের average", "Root নিন"];

function spreadOf(c: number) {
  const vals = FIVE.map((s) => s.v[c]);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const gaps = vals.map((x) => x - avg);
  const sq = gaps.map((g) => g * g);
  const meanSq = sq.reduce((a, b) => a + b, 0) / sq.length;
  return { avg, gaps, sq, meanSq, root: Math.sqrt(meanSq) };
}
const SPREADS = [spreadOf(0), spreadOf(1)];

export function SpreadMachine() {
  const pass = useGate();
  const [stages, setStages] = useSeed<number[]>("stages", [0, 0]);
  const col = stages[0] < 5 ? 0 : 1;
  const st = stages[col];
  const s = SPREADS[col];
  const all = stages[1] === 5;

  const step = () => {
    const next = col === 0 ? [st + 1, 0] : [5, st + 1];
    setStages(next);
    if (next[1] === 5) pass("scale : উচ্চতায় 10 cm, ওজনে 12 kg।");
  };

  const cell = (c: number) => `px-2 py-0.5 ${c === col && !all ? "bg-cat-blue/10" : ""}`;

  return (
    <>
      <div className="mt-4 overflow-x-auto">
        <table className="mx-auto text-center font-mono text-sm tabular-nums">
          <thead>
            <tr className="font-sans text-xs text-muted">
              <th className="px-2 pb-1 font-normal">নাম</th>
              {COLS.map((c, i) => (
                <th key={c.k} className={`${cell(i)} pb-1 font-normal`}>
                  {c.k} ({c.unit})
                </th>
              ))}
              {st >= 2 && !all && <th className={`${FADE} px-2 pb-1 font-normal`}>পার্থক্য</th>}
              {st >= 3 && !all && <th className={`${FADE} px-2 pb-1 font-normal`}>বর্গ</th>}
            </tr>
          </thead>
          <tbody>
            {FIVE.map((p, r) => (
              <tr key={p.n}>
                <td className="px-2 py-0.5 font-sans">{p.n}</td>
                {COLS.map((c, i) => (
                  <td key={c.k} className={cell(i)}>
                    {p.v[i]}
                  </td>
                ))}
                {st >= 2 && !all && <td className={`${FADE} px-2 text-cat-blue`}>{sh(s.gaps[r])}</td>}
                {st >= 3 && !all && <td className={`${FADE} px-2 text-cat-violet`}>{sh(s.sq[r])}</td>}
              </tr>
            ))}
            <tr className="border-t border-border font-sans text-xs">
              <td className="px-2 pt-1 text-muted">scale </td>
              {COLS.map((c, i) => (
                <td key={c.k} className="px-2 pt-1 font-mono text-sm font-bold text-cat-teal">
                  {stages[i] === 5 && (
                    <span className={`${POP} inline-block`}>
                      {sh(SPREADS[i].root)} {c.unit}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className={FADE}>
        {!all && (
          <div className="mt-3 min-h-16 space-y-0.5 text-center font-mono text-[0.95rem]">
            <div className="font-sans text-sm text-muted">এখন মেশিনে: {COLS[col].of} column</div>
            {st >= 1 && <div className={FADE}>Average = {sh(s.avg)}</div>}
            {st >= 4 && (
              <div className={`${FADE} text-sm`}>
                বর্গের average = ({s.sq.map(sh).join(" + ")}) ÷ 5 = {sh(s.meanSq)}
              </div>
            )}
            {st >= 5 && (
              <div className={`${FADE} font-bold text-cat-teal`}>
                √{sh(s.meanSq)} = {sh(s.root)} {COLS[col].unit}
              </div>
            )}
          </div>
        )}
        {stages[0] === 5 && (
          <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>
            উচ্চতায় স্বাভাবিক পার্থক্য 10 cm। {col === 1 && st === 0 && "এবার ওজনের column-টাও একই মেশিনে দিয়ে দেখুন।"}
          </div>
        )}
        {!all && (
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={step} className={primaryBtn}>
              {bn(st + 1)} · {STAGES[st]}
            </button>
          </div>
        )}
      </div>
      <Ticks
        items={[
          ["উচ্চতার scale ", stages[0] === 5],
          ["ওজনের scale ", all],
        ]}
      />
      <Task done={all}>উচ্চতা আর ওজন, দুইটা column-ই মেশিনে step by step চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: why square first? The five
//      height gaps from 170 (−15, −5, 0, 5, 15). Added straight, the walks left
//      and right cancel to 0, as if nobody were away from the average. Squared,
//      every one is a positive square, 500 in all; ÷ 5 and root give 10 cm.

const SC_GAPS = FIVE.map((p) => p.v[0] - 170);
/** the straight sum as a walk: two steps left on the top lane, two back on the bottom one */
const SC_WALK: { from: number; to: number; y: number }[] = [
  { from: 0, to: -15, y: 8 },
  { from: -15, to: -20, y: 8 },
  { from: -20, to: -15, y: 22 },
  { from: -15, to: 0, y: 22 },
];
const scWx = (g: number) => 150 + g * 6;
const scSign = (g: number) => (g > 0 ? `+${g}` : sh(g));

export function WhySquare() {
  const s = useScene(4, [500, 1400, 2200, 1800]);
  const k = s.k;
  const say = [
    "প্রত্যেকে average 170 cm থেকে কতটা দূরে, আর কোন দিকে।",
    "প্রত্যেকে average 170 cm থেকে কতটা দূরে, আর কোন দিকে।",
    "সোজা যোগ করলে বামে যাওয়া আর ডানে ফেরা কাটাকাটি হয়ে যায়। মোট শূন্য!",
    "বর্গ করলে minus চিহ্ন উধাও, প্রতিটা পার্থক্য এখন একটা বর্গ।",
  ];

  return (
    <Scene scene={s} caption={k < 4 ? say[k] : <span className={FADE}>বর্গের average 100, root নিয়ে আবার cm-এ ফেরা: স্বাভাবিক পার্থক্য 10 cm।</span>}>
      <div className="mx-auto grid h-10 max-w-xs grid-cols-5 text-center">
        {SC_GAPS.map((g, i) => (
          <div key={FIVE[i].n}>
            {k >= 1 && (
              <div className={FADE} style={{ transitionDelay: `${i * 120}ms` }}>
                <div className={`font-mono text-sm font-semibold ${g < 0 ? "text-cat-coral" : g > 0 ? "text-cat-blue" : ""}`}>{scSign(g)}</div>
                <div className="text-[0.65rem] text-muted">{FIVE[i].n}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-2 grid max-w-xs grid-cols-[4.2rem_1fr_3.2rem] items-center gap-1">
        <span className="text-xs text-muted">সোজা যোগ</span>
        <svg viewBox="0 0 170 30" aria-hidden="true" className="h-8 w-full">
          <path d={`M${scWx(0)} 1V29`} strokeWidth={1} strokeDasharray="2 2" className="fill-none stroke-foreground/30" />
          {k >= 2 &&
            SC_WALK.map((w, i) => {
              const x1 = scWx(w.from);
              const x2 = scWx(w.to);
              const d = Math.sign(x2 - x1);
              return (
                <Draw
                  key={i}
                  d={`M${x1} ${w.y}H${x2}M${x2} ${w.y}l${-4 * d} -3M${x2} ${w.y}l${-4 * d} 3`}
                  delay={i * 380}
                  ms={380}
                  strokeWidth={2}
                  className={d < 0 ? "stroke-cat-coral" : "stroke-cat-blue"}
                />
              );
            })}
        </svg>
        <span className="font-mono font-bold text-danger">{k >= 2 && <span className={`${FADE} delay-1000`}>= 0</span>}</span>
        <span className="text-xs text-muted">বর্গ করে যোগ</span>
        <svg viewBox="0 0 170 44" aria-hidden="true" className="h-11 w-full fill-current text-foreground">
          <path d="M0 42.5H170" strokeWidth={0.8} className="stroke-foreground/30" />
          {k >= 3 &&
            SC_GAPS.map((g, i) => {
              const side = Math.abs(g) * 2.4;
              const cx = 17 + i * 34;
              return (
                <g key={i} className={POP} style={{ transitionDelay: `${i * 150}ms` }}>
                  {side > 0 ? (
                    <rect x={cx - side / 2} y={42 - side} width={side} height={side} strokeWidth={1.2} className="fill-cat-violet/15 stroke-cat-violet" />
                  ) : (
                    <circle cx={cx} cy={42} r={1.8} className="fill-cat-violet" />
                  )}
                  <text x={cx} y={27} textAnchor="middle" fontSize={9} fontWeight={600} className="font-mono">
                    {g * g}
                  </text>
                </g>
              );
            })}
        </svg>
        <span className="font-mono font-bold text-cat-violet">{k >= 3 && <span className={`${FADE} delay-700`}>= 500</span>}</span>
      </div>
      <div className="mt-2 h-6 text-center font-mono text-[0.95rem]">
        {k >= 4 && (
          <span className={FADE}>
            500 ÷ 5 = 100, √100 = <b className="text-cat-teal">10 cm</b>
          </span>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4⅝ · A figure for screen 4's explanation, no task: the spread is a length
//      in disguise. The five gaps as one column; square, add, root gives its
//      length, √500 ≈ 22.4; the average in place of the sum gives the
//      yardstick, 10. Copy the five a hundred times, 500 people: the length
//      swells to 224, the yardstick stays 10.

const X4_TOP = Math.sqrt(50000);
const X4_SAY = [
  "Average থেকে পাঁচজনের পার্থক্য, একটা column।",
  "Average থেকে পাঁচজনের পার্থক্য, একটা column।",
  "বর্গ, যোগ, root: এ তো এই column-এর length, ‖v‖।",
  "যোগের জায়গায় average নিলে পাই scale , 10।",
];

export function LengthVsSpread() {
  const s = useScene(4, [600, 1500, 2200, 2400]);
  const k = s.k;
  const many = k >= 4;
  const [lw, sw] = useTween([k >= 2 ? Math.sqrt(many ? 50000 : 500) : 0, k >= 3 ? 10 : 0], 1300);
  const rows = [
    { name: "length ‖v‖", on: k >= 2, f: many ? "√50,000 ≈ 224" : "√500 ≈ 22.4", w: lw, bar: "bg-cat-violet" },
    { name: "scale ", on: k >= 3, f: many ? "√(50,000 ÷ 500) = 10" : "√(500 ÷ 5) = 10", w: sw, bar: "bg-cat-teal" },
  ];

  return (
    <Scene scene={s} caption={k < 4 ? X4_SAY[k] : <span className={FADE}>পাঁচশো জন হলে length ফুলেফেঁপে হয়ে ওঠে 224, অথচ scale  সেই 10-ই।</span>}>
      <div className="mx-auto flex max-w-sm items-center gap-4">
        <div className={`shrink-0 text-center transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>
          <div className="rounded-md border-x-2 border-foreground/50 px-2 font-mono text-sm leading-5">
            {SC_GAPS.map((g, i) => (
              <div key={i}>{sg(g)}</div>
            ))}
          </div>
          <div className="mt-1 h-4 text-xs whitespace-nowrap text-muted">{many && <span className={FADE}>× ১০০, ৫০০ জন</span>}</div>
        </div>
        <div className="grid min-w-0 flex-1 gap-4">
          {rows.map((r) => (
            <div key={r.name} className={`transition-opacity duration-500 motion-reduce:transition-none ${r.on ? "" : "opacity-0"}`}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-muted">{r.name}</span>
                <span key={r.f} className={`${FADE} font-mono`}>
                  {r.f}
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-foreground/5">
                <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${(r.w / X4_TOP) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's explanation, no task: the two yardsticks, and
//      their name. The five heights and weights on two lines at one scale,
//      the average marked; a 10 cm stick from the average, then a 12 kg one,
//      and last the name, standard deviation.

const x4bX = (v: number, lo: number) => 18 + (v - lo) * 5.5;
const X4B_ROWS = [
  { y: 38, label: "উচ্চতা, cm", lo: 146, i: 0, avg: 170, sd: 10, unit: "cm", ticks: [150, 170, 190], on: 2 },
  { y: 92, label: "ওজন, kg", lo: 48, i: 1, avg: 70, sd: 12, unit: "kg", ticks: [50, 70, 90], on: 3 },
];
const X4B_SAY = ["পাঁচজনের উচ্চতা আর ওজন। বেগুনি দাগে average।", "পাঁচজনের উচ্চতা আর ওজন। বেগুনি দাগে average।", "উচ্চতায় স্বাভাবিক পার্থক্য 10 cm।", "ওজনে 12 kg।"];

export function TwoSticks() {
  const s = useScene(4, [600, 1500, 1800, 1800, 2000]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k < 4 ? (
          X4B_SAY[k]
        ) : (
          <span className={FADE}>
            এই scale র একটা বিখ্যাত নাম আছে: <b className="text-foreground">standard deviation</b>।
          </span>
        )
      }
    >
      <svg viewBox="0 0 300 112" role="img" aria-label="the five heights and weights on two lines; a 10 cm yardstick from the height average and a 12 kg one from the weight average: the standard deviation" className="mx-auto block h-auto w-full max-w-[17.5rem]">
        <rect x={2} y={2} width={296} height={108} rx={5} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        {X4B_ROWS.map((r) => {
          const ax = x4bX(r.avg, r.lo);
          return (
            <g key={r.y}>
              <text x={14} y={r.y - 22} fontSize={9.5} className={INK_SOFT}>
                {r.label}
              </text>
              <path d={`M12 ${r.y}H288`} strokeWidth={1} className="stroke-[#0f1b2d]/35" />
              {r.ticks.map((t) => (
                <text key={t} x={x4bX(t, r.lo)} y={r.y + 13} textAnchor="middle" fontSize={8.5} className={`${INK_SOFT} font-mono`}>
                  {t}
                </text>
              ))}
              {k >= 1 && (
                <>
                  <path d={`M${ax} ${r.y - 6}v12`} strokeWidth={2} className={`${FADE} stroke-cat-violet`} />
                  {FIVE.map((p, j) => (
                    <circle key={p.n} cx={x4bX(p.v[r.i], r.lo)} cy={r.y} r={3} className={`${POP} fill-cat-blue`} style={{ transitionDelay: `${j * 60}ms` }} />
                  ))}
                </>
              )}
              {k >= r.on && (
                <g className={POP}>
                  <rect x={ax} y={r.y - 16} width={r.sd * 5.5} height={7} rx={1.5} fill="#fef3c7" stroke="#0d9488" strokeWidth={1.3} />
                  <text x={ax + r.sd * 5.5 + 5} y={r.y - 9.5} fontSize={10} fontWeight={700} className="fill-[#0d9488] font-mono">
                    {r.sd} {r.unit}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: back to A, B and C with the
//      two yardsticks in hand. The sticks come out, the three walk back with
//      their cards, and ডাক্তার আপা asks how many yardsticks each gap is. The
//      count, and so the twin, is the widget's.

const S5_Y = 150;
const S5_AT = { apa: 34, A: 146, B: 210, C: 274 };

export function BackToABC({}: Story) {
  const s = useScene(4, [600, 1600, 1700, 1400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="two yardsticks, 10 cm and 12 kg; A, B and C walk back with their cards, and ডাক্তার আপা asks how many yardsticks each gap is">
        {k >= 1 && (
          <>
            <S_Stick x={184} y={20} w={72} label="উচ্চতার scale  10 cm" color="#1d4ed8" />
            <S_Stick x={184} y={36} w={86} label="ওজনের scale  12 kg" />
          </>
        )}
        <Person who="apa" x={S5_AT.apa} y={S5_Y} arm={k === 1 ? "wave" : k >= 4 ? "point" : "down"} mood={k >= 4 ? "puzzled" : "happy"} label />
        {k >= 4 && <Bubble x={S5_AT.apa} y={S5_Y - 66} side="right" lines={["পার্থক্যটা কয়টা", "scale র সমান?"]} />}
        <S_Visitor who="A" x={k >= 2 ? S5_AT.A : 360} y={S5_Y} facing={-1} walking={k === 2} hold={k >= 3} />
        <S_Visitor who="B" x={k >= 2 ? S5_AT.B : 400} y={S5_Y} tall={1.1} facing={-1} walking={k === 2} hold={k >= 3} />
        <S_Visitor who="C" x={k >= 2 ? S5_AT.C : 440} y={S5_Y} wide={1.25} facing={-1} walking={k === 2} hold={k >= 3} />
        {k >= 3 && (
          <>
            <CastCard x={S5_AT.A} y={S5_Y - 77} text="(172, 68)" tone="blue" />
            <CastCard x={S5_AT.B} y={S5_Y - 83} text="(190, 69)" tone="blue" />
            <CastCard x={S5_AT.C} y={S5_Y - 77} text="(173, 78)" tone="blue" />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · Measure in yardsticks. Each gap from A becomes "how many yardsticks",
//     then the distance: B 1.80, C 0.84. C is the twin.

const PAIRS = [
  { n: "B", p: B },
  { n: "C", p: C },
];
const FEAT = [
  { of: "উচ্চতার", unit: "cm" },
  { of: "ওজনের", unit: "kg" },
];

/** a gap drawn against two yardsticks, with a tick where one ends */
function YardBar({ x }: { x: number }) {
  return (
    <span className="relative mt-1 block h-2.5 overflow-hidden rounded-full bg-foreground/5">
      <span className="absolute inset-y-0 left-0 rounded-full bg-cat-blue transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${Math.min(x / 2, 1) * 100}%` }} />
      <span className="absolute inset-y-0 left-1/2 w-0.5 bg-foreground/40" />
    </span>
  );
}

export function Yardstick() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [conv, setConv] = useSeed<string[]>("conv", []);
  const [measured, setMeasured] = useSeed("measured", false);
  const allConv = conv.length === 4;

  const convert = (key: string) => {
    if (!conv.includes(key)) setConv([...conv, key]);
  };
  const measure = () => {
    setMeasured(true);
    pass("scale এ মাপলে twin C।");
  };

  return (
    <>
      <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-2">
        {PEOPLE.map(({ n, v: [h, w] }) => (
          <div key={n} className="rounded-xl border border-border px-2 py-1.5 text-center">
            <span className="text-sm font-semibold">{n}</span>
            <span className="mt-0.5 block font-mono text-xs leading-tight text-muted">{h} cm</span>
            <span className="block font-mono text-xs leading-tight text-muted">{w} kg</span>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-2 flex max-w-sm justify-center gap-2 text-sm">
        <span className="rounded-full bg-cat-teal/10 px-3 py-1 text-cat-teal">উচ্চতার scale  10 cm</span>
        <span className="rounded-full bg-cat-teal/10 px-3 py-1 text-cat-teal">ওজনের scale  12 kg</span>
      </div>
      <div className="mt-4 text-sm font-medium text-muted">প্রতিটা পার্থক্য নিজের scale এ মাপলে A-এর twin কে হবে?</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {["B", "C"].map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, measured, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={`${FADE} mt-4 grid gap-3`}>
          {PAIRS.map(({ n, p }) => {
            const d = yardD(p);
            const win = measured && n === "C";
            return (
              <div key={n} className={`rounded-2xl border-2 px-3 py-2.5 transition-colors motion-reduce:transition-none ${win ? "border-cat-teal/50 bg-cat-teal/5" : "border-border"}`}>
                <div className="text-sm font-semibold">A থেকে {n}</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {FEAT.map((f, i) => {
                    const key = `${n}${i}`;
                    const gap = Math.abs(p[i] - A[i]);
                    const on = conv.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={on}
                        onClick={() => convert(key)}
                        className={`cursor-pointer rounded-xl border-2 px-2 py-1.5 text-left transition-colors motion-reduce:transition-none disabled:cursor-default ${
                          on ? "border-cat-blue/30" : "border-dashed border-border hover:border-cat-blue/60"
                        }`}
                      >
                        <span className="block text-xs text-muted">
                          {f.of} পার্থক্য {gap} {f.unit}
                        </span>
                        {on ? (
                          <span className={`${FADE} block font-mono text-sm`}>
                            {gap} ÷ {YARD[i]} ≈ <b>{sh(gap / YARD[i])}</b>
                            <YardBar x={gap / YARD[i]} />
                          </span>
                        ) : (
                          <span className="block text-xs text-cat-blue">scale এ মাপুন</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {measured && (
                  <div className={`${FADE} mt-2 text-center font-mono`}>
                    √({sh((p[0] - A[0]) / YARD[0])}² + {sh((p[1] - A[1]) / YARD[1])}²) ≈ <b className={win ? "text-cat-teal" : ""}>{d.toFixed(2)}</b>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {allConv && !measured && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={measure} className={primaryBtn}>
            দূরত্ব মাপুন
          </button>
        </div>
      )}
      {measured && guess !== null && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
          {guess === 1 ? "ঠিক ধরেছেন, twin C।" : "উঁহু, এবার twin C। B-এর 18 cm শুনতে ছোট, কিন্তু উচ্চতার scale এ সেটা প্রায় দুই ধাপ।"} আর খেয়াল করেছেন, এই সংখ্যাগুলোর পাশে কোনো unit নাই?
        </div>
      )}
      <Task done={measured}>আগে একটা guess করুন। তারপর চারটা পার্থক্যই scale এ মেপে দূরত্ব বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: laying the sticks down.
//      B's 18 cm gap and C's 10 kg gap as bars; the 10 cm yardstick goes
//      along B's twice, nearly two steps, and the 12 kg one overshoots C's,
//      not even one. So the twin is C.

const X5_U = 8; // px per cm, and per kg
const X5_X0 = 16;
const X5_ROWS = [
  { y: 30, label: "B-এর উচ্চতার পার্থক্য, 18 cm", gap: 18, stick: 10, n: 2, steps: "1.8", fill: "#1d4ed8", on: 2 },
  { y: 88, label: "C-এর ওজনের পার্থক্য, 10 kg", gap: 10, stick: 12, n: 1, steps: "0.83", fill: "#7c3aed", on: 3 },
];
const X5_SAY = [
  "18 cm শুনতে তেমন কিছু না, আর 10 kg শুনতে বড়।",
  "18 cm শুনতে তেমন কিছু না, আর 10 kg শুনতে বড়।",
  "উচ্চতার scale  10 cm। B-এর 18 cm প্রায় দুই ধাপ।",
  "ওজনের scale  12 kg। C-এর 10 kg এক ধাপও না।",
];

export function StickSteps() {
  const s = useScene(4, [600, 1500, 2300, 2300, 2000]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 4 ? X5_SAY[k] : <span className={FADE}>B সত্যিই অনেকটা লম্বা, C তেমন ভারী না। তাই twin C।</span>}>
      <svg viewBox="0 0 300 118" role="img" aria-label="B's 18 cm gap is nearly two 10 cm yardsticks, C's 10 kg gap is less than one 12 kg yardstick" className="mx-auto block h-auto w-full max-w-[17.5rem]">
        <rect x={2} y={2} width={296} height={114} rx={5} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        {X5_ROWS.map((r) => {
          const end = X5_X0 + r.gap * X5_U;
          const win = k >= 4 && r.gap === 10;
          return (
            <g key={r.y}>
              <text x={X5_X0} y={r.y - 12} fontSize={9.5} className={INK}>
                {r.label}
              </text>
              {k >= 1 && <rect x={X5_X0} y={r.y - 5} width={r.gap * X5_U} height={10} rx={2} fill={r.fill} className={FADE} />}
              {k >= r.on && (
                <>
                  <path d={`M${end} ${r.y - 8}V${r.y + 22}`} strokeWidth={1} strokeDasharray="2 2" className={`${FADE} stroke-[#5a6b7d]`} />
                  {Array.from({ length: r.n }, (_, i) => (
                    <g key={i} className={POP} style={{ transitionDelay: `${i * 500}ms` }}>
                      <rect x={X5_X0 + i * r.stick * X5_U} y={r.y + 9} width={r.stick * X5_U} height={8} rx={1.5} fill="#fef3c7" stroke="#0d9488" strokeWidth={1.3} />
                      <text x={X5_X0 + (i + 0.5) * r.stick * X5_U} y={r.y + 15.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#0d9488" className="font-mono">
                        {i + 1}
                      </text>
                    </g>
                  ))}
                  <text x={290} y={r.y + 16} textAnchor="end" fontSize={11} fontWeight={800} className={`${FADE} ${win ? "fill-[#0d9488]" : INK}`}>
                    <tspan className="font-mono">{r.steps}</tspan> ধাপ
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: তানভীর will write grams
//      whatever anyone says. He walks up to his laptop, the weights come up in
//      grams, he digs in, then the dial comes back, turns to gram, and a
//      yardstick is laid beside it. Whether the yardstick distance moves is the widget's.
//      তানভীর is not in the shared cast: he wears করিম's look and his own name.

const S6_Y = 150;
const S6_AT = 84;

export function TanvirGrams({}: Story) {
  const s = useScene(5, [600, 1600, 1500, 2600, 1500]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="তানভীর types the weights in grams, 68,000 and so on, and insists; the unit dial turns to gram and a yardstick is laid beside it">
        {/* the table */}
        <rect x={114} y={126} width={84} height={5} rx={1} fill="#92400e" />
        <path d="M120 131V150M192 131V150" stroke="#78350f" strokeWidth={3} />
        <S_Laptop x={156} y={126} w={70} h={40} fs={7.5} lines={k >= 2 ? ["A 68,000 g", "B 69,000 g", "C 78,000 g"] : []} />
        <Person who="karim" x={k >= 1 ? S6_AT : -30} y={S6_Y} walking={k === 1} arm={k >= 2 ? "point" : "down"} mood={k >= 3 ? "smug" : "plain"} />
        <g style={{ transform: `translate(${k >= 1 ? S6_AT : -30}px, ${S6_Y + 11}px)` }} className="transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
          <text textAnchor="middle" fontSize={8.5} fontWeight={700} fill={S_INK}>
            তানভীর
          </text>
        </g>
        {k >= 3 && <Bubble x={S6_AT} y={S6_Y - 66} lines={["আমি gram-এই", "লিখবো!"]} />}
        {k >= 4 && <S_Dial x={264} y={64} r={22} at={k >= 5 ? 3 : 1} />}
        {k >= 5 && <S_Stick x={222} y={128} w={80} label="scale " anchor="above" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · The unit dial again, now with three readouts. Raw distances flip their
//     twin; the gap and the scale roll into the new unit's numbers while
//     their bars hold the same 10:12 shape; distances in yardsticks don't
//     move at all, in any unit.

export function UnitsCancel() {
  const pass = useGate();
  const [u, setU] = useSeed("u", 1);
  const [seen, setSeen] = useSeed<number[]>("seen", [1]);
  const { k, name } = UNITS[u];
  const rB = rawD(B, k);
  const rC = rawD(C, k);
  const all = seen.length === UNITS.length;
  // the gap and the scale glide into the new unit's numbers when it's turned
  const [gapN, scaleN] = useTween([10 * k, 12 * k], 700);
  const fmtU = (n: number) => (n >= 1000 ? Math.round(n).toLocaleString("en-US") : n.toFixed(UNITS[u].dec));

  const turn = (i: number) => {
    setU(i);
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (next.length === UNITS.length) pass("scale এ মাপলে unit কেটে যায়।");
  };

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border px-2 py-2.5">
          <div className="text-center text-sm font-semibold">Distance</div>
          <TwinBars dB={rB} dC={rC} />
          <div key={u} className={`${FADE} mt-1 text-center text-sm`}>
            Twin <b>{rB < rC ? "B" : "C"}</b>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-cat-teal/40 px-2 py-2.5">
          <div className="text-center text-sm font-semibold text-cat-teal">scale এ দূরত্ব</div>
          <TwinBars dB={yardD(B)} dC={yardD(C)} />
          <div className="mt-1 text-center text-sm">
            Twin <b>C</b>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-border px-3 py-2">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-2">
          {/* the bars hold this 10:12 shape in every unit — only the numbers roll */}
          <span className="text-xs text-muted">C-এর পার্থক্য</span>
          <span className="relative block h-2.5 overflow-hidden rounded-full bg-foreground/5">
            <span className="absolute inset-y-0 left-0 w-[83%] rounded-full bg-cat-blue" />
          </span>
          <span className="w-24 text-right text-xs">
            <span className="font-mono">{fmtU(gapN)}</span> <span className="text-muted">{name}</span>
          </span>
          <span className="text-xs text-muted">ওজনের scale</span>
          <span className="relative block h-2.5 overflow-hidden rounded-full bg-foreground/5">
            <span className="absolute inset-y-0 left-0 w-full rounded-full bg-cat-teal" />
          </span>
          <span className="w-24 text-right text-xs">
            <span className="font-mono">{fmtU(scaleN)}</span> <span className="text-muted">{name}</span>
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {UNITS.map((x, i) => (
          <button key={x.name} type="button" aria-pressed={u === i} onClick={() => turn(i)} className={`${pill(u === i)} font-sans`}>
            {x.name}
          </button>
        ))}
      </div>
      <Ticks items={UNITS.map((x, i) => [x.name, seen.includes(i)])} />
      <Task done={all}>চারটা unit-ই ঘুরিয়ে দুই পাশের দূরত্ব মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: C's 10 kg gap over the
//      12 kg yardstick, written in kg, gram, pound, মণ and তোলা in turn. The
//      numbers above and below leap about, the same unit on both lines is
//      struck out each time, and the answer never leaves 0.83.

const SC_UNITS = [
  { name: "kg", in: "kg-তে", top: "10", bot: "12", u: "kg" },
  { name: "gram", in: "gram-এ", top: "10,000", bot: "12,000", u: "gram" },
  { name: "pound", in: "pound-এ", top: "22.05", bot: "26.46", u: "pound" },
  { name: "মণ", in: "মণে", top: "0.268", bot: "0.322", u: "মণ" },
  { name: "তোলা", in: "তোলায়", top: "857", bot: "1,029", u: "তোলা" },
];

/** a unit word with a line drawn through it, `key` it to strike again */
function Struck({ on, children }: { on: boolean; children: string }) {
  return (
    <span className="relative ml-1 inline-block font-sans text-sm text-muted">
      {children}
      {on && (
        <span className="absolute top-1/2 left-0 h-0.5 w-full -rotate-12 rounded-full bg-cat-coral transition-[width] delay-300 duration-500 motion-reduce:transition-none starting:w-0" />
      )}
    </span>
  );
}

export function EveryUnit() {
  const s = useScene(5, [500, 1700, 1700, 1700, 1700]);
  const k = s.k;
  const i = Math.max(0, k - 1);
  const x = SC_UNITS[i];

  return (
    <Scene
      scene={s}
      caption={
        k < 5 ? (
          `${x.in} লিখলে ওপরে আর নিচে, দুই জায়গাতেই ${x.name}। তাই কেটে যায়।`
        ) : (
          <span className={FADE}>মণ, pound, তোলা, যা-ই লিখুন, ভাগ করলে unit নিজেই কেটে যায়। থাকে সেই একই 0.83।</span>
        )
      }
    >
      <div className="flex flex-wrap justify-center gap-1.5">
        {SC_UNITS.map((u, j) => (
          <span
            key={u.name}
            className={`rounded-full px-2.5 py-0.5 text-xs transition-colors motion-reduce:transition-none ${j === i ? "bg-cat-blue/15 font-semibold text-cat-blue" : "text-muted"}`}
          >
            {u.name}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <div className="grid gap-5 text-right text-xs text-muted">
          <span>C-এর পার্থক্য</span>
          <span>scale </span>
        </div>
        <div key={i} className={`${FADE} grid justify-items-center`}>
          <div className="whitespace-nowrap">
            <span className="font-mono text-lg">{x.top}</span>
            <Struck on={k >= 1}>{x.u}</Struck>
          </div>
          <div className="my-1 h-0.5 w-full min-w-24 rounded-full bg-foreground/60" />
          <div className="whitespace-nowrap">
            <span className="font-mono text-lg">{x.bot}</span>
            <Struck on={k >= 1}>{x.u}</Struck>
          </div>
        </div>
        <div className="font-mono text-lg">
          ≈ <b className="text-cat-teal">0.83</b>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A figure for screen 6's explanation, no task: the two laptops again,
//      now agreeing. সামিন's weights in kg, তানভীর's in grams; each divides
//      by a yardstick in its own unit, and both screens say C. তানভীর, the
//      gram man, is pleased.

const X6_Y = 150;
const X6_DESKS = [
  { x: 124, lines: [["A 68 kg", "C 78 kg"], ["÷ 12 kg"]] },
  { x: 196, lines: [["A 68,000 g", "C 78,000 g"], ["÷ 12,000 g"]] },
];

export function SameTwinNow() {
  const s = useScene(4, [600, 1600, 1900, 1900, 1800]);
  const k = s.k;
  const say = (i: number) => (k === 0 ? [] : k <= 2 ? X6_DESKS[i].lines[k - 1] : ["twin = C"]);

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সামিন's laptop in kg and তানভীর's in grams each divide by a yardstick in their own unit, and both now say the twin is C">
        <rect x={82} y={122} width={156} height={5} rx={1} fill="#92400e" />
        <path d="M88 127V150M232 127V150" stroke="#78350f" strokeWidth={3} />
        {X6_DESKS.map((d, i) => (
          <S_Laptop key={d.x} x={d.x} y={122} w={66} h={38} fs={7.5} lines={say(i)} />
        ))}
        {k >= 3 &&
          X6_DESKS.map((d) => (
            <rect key={d.x} x={d.x - 24} y={128} width={48} height={3} rx={1.5} fill="#0d9488" className={FADE} />
          ))}
        <Person who="samin" x={40} y={X6_Y} arm={k >= 1 && k < 3 ? "point" : "down"} mood={k >= 3 ? "happy" : "plain"} label />
        <Person who="karim" x={280} y={X6_Y} facing={-1} arm={k >= 1 && k < 3 ? "point" : "down"} mood={k >= 3 ? "happy" : "plain"} />
        <text x={280} y={X6_Y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={S_INK}>
          তানভীর
        </text>
        {k >= 4 && <Bubble x={280} y={X6_Y - 66} side="left" lines={["gram-এও এবার", "twin C!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · A second ruler under the cm ruler, counted in yardsticks from the
//     average. The reader places three students on it: −1.5, 0.5, 1.5.

const ZTICKS = Array.from({ length: 13 }, (_, i) => -3 + i * 0.5);
const ZKIDS = [
  { n: "সামিন", h: 155 },
  { n: "সোম", h: 175 },
  { n: "নাসিব", h: 185 },
];
const zOf = (h: number) => (h - 170) / 10;

export function ZScore() {
  const pass = useGate();
  const [placed, setPlaced] = useSeed("placed", 0);
  const [miss, setMiss] = useSeed<{ z: number; n: number } | null>("miss", null);
  const kid = ZKIDS[placed];
  const all = placed === ZKIDS.length;

  const tap = (z: number) => {
    if (all) return;
    if (z !== zOf(kid.h)) {
      setMiss({ z, n: (miss?.n ?? 0) + 1 });
      return;
    }
    setMiss(null);
    setPlaced(placed + 1);
    if (placed + 1 === ZKIDS.length) pass("Average বিয়োগ, তারপর scale এ ভাগ।");
  };

  return (
    <>
      <div className="mx-auto mt-5 max-w-md">
        <div className="text-xs text-muted">উচ্চতা (cm)</div>
        <div className="grid grid-cols-13 border-b border-foreground/40 pb-1 text-center font-mono text-[0.65rem]">
          {ZTICKS.map((z) => (
            <span key={z} className={Number.isInteger(z) ? "" : "text-transparent"}>
              {170 + z * 10}
            </span>
          ))}
        </div>
        <div className="relative grid h-7 grid-cols-13">
          {ZKIDS.slice(0, placed).map((c) => (
            <span
              key={c.n}
              className={`${POP} col-span-1 row-start-1 self-center justify-self-center rounded-full bg-cat-teal px-1 text-[0.6rem] leading-4 whitespace-nowrap text-white`}
              style={{ gridColumnStart: ZTICKS.indexOf(zOf(c.h)) + 1 }}
            >
              {c.n}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-13 gap-px">
          {ZTICKS.map((z) => (
            <button
              key={z}
              type="button"
              disabled={all}
              aria-label={`${sh(z)} scale `}
              onClick={() => tap(z)}
              className={`h-9 cursor-pointer rounded-md border font-mono text-[0.6rem] transition-colors motion-reduce:transition-none disabled:cursor-default ${
                miss?.z === z ? "border-danger/50 bg-danger/5 text-danger" : z === 0 ? "border-cat-violet/50 text-cat-violet" : "border-border hover:border-cat-blue/60"
              }`}
            >
              {Number.isInteger(z) ? sh(z) : "·"}
            </button>
          ))}
        </div>
        <div className="mt-1 text-right text-xs text-muted">Average থেকে কয় scale </div>
      </div>
      <div className="mt-3 min-h-14 text-center text-[0.95rem]">
        {!all ? (
          <>
            <div>
              <b>{kid.n}</b>, উচ্চতা <span className="font-mono">{kid.h}</span> cm। এদিকে average 170 cm, আর scale  10 cm। নিচের ruler-এ {kid.n} কোথায় গিয়ে বসবে?
            </div>
            {miss && (
              <Nope key={miss.n}>
                উঁহু। {kid.n} average থেকে {Math.abs(kid.h - 170)} cm {kid.h < 170 ? "নিচে" : "উপরে"}, আর এক ঘর মানে 10 cm। মাঝের ফুটকিগুলো আধা ঘর।
              </Nope>
            )}
          </>
        ) : (
          <div className={`${FADE} space-y-0.5 font-mono`}>
            {ZKIDS.map((c) => (
              <div key={c.n}>
                <span className="font-sans">{c.n}</span> ({c.h} − 170) ÷ 10 = <b className="text-cat-teal">{sh(zOf(c.h))}</b>
              </div>
            ))}
          </div>
        )}
      </div>
      <Ticks items={ZKIDS.map((c, i) => [c.n, placed > i])} />
      <Task done={all}>তিনজনকেই নিচের ruler-এ যার যার জায়গায় বসান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: how the lower ruler got
//      its marks. It starts as a copy of the cm ruler, সামিন at 155. Take 170
//      off every mark and the zero lands on the average (সামিন −15); divide
//      by 10 and every step is one yardstick (সামিন −1.5).

const scZx = (cm: number) => 40 + (cm - 150) * 5;
const SC_TENS = [150, 160, 170, 180, 190];
const SC_TICKS = Array.from({ length: 9 }, (_, i) => 150 + i * 5);
const SC_ZLAB = [(cm: number) => `${cm}`, (cm: number) => sg(cm - 170), (cm: number) => sg((cm - 170) / 10)];
const SC_SAMIN = ["155", "−15", "−1.5"];
const SC_ZSAY = [
  "নিচের ruler-টা এখনো ওপরেরটার হুবহু কপি। সামিন বসে আছে 155-এ।",
  "নিচের ruler-টা এখনো ওপরেরটার হুবহু কপি। সামিন বসে আছে 155-এ।",
  "আগে প্রতিটা দাগ থেকে 170 বিয়োগ। শূন্য এসে বসলো average-এ।",
];

export function ZRelabel() {
  const s = useScene(3, [500, 1600, 2000]);
  const k = s.k;
  const st = Math.max(0, k - 1); // 0 copy, 1 shifted, 2 squeezed
  const sx = scZx(155);

  return (
    <Scene scene={s} caption={k < 3 ? SC_ZSAY[k] : <span className={FADE}>তারপর 10 দিয়ে ভাগ। প্রতিটা ঘর এখন এক scale , আর সামিন −1.5।</span>}>
      <svg viewBox="0 0 280 100" role="img" aria-label="The cm ruler and a second ruler under it, relabelled: minus 170, then divided by 10; সামিন at 155 becomes −1.5" className="mx-auto block h-auto w-full max-w-[17rem]">
        <rect x={4} y={4} width={272} height={92} rx={3} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        {[
          { y: 30, dir: 1 },
          { y: 70, dir: -1 },
        ].map(({ y, dir }) => (
          <path
            key={y}
            d={`M${scZx(150) - 6} ${y}H${scZx(190) + 6}` + SC_TICKS.map((c) => `M${scZx(c)} ${y}v${dir * (c % 10 ? 4 : 7)}`).join("")}
            strokeWidth={1.1}
            className="fill-none stroke-[#0f1b2d]"
          />
        ))}
        <text x={10} y={24} fontSize={8.5} className={INK_SOFT}>
          cm
        </text>
        {SC_TENS.map((c) => (
          <text key={c} x={scZx(c)} y={24} textAnchor="middle" fontSize={9} className={`${INK} font-mono`}>
            {c}
          </text>
        ))}
        <g key={st} className={FADE}>
          <text x={10} y={86} fontSize={8.5} className={INK_SOFT}>
            {st < 2 ? "cm" : "ধাপ"}
          </text>
          {SC_TENS.map((c) => (
            <text
              key={c}
              x={scZx(c)}
              y={86}
              textAnchor="middle"
              fontSize={9}
              fontWeight={st > 0 && c === 170 ? 800 : 400}
              className={`font-mono ${st > 0 && c === 170 ? "fill-cat-violet" : INK}`}
            >
              {SC_ZLAB[st](c)}
            </text>
          ))}
          {st > 0 && (
            <text x={268} y={54} textAnchor="end" fontSize={11} fontWeight={700} className="fill-cat-violet font-mono">
              {st === 1 ? "−170" : "÷10"}
            </text>
          )}
        </g>
        {k >= 1 && (
          <g className={FADE}>
            <path d={`M${sx} 31V69`} strokeWidth={1.4} strokeDasharray="3 3" className="fill-none stroke-cat-teal" />
            <circle cx={sx} cy={30} r={3.2} className="fill-cat-teal" />
            <circle cx={sx} cy={70} r={3.2} className="fill-cat-teal" />
            <text x={sx + 6} y={47} fontSize={9} className={INK}>
              সামিন
            </text>
            <text key={st} x={sx + 6} y={60} fontSize={10} fontWeight={700} className={`${POP} font-mono ${st === 2 ? "fill-cat-teal" : INK}`}>
              {SC_SAMIN[st]}
            </text>
          </g>
        )}
      </svg>
      <div className="mt-1 h-6 text-center font-mono text-[0.95rem]">
        {k >= 2 && (
          <span key={st} className={FADE}>
            {st === 1 ? "155 − 170 = −15" : "(155 − 170) ÷ 10 = −1.5"}
          </span>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7¾ · A figure for screen 7's explanation, no task: what scikit-learn's one
//      line does inside. The five's table, X, under `StandardScaler`; the
//      height column loses its average 170 and is divided by 10, then the
//      weight column loses 70 and is divided by 12. Both land on the same
//      z-scores.

const X7_COLS = [
  { name: "উচ্চতা", i: 0, avg: 170, sd: 10, on: 2 },
  { name: "ওজন", i: 1, avg: 70, sd: 12, on: 3 },
];
const X7_SAY = [
  "X মানে সেই পাঁচজনের table, দুইটা column।",
  "X মানে সেই পাঁচজনের table, দুইটা column।",
  "ভেতরে প্রথমে উচ্চতার column: average 170 বিয়োগ, তারপর scale  10 দিয়ে ভাগ।",
  "তারপর ওজনের column: নিজের average 70, নিজের scale  12।",
];

export function OneLine() {
  const s = useScene(4, [600, 1600, 2600, 2600, 2200]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 4 ? X7_SAY[k] : <span className={FADE}>দুইটা column এখন একই ভাষায় কথা বলে: average থেকে কয় step।</span>}>
      <div className="mx-auto w-fit rounded-lg px-2.5 py-1 font-mono text-xs" style={{ backgroundColor: "#0f172a", color: "#86efac" }}>
        StandardScaler().fit_transform(X)
      </div>
      <table className={`mx-auto mt-1.5 text-center text-sm tabular-nums transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>
        <thead>
          <tr className="text-xs text-muted">
            <th />
            {X7_COLS.map((c) => (
              <th key={c.name} className="px-2 font-normal whitespace-nowrap">
                {c.name}
                {k >= c.on && <span className={`${FADE} ml-1 font-mono text-cat-violet`}>−{c.avg} ÷{c.sd}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FIVE.map((p) => (
            <tr key={p.n} className="leading-5">
              <td className="pr-2 text-left text-xs text-muted">{p.n}</td>
              {X7_COLS.map((c) => {
                const z = k >= c.on;
                return (
                  <td key={c.name} className="px-2 font-mono">
                    <span key={z ? "z" : "raw"} className={`${FADE} ${z ? "font-semibold text-cat-teal" : ""}`} style={{ transitionDelay: z ? `${FIVE.indexOf(p) * 90}ms` : undefined }}>
                      {z ? sh((p.v[c.i] - c.avg) / c.sd) : p.v[c.i]}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for screen 8's setup, no task: A's "so my real twin is
//      C!", and ডাক্তার আপা's "wait". She points at the school's five the
//      yardstick came from; they walk off, and a crowd we haven't met stands
//      in their place: what if the data were different? What that does to the
//      twin is the widget's.

const S8_Y = 150;
const S8_KIDS = S4_KIDS;
const S8_X = (i: number) => 180 + i * 27;

export function DataFrom({}: Story) {
  const s = useScene(6, [600, 2400, 1900, 1800, 2800, 1300]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="A says his real twin is C; ডাক্তার আপা says wait, the yardstick came from these five; they leave and a different crowd stands there: what if the data were different?">
        <S_Visitor who="A" x={36} y={S8_Y} mood={k === 1 ? "happy" : k >= 6 ? "puzzled" : "plain"} />
        {k === 1 && <Bubble x={36} y={S8_Y - 66} side="right" lines={["যাক! আমার আসল", "twin তাহলে C!"]} />}
        <Person who="apa" x={104} y={S8_Y} arm={k === 2 ? "wave" : k === 4 || k >= 6 ? "point" : "down"} mood={k >= 6 ? "puzzled" : "plain"} label />
        {k === 2 && <Bubble x={104} y={S8_Y - 66} lines={["একটু দাঁড়ান।"]} />}
        {k === 4 && <Bubble x={104} y={S8_Y - 66} lines={["scale  এসেছে", "এই পাঁচজনের data থেকে"]} />}
        {k >= 6 && <Bubble x={104} y={S8_Y - 66} tone="think" lines={["Data অন্য রকম হলে?"]} />}
        {S8_KIDS.map((c, i) => (
          <Person
            key={c.who}
            who={c.who}
            x={k < 3 ? 360 + i * 30 : k < 5 ? S8_X(i) : 380 + i * 30}
            y={S8_Y}
            scale={(0.85 * c.h) / 170}
            facing={k >= 5 ? 1 : -1}
            walking={k === 3 || k === 5}
            ms={1500}
          />
        ))}
        {(k === 3 || k === 4) && (
          <text x={S8_X(2)} y={78} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#44403c" className={FADE}>
            স্কুলের পাঁচজন
          </text>
        )}
        {k >= 6 &&
          [0, 1, 2, 3, 4].map((i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 100}ms` }}>
              <S_Visitor who="A" x={S8_X(i)} y={S8_Y} tall={0.82 + (i % 3) * 0.06} ghost />
            </g>
          ))}
        {k >= 6 && (
          <text x={S8_X(2)} y={78} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#57534e" className={FADE}>
            অন্য একটা দল
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8 · Not the truth. A slider for the weight yardstick (3–20 kg). At 12 kg the
//     twin is C; somewhere between 6 and 5.5 kg it flips to B.

export function NotTheTruth() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [yw, setYw] = useSeed("yw", 12);
  const [visited, setVisited] = useSeed<number[]>("visited", [12]);
  const dB = yardD(B, yw);
  const dC = yardD(C, yw);
  const sawB = visited.some((v) => v <= 5.5);
  const flip = visited.includes(5.5) && visited.includes(6);

  const slide = (v: number) => {
    setYw(v);
    if (visited.includes(v)) return;
    const next = [...visited, v];
    setVisited(next);
    if (next.includes(5.5) && next.includes(6) && !flip) pass("দল বদলালে scale , তাই twin-ও বদলায়।");
  };

  return (
    <>
      <Speech who="ডাক্তার আপা" initial="ডা" tint="teal">
        পাশের স্কুলের stall-এ কিন্তু সবার ওজন খুব কাছাকাছি। ওদের ওজনের scale  মাত্র 5 kg।
      </Speech>
      <div className="mt-4 text-sm font-medium text-muted">ওজনের scale  5 kg হলে A-এর twin কে হবে?</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {["B", "C"].map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, sawB, 0)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={FADE}>
          <TwinBars dB={dB} dC={dC} />
          <div className="mt-2 text-center font-mono text-sm text-muted">
            C-এর ওজনের পার্থক্য 10 ÷ {sh(yw)} ≈ {sh(10 / yw)}
          </div>
          <label className="mx-auto mt-3 flex max-w-sm items-center gap-3">
            <span className="shrink-0 text-sm text-muted">ওজনের scale </span>
            <input
              type="range"
              min={3}
              max={20}
              step={0.5}
              value={yw}
              aria-label="ওজনের scale , kg"
              onChange={(e) => slide(Number(e.target.value))}
              className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
            />
            <b className="shrink-0 font-mono whitespace-nowrap">{sh(yw)} kg</b>
          </label>
          <div key={dB < dC ? "b" : "c"} className={`${FADE} mt-2 text-center text-[0.95rem]`}>
            Twin <b className="text-cat-teal">{dB < dC ? "B" : "C"}</b>
            {flip ? "। বদলানোর জায়গাটা খুঁজে পেয়েছেন!" : sawB ? "। এবার ঠিক কোথায় গিয়ে বদলায়, সেটা খুঁজে বের করুন।" : ""}
          </div>
        </div>
      )}
      <Ticks
        items={[
          ["Twin B হলো", sawB],
          ["বদলানোর জায়গা", flip],
        ]}
      />
      <Task done={flip}>আগে একটা guess করুন। তারপর slider সরিয়ে খুঁজুন, scale  ঠিক কোথায় পৌঁছালে twin বদলে যায়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8¼ · A figure for screen 8's explanation, no task: two schools, two
//      yardsticks, both right. Our five's weights are spread, a 12 kg stick,
//      and C's 10 kg gap is under one step: twin C. The school next door
//      weighs close together, a 5 kg stick, and the same 10 kg is two full
//      steps: twin B.

const x8X = (w: number) => 6 + (w - 50) * 3.45;
const X8_SCHOOLS = [
  { name: "আমাদের স্কুল", w: FIVE.map((p) => p.v[1]), sd: 12, n: 1, sum: "10 ÷ 12 ≈ 0.83", twin: "C", on: 1 },
  { name: "পাশের স্কুল", w: [63, 66, 70, 74, 77], sd: 5, n: 2, sum: "10 ÷ 5 = 2", twin: "B", on: 3 },
];
const X8_SAY = [
  "আমাদের স্কুলে ওজন অনেকটা ছড়ানো, scale  12 kg।",
  "আমাদের স্কুলে ওজন অনেকটা ছড়ানো, scale  12 kg।",
  "C-এর 10 kg সেখানে এক ধাপও না। Twin C।",
  "পাশের স্কুলে সবার ওজন কাছাকাছি, scale  মাত্র 5 kg।",
];

export function TwoSchools() {
  const s = useScene(4, [600, 1700, 2100, 1900, 2300]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 4 ? X8_SAY[k] : <span className={FADE}>সেখানে একই 10 kg পুরো দুই ধাপ, সত্যিই অস্বাভাবিক। Twin B। দুইটাই ঠিক।</span>}>
      <div className="grid grid-cols-2 gap-2">
        {X8_SCHOOLS.map((sc) => {
          const shown = k >= sc.on;
          const measured = k >= sc.on + 1;
          return (
            <div key={sc.name} className={`rounded-xl border border-border px-1.5 py-1.5 text-center transition-opacity duration-500 motion-reduce:transition-none ${shown ? "" : "opacity-0"}`}>
              <div className="text-xs text-muted">
                {sc.name}, scale  <span className="font-mono">{sc.sd} kg</span>
              </div>
              <svg viewBox="0 0 150 62" aria-hidden="true" className="mt-1 block h-auto w-full">
                <rect x={1} y={1} width={148} height={60} rx={4} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
                <path d={`M${x8X(68)} 22v-6H${x8X(78)}v6`} strokeWidth={1.4} className="fill-none stroke-[#e11d48]" />
                <text x={(x8X(68) + x8X(78)) / 2} y={12} textAnchor="middle" fontSize={8} fontWeight={700} className="fill-[#e11d48] font-mono">
                  10 kg
                </text>
                <path d="M4 34H146" strokeWidth={1} className="stroke-[#0f1b2d]/35" />
                {shown &&
                  sc.w.map((w, j) => <circle key={j} cx={x8X(w)} cy={34} r={2.6} className={`${POP} fill-cat-blue`} style={{ transitionDelay: `${j * 60}ms` }} />)}
                {measured && (
                  <>
                    <path d={`M${x8X(78)} 18V56`} strokeWidth={1} strokeDasharray="2 2" className="stroke-[#5a6b7d]" />
                    {Array.from({ length: sc.n }, (_, i) => (
                      <rect
                        key={i}
                        x={x8X(68) + i * sc.sd * 3.45}
                        y={44}
                        width={sc.sd * 3.45}
                        height={7}
                        rx={1.5}
                        fill="#fef3c7"
                        stroke="#0d9488"
                        strokeWidth={1.2}
                        className={POP}
                        style={{ transitionDelay: `${i * 450}ms` }}
                      />
                    ))}
                  </>
                )}
              </svg>
              <div className="mt-1 h-10 text-sm">
                {measured && (
                  <span className={FADE}>
                    <span className="font-mono">{sc.sum}</span> ধাপ
                    <br />
                    Twin <b className="text-cat-teal">{sc.twin}</b>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: when a person knows
//      better than the data. ডাক্তার আপা beside a দাঁড়িপাল্লা, a step of
//      height on one pan and a step of weight on the other, level. For her
//      disease weight matters more; she adds a weight to the ওজন pan and the
//      beam tips, on purpose.

const X8B_Y = 150;
const X8B_P = { x: 226, y: 62 }; // the pivot
const X8B_L = 50; // half the beam

export function ApaWeight() {
  const s = useScene(4, [600, 1500, 2600, 2000, 2600]);
  const k = s.k;
  const tilt = k >= 3 ? 9 : 0;
  const dy = X8B_L * Math.sin((tilt * Math.PI) / 180);
  const swing = "transition-transform duration-1000 ease-in-out motion-reduce:transition-none";

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="ডাক্তার আপা beside a balance with a step of height on one pan and a step of weight on the other; she adds a weight to the weight pan and the beam tips on purpose">
        <Stall x={38} y={X8B_Y} w={60} sign="twin" color="#0d9488" />
        <rect x={X8B_P.x - 14} y={X8B_Y - 4} width={28} height={4} rx={1} fill="#78350f" />
        <path d={`M${X8B_P.x} ${X8B_Y - 2}V${X8B_P.y}`} stroke="#78350f" strokeWidth={4} />
        <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: `${X8B_P.x}px ${X8B_P.y}px` }} className={swing}>
          <path d={`M${X8B_P.x - X8B_L} ${X8B_P.y}H${X8B_P.x + X8B_L}`} stroke="#92400e" strokeWidth={3.5} strokeLinecap="round" />
        </g>
        <circle cx={X8B_P.x} cy={X8B_P.y} r={3.5} fill="#b45309" />
        {[
          { side: -1, text: "উচ্চতা", fill: "#1d4ed8" },
          { side: 1, text: "ওজন", fill: "#7c3aed" },
        ].map(({ side, text, fill }) => {
          const px = X8B_P.x + side * X8B_L;
          return (
            <g key={side} style={{ transform: `translateY(${side * dy}px)` }} className={swing}>
              <path d={`M${px} ${X8B_P.y}L${px - 15} ${X8B_P.y + 36}M${px} ${X8B_P.y}L${px + 15} ${X8B_P.y + 36}`} stroke="#a8a29e" strokeWidth={0.9} />
              <path d={`M${px - 19} ${X8B_P.y + 36}q19 8 38 0Z`} fill="#b45309" />
              <rect x={px - 16} y={X8B_P.y + 20} width={32} height={16} rx={2} fill={fill} />
              <text x={px} y={X8B_P.y + 31} textAnchor="middle" fontSize={8} fontWeight={700} fill="white">
                {text}
              </text>
              {side === 1 && k >= 3 && (
                <g className={POP}>
                  <path d={`M${px - 8} ${X8B_P.y + 20}l2.5 -10h11l2.5 10Z`} fill="#44403c" />
                  <path d={`M${px - 2.5} ${X8B_P.y + 10}q2.5 -4 5 0`} fill="none" stroke="#44403c" strokeWidth={1.5} />
                </g>
              )}
            </g>
          );
        })}
        <Person who="apa" x={112} y={X8B_Y} arm={k === 3 ? "point" : "down"} mood={k >= 4 ? "happy" : "plain"} label />
        {k === 2 && <Bubble x={112} y={X8B_Y - 66} side="left" lines={["এই রোগে উচ্চতার চেয়ে", "ওজনটাই বেশি জরুরি।"]} />}
        {k >= 4 && <Bubble x={112} y={X8B_Y - 66} side="left" lines={["তাই ওজনকে জেনেশুনে", "একটু বাড়তি দাম দিলাম।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8¾ · A figure for screen 8's explanation, no task: the journey's question,
//      answered. Into the machine go the data and, beside it, the yardstick
//      we chose; out comes a twin, and pinned to it the yardstick it was
//      measured with.

const X8C_SAY = [
  "Machine-এর উত্তর বিশ্বাস করবো কোন ভরসায়? Machine-এ ঢোকে data…",
  "Machine-এর উত্তর বিশ্বাস করবো কোন ভরসায়? Machine-এ ঢোকে data…",
  "…আর সাথে ঢোকে আমাদের বেছে নেওয়া scale ।",
  "উত্তরটা এই দুইটা মিলে, শুধু data-র না।",
];

export function TrustAnswer() {
  const s = useScene(4, [600, 1800, 2000, 1900, 2400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 4 ? X8C_SAY[k] : <span className={FADE}>তাই বিশ্বাস করার আগে দেখুন, উত্তরটা কোন scale এ মাপা।</span>}>
      <svg viewBox="0 0 300 110" role="img" aria-label="the data and a chosen yardstick go into the machine; out comes twin C, labelled with the 12 kg yardstick it was measured with" className="mx-auto block h-auto w-full max-w-[17.5rem]">
        <rect x={2} y={2} width={296} height={106} rx={5} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        <g className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>
          <rect x={16} y={14} width={62} height={42} rx={3} fill="white" stroke="#0f1b2d" strokeOpacity={0.5} />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={24 + (i % 2) * 24} y={26 + Math.floor(i / 2) * 9} width={20} height={6} rx={1} fill="#1d4ed8" fillOpacity={0.25} />
          ))}
          <text x={47} y={23} textAnchor="middle" fontSize={8} fontWeight={700} className={`${INK} font-mono`}>
            data
          </text>
        </g>
        {k >= 1 && <Draw d="M80 35H114M109 31.5L114 35L109 38.5" ms={500} strokeWidth={1.6} className="stroke-[#0f1b2d]" />}
        {k >= 2 && (
          <>
            <S_Stick x={20} y={88} w={56} label="scale  12 kg" anchor="above" />
            <Draw d="M78 88Q100 88 114 76M108.5 76.5L114 76L112.5 81.5" ms={500} strokeWidth={1.6} className="stroke-[#0d9488]" />
          </>
        )}
        <rect x={116} y={20} width={70} height={74} rx={8} fill="#1e293b" />
        <rect x={123} y={28} width={56} height={34} rx={2} fill="#0f172a" />
        <text x={151} y={84} textAnchor="middle" fontSize={8} fontWeight={700} fill="#94a3b8" className="font-mono">
          program
        </text>
        {k >= 3 && (
          <>
            <text x={151} y={48} textAnchor="middle" fontSize={8} fontWeight={700} fill="#86efac" className={`${FADE} font-mono`}>
              Twin = C
            </text>
            <Draw d="M188 45H206M201 41.5L206 45L201 48.5" ms={400} strokeWidth={1.6} className="stroke-[#0f1b2d]" />
            <g className={POP}>
              <rect x={210} y={32} width={76} height={26} rx={4} fill="white" stroke="#0d9488" strokeWidth={1.6} />
              <text x={248} y={49} textAnchor="middle" fontSize={11} fontWeight={800} fill="#0d9488">
                Twin C
              </text>
            </g>
          </>
        )}
        {k >= 4 && (
          <g className={POP}>
            <path d="M248 58V68" stroke="#0d9488" strokeWidth={1.2} strokeDasharray="2 2" />
            <rect x={204} y={68} width={88} height={18} rx={9} fill="#0d9488" />
            <text x={248} y={80.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="white">
              12 kg scale তে
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for screen 9's setup, no task: one word, two stalls. মামা
//      at the video stall holds up Titanic's card, and it gets the word
//      "normalise"; ডাক্তার আপা at the twin stall holds up today's yardstick,
//      and it gets the same word. Between them, a "=?". How they differ is the
//      widget's.

const S9_Y = 150;

export function OneWordTwoStalls({}: Story) {
  const s = useScene(5, [600, 1500, 1400, 1500, 1400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="মামা at the video stall with Titanic's card and ডাক্তার আপা at the twin stall with a yardstick; both get the word normalise, and between them a question: the same?">
        <Stall x={50} y={S9_Y} w={86} sign="ভিডিও" color="#7c3aed" />
        <Stall x={270} y={S9_Y} w={86} sign="twin" color="#0d9488" />
        <Person who="mama" x={112} y={S9_Y} arm={k >= 1 ? "hold" : "down"} mood="happy" label />
        {k >= 1 && (
          <>
            <CastCard x={112} y={S9_Y - 78} text="(5, 2)" tone="coral" />
            <text x={83} y={S9_Y - 75} textAnchor="end" fontSize={8} fontWeight={700} fill="#be123c" className={FADE}>
              Titanic
            </text>
          </>
        )}
        {k >= 2 && <S_Tag x={112} y={48} text="normalise" />}
        <Person who="apa" x={208} y={S9_Y} facing={-1} arm={k >= 3 ? "hold" : "down"} mood="happy" label />
        {k >= 3 && <S_Stick x={186} y={S9_Y - 73} w={44} label="scale " anchor="above" />}
        {k >= 4 && <S_Tag x={208} y={48} text="normalise" />}
        {k >= 5 && (
          <g className={POP}>
            <text x={160} y={54} textAnchor="middle" fontSize={17} fontWeight={800} fill="#7c3aed">
              =?
            </text>
            <text x={160} y={112} textAnchor="middle" fontSize={9} fontWeight={700} fill={S_INK}>
              একই কাজ?
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9 · Two "normalise"s. Six cards, one at a time, into a ROW bin (3.6: divide
//     by its own length) or a COLUMN bin (3.7: divide by its yardstick).

const SORT_CARDS = [
  { t: "মামার জন্য ছবি বাছতে Titanic-এর extra loudness মুছে ফেলা", bin: 0 },
  { t: "ওজন gram-এ না kg-তে, সেই ঝামেলা মুছে ফেলা", bin: 1 },
  { t: "কাজ শেষে প্রতিটা card-এর length 1", bin: 0 },
  { t: "কাজ শেষে প্রতিটা feature-এর scale  1", bin: 1 },
  { t: "সামিনের ক্রেতাদের কার কোণ জিনিসে ঝোঁক বেশি, সেটা রাখা", bin: 0 },
  { t: "Twin খুঁজতে উচ্চতা আর ওজনকে সমান সুযোগ দেওয়া", bin: 1 },
];
const BINS = [
  { name: "একটা row, নিজের length দিয়ে ভাগ", from: "৩.৬" },
  { name: "একটা column, তার scale  দিয়ে ভাগ", from: "৩.৭" },
];

/** a 3 × 2 table glyph with one row or one column lit */
function Grid({ lit }: { lit: number }) {
  return (
    <span className="mx-auto grid w-12 grid-cols-2 gap-0.5" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => {
        const on = lit === 0 ? Math.floor(i / 2) === 1 : i % 2 === 1;
        return <span key={i} className={`h-2.5 rounded-sm ${on ? "bg-cat-blue" : "bg-foreground/15"}`} />;
      })}
    </span>
  );
}

export function TwoNormalises() {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const card = SORT_CARDS[done];
  const all = done === SORT_CARDS.length;
  const counts = BINS.map((_, b) => SORT_CARDS.slice(0, done).filter((c) => c.bin === b).length);

  const drop = (b: number) => {
    if (all) return;
    if (b !== card.bin) {
      setMiss((miss ?? 0) + 1);
      return;
    }
    setMiss(null);
    setDone(done + 1);
    if (done + 1 === SORT_CARDS.length) pass("Row-এ মোছে length, column-এ মোছে unit।");
  };

  return (
    <>
      <div className="mt-4 min-h-20">
        {!all ? (
          <div key={done} className={`${POP} mx-auto max-w-sm rounded-2xl border-2 border-cat-violet/40 bg-surface px-4 py-3 text-center text-[0.95rem]`}>
            {card.t}
          </div>
        ) : (
          <div className={`${FADE} text-center text-[0.95rem] text-accent-text`}>ছয়টা card-ই ঠিক box এ !</div>
        )}
        {miss !== null && !all && (
          <Nope key={miss}>উঁহু। একটু ভাবুন, এখানে ভাগ হচ্ছে কী? একজন মানুষ বা একটা ছবির পুরো card, নাকি সবার একটা feature?</Nope>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {BINS.map((b, i) => (
          <button
            key={b.name}
            type="button"
            disabled={all}
            onClick={() => drop(i)}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-border px-2 py-3 text-center transition-colors hover:border-cat-blue/60 motion-reduce:transition-none disabled:cursor-default"
          >
            <Grid lit={i} />
            <span className="text-sm font-semibold leading-snug">{b.name}</span>
            <span className="text-xs text-muted">{b.from}</span>
            <span className="font-mono text-sm">{bn(counts[i])}টা</span>
          </button>
        ))}
      </div>
      <Task done={all}>
        প্রতিটা card কোন box এর কাজ, ঠিক করে tap করে পাঠিয়ে দিন ({bn(done)}/{bn(SORT_CARDS.length)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for screen 9's explanation, no task: the same word, two
//      directions. Movie club's table: Titanic's row, divided by its own
//      length, keeps only its direction. The stall's table: the weight
//      column, less its average and divided by its yardstick, loses its unit.

const X9_FILMS = [
  { n: "Titanic", v: [5, 2], hat: "(0.93, 0.37)" },
  { n: "Mr. Bean", v: [1, 4], hat: "" },
];
const X9_SAY = [
  "Movie club-এ ভাগ হয়েছিল একটা row, Titanic-এর পুরো card, তার নিজের length দিয়ে।",
  "Movie club-এ ভাগ হয়েছিল একটা row, Titanic-এর পুরো card, তার নিজের length দিয়ে।",
  "মুছে গেল জোর, রইলো শুধু দিক।",
  "আজ ভাগ হলো একটা column, সবার ওজন, ওজনের scale  দিয়ে।",
];
const X9_LIT = "transition-colors duration-500 motion-reduce:transition-none";

export function RowVsColumn() {
  const s = useScene(4, [600, 1900, 1700, 2200, 2200]);
  const k = s.k;
  const col = k >= 3;

  return (
    <Scene scene={s} caption={k < 4 ? X9_SAY[k] : <span className={FADE}>মুছে গেল unit। নাম এক, কাজ আলাদা: একটা row, আরেকটা column।</span>}>
      <div className="grid grid-cols-[1fr_1.15fr] items-start gap-2">
        <div className="rounded-xl border border-border px-1.5 py-1.5">
          <div className="text-center text-xs text-muted">Movie club, ৩.৬</div>
          <div className="mt-1 grid gap-1 text-sm">
            {X9_FILMS.map((f, i) => {
              const lit = i === 0 && k >= 1;
              return (
                <div key={f.n} className={`rounded-md px-1.5 py-0.5 ${X9_LIT} ${lit ? "bg-cat-coral/15" : ""}`}>
                  <div className="text-xs">{f.n}</div>
                  <div key={i === 0 && k >= 2 ? "hat" : "raw"} className={`${FADE} font-mono ${i === 0 && k >= 2 ? "font-semibold text-cat-coral" : ""}`}>
                    {i === 0 && k >= 2 ? f.hat : `(${f.v.join(", ")})`}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 h-4 text-center font-mono text-xs text-cat-coral">{k >= 1 && <span className={FADE}>÷ 5.39</span>}</div>
        </div>
        <div className={`rounded-xl border border-border px-1 py-1.5 transition-opacity duration-500 motion-reduce:transition-none ${k >= 3 ? "" : "opacity-40"}`}>
          <div className="text-center text-xs text-muted">
            Twin stall, ৩.৭{col && <span className={`${FADE} ml-1 font-mono text-cat-blue`}>−70 ÷12</span>}
          </div>
          <table className="mx-auto mt-0.5 text-center text-sm tabular-nums">
            <thead>
              <tr className="text-[0.7rem] text-muted">
                <th />
                <th className="px-1 font-normal">উচ্চতা</th>
                <th className={`rounded-t-md px-1 font-normal ${X9_LIT} ${col ? "bg-cat-blue/10" : ""}`}>ওজন</th>
              </tr>
            </thead>
            <tbody>
              {FIVE.map((p) => (
                <tr key={p.n} className="leading-[1.15rem]">
                  <td className="pr-1 text-left text-[0.7rem] text-muted">{p.n}</td>
                  <td className="px-1 font-mono">{p.v[0]}</td>
                  <td className={`px-1 font-mono ${X9_LIT} ${col ? "bg-cat-blue/10" : ""}`}>
                    <span key={k >= 4 ? "z" : "raw"} className={`${FADE} ${k >= 4 ? "font-semibold text-cat-blue" : ""}`}>
                      {k >= 4 ? sh((p.v[1] - 70) / 12) : p.v[1]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9¾ · A figure for the check's explanation, no task: inches and pounds. B's
//      and C's gaps in inches and pounds, each over a yardstick in the same
//      unit; the units strike out in pairs and the old steps are left, 1.8
//      and 0.08, 0.1 and 0.83. The twin is still C.

const X9C_ROWS = [
  {
    n: "B",
    cells: [
      { top: "7.09", bot: "3.94", u: "inch", r: "1.8" },
      { top: "2.2", bot: "26.46", u: "pound", r: "0.08" },
    ],
  },
  {
    n: "C",
    cells: [
      { top: "0.39", bot: "3.94", u: "inch", r: "0.1" },
      { top: "22.05", bot: "26.46", u: "pound", r: "0.83" },
    ],
  },
];
const X9C_SAY = [
  "B-এর পার্থক্য inch আর pound-এ, নিচে একই unit-এ scale ।",
  "B-এর পার্থক্য inch আর pound-এ, নিচে একই unit-এ scale ।",
  "C-এরও তাই।",
  "inch ÷ inch, pound ÷ pound। unit কেটে যায়, থাকে আগের সেই কয় ধাপ।",
];

export function InchPound() {
  const s = useScene(4, [600, 1600, 1500, 2600, 2200]);
  const k = s.k;
  const cut = k >= 3;

  return (
    <Scene scene={s} caption={k < 4 ? X9C_SAY[k] : <span className={FADE}>দূরত্বও আগের মতো, B 1.80 আর C 0.84। Twin C-ই থাকলো।</span>}>
      <div className="mx-auto grid w-fit grid-cols-[1.2rem_auto_auto] items-center gap-x-3 gap-y-1">
        <span />
        <span className="text-center text-xs text-muted">উচ্চতা</span>
        <span className="text-center text-xs text-muted">ওজন</span>
        {X9C_ROWS.map((row, ri) => (
          <div key={row.n} className="contents">
            <b className={`transition-[opacity,color] duration-500 motion-reduce:transition-none ${k > ri ? "" : "opacity-0"} ${k >= 4 && row.n === "C" ? "text-cat-teal" : ""}`}>{row.n}</b>
            {row.cells.map((c) => (
              <span key={c.u} className={`inline-flex items-center gap-1.5 transition-opacity duration-500 motion-reduce:transition-none ${k > ri ? "" : "opacity-0"}`}>
                <span className="grid justify-items-center">
                  <span className="whitespace-nowrap">
                    <span className="font-mono text-sm">{c.top}</span>
                    <Struck on={cut}>{c.u}</Struck>
                  </span>
                  <span className="my-0.5 h-px w-full bg-foreground/60" />
                  <span className="whitespace-nowrap">
                    <span className="font-mono text-sm">{c.bot}</span>
                    <Struck on={cut}>{c.u}</Struck>
                  </span>
                </span>
                <span className="w-12 font-mono text-sm whitespace-nowrap">{cut && <span className={`${FADE} delay-500`}>≈ <b className="text-cat-teal">{c.r}</b></span>}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10 · «মেলার ঝুলি»। Seven stalls, one line each, then the last tap: can two
//      vectors be multiplied? No gate; the teaser points at Article 4.

const BAG = [
  { stall: "গুপ্তধন", n: "৩.১", say: "যোগ মানে ঘরে ঘরে যোগ। বিয়োগ মানে এক জায়গা থেকে আরেক জায়গায় যাওয়ার arrow।" },
  { stall: "শরবত", n: "৩.২", say: "λ দিয়ে গুণ করলে arrow লম্বা,ছোট বা উল্টো হয়, কিন্তু নিজের লাইন ছাড়ে না।" },
  { stall: "টিফিন", n: "৩.৩", say: "কিছুটা এটা, কিছুটা ওটা, এটাই linear combination। average-ও আসলে একটা recipe।" },
  { stall: "ফিতা", n: "৩.৪", say: "‖v‖ মানে length, মানে বর্গ, যোগ, root। আর দুইজনের দূরত্ব মানে ‖a − b‖।" },
  { stall: "কাক আর রাজা", n: "৩.৫", say: "length মাপার তিনটা ফিতা: কাক L2, পথিক L1, আর রাজা L∞।" },
  { stall: "movie club", n: "৩.৬", say: "Row-কে নিজের length দিয়ে ভাগ করলে থাকে শুধু দিক, v̂।" },
  { stall: "scale ", n: "৩.৭", say: "Column-কে তার scale  দিয়ে ভাগ করলে unit কেটে যায়, z-score।" },
];

export function Finale() {
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [teaser, setTeaser] = useSeed("teaser", false);
  const all = open.length === BAG.length;

  return (
    <>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {BAG.map((b, i) => {
          const on = open.includes(i);
          return (
            <button
              key={b.n}
              type="button"
              aria-expanded={on}
              onClick={() => !on && setOpen([...open, i])}
              className={`flex min-h-16 cursor-pointer flex-col items-start justify-center rounded-xl border-2 px-3 py-2 text-left transition-colors motion-reduce:transition-none ${
                on ? "cursor-default border-cat-teal/40 bg-cat-teal/5" : "border-border hover:border-cat-teal/60"
              }`}
            >
              <span className="text-xs text-muted">
                {b.n} · {b.stall}
              </span>
              {on ? <span className={`${FADE} text-[0.92rem] leading-snug`}>{b.say}</span> : <span className="text-sm text-cat-teal">ঝুলি থেকে বের করুন</span>}
            </button>
          );
        })}
      </div>
      {all && !teaser && (
        <div className={`${FADE} mt-4 flex justify-center`}>
          <button type="button" onClick={() => setTeaser(true)} className={primaryBtn}>
            শেষ প্রশ্ন, দুইটা vector-কে কি গুণ করা যায়?
          </button>
        </div>
      )}
      {teaser && (
        <div className={`${FADE} mx-auto mt-4 max-w-md rounded-2xl bg-cat-violet/5 px-4 py-3 text-center text-[0.95rem]`}>
          <div className="font-mono">(2, 5) আর (5, 2), ঘরে ঘরে গুণ → (10, 10)</div>
          <div className="mt-1">
            যায়, কিন্তু তাতে পাওয়া যায় আরেকটা list, যার তেমন কোনো মানেই নাই। কাজের গুণটা ফেরত দেয় <b>একটাই সংখ্যা</b>: দুইটা arrow কতটা একই দিকে। মনে আছে movie club-এর black box?
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 10¼ · A figure for screen 10's explanation, no task: two moves and one
//       measure, and everything else built from them. যোগ, stretch and
//       length on top; then বিয়োগ, average, দূরত্ব and normalise each appear
//       below with lines to what it is made of.

type X10Node = { x: number; y: number; w: number; text: string };
const X10_BASE: Record<"add" | "stretch" | "len", X10Node> = {
  add: { x: 58, y: 24, w: 40, text: "যোগ" },
  stretch: { x: 150, y: 24, w: 54, text: "stretch" },
  len: { x: 242, y: 24, w: 48, text: "length" },
};
const X10_MADE: { node: X10Node; from: string[]; color: string; line: string }[] = [
  { node: { x: 40, y: 98, w: 46, text: "বিয়োগ" }, from: ["M58 34L40 88", "M150 34L40 88"], color: "#e11d48", line: "stroke-[#e11d48]" },
  { node: { x: 114, y: 98, w: 56, text: "average" }, from: ["M58 34L114 88", "M150 34L114 88"], color: "#d97706", line: "stroke-[#d97706]" },
  { node: { x: 190, y: 98, w: 48, text: "দূরত্ব" }, from: ["M40 108Q115 128 190 108", "M242 34L190 88"], color: "#1d4ed8", line: "stroke-[#1d4ed8]" },
  { node: { x: 262, y: 98, w: 62, text: "normalise" }, from: ["M242 34L262 88", "M150 34L262 88"], color: "#7c3aed", line: "stroke-[#7c3aed]" },
];
const X10_SAY = [
  "দুইটা চাল, যোগ আর stretch। আর একটা মাপ, length।",
  "দুইটা চাল, যোগ আর stretch। আর একটা মাপ, length।",
  "বিয়োগ হলো উল্টে দিয়ে যোগ।",
  "Average হলো যোগ করে stretch।",
  "দূরত্ব হলো বিয়োগের length।",
];

function X10Chip({ n, color, base = false }: { n: X10Node; color: string; base?: boolean }) {
  return (
    <g className={POP}>
      <rect x={n.x - n.w / 2} y={n.y - 10} width={n.w} height={20} rx={10} fill={base ? color : "white"} stroke={color} strokeWidth={1.6} />
      <text x={n.x} y={n.y + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={base ? "white" : color}>
        {n.text}
      </text>
    </g>
  );
}

export function ThreeTools() {
  const s = useScene(5, [600, 1600, 1800, 1800, 1800, 2000]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 5 ? X10_SAY[k] : <span className={FADE}>আর দুই রকম normalise হলো length বা scale  দিয়ে ভাগ। বাকি সব এই তিনটা থেকেই।</span>}>
      <svg viewBox="0 0 300 126" role="img" aria-label="add, stretch and length on top; subtraction, average, distance and normalise built from them below" className="mx-auto block h-auto w-full max-w-[17.5rem]">
        <rect x={2} y={2} width={296} height={122} rx={5} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        {X10_MADE.map((m, i) =>
          k >= i + 2 ? (
            <g key={m.node.text}>
              {m.from.map((d, j) => (
                <Draw key={d} d={d} delay={j * 250} ms={600} strokeWidth={1.5} className={m.line} />
              ))}
            </g>
          ) : null,
        )}
        {k >= 1 && Object.values(X10_BASE).map((n) => <X10Chip key={n.text} n={n} color="#0d9488" base />)}
        {X10_MADE.map((m, i) => (k >= i + 2 ? <X10Chip key={m.node.text} n={m.node} color={m.color} /> : null))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for screen 10's explanation, no task: a choice hidden in
//       every sum. One arrow, (3, 4), measured with 3.5's three tapes: the
//       crow's 5, the walker's 7, the king's 4. The arrow never changes; the
//       number says which tape was picked.

const X10B_U = 18;
const x10bX = (x: number) => 10 + x * X10B_U;
const x10bY = (y: number) => 100 - y * X10B_U;
const X10B_TAPES = [
  { name: "কাকের মাপ", n: 5, d: `M${x10bX(0)} ${x10bY(0)}L${x10bX(3)} ${x10bY(4)}`, stroke: "stroke-[#0d9488]", ink: "text-cat-teal", swatch: "bg-cat-teal" },
  { name: "পথিকের মাপ", n: 7, d: `M${x10bX(0)} ${x10bY(0)}H${x10bX(3)}V${x10bY(4)}`, stroke: "stroke-[#e11d48]", ink: "text-cat-coral", swatch: "bg-cat-coral" },
  { name: "রাজার মাপ", n: 4, d: `M${x10bX(0)} ${x10bY(0)}L${x10bX(3)} ${x10bY(3)}V${x10bY(4)}`, stroke: "stroke-[#7c3aed]", ink: "text-cat-violet", swatch: "bg-cat-violet" },
];
const X10B_SAY = ["একই arrow, (3, 4)।", "একই arrow, (3, 4)।", "কাকের ফিতায় মাপলে 5।", "পথিকের ফিতায় 7।", "রাজার ফিতায় 4।"];

export function HiddenChoice() {
  const s = useScene(5, [600, 1300, 1700, 1700, 1700, 2200]);
  const k = s.k;
  const grid = Array.from({ length: 6 }, (_, i) => `M${x10bX(i)} ${x10bY(0)}V${x10bY(5)}M${x10bX(0)} ${x10bY(i)}H${x10bX(5)}`).join("");

  return (
    <Scene scene={s} caption={k < 5 ? X10B_SAY[k] : <span className={FADE}>Arrow বদলায়নি, বদলেছে choice। সংখ্যাটা সেই choice এর basis এ উত্তর পালটাচ্ছে।</span>}>
      <div className="mx-auto flex max-w-xs items-center justify-center gap-4">
        <svg viewBox="0 0 110 110" role="img" aria-label="the arrow (3, 4) measured three ways: 5 by the crow, 7 by the walker, 4 by the king" className="block h-auto w-28 shrink-0">
          <rect x={1} y={1} width={108} height={108} rx={4} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
          <path d={grid} strokeWidth={0.6} className="fill-none stroke-cat-blue/25" />
          {k >= 1 && (
            <g className={FADE}>
              <path d={`M${x10bX(0)} ${x10bY(0)}L${x10bX(3)} ${x10bY(4)}`} strokeWidth={1.6} className="stroke-[#0f1b2d]/60" />
              <circle cx={x10bX(3)} cy={x10bY(4)} r={3} className={INK} />
              <circle cx={x10bX(0)} cy={x10bY(0)} r={2.4} className={INK} />
            </g>
          )}
          {X10B_TAPES.map((t, i) => (k >= i + 2 ? <Draw key={t.name} d={t.d} ms={900} strokeWidth={3} className={t.stroke} /> : null))}
        </svg>
        <div className="grid gap-1.5">
          {X10B_TAPES.map((t, i) => (
            <div key={t.name} className={`flex items-center gap-2 transition-opacity duration-500 motion-reduce:transition-none ${k >= i + 2 ? "" : "opacity-0"}`}>
              <i className={`h-1 w-5 shrink-0 rounded ${t.swatch}`} />
              <span className="text-sm">{t.name}</span>
              <b className={`font-mono text-lg ${t.ink}`}>{t.n}</b>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10¾ · A figure for screen 10's explanation, no task: the question to take
//       home, left open. A দাঁড়িপাল্লা with উচ্চতা and ওজন; ডাক্তার আপা
//       would tip it toward weight, the data would level it, Shiku the model
//       offers to learn it himself. Then only a question mark over the beam.

const X10C_Y = 150;
const X10C_P = { x: 150, y: 64 };
const X10C_L = 42;
const X10C_TILT = [0, 0, 9, 0, -7, 0];

export function WhoDecides() {
  const s = useScene(5, [600, 1400, 2300, 2300, 2400, 2400]);
  const k = s.k;
  const tilt = X10C_TILT[k];
  const dy = X10C_L * Math.sin((tilt * Math.PI) / 180);
  const swing = "transition-transform duration-1000 ease-in-out motion-reduce:transition-none";

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="a balance with height and weight: ডাক্তার আপা would weigh weight more, the data would level them, and Shiku the model offers to learn it himself; who should decide?">
        <rect x={X10C_P.x - 14} y={X10C_Y - 4} width={28} height={4} rx={1} fill="#78350f" />
        <path d={`M${X10C_P.x} ${X10C_Y - 2}V${X10C_P.y}`} stroke="#78350f" strokeWidth={4} />
        <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: `${X10C_P.x}px ${X10C_P.y}px` }} className={swing}>
          <path d={`M${X10C_P.x - X10C_L} ${X10C_P.y}H${X10C_P.x + X10C_L}`} stroke="#92400e" strokeWidth={3.5} strokeLinecap="round" />
        </g>
        <circle cx={X10C_P.x} cy={X10C_P.y} r={3.5} fill="#b45309" />
        {[
          { side: -1, text: "উচ্চতা", fill: "#1d4ed8" },
          { side: 1, text: "ওজন", fill: "#7c3aed" },
        ].map(({ side, text, fill }) => {
          const px = X10C_P.x + side * X10C_L;
          return (
            <g key={side} style={{ transform: `translateY(${side * dy}px)` }} className={swing}>
              <path d={`M${px} ${X10C_P.y}L${px - 14} ${X10C_P.y + 34}M${px} ${X10C_P.y}L${px + 14} ${X10C_P.y + 34}`} stroke="#a8a29e" strokeWidth={0.9} />
              <path d={`M${px - 18} ${X10C_P.y + 34}q18 8 36 0Z`} fill="#b45309" />
              <rect x={px - 15} y={X10C_P.y + 19} width={30} height={15} rx={2} fill={fill} />
              <text x={px} y={X10C_P.y + 29.5} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white">
                {text}
              </text>
            </g>
          );
        })}
        <Person who="apa" x={46} y={X10C_Y} arm={k === 2 ? "point" : "down"} mood={k >= 5 ? "puzzled" : "plain"} label />
        {k === 2 && <Bubble x={46} y={X10C_Y - 66} side="right" lines={["ওজনের দাম", "বেশি হোক?"]} />}
        {k >= 3 && (
          <g className={POP}>
            <path d="M246 150V112" stroke="#78350f" strokeWidth={2.5} />
            <rect x={226} y={88} width={40} height={26} rx={2} fill="white" stroke="#44403c" strokeWidth={1} />
            {Array.from({ length: 6 }, (_, i) => (
              <rect key={i} x={231 + (i % 2) * 16} y={92 + Math.floor(i / 2) * 7} width={14} height={4.5} rx={0.8} fill="#1d4ed8" fillOpacity={0.3} />
            ))}
            <text x={246} y={126} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={S_INK} className="font-mono">
              data
            </text>
          </g>
        )}
        {k === 3 && <Bubble x={246} y={84} tone="think" lines={["সব feature-এ", "সমান সুযোগ?"]} />}
        <Robot x={k >= 4 ? 294 : 350} y={X10C_Y} walking={k === 4} ms={1400} />
        {k === 4 && <Bubble x={294} y={104} side="left" lines={["আমি নিজেই", "শিখে নেবো?"]} />}
        {k >= 5 && (
          <text x={X10C_P.x} y={46} textAnchor="middle" fontSize={26} fontWeight={800} fill="#7c3aed" className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  TwinStall: { crowd: { k: 2 }, running: { k: 3 }, done: {} },
  WaysToWeigh: { box: { k: 2 }, dial: { k: 3 }, done: {} },
  AlwaysKg: { claim: { k: 1 }, objection: { k: 2 }, done: {} },
  FiveHeights: { cards: { k: 2 }, done: {} },
  BackToABC: { cards: { k: 3 }, done: {} },
  TanvirGrams: { typed: { k: 3 }, dial: { k: 4 }, done: {} },
  DataFrom: { twin: { k: 1 }, wait: { k: 2 }, five: { k: 4 }, done: {} },
  OneWordTwoStalls: { mama: { k: 2 }, done: {} },
  KgVsGram: { start: {}, one: { guess: 0, ran: [0] }, both: { guess: 2, ran: [0, 1] } },
  UnitDial: { start: {}, pound: { u: 2, seen: [1, 2] }, all: { u: 3, seen: [1, 2, 0, 3] } },
  TwoCrowds: { start: {}, miss: { picks: [null, null], miss: { c: 0, n: 1 } }, done: { picks: [0, 1] } },
  SpreadMachine: {
    start: {},
    squares: { stages: [3, 0] },
    height: { stages: [5, 0] },
    weight: { stages: [5, 4] },
    all: { stages: [5, 5] },
  },
  Yardstick: { start: {}, half: { guess: 0, conv: ["B0", "C1"] }, done: { guess: 0, conv: ["B0", "B1", "C0", "C1"], measured: true } },
  UnitsCancel: { start: {}, gram: { u: 3, seen: [1, 3] }, pound: { u: 2, seen: [1, 3, 0, 2] } },
  ZScore: { start: {}, miss: { placed: 1, miss: { z: 1, n: 1 } }, all: { placed: 3 } },
  NotTheTruth: { start: {}, twelve: { guess: 0 }, flip: { guess: 1, yw: 5.5, visited: [12, 6, 5.5] } },
  TwoNormalises: { start: {}, miss: { done: 2, miss: 1 }, all: { done: 6 } },
  Finale: { start: {}, some: { open: [0, 3, 6] }, teaser: { open: [0, 1, 2, 3, 4, 5, 6], teaser: true } },
  OneChange: { mid: { k: 3 }, done: {} },
  WhichTwin: { mid: { k: 2 }, done: {} },
  EqualPrice: { mid: { k: 2 }, done: {} },
  TenKgSpan: { mid: { k: 2 }, done: {} },
  DataStick: { mid: { k: 3 }, done: {} },
  NewStudent: { mid: { k: 3 }, done: {} },
  LengthVsSpread: { mid: { k: 3 }, done: {} },
  TwoSticks: { mid: { k: 2 }, done: {} },
  StickSteps: { mid: { k: 2 }, done: {} },
  SameTwinNow: { mid: { k: 2 }, done: {} },
  OneLine: { mid: { k: 2 }, done: {} },
  TwoSchools: { mid: { k: 2 }, done: {} },
  ApaWeight: { mid: { k: 2 }, done: {} },
  TrustAnswer: { mid: { k: 2 }, done: {} },
  RowVsColumn: { mid: { k: 2 }, done: {} },
  InchPound: { mid: { k: 2 }, done: {} },
  ThreeTools: { mid: { k: 3 }, done: {} },
  HiddenChoice: { mid: { k: 3 }, done: {} },
  WhoDecides: { mid: { k: 4 }, done: {} },
};
