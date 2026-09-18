"use client";

import { useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Laptop, Nope, Out, POP, Speech, Ticks, predictLook, primaryBtn, quietBtn, useCountUp, usePlay, useTween } from "@/components/journey/kit";
import { Arrow, Label, Plane, clamp, makeFrame, type Tone, type XY } from "@/components/journey/plane";
import { bn } from "./figure-kit";

// Screens for "Math for AI 2.4 — মাঝির বাতাস আর golf ball".
//
// Things that really are arrows. A boatman given the wind's strength alone,
// then its direction alone, can set his sail with neither. Two buses share a
// speed and not a velocity, which is where "scalar" gets its name. Shom and
// Samin push the table from both sides as hard as they can and it does not
// move: the push adds to the zero vector. A golf ball thrown east from a car
// going north flies off diagonally, faster than either (a teaser; the sum is
// the next lesson's). Then the turn: Nasib's (180, 78) points nowhere, and we
// treat it as an arrow by choice — the same arrow under three lenses, and a
// grocer whose "nearest customer" is decided by phone numbers.
//
// The scenes are drawn on theme tokens (a river, a road, a classroom floor);
// the abstract arrows sit on the white sheet from journey/plane.

function MajhiSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="মাঝি চাচা" initial="মা" tint="blue" {...props} />;
}

function SaminSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="সামিন" initial="সা" tint="blue" {...props} />;
}

function JamalSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="জামাল ভাই" initial="জা" tint="teal" {...props} />;
}

const at =(o: XY, v: XY, r: number): XY => [o[0] + v[0] * r, o[1] + v[1] * r];

// ---------------------------------------------------------------------------
// 1 · The boatman. Strength alone: every direction is possible. Direction
//     alone: every strength is. Both: one arrow, and the sail fills.

const FW = makeFrame(0, 10, 0, 6.5, 32, 8);
const BOAT: XY = [5.4, 2.8];
const NE: XY = [Math.SQRT1_2, Math.SQRT1_2];
const WIND_TAIL = at(BOAT, NE, -3.6);
const WIND_LEN = 2.7;

type Report = "speed" | "dir" | "both";
const REPORTS: { id: Report; label: string; say: string; tone: "bad" | "good" }[] = [
  {
    id: "speed",
    label: "“ঘণ্টায় 20 km”",
    say: "২০ কিলোমিটার তো বুঝলাম বাবা, কিন্তু আসতেছে কোন দিক থেকে? পাল কোন দিকে ঘুরামু, বুঝতেছি না।",
    tone: "bad",
  },
  {
    id: "dir",
    label: "“দক্ষিণ-পশ্চিম থেকে”",
    say: "দক্ষিণ-পশ্চিম থেকে, বুঝলাম। কিন্তু কত জোরে? ঝড় হইলে তো পাল নামায়া রাখতে হবে।",
    tone: "bad",
  },
  { id: "both", label: "“দক্ষিণ-পশ্চিম থেকে, ঘণ্টায় 20 km”", say: "এইবার হইছে! পাল এইদিকে ঘুরাইলাম, চলো যাই।", tone: "good" },
];

export function WindReport() {
  const pass = useGate();
  const [rep, setRep] = useState<Report | null>(null);
  const [tried, setTried] = useState<Report[]>([]);
  const full = rep === "both";
  const mast: XY = [FW.sx(BOAT[0]), FW.sy(BOAT[1] + 1.1)];

  const pick = (r: Report) => {
    setRep(r);
    if (tried.includes(r)) return;
    const next = [...tried, r];
    setTried(next);
    if (next.length === REPORTS.length) pass("জোর আর দিক মিলে একটা vector।");
  };

  let waves = "";
  for (let y = 1.6; y < 5; y += 0.9) for (let x = 0.6; x < 9.5; x += 2.2) waves += `M${FW.sx(x)} ${FW.sy(y)}q8 -5 16 0t16 0`;

  return (
    <>
      <Plane f={FW} paper={false} grid={0} axes={false} label="a sailing boat on a river, and what you know about the wind" className="max-w-[24rem]">
        <rect x={FW.sx(0)} y={FW.sy(6.5)} width={10 * FW.u} height={6.5 * FW.u} rx={14} className="fill-cat-teal/15" />
        <rect x={FW.sx(0)} y={FW.sy(5.2)} width={10 * FW.u} height={4.2 * FW.u} className="fill-cat-blue/15" />
        <path d={waves} strokeWidth={1.2} strokeLinecap="round" className="fill-none stroke-cat-blue/30" />
        <text x={FW.sx(10) - 10} y={FW.sy(6.5) + 16} textAnchor="end" fontSize={11} fontWeight={700} className="fill-muted">
          উ ↑
        </text>

        {rep === "speed" && (
          <g key="speed" className={FADE}>
            {Array.from({ length: 8 }, (_, k) => {
              const u: XY = [Math.cos((k * Math.PI) / 4), Math.sin((k * Math.PI) / 4)];
              return <Arrow key={k} f={FW} from={at(BOAT, u, 1.5)} to={at(BOAT, u, 2.5)} tone="teal" faint />;
            })}
            <Label f={FW} at={[BOAT[0], BOAT[1] + 2.9]} className="fill-foreground">
              20 km/h, কিন্তু কোন দিকে?
            </Label>
          </g>
        )}
        {rep === "dir" && (
          <g key="dir" className={FADE}>
            {[0.9, 1.8, 2.7, 3.4].map((l) => (
              <Arrow key={l} f={FW} from={WIND_TAIL} to={at(WIND_TAIL, NE, l)} tone="teal" faint dashed />
            ))}
            <Label f={FW} at={at(WIND_TAIL, NE, 1.2)} dx={10} dy={14} anchor="start" className="animate-pulse fill-foreground">
              কত জোরে?
            </Label>
          </g>
        )}
        {full && (
          <g key="both">
            <Arrow f={FW} from={WIND_TAIL} to={at(WIND_TAIL, NE, WIND_LEN)} tone="teal" w={4.5} draw />
            <Label f={FW} at={at(WIND_TAIL, NE, 1.1)} dx={12} dy={12} anchor="start" className={`${POP} fill-cat-teal`}>
              20 km/h
            </Label>
          </g>
        )}

        {/* The boat. It drifts off north-east once the sail is set. */}
        <g
          style={{ transform: full ? "translate(34px, -22px)" : "none" }}
          className="transition-transform duration-[2500ms] ease-out motion-reduce:transition-none"
        >
          <path
            d={`M${FW.sx(BOAT[0] - 1.1)} ${FW.sy(BOAT[1])}Q${FW.sx(BOAT[0])} ${FW.sy(BOAT[1] - 0.8)} ${FW.sx(BOAT[0] + 1.1)} ${FW.sy(BOAT[1])}Z`}
            className="fill-foreground/70"
          />
          <path d={`M${mast[0]} ${FW.sy(BOAT[1])}V${FW.sy(BOAT[1] + 2.2)}`} strokeWidth={2} className="stroke-foreground/70" />
          <polygon
            points={`${mast[0]},${FW.sy(BOAT[1] + 2.1)} ${mast[0]},${FW.sy(BOAT[1] + 0.2)} ${mast[0] + 42},${FW.sy(BOAT[1] + 1.0)}`}
            style={{ transform: `scaleX(${full ? 1 : 0.18})`, transformOrigin: `${mast[0]}px ${mast[1]}px`, transformBox: "view-box" }}
            strokeWidth={1.5}
            className="fill-surface stroke-foreground/70 transition-transform duration-700 motion-reduce:transition-none"
          />
        </g>
      </Plane>
      <div className="grid gap-2">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => pick(r.id)}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left transition-colors ${
              rep === r.id ? "border-cat-teal bg-cat-teal/10" : "border-border hover:border-cat-teal/60"
            }`}
          >
            <span className="text-sm text-muted">মাঝি চাচাকে বলুন:</span>
            <b className="font-semibold">{r.label}</b>
            {tried.includes(r.id) && <span className="ml-auto text-accent-text">✓</span>}
          </button>
        ))}
      </div>
      {rep && (
        <MajhiSays key={rep} tone={REPORTS.find((r) => r.id === rep)!.tone}>
          {REPORTS.find((r) => r.id === rep)!.say}
        </MajhiSays>
      )}
      <Task done={tried.length === REPORTS.length}>
        তিন রকম খবরই দিয়ে দেখুন ({bn(tried.length)}/{bn(REPORTS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Two buses. The dashed ring is every velocity with speed 60: land on it
//     away from north for the same speed, on north for the same velocity.

const FB = makeFrame(-4, 4, -4, 4, 26, 18);
const COMPASS8 = [
  { w: "উত্তর", a: 90 },
  { w: "উত্তর-পূর্ব", a: 45 },
  { w: "পূর্ব", a: 0 },
  { w: "দক্ষিণ-পূর্ব", a: -45 },
  { w: "দক্ষিণ", a: -90 },
  { w: "দক্ষিণ-পশ্চিম", a: -135 },
  { w: "পশ্চিম", a: 180 },
  { w: "উত্তর-পশ্চিম", a: 135 },
];
/** 20 km/h to a square */
const vel = (speed: number, deg: number): XY => [(speed / 20) * Math.cos((deg * Math.PI) / 180), (speed / 20) * Math.sin((deg * Math.PI) / 180)];
const BUS_A = vel(60, 90);

export function BusVelocity() {
  const pass = useGate();
  const [dir, setDir] = useState(4);
  const [speed, setSpeed] = useState(40);
  const [got, setGot] = useState<string[]>([]);
  const b = vel(speed, COMPASS8[dir].a);
  const sameSpeed = speed === 60;
  const sameVel = sameSpeed && dir === 0;

  const check = (d: number, s: number) => {
    if (s !== 60) return;
    const k = d === 0 ? "vel" : "speed";
    if (got.includes(k)) return;
    const next = [...got, k];
    setGot(next);
    if (next.length === 2) pass("Speed শুধু সংখ্যা, velocity-তে দিকও।");
  };

  return (
    <>
      <Plane f={FB} paper={false} grid={0} axes={false} label="two velocity arrows from one point" className="max-w-[18rem]">
        <circle cx={FB.sx(0)} cy={FB.sy(0)} r={3 * FB.u} strokeDasharray="4 5" strokeWidth={1.2} className="fill-foreground/[0.03] stroke-muted/60" />
        <Label f={FB} at={[0, 3.6]} className="fill-muted">
          উ
        </Label>
        <Label f={FB} at={[0, -3.8]} className="fill-muted">
          দ
        </Label>
        <Label f={FB} at={[3.7, -0.1]} className="fill-muted">
          পূ
        </Label>
        <Label f={FB} at={[-3.7, -0.1]} className="fill-muted">
          প
        </Label>
        <Label f={FB} at={[2.3, -2.5]} size={9} weight={400} className="fill-muted">
          speed 60
        </Label>
        <Arrow f={FB} from={[0, 0]} to={BUS_A} tone="blue" w={4} />
        <Arrow f={FB} from={[0, 0]} to={b} tone="coral" w={sameVel ? 2.4 : 4} dashed={sameVel} />
        <circle cx={FB.sx(0)} cy={FB.sy(0)} r={3.5} className="fill-foreground" />
      </Plane>
      <div className="mx-auto grid max-w-md gap-2 text-[0.95rem]">
        <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
          <span className="size-3 shrink-0 rounded-full bg-cat-blue" />
          <span className="min-w-0 flex-1">বাস ক, ঢাকা থেকে ময়মনসিংহ</span>
          <span className="font-mono">60 km/h, উত্তরে</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
          <span className="size-3 shrink-0 rounded-full bg-cat-coral" />
          <span className="min-w-0 flex-1">বাস খ, আপনি চালাচ্ছেন</span>
          <span className="font-mono">
            {speed} km/h{speed ? `, ${COMPASS8[dir].w}ে` : ""}
          </span>
        </div>
        <div className="text-center">
          speed <b className={sameSpeed ? "text-accent-text" : ""}>{sameSpeed ? "একই" : "আলাদা"}</b> · velocity{" "}
          <b className={sameVel ? "text-accent-text" : ""}>{sameVel ? "একই" : "আলাদা"}</b>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {COMPASS8.map((c, i) => (
          <button
            key={c.w}
            type="button"
            aria-pressed={dir === i}
            onClick={() => {
              setDir(i);
              check(i, speed);
            }}
            className={`cursor-pointer rounded-full border-2 px-2.5 py-1 text-sm font-semibold transition-colors ${
              dir === i ? "border-cat-coral bg-cat-coral text-white" : "border-border hover:border-cat-coral/60"
            }`}
          >
            {c.w}
          </button>
        ))}
      </div>
      <label className="mx-auto mt-3 flex max-w-sm items-center gap-3">
        <span className="shrink-0 text-sm text-muted">বাস খ-এর speed</span>
        <input
          type="range"
          min={0}
          max={80}
          step={10}
          value={speed}
          aria-label="বাস খ-এর speed"
          onChange={(e) => {
            const s = Number(e.target.value);
            setSpeed(s);
            check(dir, s);
          }}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-coral)]"
        />
        <span className="w-16 shrink-0 text-right font-mono text-sm">{speed} km/h</span>
      </label>
      <Ticks
        items={[
          ["speed এক, velocity আলাদা", got.includes("speed")],
          ["velocity-ও হুবহু এক", got.includes("vel")],
        ]}
      />
      <Task done={got.length === 2}>বাস খ-কে এমনভাবে চালান যেন আগে শুধু speed মেলে, তারপর velocity-ও মেলে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The table. Seen from above: the two pushes as arrows on it, their sum
//     underneath, and the table slides by the sum — or shudders at zero.

const TW = 340;
const TH = 200;
const TABLE = { w: 84, h: 56, y: 62 };
const PER = 7; // px of arrow per unit of push

/** A sideways push drawn in pixels, from x1 to x2 along the line y. */
function PxArrow({ x1, y, x2, stroke, fill }: { x1: number; y: number; x2: number; stroke: string; fill: string }) {
  if (Math.abs(x2 - x1) < 2) return null;
  const s = Math.sign(x2 - x1);
  const h = Math.min(9, Math.abs(x2 - x1) * 0.6);
  return (
    <g className="pointer-events-none">
      <path d={`M${x1} ${y}H${x2 - s * h}`} strokeWidth={3.5} strokeLinecap="round" className={`fill-none ${stroke}`} />
      <path d={`M${x2} ${y}l${-s * h} ${-h * 0.55}v${h * 1.1}z`} className={fill} />
    </g>
  );
}

function Kid({ x, y, name, tone }: { x: number; y: number; name: string; tone: string }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={12} className={tone} />
      <text x={x} y={y + 25} textAnchor="middle" fontSize={10} fontWeight={600} className="fill-foreground">
        {name}
      </text>
    </g>
  );
}

export function TablePush() {
  const pass = useGate();
  const [shom, setShom] = useState(7);
  const [samin, setSamin] = useState(7);
  const [side, setSide] = useState<"right" | "left">("right");
  const [offset, setOffset] = useState(0);
  const [shake, setShake] = useState(0);
  const [got, setGot] = useState<string[]>([]);
  const [said, setSaid] = useState<"still" | "moved" | null>(null);
  const [off] = useTween([offset], 1400);
  const net = shom + (side === "left" ? samin : -samin);
  const cx = TW / 2 + off;
  const left = cx - TABLE.w / 2;
  const right = cx + TABLE.w / 2;
  const mid = TABLE.y + TABLE.h / 2;

  const push = () => {
    setOffset(clamp(net * 9, -115, 115));
    if (net === 0) setShake((s) => s + 1);
    const k = net === 0 && shom >= 5 && samin >= 5 && side === "right" ? "still" : net !== 0 ? "moved" : null;
    setSaid(net === 0 ? "still" : "moved");
    if (!k || got.includes(k)) return;
    const next = [...got, k];
    setGot(next);
    if (next.length === 2) pass("জোর যতই হোক, দিক ছাড়া চলে না।");
  };

  return (
    <>
      <svg viewBox={`0 0 ${TW} ${TH}`} role="img" aria-label={`a table pushed by Shom and Samin; total push ${net}`} className="mx-auto my-5 block h-auto w-full max-w-sm select-none">
        <rect x={0} y={0} width={TW} height={TH} rx={14} className="fill-foreground/[0.04]" />
        <g key={shake} className={shake ? "nudge" : undefined}>
          <rect x={left} y={TABLE.y} width={TABLE.w} height={TABLE.h} rx={6} strokeWidth={2} className="fill-cat-amber/25 stroke-cat-amber" />
          <path d={`M${left + 8} ${TABLE.y + 18}H${right - 8}M${left + 8} ${TABLE.y + 38}H${right - 8}`} strokeWidth={1} className="stroke-cat-amber/40" />
          <PxArrow x1={cx} x2={cx + shom * PER} y={mid - 10} stroke="stroke-cat-teal" fill="fill-cat-teal" />
          <PxArrow x1={cx} x2={cx + (side === "left" ? 1 : -1) * samin * PER} y={mid + 10} stroke="stroke-cat-coral" fill="fill-cat-coral" />
        </g>
        {side === "right" ? (
          <>
            <Kid x={left - 26} y={mid} name="সোম" tone="fill-cat-teal" />
            <Kid x={right + 26} y={mid} name="সামিন" tone="fill-cat-coral" />
          </>
        ) : (
          <>
            <Kid x={left - 26} y={mid - 16} name="" tone="fill-cat-teal" />
            <Kid x={left - 26} y={mid + 16} name="সোম, সামিন" tone="fill-cat-coral" />
          </>
        )}
        <text x={TW / 2} y={TABLE.y + TABLE.h + 44} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-muted">
          মোট ঠেলা: {net === 0 ? "0" : net > 0 ? `ডানে ${net}` : `বাঁয়ে ${-net}`}
        </text>
        <PxArrow x1={TW / 2} x2={TW / 2 + net * PER} y={TABLE.y + TABLE.h + 22} stroke="stroke-foreground" fill="fill-foreground" />
        {net === 0 && <circle cx={TW / 2} cy={TABLE.y + TABLE.h + 22} r={4} className="fill-foreground" />}
      </svg>
      <div className="mx-auto grid max-w-sm gap-2">
        {[
          { name: "সোমের জোর", v: shom, set: setShom, accent: "accent-[var(--cat-teal)]" },
          { name: "সামিনের জোর", v: samin, set: setSamin, accent: "accent-[var(--cat-coral)]" },
        ].map((s) => (
          <label key={s.name} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-medium">{s.name}</span>
            <input
              type="range"
              min={0}
              max={10}
              value={s.v}
              aria-label={s.name}
              onChange={(e) => s.set(Number(e.target.value))}
              className={`h-6 min-w-0 flex-1 cursor-pointer ${s.accent}`}
            />
            <span className="w-6 shrink-0 text-right font-mono text-sm">{s.v}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={push} className={primaryBtn}>
          ঠেলো!
        </button>
        <button type="button" onClick={() => setSide(side === "right" ? "left" : "right")} className={quietBtn}>
          {side === "right" ? "সামিন, সোমের পাশে যা" : "সামিন, আবার ওপাশে যা"}
        </button>
        <button type="button" onClick={() => setOffset(0)} className={`${quietBtn} px-3`}>
          ↺
        </button>
      </div>
      {said === "still" && (
        <SaminSays key={`s${shake}`} tone="bad">
          দুইজনেই গায়ের সব জোর দিয়ে ঠেলতেছি! নড়ে না কেন?
        </SaminSays>
      )}
      {said === "moved" && side === "left" && <SaminSays tone="good">এইবার দুইজন একই দিকে। দেখ কেমন সরে!</SaminSays>}
      <Ticks
        items={[
          ["দুইজনেই জোরে, টেবিল স্থির", got.includes("still")],
          ["টেবিলটা সরান", got.includes("moved")],
        ]}
      />
      <Task done={got.length === 2}>দুইজনকে দিয়েই জোরে ঠেলান, কিন্তু টেবিল যেন না নড়ে। তারপর এমনভাবে ঠেলান যেন টেবিলটা সরে যায়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The golf ball. Predict, then watch from above: the car keeps going
//     north, the ball keeps level with it and drifts east, and the two
//     arrows show why it went corner-wise.

const FG = makeFrame(-1.5, 6, -0.6, 5.4, 32, 12);
const GOLF_Q = [
  "সোজা পূর্ব দিকে, ঘণ্টায় 60 km",
  "সোজা উত্তরে, গাড়ির সাথে সাথে",
  "কোণাকুনি উত্তর-পূর্বে, 60-র চেয়েও জোরে",
  "কোণাকুনি উত্তর-পূর্বে, 60-র চেয়ে আস্তে",
];
const GOLF_RIGHT = 2;
const GOLF_SPEED = Math.hypot(60, 60);

function GolfScene({ play, over }: { play: boolean; over: boolean }) {
  const [t] = useTween([play ? 1 : 0], 2600, [0]);
  const car: XY = [0, 4 * t];
  const ball: XY = [4 * t, 4 * t];
  return (
    <Plane f={FG} paper={false} grid={0} axes={false} label="seen from above: a car driving north, a golf ball thrown east from its window" className="max-w-[21rem]">
      <rect x={FG.sx(FG.x0)} y={FG.sy(FG.y1)} width={(FG.x1 - FG.x0) * FG.u} height={(FG.y1 - FG.y0) * FG.u} rx={12} className="fill-cat-teal/10" />
      <rect x={FG.sx(-0.55)} y={FG.sy(FG.y1)} width={1.1 * FG.u} height={(FG.y1 - FG.y0) * FG.u} className="fill-foreground/15" />
      <path d={`M${FG.sx(0)} ${FG.sy(FG.y1)}V${FG.sy(FG.y0)}`} strokeDasharray="8 8" strokeWidth={1.5} className="stroke-surface" />
      <text x={FG.sx(FG.x1) - 8} y={FG.sy(FG.y1) + 16} textAnchor="end" fontSize={10} fontWeight={700} className="fill-muted">
        উ ↑ · পূ →
      </text>
      {t > 0.02 && (
        <>
          <path d={`M${FG.sx(0)} ${FG.sy(0)}L${FG.sx(ball[0])} ${FG.sy(ball[1])}`} strokeDasharray="2 4" strokeWidth={2} className="fill-none stroke-cat-amber" />
          {!over && <path d={`M${FG.sx(car[0])} ${FG.sy(car[1])}H${FG.sx(ball[0])}`} strokeDasharray="3 4" strokeWidth={1} className="fill-none stroke-muted/60" />}
        </>
      )}
      {over && (
        <>
          <Arrow f={FG} from={[0, 0]} to={[0, 4]} tone="blue" w={3} draw />
          <Arrow f={FG} from={[0, 0]} to={[4, 0]} tone="coral" w={3} draw delay={300} />
          <Arrow f={FG} from={[0, 0]} to={[4, 4]} tone="violet" w={3.6} draw delay={700} />
          <Label f={FG} at={[0, 4]} dx={-8} dy={4} anchor="end" className={`${POP} fill-cat-blue`}>
            গাড়ি: 60
          </Label>
          <Label f={FG} at={[4, 0]} dy={16} className={`${POP} fill-cat-coral`}>
            ছোড়া: 60
          </Label>
        </>
      )}
      <rect x={FG.sx(car[0]) - 8} y={FG.sy(car[1]) - 13} width={16} height={26} rx={5} className="fill-cat-blue" />
      <rect x={FG.sx(car[0]) - 6} y={FG.sy(car[1]) - 9} width={12} height={6} rx={2} className="fill-surface/70" />
      <circle cx={FG.sx(ball[0])} cy={FG.sy(ball[1])} r={5.5} strokeWidth={1.5} className="fill-surface stroke-foreground" />
    </Plane>
  );
}

export function GolfThrow() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  const show = usePlay(2800);
  const over = guess !== null && show.k === 1;
  const [spd] = useTween([over ? GOLF_SPEED : 0], 1400, [0]);

  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    show.play(1, () =>
      pass(
        "বল গেল কোণাকুনি, সবার চেয়ে জোরে।"),
    );
  };

  return (
    <>
      <GolfScene key={run} play={guess !== null} over={over} />
      <div className="min-h-14 text-center">
        {over && (
          <div className={FADE}>
            <div className="font-mono text-2xl font-bold text-cat-violet tabular-nums">{spd.toFixed(1)} km/h</div>
            <div className="text-sm text-muted">বলের বেগ, উত্তর-পূর্বে। কেন ঠিক এত, সেটা সামনের lesson-এ।</div>
          </div>
        )}
      </div>
      {over && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setRun((r) => r + 1);
              show.play(1);
            }}
            className={quietBtn}
          >
            ↺ আবার ছুড়ুন
          </button>
        </div>
      )}
      <div className="mt-5 text-sm font-medium text-muted">রাস্তা থেকে দেখলে বলটা কোন দিকে যাবে?</div>
      <div className="mt-2 grid gap-2">
        {GOLF_Q.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, GOLF_RIGHT)} disabled={guess !== null} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={over}>আগে guess করুন। তারপর ওপর থেকে দেখুন বলটা কোথায় যায়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · One arrow, three lenses. The numbers and the maths never change; only
//     what we say the axes mean.

const FS = makeFrame(-1, 6, -1, 4, 36, 16);
const SV: XY = [5, 3];
const LENSES = [
  {
    id: "wind",
    name: "বাতাস",
    x: "পূর্ব দিকে (km/h)",
    y: "উত্তর দিকে (km/h)",
    read: "পূর্বে 5, উত্তরে 3 km/h বেগের একটা হাওয়া",
    flip: "একই জোরের হাওয়া, ঠিক উল্টো দিক থেকে",
  },
  {
    id: "boat",
    name: "নৌকার যাত্রা",
    x: "পূর্ব দিকে (km)",
    y: "উত্তর দিকে (km)",
    read: "ঘাট থেকে পূর্বে 5 km, উত্তরে 3 km",
    flip: "যেখান থেকে এসেছিলেন, সোজা সেখানে ফেরা",
  },
  {
    id: "kids",
    name: "নাসিব − সোম",
    x: "height-এর তফাত (cm)",
    y: "weight-এর তফাত (kg)",
    read: "নাসিব সোমের চেয়ে 5 cm লম্বা, 3 kg ভারী",
    flip: "সোম − নাসিব: সোম 5 cm খাটো, 3 kg হালকা",
  },
];

export function SameArrow() {
  const pass = useGate();
  const [lens, setLens] = useState(0);
  const [seen, setSeen] = useState<number[]>([0]);
  const L = LENSES[lens];

  const pick = (i: number) => {
    setLens(i);
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (next.length === LENSES.length) pass("চশমা বদলায়, arrow বদলায় না।");
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {LENSES.map((l, i) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={lens === i}
            onClick={() => pick(i)}
            className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              lens === i ? "border-cat-violet bg-cat-violet text-white" : "border-border hover:border-cat-violet/60"
            }`}
          >
            {seen.includes(i) && lens !== i ? "✓ " : ""}
            {l.name}
          </button>
        ))}
      </div>
      <Plane f={FS} ticks={1} label={`the arrow (5, 3), read as ${L.name}`} className="max-w-[22rem]">
        <Arrow f={FS} from={[0, 0]} to={SV} tone="violet" w={3.4} />
        <Label key={`x${lens}`} f={FS} at={[FS.x1, 0]} dx={-4} dy={-7} anchor="end" size={9.5} className={`${FADE} fill-[#0f1b2d]`}>
          {L.x} →
        </Label>
        <Label key={`y${lens}`} f={FS} at={[0, FS.y1]} dx={6} dy={10} anchor="start" size={9.5} className={`${FADE} fill-[#0f1b2d]`}>
          ↑ {L.y}
        </Label>
      </Plane>
      <div className="mx-auto grid max-w-md gap-2 rounded-2xl border border-border px-4 py-3 text-[0.95rem]">
        <div>
          <b className="font-mono">(5, 3)</b>
          <span className="text-muted"> মানে </span>
          <span key={`r${lens}`} className={FADE}>
            {L.read}
          </span>
        </div>
        <div>
          <b className="font-mono">(−5, −3)</b>
          <span className="text-muted">, মানে উল্টো দিকে নিলে: </span>
          <span key={`f${lens}`} className={FADE}>
            {L.flip}
          </span>
        </div>
      </div>
      <Task done={seen.length === LENSES.length}>
        একই arrow তিনটা চশমাতেই দেখুন ({bn(seen.length)}/{bn(LENSES.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Jamal bhai's customers. With the phone number as a "feature", the
//     nearest customer to an old man is a college girl whose number happens
//     to be close to his. Find the column that is not a quantity.

type Col = "age" | "buy" | "phone";
const COLS: { id: Col; name: string }[] = [
  { id: "age", name: "বয়স" },
  { id: "buy", name: "মাসে বাজার (হাজার ৳)" },
  { id: "phone", name: "ফোন নম্বর" },
];
const CUST = [
  { name: "রহিম চাচা", v: { age: 62, buy: 12, phone: 1711234567 }, show: "01711-234567" },
  { name: "করিম চাচা", v: { age: 61, buy: 11, phone: 1911876543 }, show: "01911-876543" },
  { name: "সুমি", v: { age: 19, buy: 2, phone: 1711234580 }, show: "01711-234580" },
  { name: "নিলা", v: { age: 34, buy: 6, phone: 1815555010 }, show: "01815-555010" },
];
const fmt = (d: number) => (d < 1000 ? d.toFixed(1) : Math.round(d).toLocaleString("en-US"));
const KEEP_MSG: Record<Col, string> = {
  age: "বয়স তো আসল একটা পরিমাণ। 62 আর 61 সত্যিই কাছাকাছি, এটা বাদ দিলে কাজের তথ্য হারাবেন।",
  buy: "বাজারের টাকাও আসল পরিমাণ। 12 হাজার আর 11 হাজার সত্যিই কাছাকাছি।",
  phone: "",
};

export function PhoneTrap() {
  const pass = useGate();
  const [off, setOff] = useState<Col[]>([]);
  const [miss, setMiss] = useState<{ n: number; col: Col } | null>(null);
  const on = COLS.filter((c) => !off.includes(c.id));
  const me = CUST[0];
  const ranked = CUST.slice(1)
    .map((c) => ({ c, d: Math.sqrt(on.reduce((s, col) => s + (c.v[col.id] - me.v[col.id]) ** 2, 0)) }))
    .sort((a, b) => a.d - b.d);
  const top = ranked[0].c;
  const fixed = off.includes("phone");

  const toggle = (col: Col) => {
    const next = off.includes(col) ? off.filter((c) => c !== col) : [...off, col];
    setOff(next);
    if (col !== "phone" && !off.includes(col)) setMiss((m) => ({ n: (m?.n ?? 0) + 1, col }));
    else setMiss(null);
    if (col === "phone" && next.includes("phone")) pass("ফোন নম্বরের “দূরত্ব”-এর মানে নাই।");
  };

  return (
    <>
      <div className="mt-5 overflow-x-auto">
        <table className="mx-auto border-separate border-spacing-x-2 border-spacing-y-1 text-[0.92rem]">
          <thead>
            <tr>
              <th />
              {COLS.map((c) => (
                <th key={c.id}>
                  <button
                    type="button"
                    aria-pressed={!off.includes(c.id)}
                    onClick={() => toggle(c.id)}
                    className={`cursor-pointer rounded-full border-2 px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      off.includes(c.id) ? "border-dashed border-danger/50 text-danger line-through" : "border-border hover:border-cat-blue/60"
                    }`}
                  >
                    {c.name}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CUST.map((c, i) => (
              <tr key={c.name} className={i === 0 ? "font-semibold" : ""}>
                <td className="pr-2 whitespace-nowrap">{c.name}</td>
                <td className={`text-center font-mono ${off.includes("age") ? "text-muted/50" : ""}`}>{c.v.age}</td>
                <td className={`text-center font-mono ${off.includes("buy") ? "text-muted/50" : ""}`}>{c.v.buy}</td>
                <td className={`text-center font-mono whitespace-nowrap ${off.includes("phone") ? "text-muted/50 line-through" : ""}`}>{c.show}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-center">
        <Laptop file="offer.py">
          <Out>$ python offer.py রহিম</Out>
          {ranked.map(({ c, d }) => (
            <Out key={`${c.name}${on.length}`} tone={c === top ? "ok" : "dim"}>
              {c === top ? "→ " : "  "}
              {c.name}: {fmt(d)}
            </Out>
          ))}
          <Out key={top.name} tone="plain">
            সবচেয়ে কাছে: {top.name}
          </Out>
        </Laptop>
      </div>
      {top.name === "সুমি" ? (
        <JamalSays tone="bad">সুমি? ও তো কলেজে পড়ে! রহিম চাচার চিনি-ছাড়া বিস্কুটের offer ওরে পাঠামু?</JamalSays>
      ) : (
        fixed && <JamalSays tone="good">করিম চাচা! এইবার ঠিক আছে। দুইজন একই বয়সী, বাজারও করে একই রকম।</JamalSays>
      )}
      {miss && !fixed && <Nope key={miss.n}>{KEEP_MSG[miss.col]}</Nope>}
      <Task done={fixed}>কোন column-টা হিসাব নষ্ট করছে? ওটার নামে tap করে ওটাকে বাদ দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The last picture: real arrows solid, chosen arrows dashed.

const FF = makeFrame(-4.2, 4.2, -3.2, 3.2, 30, 16);
const REEL: { to: XY; name: string; tone: Tone; chosen?: boolean; dx: number; dy: number; anchor: "start" | "middle" | "end" }[] = [
  { to: [-2.4, 2.0], name: "বাতাস", tone: "teal", dx: -4, dy: -6, anchor: "end" },
  { to: [0.3, 2.7], name: "বাস", tone: "blue", dx: 6, dy: -4, anchor: "start" },
  { to: [2.6, 1.9], name: "golf ball", tone: "violet", dx: 6, dy: -4, anchor: "start" },
  { to: [-3.2, -0.5], name: "ঠেলা", tone: "amber", dx: 0, dy: 16, anchor: "middle" },
  { to: [2.9, -1.2], name: "নাসিব − সোম", tone: "coral", chosen: true, dx: 0, dy: 16, anchor: "middle" },
  { to: [-1.0, -2.6], name: "king − man", tone: "coral", chosen: true, dx: 6, dy: 12, anchor: "start" },
];

function FinaleReel({ onReplay }: { onReplay: () => void }) {
  const k = useCountUp(REEL.length + 1, 750);
  return (
    <>
      <Plane f={FF} grid={1} label="arrows that really are arrows drawn solid, arrows we chose to see drawn dashed" className="max-w-[21rem]">
        {REEL.slice(0, k).map((r) => (
          <g key={r.name}>
            <Arrow f={FF} from={[0, 0]} to={r.to} tone={r.tone} w={3} dashed={r.chosen} />
            <Label f={FF} at={r.to} dx={r.dx} dy={r.dy} anchor={r.anchor} size={10} className={`${POP} fill-[#0f1b2d]`}>
              {r.name}
            </Label>
          </g>
        ))}
      </Plane>
      <div className="min-h-24 text-center">
        {k > REEL.length && (
          <div className={FADE}>
            <div className="text-lg font-bold">
              ভরাট দাগ: সত্যিকারের arrow <span className="text-muted">·</span> ভাঙা দাগ: আমাদের বেছে নেওয়া
            </div>
            <div className="text-muted">অঙ্ক দুইটার জন্যই এক। মানে ঠিক রাখার দায়িত্ব আমাদের।</div>
            <button
              type="button"
              onClick={onReplay}
              className="mt-3 cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              ↺ আবার দেখুন
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function Finale() {
  const [run, setRun] = useState(0);
  return <FinaleReel key={run} onReplay={() => setRun((r) => r + 1)} />;
}
