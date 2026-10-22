"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Ticks, primaryBtn, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { Bicycle, Gauge, PArrow, PH, ROAD, RoadBase, Ripple, Sheet, Tag, Txt, WrongMark, chip, svgPoint, useWalk, type PhTone } from "@/components/interactive/phy-kit";

// Screens for "Physics for High School 8 — সমদ্রুতি, তবু বেগ বদলায়"
// (src/content/articles/physics_for_high_school/08_uniform_speed.mdx), the
// journey of video EP 08 (physics_9_10/08-uniform-speed/script.md). Book §2.5,
// p. 42.
//
// The spine: টুটুল whirls a stone on a string on the ছাদ, at the same জোর.
// Does its বেগ change? The reader bets (WhirlBet) and it is settled on the last
// screen. On the way, the video's own beats in order: every lap takes 1 s
// (LapTimer), তিথি says সমবেগ but বেগ is a vector (TithiClaim), the rim
// unrolls to 3 m so the speed is 3 m/s, সমদ্রুতি (SpeedTape, SpeedChipRide),
// the velocity arrow turns → ↑ ← ↓ (ArrowRide), arrows only match when their
// directions do (SamePair, FanFour), the bike on the river road with a steady
// needle (RoadPick), the one-way rule (OneWay), the string let go (LetGo,
// ReleasePick, FinallyUniform), and the reader's turn with a wet umbrella
// (UmbrellaTurn, UmbrellaSpray).
//
// Canon (the video's): one round = 3 m, one round per second → 3 m/s. Seen
// from above the stone goes anticlockwise: at the bottom it moves ডানে, then
// উপরে, বামে, নিচে. It is let go at the bottom-right, where its arrow points
// উপরে-ডানে. The river road is EP 06's (phy-kit ROAD); তিথি's steady 3.33 m/s
// is EP 07's A → B in 20 min. Velocity arrows are amber, as in the video.
//
// Motion: everything here moves at one steady speed, so every glide is on a
// linear clock (useWalk ease "linear", or useGlide below), never eased.

type Story = { story?: boolean };
type P = [number, number];

const RAD = Math.PI / 180;
const W = 300;
const H = 200;
const C: P = [150, 100];
const R = 62;
/** a 3 m/s arrow on the sheet */
const VL = 34;

/** A point on a circle at `deg` (maths angle: 0 = right, 90 = up). */
const at = (deg: number, c: P = C, r = R): P => [c[0] + r * Math.cos(deg * RAD), c[1] - r * Math.sin(deg * RAD)];
/** The way the stone moves at `deg`, going anticlockwise on the sheet. */
const ccw = (deg: number): P => [-Math.sin(deg * RAD), -Math.cos(deg * RAD)];
const plus = (p: P, v: P, s: number): P => [p[0] + v[0] * s, p[1] + v[1] * s];
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const mod360 = (a: number) => ((a % 360) + 360) % 360;
const ptsD = (pts: P[]) => "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L");
/** An arc of a circle from a0 to a1 degrees. */
const arcD = (c: P, r: number, a0: number, a1: number) => {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 5));
  return ptsD(Array.from({ length: n + 1 }, (_, i) => at(a0 + ((a1 - a0) * i) / n, c, r)));
};

/** A screen-direction word for an arrow: ডানে, উপরে-ডানে, উপরে… */
export function dirWord(dx: number, dy: number) {
  const a = mod360(Math.atan2(dy, dx) / RAD);
  const k = Math.round(a / 45) % 8;
  return ["ডানে", "নিচে-ডানে", "নিচে", "নিচে-বামে", "বামে", "উপরে-বামে", "উপরে", "উপরে-ডানে"][k];
}
const tellV = (v: P, speed = "3 m/s") => `${speed} ${dirWord(v[0], v[1])}`;

const CALM = "(prefers-reduced-motion: reduce)";
const calmSub = (cb: () => void) => {
  const m = window.matchMedia(CALM);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
/** Whether the reader asked for less motion (true on the server, so loops never run in a preview). */
function useCalm() {
  return useSyncExternalStore(calmSub, () => window.matchMedia(CALM).matches, () => true);
}

/**
 * A number that glides to each new target at one steady rate (linear, never
 * eased: this lesson is uniform motion). It starts at the target, so a
 * preview shows the finished picture. Reduced motion jumps.
 */
function useGlide(target: number, ms: number) {
  const [now, setNow] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    const from = cur.current;
    if (from === target) return;
    const calm = window.matchMedia(CALM).matches;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = calm ? 1 : Math.min(1, (t - t0) / ms);
      cur.current = from + (target - from) * p;
      setNow(cur.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return now;
}

// ---------------------------------------------------------------------------
// Drawn pieces: the stone, the hand, the turning arrow, a stopwatch, the ছাদ.

/** The small stone, centred at p: a sticker, one ink line, a warm grey, its shadow on the roof below. */
export function Stone({ p, ghost = false, tone }: { p: P; ghost?: boolean; tone?: PhTone }) {
  const ring = tone === "mint" ? PH.mint : tone === "red" ? PH.red : PH.ink;
  return (
    <g opacity={ghost ? 0.35 : 1} className="pointer-events-none">
      {!ghost && <circle cx={p[0] + 1.4} cy={p[1] + 2.4} r={7.2} fill={PH.ink} opacity={0.1} />}
      <circle cx={p[0]} cy={p[1]} r={7} fill="#a39584" stroke={ring} strokeWidth={tone ? 2 : 1} />
      <circle cx={p[0] - 2.2} cy={p[1] - 2.2} r={2} fill="#e7e0d6" />
    </g>
  );
}

/** টুটুলের মুঠো, seen from above, with the string's knot. */
function Fist({ p }: { p: P }) {
  return (
    <g className="pointer-events-none">
      <circle cx={p[0] + 1.2} cy={p[1] + 2} r={8} fill={PH.ink} opacity={0.1} />
      <circle cx={p[0]} cy={p[1]} r={8} fill="#d9a273" stroke={PH.ink} strokeWidth={1} />
      <path d={`M${p[0] - 4} ${p[1] - 2.5}h8M${p[0] - 4.5} ${p[1] + 0.5}h9M${p[0] - 4} ${p[1] + 3.5}h8`} stroke={PH.ink} strokeWidth={0.6} opacity={0.45} />
      <circle cx={p[0]} cy={p[1]} r={1.6} fill={PH.ink} />
    </g>
  );
}

/** A curved arrow along a circle from a0 to a1: which way something turns. Décor, not a vector. */
function Curl({ c, r, a0, a1, tone = "ink" }: { c: P; r: number; a0: number; a1: number; tone?: PhTone }) {
  const col = tone === "ink" ? PH.mute : tone === "amber" ? PH.amber : tone === "blue" ? PH.blue : PH.mint;
  const end = at(a1, c, r);
  const v = a1 > a0 ? ccw(a1) : ([-ccw(a1)[0], -ccw(a1)[1]] as P);
  const b = plus(end, v, -6);
  const head = `M${end[0]} ${end[1]}L${b[0] - v[1] * 3.4} ${b[1] + v[0] * 3.4}L${b[0] + v[1] * 3.4} ${b[1] - v[0] * 3.4}Z`;
  return (
    <g className="pointer-events-none">
      <path d={arcD(c, r, a0, a1 > a0 ? a1 - 4 : a1 + 4)} stroke={col} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <path d={head} fill={col} />
    </g>
  );
}

/** A stopwatch at (x, y): the hand has gone round `t` of a turn; the time under it. */
function Watch({ x, y, t, r = 15 }: { x: number; y: number; t: number; r?: number }) {
  const a = (t * 360 - 90) * RAD;
  return (
    <g className="pointer-events-none">
      <circle cx={x + 1.2} cy={y + 2.2} r={r} fill={PH.ink} opacity={0.1} />
      <rect x={x - 3} y={y - r - 5} width={6} height={5} rx={1} fill="#f3e9d8" stroke={PH.ink} strokeWidth={1} />
      <circle cx={x} cy={y} r={r} fill="#fff" stroke={PH.ink} strokeWidth={1.2} />
      {t > 0 && t < 1 && <path d={`M${x} ${y}V${y - r + 2}A${r - 2} ${r - 2} 0 ${t > 0.5 ? 1 : 0} 1 ${x + Math.cos(a) * (r - 2)} ${y + Math.sin(a) * (r - 2)}Z`} fill={PH.amberSoft} />}
      {t >= 1 && <circle cx={x} cy={y} r={r - 2} fill={PH.amberSoft} />}
      <path d={`M${x} ${y}L${x + Math.cos(a) * (r - 3)} ${y + Math.sin(a) * (r - 3)}`} stroke={PH.amber} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={x} cy={y} r={1.6} fill={PH.ink} />
      <Txt x={x} y={y + r + 11} size={9} weight={700}>
        {`${Math.min(1, t).toFixed(1)} s`}
      </Txt>
    </g>
  );
}

/**
 * The stone on its string, seen from above: টুটুলের মুঠো at the centre, the
 * path as a faint ring, the stone at `phi`. `spin` whirls it once a second.
 */
export function TopView({
  label,
  phi,
  c = C,
  r = R,
  w = W,
  h = H,
  spin = false,
  string = true,
  sheet,
  children,
}: {
  label: string;
  phi?: number;
  c?: P;
  r?: number;
  w?: number;
  h?: number;
  spin?: boolean;
  string?: boolean;
  sheet?: Partial<Parameters<typeof Sheet>[0]>;
  children?: ReactNode;
}) {
  const calm = useCalm();
  const p = phi === undefined ? null : at(phi, c, r);
  return (
    <Sheet w={w} h={h} label={label} {...sheet}>
      <circle cx={c[0]} cy={c[1]} r={r} fill="none" stroke={PH.faint} strokeWidth={1.2} strokeDasharray="3 4" className="pointer-events-none" />
      {p && (
        <g className="pointer-events-none">
          {spin && !calm && <animateTransform attributeName="transform" type="rotate" from={`0 ${c[0]} ${c[1]}`} to={`-360 ${c[0]} ${c[1]}`} dur="1s" repeatCount="indefinite" />}
          {string && <path d={`M${c[0]} ${c[1]}L${p[0]} ${p[1]}`} stroke={PH.mute} strokeWidth={1} />}
          <Stone p={p} />
        </g>
      )}
      <Fist p={c} />
      {children}
    </Sheet>
  );
}

/** তিথিদের ছাদ: a parapet, the water tank, the next house. The stage's ground is the roof floor. */
function RoofBack() {
  return (
    <g className="pointer-events-none">
      <rect x={262} y={64} width={58} height={70} fill="#e7d7c1" stroke="#a8a29e" strokeWidth={1} />
      {[270, 292].map((x) => (
        <rect key={x} x={x} y={76} width={12} height={14} rx={1} fill="#93c5fd" stroke="#64748b" strokeWidth={0.6} />
      ))}
      <rect x={18} y={98} width={34} height={36} rx={3} fill="#94a3b8" />
      <rect x={15} y={94} width={40} height={6} rx={2} fill="#64748b" />
      <rect x={0} y={134} width={320} height={16} fill="#d6c4a8" stroke="#a8a29e" strokeWidth={0.8} />
      <text x={36} y={146} fontSize={7.5} fontWeight={700} textAnchor="middle" fill={PH.mute}>
        ছাদ
      </text>
    </g>
  );
}

const ORB = { dx: 10, dy: -64, rx: 30, ry: 7 };
const orbAt = (x: number, y: number, deg: number): P => [x + ORB.dx + ORB.rx * Math.cos(deg * RAD), y + ORB.dy + ORB.ry * Math.sin(deg * RAD)];

/**
 * টুটুল on the roof, feet at (x, y), drawn small. "hold": the stone hangs from
 * his hand. "spin": arm up, the stone whirls round over his head. "let": the
 * hand has let go; the stone hangs in the air where it was, with a ?.
 */
function Whirler({ x, y, mode }: { x: number; y: number; mode: "hold" | "spin" | "let" }) {
  const calm = useCalm();
  const hand: P = [x + ORB.dx, y + ORB.dy + 4];
  const samples = Array.from({ length: 13 }, (_, i) => orbAt(x, y, i * 30));
  const xs = samples.map((p) => p[0].toFixed(1)).join(";");
  const ys = samples.map((p) => p[1].toFixed(1)).join(";");
  const rest = orbAt(x, y, 40);
  const free = orbAt(x, y, 0);
  const loop = mode === "spin" && !calm;
  return (
    <g className="pointer-events-none">
      <Person who="tutul" x={x} y={y} scale={0.8} arm={mode === "hold" ? "hold" : "wave"} mood={mode === "let" ? "puzzled" : "happy"} label />
      {mode !== "hold" && <path d={`M${x + 13.6} ${y - 41.6}L${hand[0]} ${hand[1]}`} stroke="#d49a6a" strokeWidth={3.2} strokeLinecap="round" />}
      {mode === "hold" && (
        <g>
          <path d={`M${x + 13.6} ${y - 34}V${y - 22}`} stroke={PH.mute} strokeWidth={0.9} />
          <Stone p={[x + 13.6, y - 19]} />
        </g>
      )}
      {mode === "spin" && (
        <g>
          <ellipse cx={x + ORB.dx} cy={y + ORB.dy} rx={ORB.rx} ry={ORB.ry} fill="none" stroke={PH.faint} strokeWidth={1} strokeDasharray="2 3" />
          <line x1={hand[0]} y1={hand[1]} x2={rest[0]} y2={rest[1]} stroke={PH.mute} strokeWidth={0.9}>
            {loop && <animate attributeName="x2" values={xs} dur="1s" repeatCount="indefinite" />}
            {loop && <animate attributeName="y2" values={ys} dur="1s" repeatCount="indefinite" />}
          </line>
          <g>
            <circle cx={rest[0]} cy={rest[1]} r={4.5} fill="#8b8178" stroke="#57534e" strokeWidth={1}>
              {loop && <animate attributeName="cx" values={xs} dur="1s" repeatCount="indefinite" />}
              {loop && <animate attributeName="cy" values={ys} dur="1s" repeatCount="indefinite" />}
            </circle>
          </g>
        </g>
      )}
      {mode === "let" && (
        <g>
          <ellipse cx={x + ORB.dx} cy={y + ORB.dy} rx={ORB.rx} ry={ORB.ry} fill="none" stroke={PH.faint} strokeWidth={1} strokeDasharray="2 3" />
          <circle cx={free[0]} cy={free[1]} r={4.5} fill="#8b8178" stroke="#57534e" strokeWidth={1} />
          <Txt x={free[0] + 10} y={free[1] - 6} size={13} color={PH.amber} weight={800}>
            ?
          </Txt>
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: টুটুল on the ছাদ holds up the stone, then
// whirls it over his head; তিথি watches. The video's chip: বেগ বদলায়?

export function RoofWhirl({}: Story) {
  const s = useScene(2, [600, 1400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="ছাদে টুটুল সুতায় বাঁধা একটা ঢিল মাথার উপর ঘোরাচ্ছে। পাশে তিথি দেখছে।">
        <RoofBack />
        <Whirler x={118} y={150} mode={k >= 1 ? "spin" : "hold"} />
        <Person who="tithi" x={214} y={150} facing={-1} scale={0.95} label />
        {k >= 2 && <Tag x={160} y={24} text={" বেগ বদলায়? "} tone="amber" pop />}
      </Stage>
    </StoryFrame>
  );
}

// 1 · The sealed bet: does the stone's বেগ change? The pick hangs its claim
// on the stone's path with a ?. Not marked.

const BET = ["না। একই জোরে ঘুরছে, বেগ একই।", "হ্যাঁ, বেগ বদলাচ্ছে।", "হ্যাঁ, কারণ দ্রুতি বদলাচ্ছে।"];
const BET_TAG = ["বেগ একই ?", "বেগ বদলায় ?", "দ্রুতি বদলায় ?"];

export function WhirlBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  return (
    <>
      <TopView label="উপর থেকে দেখা: মাঝখানে টুটুলের মুঠো, সুতায় বাঁধা ঢিল একই জোরে গোল হয়ে ঘুরছে।" phi={-90} spin h={176} c={[150, 96]} r={58} sheet={{ className: "max-w-[17rem]" }}>
        {bet === null ? (
          <Tag x={150} y={18} text={" বেগ বদলায়? "} tone="amber" size={11.5} />
        ) : (
          <Tag key={bet} x={150} y={18} text={` ${BET_TAG[bet]} `} tone="blue" size={11.5} pop />
        )}
      </TopView>
      <div className="mt-3 grid gap-2">
        {BET.map((o, i) => (
          <Choice
            key={o}
            n={i}
            look={bet === i ? "picked" : bet !== null ? "dim" : "idle"}
            disabled={bet !== null}
            onClick={() => {
              setBet(i);
              sfx.stamp();
              pass("বাজি সিল হলো। শেষে মিলিয়ে দেখবো।");
            }}
          >
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>ঢিলটা একই জোরে ঘুরছে। এর বেগ কি বদলাচ্ছে? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The lap timer (video scene 2): each tap whirls the stone once round from
// the start mark while a stopwatch runs; every lap reads 1 s. Three laps.

const X2_LAPS = 3;
const X2_LAP_MS = 1000; // the lap plays in 1 s, as it is

export function LapTimer() {
  const pass = useGate();
  const [laps, setLaps] = useSeed("laps", 0);
  // one lap is one second, as it is, on a steady clock
  const walk = useWalk(X2_LAP_MS, { steps: false, ease: "linear" });
  const done = laps >= X2_LAPS;
  const go = () => {
    if (walk.running || done) return;
    sfx.whoosh(0.5);
    walk.start(() => {
      const n = laps + 1;
      setLaps(n);
      sfx.tap();
      if (n === X2_LAPS) pass("প্রতিটা পাকে সমান সময়: 1 s।");
    });
  };
  const t = walk.running ? walk.t : laps > 0 ? 1 : 0;
  const phi = -90 + 360 * (walk.running ? walk.t : 0);
  const s0 = at(-90, C, R - 9);
  const s1 = at(-90, C, R + 9);
  const back = laps > 0 && !walk.running;
  return (
    <>
      <TopView label="উপর থেকে দেখা ঘুরন্ত ঢিল। নিচে শুরুর দাগ, পাশে একটা stopwatch।" phi={phi} sheet={{ className: "max-w-[19rem]" }}>
        <path d={`M${s0[0]} ${s0[1]}L${s1[0]} ${s1[1]}`} stroke={done ? PH.mint : PH.amber} strokeWidth={2.2} strokeLinecap="round" className="pointer-events-none" />
        <Txt x={s1[0]} y={s1[1] + 12} size={8.5} color={done ? PH.mint : PH.amber} weight={700}>
          শুরু
        </Txt>
        {back && <Ripple key={laps} at={at(-90)} tone={done ? "mint" : "amber"} r={20} />}
        {walk.running && walk.t > 0.01 && <path d={arcD(C, R, -90, phi)} stroke={PH.amber} strokeWidth={2} fill="none" opacity={0.6} className="pointer-events-none" />}
        <Curl c={C} r={R + 13} a0={-20} a1={20} />
        <Watch x={218} y={166} t={t} />
      </TopView>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={walk.running || done} onClick={go}>
          এক পাক ঘোরান
        </button>
      </div>
      <Ticks items={Array.from({ length: X2_LAPS }, (_, i) => [laps > i ? `পাক ${i + 1}: 1 s` : `পাক ${i + 1}`, laps > i] as [string, boolean])} />
      <Task done={done}>ঢিলটা তিনবার এক পাক ঘোরান। প্রতিবার stopwatch কত দেখায়?</Task>
    </>
  );
}

// 2½ · Figure for screen 2's explanation (video scene 3): তিথি says সমবেগ; a
// red ? on her claim; the word বেগ sprouts an arrow, মান and দিক.

const S2_SAY = ["তিথি বললো, সমান জোরে ঘুরছে, তাই এটা সমবেগ।", "কিন্তু দাঁড়ান। বেগ তো vector!", "শুধু মান না, দিকটাও দেখতে হবে।"];

export function TithiClaim({}: Story) {
  const s = useScene(2, [600, 1600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S2_SAY[k]}</span>}>
      <Sheet w={300} h={150} label="তিথি বলছে সমবেগ। পাশে বেগ শব্দটা, তার থেকে একটা তীর বের হলো: মান আর দিক।" className="max-w-[18rem]">
        <Person who="tithi" x={62} y={138} label />
        <Bubble x={62} y={68} side="right" lines={["সমান জোরে ঘুরছে,", "তাই সমবেগ!"]} />
        {k >= 1 && <Tag x={128} y={28} text="?" tone="red" solid pop />}
        {k >= 1 && (
          <g className={FADE}>
            <Txt x={214} y={82} size={24} weight={800}>
              বেগ
            </Txt>
          </g>
        )}
        {k >= 2 && <PArrow key="v" a={[176, 104]} b={[262, 104]} tone="amber" draw tell="vector: মান + দিক" />}
        {k >= 2 && <Tag x={208} y={122} text="মান" tone="amber" pop />}
        {k >= 2 && <Tag x={270} y={86} text="দিক" tone="blue" pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · দ্রুতি (video scene 4). First the rim unrolls into a straight tape: 3 m.
// Then the reader says the speed; the stone runs 1 s at that speed while the
// tape fills with the path covered. Only 3 m/s makes exactly one round in 1 s.

const X3_C: P = [150, 64];
const X3_R = 40;
const X3_LEN = 2 * Math.PI * X3_R;
const X3_X0 = 150 - X3_LEN / 2;
const X3_Y = 146;
const X3_M = X3_LEN / 3; // sheet units per metre
const X3_N = 72;
const X3_OPEN_MS = 900;
const X3_RUN_MS = 1000; // 1 s, as it is
const X3_OPTS = [
  { v: 1, say: "1 m/s", went: "1 m" },
  { v: 3, say: "3 m/s", went: "3 m" },
  { v: 1 / 3, say: "0.33 m/s", went: "0.33 m" },
];
const X3_RIGHT = 1;
const X3_NOPE = [
  "1 s-এ ঢিল গেলো মাত্র 1 m, পাকের তিন ভাগের এক ভাগ। কিন্তু 1 s-এ তো পুরো এক পাক, মানে 3 m।",
  "",
  "1 s-এ মাত্র 0.33 m, ঢিল প্রায় নড়লোই না। এখানে সময়কে পথ দিয়ে ভাগ করা হয়েছে, 1 ÷ 3। ভাগটা হবে পথ ÷ সময়।",
];

/** The rim, part-way (u, already eased) to a straight tape: cut at the bottom, laid out flat. */
function rimD(e: number) {
  return ptsD(
    Array.from({ length: X3_N + 1 }, (_, i) => {
      const a = at(-90 - (360 * i) / X3_N, X3_C, X3_R);
      const b: P = [X3_X0 + (X3_LEN * i) / X3_N, X3_Y];
      return lerp(a, b, e);
    }),
  );
}

export function SpeedTape() {
  const pass = useGate();
  const [open, setOpen] = useSeed("open", false);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const unroll = useWalk(X3_OPEN_MS, { steps: false });
  // the stone runs 1 s at the picked speed: a steady clock, as uniform speed is
  const run = useWalk(X3_RUN_MS, { steps: false, ease: "linear" });
  const u = open ? (unroll.running ? unroll.t : 1) : 0;
  const laid = open && !unroll.running;
  const t = pick === null ? 0 : run.running ? run.t : 1;
  const v = pick === null ? 0 : X3_OPTS[pick].v;
  const right = pick === X3_RIGHT && !run.running;
  const wrong = pick !== null && pick !== X3_RIGHT && !run.running;
  const doOpen = () => {
    if (open) return;
    setOpen(true);
    sfx.tape(0.7);
    unroll.start();
  };
  const choose = (i: number) => {
    if (run.running || !laid || right) return;
    setPick(i);
    sfx.whoosh(0.5);
    run.start(() => {
      if (i === X3_RIGHT) {
        sfx.chime();
        pass("3 m ÷ 1 s = 3 m/s.");
      } else setMiss((m) => m + 1);
    });
  };
  const phi = -90 + 360 * (v / 3) * t;
  const went = Math.min(X3_LEN, v * X3_M * t);
  const sp = at(phi, X3_C, X3_R);
  return (
    <>
      <Sheet w={300} h={190} label="ঢিলের গোল পথটা কেটে সোজা একটা ফিতা বানানো হলো। নিচে ফিতা, উপরে গোল পথ আর ঢিল, পাশে stopwatch।" className="max-w-[20rem]">
        {!open && (
          <Txt x={X3_C[0]} y={X3_C[1] + X3_R + 16} size={9} color={PH.mute}>
            ঢিলের গোল পথ, এক পাক
          </Txt>
        )}
        {!laid && <path d={rimD(u)} stroke={PH.cream} strokeWidth={3} fill="none" strokeLinecap="round" className="pointer-events-none" />}
        {laid && (
          <g className="pointer-events-none">
            <path d={`M${X3_X0} ${X3_Y}H${X3_X0 + X3_LEN}`} stroke={PH.creamSoft} strokeWidth={6} strokeLinecap="round" />
            <path d={`M${X3_X0} ${X3_Y}H${X3_X0 + X3_LEN}`} stroke={PH.cream} strokeWidth={1.4} />
            {went > 0.5 && <path d={`M${X3_X0} ${X3_Y}H${X3_X0 + went}`} stroke={right ? PH.mint : wrong ? PH.red : PH.amber} strokeWidth={4} strokeLinecap="round" />}
            {[0, 1, 2, 3].map((m) => (
              <g key={m}>
                <path d={`M${X3_X0 + m * X3_M} ${X3_Y - 5}V${X3_Y + 5}`} stroke={PH.ink} strokeWidth={1} />
                <Txt x={X3_X0 + m * X3_M} y={X3_Y + 16} size={8.5} color={PH.mute}>
                  {m === 0 ? "0" : `${m} m`}
                </Txt>
              </g>
            ))}
            {right ? <Tag key="r" x={150} y={X3_Y - 14} text={" 3 m ÷ 1 s = 3 m/s "} tone="mint" solid pop /> : <Tag x={150} y={X3_Y - 14} text={" এক পাক = 3 m "} tone="cream" pop />}
            {wrong && <Tag key={pick} x={Math.max(46, X3_X0 + went)} y={X3_Y + 31} text={`1 s-এ ${X3_OPTS[pick].went}`} tone="red" pop />}
            <circle cx={X3_C[0]} cy={X3_C[1]} r={X3_R} fill="none" stroke={PH.faint} strokeWidth={1.2} strokeDasharray="3 4" className={FADE} />
            {pick !== null && t > 0 && t < 1 && <path d={arcD(X3_C, X3_R, -90, phi)} stroke={PH.amber} strokeWidth={2} fill="none" opacity={0.6} />}
            <path d={`M${X3_C[0]} ${X3_C[1]}L${sp[0]} ${sp[1]}`} stroke={PH.mute} strokeWidth={1} />
            <Stone p={sp} tone={pick === null || run.running ? undefined : right ? "mint" : "red"} />
            {right && <Ripple at={sp} r={22} />}
            {wrong && <WrongMark x={sp[0] + (sp[0] >= X3_C[0] ? 15 : -15)} y={sp[1] + 5} />}
            <Fist p={X3_C} />
          </g>
        )}
        <Watch x={226} y={58} t={t} />
        {!run.running && pick === null && laid && <Tag x={226} y={98} text={" এক পাক = 1 s "} tone="amber" pop />}
      </Sheet>
      {!laid ? (
        <div className="mt-3 flex justify-center">
          <button type="button" className={primaryBtn} disabled={open} onClick={doOpen}>
            পাকটা খুলুন
          </button>
        </div>
      ) : (
        <div className="mx-auto mt-3 flex w-full max-w-[20rem] flex-wrap items-center justify-center gap-1.5 text-sm">
          <span className="mr-0.5">দ্রুতি =</span>
          {X3_OPTS.map((o, i) => (
            <button key={o.say} type="button" disabled={run.running || right} className={`${chip(pick === i)} font-mono`} onClick={() => choose(i)}>
              {o.say}
            </button>
          ))}
        </div>
      )}
      {pick !== null && pick !== X3_RIGHT && !run.running && <Nope key={miss}>{X3_NOPE[pick]}</Nope>}
      <Task done={right}>আগে পাকটা খুলে দেখুন কত লম্বা। তারপর বলুন, দ্রুতি কত? ঢিলটা 1 s সেই দ্রুতিতে চলবে।</Task>
    </>
  );
}

// 3½ · Figure for screen 3's explanation: the speed chip rides with the stone
// round the circle, always 3 m/s; then the name, সমদ্রুতি.

const S3_PHI = [-90, 0, 90, 180, 180];
const S3_SAY = ["এক পাকে 3 m, সময় 1 s: 3 m/s।", "এখানেও 3 m/s।", "এখানেও 3 m/s।", "এখানেও 3 m/s।", "দ্রুতি বদলাচ্ছে না: সমদ্রুতি।"];
const S3_C: P = [150, 82];
const S3_R = 52;

export function SpeedChipRide({}: Story) {
  const s = useScene(4, [600, 1100, 1100, 1100]);
  const k = s.k;
  // a quarter turn per beat at one steady rate: the same 3 m/s all the way
  const phi = useGlide(S3_PHI[k], 800);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S3_SAY[k]}</span>}>
      <TopView label="ঢিল গোল পথে ঘুরছে, সাথে একটা chip: 3 m/s। যেখানেই থাকুক, chip বদলায় না।" phi={phi} c={S3_C} r={S3_R} h={170} sheet={{ className: "max-w-[17rem]" }}>
        {S3_PHI.slice(0, Math.min(k, 4)).map((a, i) => {
          const q = at(a, S3_C, S3_R + 22);
          return (
            <g key={i} opacity={0.4}>
              <Tag x={q[0]} y={q[1]} text="3 m/s" tone="cream" size={8.5} />
            </g>
          );
        })}
        {(() => {
          const q = at(phi, S3_C, S3_R + 22);
          return <Tag x={q[0]} y={q[1]} text="3 m/s" tone="cream" solid size={8.5} />;
        })()}
        {k >= 4 && <Tag x={150} y={112} text={" সমদ্রুতি "} tone="mint" solid pop />}
      </TopView>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · The velocity arrow (video scene 5). The reader drags the stone round
// (it only goes the way it whirls); an amber arrow rides on it, always along
// the path. At the bottom, right, top and left a ghost of the arrow stays.

const X4_SPOTS = [-90, 0, 90, 180];
const X4_START = -128;

export function ArrowRide() {
  const pass = useGate();
  const [phi, setPhi] = useSeed("phi", X4_START);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const [drag, setDrag] = useState(false);
  const done = seen.length >= X4_SPOTS.length;
  const aim = (e: React.PointerEvent<SVGSVGElement>) => {
    const [x, y] = svgPoint(e, W, H);
    if (Math.hypot(x - C[0], y - C[1]) < 16) return;
    const ang = Math.atan2(-(y - C[1]), x - C[0]) / RAD;
    const d = mod360(ang - phi);
    if (d <= 0 || d > 70) return;
    const next = phi + d;
    setPhi(next);
    const hit = X4_SPOTS.map((sp, j) => [j, mod360(sp - phi)] as const).filter(([j, off]) => off > 0 && off <= d && !seen.includes(j)).map(([j]) => j);
    if (hit.length) {
      const all = [...seen, ...hit];
      setSeen(all);
      sfx.pop();
      if (all.length === X4_SPOTS.length) pass("তীরের দৈর্ঘ্য একই, দিক বদলায়।");
    }
  };
  const p = at(phi);
  const v = ccw(phi);
  return (
    <>
      <TopView
        label="উপর থেকে দেখা ঘুরন্ত ঢিল, তার উপর বেগের তীর। ঢিলটা টেনে ঘোরানো যায়; চার জায়গায় তীরের একটা ছাপ থেকে যায়।"
        phi={phi}
        sheet={{
          onPointerDown: (e) => {
            setDrag(true);
            aim(e);
          },
          onPointerMove: (e) => drag && aim(e),
          onPointerUp: () => setDrag(false),
          className: "max-w-[20rem] cursor-grab",
        }}
      >
        <Curl c={C} r={R + 14} a0={118} a1={152} />
        <Txt x={at(135, C, R + 32)[0] - 4} y={at(135, C, R + 32)[1]} size={8} color={PH.mute}>
          ঘোরার দিক
        </Txt>
        {seen.map((j) => {
          const q = at(X4_SPOTS[j]);
          const g = ccw(X4_SPOTS[j]);
          return (
            <g key={j} className={FADE}>
              <Stone p={q} ghost />
              <PArrow a={q} b={plus(q, g, VL)} tone="amber" opacity={0.45} tell={tellV(g)} />
            </g>
          );
        })}
        <PArrow a={p} b={plus(p, v, VL)} tone="amber" tell={tellV(v)} />
        <circle cx={p[0]} cy={p[1]} r={13} fill="none" stroke={PH.blue} strokeWidth={1.2} strokeDasharray="2.5 2.5" className="pointer-events-none" opacity={drag ? 0 : 0.8} />
      </TopView>
      <div className="mt-2 text-center text-sm">
        <span className="font-semibold">তীরের দৈর্ঘ্য:</span> <span className="font-mono">3 m/s</span> · <span className="font-semibold">দিক:</span> <span className="text-cat-amber">{dirWord(v[0], v[1])}</span>
        <span className="ml-2 text-muted tabular-nums">({seen.length}/4 জায়গা)</span>
      </div>
      <Task done={done}>ঢিলটা টেনে পুরো এক পাক ঘোরান। চার জায়গায় বেগের তীর কোন দিকে থাকে, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Same velocity? (video scene 6, as a question). Each pick marks two
// moments on the circle; their arrows glide to one point, tail to tail. Only
// a pair whose arrows land on top of each other has the same velocity.

const X5_C: P = [86, 86];
const X5_R = 50;
const X5_Q: P = [222, 86];
const X5_VL = 38;
const X5_PAIRS = [
  { a: -90, b: 0, label: "নিচে, আর তারপর ডান পাশে" },
  { a: -90, b: 270, label: "নিচে, আর 1 s পরে আবার নিচে" },
  { a: -90, b: 90, label: "নিচে, আর তারপর উপরে" },
];
const X5_RIGHT = 1;
const X5_NOPE = [
  "এক বিন্দুতে আনতেই তীর দুইটা ফাঁক হয়ে গেলো: একটা ডানে, একটা উপরে। দৈর্ঘ্য একই, দিক আলাদা, তাই বেগও আলাদা।",
  "",
  "তীর দুইটা দুই উল্টা দিকে খুলে গেলো, ডানে আর বামে। দুটোই 3 m/s, কিন্তু দিক উল্টা, বেগ আলাদা।",
];
const X5_MS = 1300;

function PairMini({ a, b }: { a: number; b: number }) {
  const c: P = [22, 22];
  const r = 14;
  const pa = at(a, c, r);
  const pb = at(b, c, r);
  const same = mod360(a - b) < 1;
  return (
    <svg viewBox="0 0 44 44" className="h-13 w-13 shrink-0" aria-hidden="true">
      <circle cx={c[0]} cy={c[1]} r={r} fill="none" stroke={PH.faint} strokeWidth={1.2} strokeDasharray="2 2.5" />
      <PArrow a={pa} b={plus(pa, ccw(a), 12)} tone="amber" w={1.6} tell={false} />
      {!same && <PArrow a={pb} b={plus(pb, ccw(b), 12)} tone="blue" w={1.6} tell={false} />}
      <circle cx={pa[0]} cy={pa[1]} r={2.6} fill="#8b8178" />
      {!same && <circle cx={pb[0]} cy={pb[1]} r={2.6} fill="#8b8178" />}
      {same && (
        <text x={pa[0] + 9} y={pa[1] + 3} fontSize={7} fontWeight={700} fill={PH.blue} style={{ fontFamily: "ui-monospace, monospace" }}>
          ×2
        </text>
      )}
    </svg>
  );
}

export function SamePair() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // carrying two arrows to one point is not a motion of the stone: eased is fine
  const walk = useWalk(X5_MS, { steps: false });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(0.4);
    walk.start(() => {
      if (i === X5_RIGHT) {
        sfx.chime();
        pass("দিক না মিললে বেগ মেলে না।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const e = Math.max(0, (t - 0.15) / 0.85);
  const pair = pick === null ? null : X5_PAIRS[pick];
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X5_RIGHT;
  const arrow = (deg: number, tone: PhTone, key: string, w = 2.6) => {
    const from = at(deg, X5_C, X5_R);
    const tail = lerp(from, X5_Q, e);
    const v = ccw(deg);
    return <PArrow key={key} a={tail} b={plus(tail, v, X5_VL)} tone={tone} w={w} tell={tellV(v)} />;
  };
  // the angle the second arrow opens from the first (the first always points ডানে, 0°)
  const spread = pair ? mod360(pair.b + 90) : 0;
  return (
    <>
      <Sheet w={300} h={172} label="বামে ঘুরন্ত ঢিলের গোল পথ, দুই মুহূর্তের দুইটা তীর। ডানে একটা বিন্দু, যেখানে তীর দুইটা এনে মিলানো হয়।" className="max-w-[19rem]">
        <circle cx={X5_C[0]} cy={X5_C[1]} r={X5_R} fill="none" stroke={PH.faint} strokeWidth={1.2} strokeDasharray="3 4" className="pointer-events-none" />
        <Fist p={X5_C} />
        <circle cx={X5_Q[0]} cy={X5_Q[1]} r={3} fill={PH.ink} className="pointer-events-none" />
        <Txt x={X5_Q[0]} y={X5_Q[1] + 18} size={8.5} color={PH.mute}>
          এখানে এনে মিলাই
        </Txt>
        {pair && (
          <g>
            <Stone p={at(pair.a, X5_C, X5_R)} ghost={e > 0.5} />
            {mod360(pair.b - pair.a) > 1 && <Stone p={at(pair.b, X5_C, X5_R)} ghost={e > 0.5} />}
            {arrow(pair.a, "amber", "a", 5)}
            {arrow(pair.b, right ? "mint" : "blue", "b")}
            {settled && spread > 1 && <path d={arcD(X5_Q, 26, 0, spread)} stroke={PH.red} strokeWidth={1.6} fill="none" strokeDasharray="3 2" className={`pointer-events-none ${FADE}`} />}
            {settled && spread > 1 && <WrongMark key={miss} x={X5_Q[0] + 34} y={X5_Q[1] - 26} />}
            {right && <Ripple at={plus(X5_Q, [1, 0], X5_VL / 2)} r={26} />}
          </g>
        )}
        {settled && <Tag key={pick} x={X5_Q[0]} y={22} text={right ? " বেগ একই " : " দিক আলাদা, বেগ আলাদা "} tone={right ? "mint" : "red"} solid pop />}
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X5_PAIRS.map((q, i) => (
          <Choice key={q.label} n={i} look={pick === i && settled ? (i === X5_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="flex items-center gap-2.5">
              <PairMini a={q.a} b={q.b} />
              <span>{q.label}</span>
            </span>
          </Choice>
        ))}
      </div>
      {settled && !right && <Nope key={miss}>{X5_NOPE[pick]}</Nope>}
      <Task done={right}>কোন দুই মুহূর্তে ঢিলের বেগ একই? বেছে নিন, তীর দুইটা এক বিন্দুতে এনে মিলিয়ে দেখা হবে।</Task>
    </>
  );
}

// 5½ · Figure for screen 5's explanation (video scene 6): the four ghost
// arrows glide to one point and open like a fan; same length, four ways. Then
// the verdict: সমদ্রুতি yes, সমবেগ no.

const S5_C: P = [74, 76];
const S5_R = 44;
const S5_Q: P = [214, 76];
const S5_SAY = ["চার মুহূর্তের চারটা বেগের তীর।", "চারটাকে এক বিন্দুতে আনি।", "দৈর্ঘ্য একই, দিক চারটা: দ্রুতি একই, বেগ ভিন্ন।", "সমদ্রুতি, হ্যাঁ। সমবেগ, না।"];

/** A verdict pill with a drawn tick or cross. */
function Verdict({ x, y, text, ok }: { x: number; y: number; text: string; ok: boolean }) {
  const w = text.length * 6.2 + 34;
  const c = ok ? PH.mint : PH.red;
  const mx = x + w / 2 - 13;
  return (
    <g className={`pointer-events-none ${POP}`}>
      <rect x={x - w / 2} y={y - 11} width={w} height={22} rx={11} fill={ok ? PH.mintSoft : PH.redSoft} stroke={c} strokeWidth={1.2} />
      <text x={x - 8} y={y + 4} fontSize={10.5} fontWeight={700} textAnchor="middle" fill={c}>
        {text}
      </text>
      {ok ? (
        <path d={`M${mx - 4} ${y}l3 3.2l5.5 -6.4`} fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d={`M${mx - 3.5} ${y - 3.5}l7 7M${mx + 3.5} ${y - 3.5}l-7 7`} stroke={c} strokeWidth={2} strokeLinecap="round" />
      )}
    </g>
  );
}

export function FanFour({}: Story) {
  const s = useScene(3, [600, 1400, 2200]);
  const k = s.k;
  const [e] = useTween([k >= 1 ? 1 : 0], 900);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <Sheet w={300} h={164} label="চার জায়গার চারটা বেগের তীর এক বিন্দুতে এনে রাখা হলো, পাখার মতো খুলে আছে।" className="max-w-[18rem]">
        <circle cx={S5_C[0]} cy={S5_C[1]} r={S5_R} fill="none" stroke={PH.faint} strokeWidth={1.2} strokeDasharray="3 4" className="pointer-events-none" />
        <Fist p={S5_C} />
        {X4_SPOTS.map((sp) => {
          const q = at(sp, S5_C, S5_R);
          const tail = lerp(q, S5_Q, e);
          const v = ccw(sp);
          return (
            <g key={sp}>
              <Stone p={q} ghost />
              <PArrow a={tail} b={plus(tail, v, 34)} tone="amber" tell={tellV(v)} />
            </g>
          );
        })}
        {k >= 2 && <circle cx={S5_Q[0]} cy={S5_Q[1]} r={34} fill="none" stroke={PH.cream} strokeWidth={1.2} strokeDasharray="2 3" className={`pointer-events-none ${FADE}`} />}
        {k >= 3 && <Verdict x={96} y={146} text="সমদ্রুতি" ok />}
        {k >= 3 && <Verdict x={210} y={146} text="সমবেগ" ok={false} />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · The river road (video scene 7). The speedometer needle stays put on
// every path; the reader picks where তিথি rides at সমবেগ. Each pick rides it:
// the amber arrow swings at every bend and leaves ghosts; only the straight
// path keeps one arrow.

type RoadPt = [number, number, number];
const X6_LINE = Math.atan2(ROAD.B[1] - ROAD.A[1], ROAD.B[0] - ROAD.A[0]);
const X6_PATHS: { label: string; pt: (u: number) => RoadPt; d: string; dashed?: boolean }[] = [
  { label: "নদীর পাড়ের রাস্তা, A থেকে B", pt: (u) => ROAD.at(4 * u), d: ROAD.d(0, 4) },
  { label: "A থেকে B, একদম সোজা পথে", pt: (u) => [...lerp(ROAD.A, ROAD.B, u), X6_LINE], d: `M${ROAD.A[0]} ${ROAD.A[1]}L${ROAD.B[0]} ${ROAD.B[1]}`, dashed: true },
  { label: "বটতলা থেকে নানুবাড়ি, B থেকে C", pt: (u) => ROAD.at(4 + 2 * u), d: ROAD.d(4, 6) },
];
const X6_RIGHT = 1;
const X6_MARKS = [0.1, 0.35, 0.6, 0.85];
const X6_MS = 2600; // one steady ride: the needle never moves, so neither does the pace
const X6_SPEED = "3.33 m/s";
const X6_NOPE = [
  "কাঁটা একটুও নড়েনি, 3.33 m/s। কিন্তু প্রতিটা বাঁকে তীর ঘুরে গেলো। দিক বদলালো, তাই বেগও বদলালো।",
  "",
  "B-র পরের বাঁকে তীর ঘুরতে ঘুরতে প্রায় উল্টা দিকে চলে গেলো। দ্রুতি এক, বেগ এক না।",
];

/** তিথি on her bike at a road point, tilted with the road (at most 45°), facing the way she rides. */
function Rider({ p, s = 0.5 }: { p: RoadPt; s?: number }) {
  const [x, y, h] = p;
  const left = Math.cos(h) < 0;
  let deg = ((left ? h - Math.PI : h) * 180) / Math.PI;
  deg = mod360(deg + 180) - 180;
  deg = Math.max(-45, Math.min(45, deg));
  return (
    <g transform={`translate(${x} ${y}) rotate(${deg.toFixed(1)})`} className="pointer-events-none">
      <Bicycle x={0} y={3} s={s} flip={left} />
    </g>
  );
}

function RoadMini({ i }: { i: number }) {
  const q = X6_PATHS[i];
  return (
    <svg viewBox={`0 0 ${ROAD.W} ${ROAD.H}`} className="h-10 w-16 shrink-0" aria-hidden="true">
      <path d={ROAD.d(0, 6)} stroke="#e7e5e4" strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d={q.d} stroke={PH.ink} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={q.dashed ? "14 10" : undefined} />
    </svg>
  );
}

export function RoadPick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X6_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.pedal();
    walk.start(() => {
      if (i === X6_RIGHT) {
        sfx.chime();
        pass("সমবেগে চলা যায় শুধু সোজা পথে।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const path = pick === null ? null : X6_PATHS[pick];
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X6_RIGHT;
  const wrong = settled && pick !== X6_RIGHT;
  const bike = path ? path.pt(Math.min(t, 0.999)) : ROAD.at(0);
  const dir = (p: RoadPt): P => [Math.cos(p[2]), Math.sin(p[2])];
  return (
    <>
      <Sheet w={ROAD.W} h={ROAD.H} label="নদীর পাড়ের আঁকাবাঁকা রাস্তা: A বাসার মোড়, B বটতলা, C নানুবাড়ি। কোণে speedometer। তিথি সাইকেলে, তার বেগের তীর সাথে।" className="max-w-[20rem]">
        <RoadBase upTo={6} />
        {path && <path d={path.d} stroke={PH.blue} strokeWidth={1.6} fill="none" strokeDasharray={path.dashed ? "4 3" : "1 3"} opacity={0.7} className="pointer-events-none" />}
        {path &&
          X6_MARKS.filter((m) => t >= m).map((m, j) => {
            const q = path.pt(m);
            const v = dir(q);
            const a: P = [q[0], q[1]];
            // on the right path the four arrows light up mint one after another: one and the same arrow
            return right ? (
              <PArrow key={`${pick}${m}r`} a={a} b={plus(a, v, 22)} tone="mint" w={2} draw delay={j * 160} ms={300} tell={tellV(v, X6_SPEED)} />
            ) : (
              <PArrow key={`${pick}${m}`} a={a} b={plus(a, v, 22)} tone="amber" w={2} opacity={0.5} tell={tellV(v, X6_SPEED)} />
            );
          })}
        {right && <Ripple at={ROAD.B} r={22} />}
        <Rider p={bike} />
        {path && !settled && <PArrow a={[bike[0], bike[1]]} b={plus([bike[0], bike[1]], dir(bike), 26)} tone="amber" tell={false} />}
        {wrong && <WrongMark key={miss} x={bike[0] + (pick === 2 ? -22 : 14)} y={bike[1] + (pick === 2 ? -8 : -16)} />}
        <Gauge x={224} y={34} r={17} v={3.33} max={6} digits={2} />
        <Txt x={224} y={60} size={7.5} color={PH.mute}>
          speedometer
        </Txt>
        {settled && <Tag key={pick} x={Math.max(70, Math.min(140, bike[0]))} y={34} text={right ? " একটাই তীর: সমবেগ " : " তীর ঘুরলো: বেগ বদলালো "} tone={right ? "mint" : "red"} solid pop size={8.5} />}
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X6_PATHS.map((q, i) => (
          <Choice key={q.label} n={i} look={pick === i && settled ? (i === X6_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="flex items-center gap-2.5">
              <RoadMini i={i} />
              <span>{q.label}</span>
            </span>
          </Choice>
        ))}
      </div>
      {settled && !right && <Nope key={miss}>{X6_NOPE[pick]}</Nope>}
      <Task done={right}>speedometer-এর কাঁটা সব পথেই এক জায়গায়। কোন পথে তিথি সমবেগে চলবে? বেছে নিয়ে চালিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The one-way rule (video scene 8). Two boxes, সমবেগ and সমদ্রুতি; the
// reader picks which way the rule runs. Each claim is tried on this
// journey's own cases: the bike on the straight path (one arrow, so one
// speed), the whirling stone (one speed, a turning arrow).

const X7_OPTS = [
  { key: "back", label: "সমদ্রুতি হলে সমবেগ হবেই" },
  { key: "fwd", label: "সমবেগ হলে সমদ্রুতি হবেই" },
  { key: "both", label: "দুই দিকেই, একটা হলে অন্যটাও" },
] as const;
type X7Key = (typeof X7_OPTS)[number]["key"];
const X7_RIGHT = 1;
const X7_MS = 1800; // both cases move at one steady speed: a linear clock
const X7_NOPE: Record<X7Key, string> = {
  back: "ঘুরন্ত ঢিল: দ্রুতি এক, 3 m/s, তবু বেগের তীর ঘুরছে। সমদ্রুতি হলো, সমবেগ হলো না।",
  fwd: "",
  both: "সমবেগ থেকে সমদ্রুতি, ঠিক আছে। কিন্তু উল্টাটা? ঘুরন্ত ঢিলের দ্রুতি এক, তবু বেগ বদলায়।",
};
const X7_VB: P = [72, 30];
const X7_SB: P = [228, 30];

function Box({ at: p, text, tone = "ink" }: { at: P; text: string; tone?: PhTone }) {
  const c = tone === "mint" ? PH.mint : tone === "red" ? PH.red : PH.ink;
  return (
    <g className="pointer-events-none">
      <rect x={p[0] - 46} y={p[1] - 15} width={92} height={30} rx={8} fill="#fff" stroke={c} strokeWidth={1.6} />
      <Txt x={p[0]} y={p[1] + 4.5} size={12} weight={800} color={c}>
        {text}
      </Txt>
    </g>
  );
}

/** A "then" arrow between the boxes: a double shaft with a head; `slash` crosses it out. Not a vector. */
function Imply({ x0, x1, y, tone, slash = false }: { x0: number; x1: number; y: number; tone: PhTone; slash?: boolean }) {
  const c = tone === "mint" ? PH.mint : tone === "red" ? PH.red : PH.blue;
  const s = Math.sign(x1 - x0);
  const hx = x1 - s * 8;
  const mx = (x0 + x1) / 2;
  return (
    <g className={`pointer-events-none ${FADE}`}>
      <path d={`M${x0} ${y - 2.2}H${hx}M${x0} ${y + 2.2}H${hx}`} stroke={c} strokeWidth={1.6} />
      <path d={`M${x1} ${y}L${hx - s * 2} ${y - 6}M${x1} ${y}L${hx - s * 2} ${y + 6}`} stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      {slash && <path d={`M${mx - 5} ${y + 9}L${mx + 5} ${y - 9}`} stroke={PH.red} strokeWidth={2.2} strokeLinecap="round" />}
    </g>
  );
}

function ImplyMini({ k }: { k: X7Key }) {
  return (
    <svg viewBox="0 0 30 16" className="h-5 w-9 shrink-0" aria-hidden="true">
      <path d="M5 6H24M5 10H24" stroke={PH.blue} strokeWidth={1.4} />
      {k !== "back" && <path d="M28 8l-5 -5M28 8l-5 5" stroke={PH.blue} strokeWidth={1.6} strokeLinecap="round" />}
      {k !== "fwd" && <path d="M2 8l5 -5M2 8l5 5" stroke={PH.blue} strokeWidth={1.6} strokeLinecap="round" />}
    </svg>
  );
}

export function OneWay() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X7_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.tap();
    walk.start(() => {
      if (i === X7_RIGHT) {
        sfx.chime();
        pass("সমবেগ হলে সমদ্রুতি হবেই, উল্টাটা না।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const key = pick === null ? null : X7_OPTS[pick].key;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X7_RIGHT;
  // the case it is tried on: the bike for "fwd", the stone for the others
  const bikeCase = key === "fwd";
  const sc: P = [150, 132];
  const sr = 38;
  const phi = -90 + 360 * t;
  const sp = at(phi, sc, sr);
  const bx = 58 + 170 * t;
  return (
    <>
      <Sheet w={300} h={192} label="উপরে দুইটা বাক্স: সমবেগ আর সমদ্রুতি। নিচে যে উদাহরণে নিয়মটা পরীক্ষা হয়: সোজা পথে সাইকেল, অথবা ঘুরন্ত ঢিল।" className="max-w-[19rem]">
        <Box at={X7_VB} text="সমবেগ" tone={right ? "mint" : "ink"} />
        <Box at={X7_SB} text="সমদ্রুতি" tone={right ? "mint" : "ink"} />
        {key && !settled && key !== "back" && <Imply x0={122} x1={178} y={key === "both" ? 25 : 30} tone="blue" />}
        {key && !settled && key !== "fwd" && <Imply x0={178} x1={122} y={key === "both" ? 36 : 30} tone="blue" />}
        {settled && key === "back" && <Imply x0={178} x1={122} y={30} tone="red" slash />}
        {settled && key === "both" && (
          <>
            <Imply x0={122} x1={178} y={25} tone="mint" />
            <Imply x0={178} x1={122} y={36} tone="red" slash />
          </>
        )}
        {right && (
          <>
            <Imply x0={122} x1={178} y={25} tone="mint" />
            <Imply x0={178} x1={122} y={36} tone="red" slash />
            <Ripple at={[150, 25]} r={22} />
          </>
        )}
        <path d="M14 62H286" stroke={PH.faint} strokeWidth={1} strokeDasharray="2 3" className="pointer-events-none" />
        {key === null && (
          <Txt x={150} y={130} size={9.5} color={PH.mute}>
            বেছে নিলে এখানে পরীক্ষা হবে
          </Txt>
        )}
        {key !== null && bikeCase && (
          <g>
            <path d={`M40 160H262`} stroke={PH.blue} strokeWidth={1.6} strokeDasharray="4 3" opacity={0.7} className="pointer-events-none" />
            {/* the arrow it had, left behind at equal steps: always the same arrow */}
            {[0.25, 0.5, 0.75].filter((m) => t >= m).map((m) => (
              <PArrow key={m} a={[58 + 170 * m + 8, 146]} b={[58 + 170 * m + 40, 146]} tone="amber" opacity={0.35} tell={false} />
            ))}
            <Rider p={[bx, 160, 0]} s={0.6} />
            <PArrow a={[bx + 8, 146]} b={[bx + 40, 146]} tone="amber" tell="3.33 m/s ডানে" />
            <Gauge x={52} y={100} r={15} v={3.33} max={6} digits={2} />
            {t > 0.7 && <Tag x={135} y={96} text={" কাঁটা একই: সমদ্রুতি "} tone="mint" size={9.5} pop />}
            {t > 0.8 && <Tag x={142} y={128} text={" তীর একই: সমবেগ "} tone="mint" size={9.5} pop />}
          </g>
        )}
        {key !== null && !bikeCase && (
          <g>
            <circle cx={sc[0]} cy={sc[1]} r={sr} fill="none" stroke={PH.faint} strokeWidth={1.2} strokeDasharray="3 4" className="pointer-events-none" />
            <path d={`M${sc[0]} ${sc[1]}L${sp[0]} ${sp[1]}`} stroke={PH.mute} strokeWidth={1} className="pointer-events-none" />
            <Stone p={sp} />
            <Fist p={sc} />
            <PArrow a={sp} b={plus(sp, ccw(phi), 26)} tone="amber" tell={tellV(ccw(phi))} />
            {t > 0.3 && <Tag x={64} y={132} text={" দ্রুতি: 3 m/s "} tone="mint" size={9.5} pop />}
            {t > 0.6 && <Tag x={236} y={132} text={" তীর ঘুরছে "} tone="red" size={9.5} pop />}
          </g>
        )}
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X7_OPTS.map((o, i) => (
          <Choice key={o.key} n={i} look={pick === i && settled ? (i === X7_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="flex items-center gap-2.5">
              <ImplyMini k={o.key} />
              <span>{o.label}</span>
            </span>
          </Choice>
        ))}
      </div>
      {settled && !right && key && <Nope key={miss}>{X7_NOPE[key]}</Nope>}
      <Task done={right}>সমবেগ আর সমদ্রুতি: নিয়মটা কোন দিকে চলে? বেছে নিন, এই journey-র উদাহরণে পরীক্ষা হবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8a · Story scene for screen 8: টুটুল whirls, then lets the string go. The
// stone hangs where it was, with a ?. (Where it goes is the screen's question.)

export function LetGo({}: Story) {
  const s = useScene(2, [600, 1400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="ছাদে টুটুল ঢিল ঘোরাচ্ছিল, হঠাৎ সুতাটা ছেড়ে দিলো। ঢিলটা কোন দিকে যাবে?">
        <RoofBack />
        <Whirler x={118} y={150} mode={k >= 1 ? "let" : "spin"} />
        <Person who="tithi" x={214} y={150} facing={-1} scale={0.95} label />
        {k >= 2 && <Tag x={200} y={40} text={" এবার কোন দিকে? "} tone="amber" pop />}
      </Stage>
    </StoryFrame>
  );
}

// 8 · The string let go (video scene 9). Seen from above, at the moment the
// arrow points উপরে-ডানে. Three paths on the picture; each pick lets go and
// flies the stone along it, its arrow riding with it. Only the straight path
// along the arrow keeps the arrow the release gave it.

const X8_C: P = [104, 102];
const X8_R = 52;
const X8_AT = -45;
const X8_P = at(X8_AT, X8_C, X8_R);
const X8_V = ccw(X8_AT);
const X8_OUT: P = [Math.cos(X8_AT * RAD), -Math.sin(X8_AT * RAD)];
const X8_OPTS = ["গোল পথেই ঘুরতে থাকবে", "তীর বরাবর সোজা ছুটবে", "সুতা বরাবর বাইরে ছুটবে"];
const X8_RIGHT = 1;
const X8_MS = 1100; // let go, it keeps one speed: a linear clock
const X8_NOPE = [
  "সুতা নেই, তবু ঢিল গোল পথে ঘুরে গেলো, তীরটাও ঘুরলো। ছাড়ার মুহূর্তে তীর ছিল উপরে-ডানে। ঢিলটাকে আর ঘোরাবে কে?",
  "",
  "ঢিল সুতা বরাবর বাইরে ছুটলো, নিচে-ডানে। কিন্তু ছাড়ার মুহূর্তে বেগের তীর ছিল উপরে-ডানে।",
];
const X8_ARC = 140;
const X8_TAN = 120;
const X8_RAD = 46;

/** Where the stone is, and which way it goes, `t` of the way along path i. */
function x8Pos(i: number, t: number): [P, P] {
  if (i === 0) {
    const a = X8_AT + X8_ARC * t;
    return [at(a, X8_C, X8_R), ccw(a)];
  }
  if (i === 1) return [plus(X8_P, X8_V, X8_TAN * t), X8_V];
  return [plus(X8_P, X8_OUT, X8_RAD * t), X8_OUT];
}

export function ReleasePick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X8_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(0.6);
    walk.start(() => {
      if (i === X8_RIGHT) {
        sfx.chime();
        pass("ছাড়া পেলে ঢিল ছোটে বেগের তীর বরাবর।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X8_RIGHT;
  const [sp, sv] = pick === null ? [X8_P, X8_V] : x8Pos(pick, t);
  const ends: P[] = [at(X8_AT + X8_ARC, X8_C, X8_R + 17), plus(plus(X8_P, X8_V, X8_TAN), [-0.707, -0.707], 16), plus(plus(X8_P, X8_OUT, X8_RAD), [0.707, -0.707], 16)];
  const paths = [arcD(X8_C, X8_R, X8_AT, X8_AT + X8_ARC), ptsD([X8_P, plus(X8_P, X8_V, X8_TAN)]), ptsD([X8_P, plus(X8_P, X8_OUT, X8_RAD)])];
  return (
    <>
      <TopView label="উপর থেকে দেখা: ঢিল নিচে-ডান পাশে, বেগের তীর উপরে-ডানে। সুতা ছাড়লে ঢিল কোন পথে যাবে, তিনটা পথ A, B, C।" c={X8_C} r={X8_R} sheet={{ className: "max-w-[19rem]" }}>
        {paths.map((d, i) => (
          <path key={i} d={d} stroke={pick === i ? (settled ? (i === X8_RIGHT ? PH.mint : PH.red) : PH.blue) : PH.mute} strokeWidth={pick === i ? 1.8 : 1.2} strokeDasharray="4 3" fill="none" opacity={pick === null || pick === i ? 0.8 : 0.3} className="pointer-events-none" />
        ))}
        {ends.map((p, i) => (
          <g key={i} className="pointer-events-none">
            <circle cx={p[0]} cy={p[1]} r={7} fill="#fff" stroke={PH.mute} strokeWidth={1} />
            <text x={p[0]} y={p[1] + 3.3} fontSize={9} fontWeight={800} textAnchor="middle" fill={PH.ink} style={{ fontFamily: "ui-monospace, monospace" }}>
              {String.fromCharCode(65 + i)}
            </text>
          </g>
        ))}
        {pick === null && <path d={`M${X8_C[0]} ${X8_C[1]}L${X8_P[0]} ${X8_P[1]}`} stroke={PH.mute} strokeWidth={1} className="pointer-events-none" />}
        {pick !== null && <PArrow a={X8_P} b={plus(X8_P, X8_V, VL)} tone="amber" opacity={0.3} tell={false} />}
        <Stone p={sp} tone={settled ? (right ? "mint" : "red") : undefined} />
        <PArrow a={sp} b={plus(sp, sv, VL)} tone="amber" tell={tellV(sv)} />
        {right && <Ripple at={sp} r={22} />}
        {settled && !right && <WrongMark key={miss} x={sp[0] + (pick === 0 ? 15 : -16)} y={sp[1] + (pick === 0 ? -8 : 10)} />}
      </TopView>
      <div className="mt-3 grid gap-2">
        {X8_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && settled ? (i === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {settled && !right && <Nope key={miss}>{X8_NOPE[pick]}</Nope>}
      <Task done={right}>টুটুল ঠিক এই মুহূর্তে সুতা ছেড়ে দিলো। ঢিল কোন পথে যাবে? বেছে নিন।</Task>
    </>
  );
}

// 8½ · Figure for screen 8's explanation (video scene 10): with no air and no
// gravity the stone keeps going, same arrow, same 3 m/s chip; at last, সমবেগ.

const S8_C: P = [52, 112];
const S8_R = 30;
const S8_P = at(-45, S8_C, S8_R);
const S8_V = ccw(-45);
const S8_SAY = ["ছাড়ার মুহূর্তে: 3 m/s, উপরে-ডানে।", "একই দ্রুতি, একই দিক।", "বাতাস আর মাধ্যাকর্ষণ না থাকলে, চলতেই থাকতো।", "দ্রুতিও এক, দিকও এক: অবশেষে সমবেগ।"];

export function FinallyUniform({}: Story) {
  const s = useScene(3, [600, 1100, 1300]);
  const k = s.k;
  // the stone glides from mark to mark at one steady rate; the marks stay at their true, equal spacing
  const pos = useGlide(k, 900);
  const spots = [0, 1, 2, 3].map((i) => plus(S8_P, S8_V, i * 42));
  const now = plus(S8_P, S8_V, pos * 42);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S8_SAY[k]}</span>}>
      <Sheet w={300} h={160} label="ছাড়া পাওয়া ঢিল সোজা উপরে-ডানে যাচ্ছে, প্রতিটা জায়গায় একই তীর, একই 3 m/s।" className="max-w-[18rem]">
        <circle cx={S8_C[0]} cy={S8_C[1]} r={S8_R} fill="none" stroke={PH.faint} strokeWidth={1.2} strokeDasharray="3 4" className="pointer-events-none" />
        <Fist p={S8_C} />
        <path d={ptsD([S8_P, plus(S8_P, S8_V, 150)])} stroke={PH.mute} strokeWidth={1} strokeDasharray="4 3" className="pointer-events-none" />
        {spots.slice(0, k).map((p, i) => (
          <g key={i} opacity={0.4}>
            <Stone p={p} ghost />
            <PArrow a={p} b={plus(p, S8_V, 26)} tone="amber" tell="3 m/s উপরে-ডানে" />
            <Tag x={p[0] + 26} y={p[1] + 14} text="3 m/s" tone="cream" size={8} />
          </g>
        ))}
        <Stone p={now} />
        <PArrow a={now} b={plus(now, S8_V, 26)} tone="amber" tell="3 m/s উপরে-ডানে" />
        <Tag x={now[0] + 26} y={now[1] + 14} text="3 m/s" tone="cream" size={8} />
        {k >= 3 && <Tag x={212} y={92} text={" সমবেগ "} tone="mint" solid pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn (video scene 11): a wet umbrella spins, seen from above, the
// way the curved arrow shows (clockwise, unlike the stone). For three drops on
// the rim the reader taps the path the drop flies off along. No arrows given.

type Ray = "radial" | "along" | "against";
const X9_U: P = [150, 110];
const X9_RU = 44;
const X9_LEN = 42;
const X9_ROUNDS: { a: number; order: Ray[] }[] = [
  { a: 90, order: ["radial", "along", "against"] },
  { a: 180, order: ["against", "radial", "along"] },
  { a: -45, order: ["along", "against", "radial"] },
];
const X9_MS = 700; // a flung drop keeps its speed: a linear clock
const X9_NOPE: Record<Ray, string> = {
  radial: "ফোঁটা কিনারা থেকে সোজা বাইরে গেলো। কিন্তু ছাড়ার মুহূর্তে ও তো কিনারা ধরে ঘুরছিল। ঘোরার দিকটা দেখুন।",
  along: "",
  against: "ফোঁটা ছাতার ঘোরার উল্টা দিকে গেলো। ছাতা কোন দিকে ঘুরছে, বাঁকা তীরটা দেখুন।",
};
/** The way a drop at `a` flies off for each kind of path; the umbrella turns clockwise. */
const rayDir = (k: Ray, a: number): P => (k === "radial" ? [Math.cos(a * RAD), -Math.sin(a * RAD)] : k === "along" ? [Math.sin(a * RAD), Math.cos(a * RAD)] : ccw(a));

/** A wet umbrella seen from above, eight panels, turning clockwise when `spin`. */
export function Umbrella({ c, r, spin = false }: { c: P; r: number; spin?: boolean }) {
  const calm = useCalm();
  return (
    <g className="pointer-events-none">
      <circle cx={c[0] + 2} cy={c[1] + 3.5} r={r} fill={PH.ink} opacity={0.1} />
      <g>
        {spin && !calm && <animateTransform attributeName="transform" type="rotate" from={`0 ${c[0]} ${c[1]}`} to={`360 ${c[0]} ${c[1]}`} dur="1.2s" repeatCount="indefinite" />}
        {Array.from({ length: 8 }, (_, i) => {
          const p = at(i * 45, c, r);
          const q = at(i * 45 + 45, c, r);
          return <path key={i} d={`M${c[0]} ${c[1]}L${p[0]} ${p[1]}L${q[0]} ${q[1]}Z`} fill={i % 2 ? "#2f6fe0" : "#5b8ff0"} stroke={PH.ink} strokeWidth={1} strokeLinejoin="round" />;
        })}
        {[20, 110, 200, 290].map((a) => {
          const p = at(a, c, r * 0.6);
          return <circle key={a} cx={p[0]} cy={p[1]} r={1.6} fill="#bfdbfe" />;
        })}
      </g>
      <circle cx={c[0]} cy={c[1]} r={4} fill="#0f172a" />
    </g>
  );
}

function Drop({ p, tone }: { p: P; tone?: PhTone }) {
  return <circle cx={p[0]} cy={p[1]} r={4.5} fill="#93c5fd" stroke={tone === "mint" ? PH.mint : tone === "red" ? PH.red : PH.ink} strokeWidth={tone ? 1.8 : 1} className="pointer-events-none" />;
}

export function UmbrellaTurn() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X9_MS, { steps: false, ease: "linear" });
  const finished = round >= X9_ROUNDS.length;
  const r = X9_ROUNDS[Math.min(round, X9_ROUNDS.length - 1)];
  const kind = pick === null ? null : r.order[pick];
  const settled = pick !== null && !walk.running;
  const hit = settled && kind === "along";
  const d0 = at(r.a, X9_U, X9_RU);
  const choose = (i: number) => {
    if (walk.running || hit || finished) return;
    setPick(i);
    sfx.drip();
    walk.start(() => {
      if (r.order[i] === "along") sfx.chime();
      else setMiss((m) => m + 1);
    });
  };
  const next = () => {
    const nr = round + 1;
    setRound(nr);
    setPick(null);
    if (nr === X9_ROUNDS.length) pass("ফোঁটা ছিটকায় ওর বেগের তীর বরাবর।");
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const dv = kind ? rayDir(kind, r.a) : ([0, 0] as P);
  const dropAt = plus(d0, dv, X9_LEN * t);
  return (
    <>
      <Sheet w={300} h={212} label="উপর থেকে দেখা ভেজা ছাতা, বাঁকা তীর দেখায় ঘোরার দিক। কিনারায় একটা পানির ফোঁটা, তার থেকে তিনটা পথ A, B, C।" className="max-w-[19rem]">
        <Umbrella c={X9_U} r={X9_RU} spin />
        <Curl c={[40, 40]} r={14} a0={170} a1={-100} tone="blue" />
        <Txt x={40} y={70} size={8.5} color={PH.blue}>
          ঘোরার দিক
        </Txt>
        {/* the drops already done */}
        {X9_ROUNDS.slice(0, round).map((q, i) => {
          const s = at(q.a, X9_U, X9_RU);
          const v = rayDir("along", q.a);
          return (
            <g key={`d${i}`}>
              <path d={ptsD([s, plus(s, v, X9_LEN)])} stroke={PH.mint} strokeWidth={1.4} strokeDasharray="3 3" className="pointer-events-none" />
              <Drop p={plus(s, v, X9_LEN)} tone="mint" />
              <PArrow a={s} b={plus(s, v, 22)} tone="amber" w={2} tell="ফোঁটার বেগের তীর" />
            </g>
          );
        })}
        {!finished && (
          <g>
            {r.order.map((k, i) => {
              const v = rayDir(k, r.a);
              const end = plus(d0, v, X9_LEN);
              const lab = plus(d0, v, X9_LEN + 11);
              const on = pick === i;
              const col = on && settled ? (k === "along" ? PH.mint : PH.red) : on ? PH.blue : PH.mute;
              return (
                <g key={`${round}${k}`} onClick={() => choose(i)} className="cursor-pointer" role="button" aria-label={`পথ ${String.fromCharCode(65 + i)}`}>
                  <path d={ptsD([d0, end])} stroke="transparent" strokeWidth={16} strokeLinecap="round" />
                  <path d={ptsD([d0, end])} stroke={col} strokeWidth={on ? 1.8 : 1.3} strokeDasharray="4 3" opacity={pick === null || on ? 0.9 : 0.35} className="pointer-events-none" />
                  <circle cx={lab[0]} cy={lab[1]} r={7} fill="#fff" stroke={col} strokeWidth={1} />
                  <text x={lab[0]} y={lab[1] + 3.3} fontSize={9} fontWeight={800} textAnchor="middle" fill={PH.ink} className="pointer-events-none" style={{ fontFamily: "ui-monospace, monospace" }}>
                    {String.fromCharCode(65 + i)}
                  </text>
                </g>
              );
            })}
            <Drop p={dropAt} tone={settled ? (hit ? "mint" : "red") : undefined} />
            {hit && <Ripple at={dropAt} r={16} />}
            {settled && !hit && <WrongMark key={miss} x={dropAt[0] - dv[1] * 14} y={dropAt[1] + dv[0] * 14 + 5} />}
            {hit && <PArrow a={d0} b={plus(d0, rayDir("along", r.a), 22)} tone="amber" w={2} draw tell="ফোঁটার বেগের তীর" />}
          </g>
        )}
      </Sheet>
      {!finished ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-sm">
          <span className="mr-0.5">ফোঁটা {round + 1} যাবে পথ</span>
          {r.order.map((k, i) => (
            <button key={`${round}${k}`} type="button" disabled={walk.running || hit} className={`${chip(pick === i)} font-mono`} onClick={() => choose(i)}>
              {String.fromCharCode(65 + i)}
            </button>
          ))}
          {hit && (
            <button type="button" className={`${primaryBtn} h-9! px-4!`} onClick={next}>
              {round < X9_ROUNDS.length - 1 ? "পরের ফোঁটা" : "শেষ"}
            </button>
          )}
        </div>
      ) : (
        <div className={`mt-2 text-center text-sm font-semibold text-accent-text ${FADE}`}>তিনটা ফোঁটাই গেলো বেগের তীর বরাবর, সোজা।</div>
      )}
      {settled && !hit && kind && <Nope key={miss}>{X9_NOPE[kind]}</Nope>}
      <Ticks items={X9_ROUNDS.map((_, i) => [`ফোঁটা ${i + 1}`, round > i] as [string, boolean])} />
      <Task done={finished}>ছাতা ঘুরছে। কিনারার ফোঁটাটা ছিটকে কোন পথে যাবে? পথে tap করুন। তিনটা ফোঁটা।</Task>
    </>
  );
}

// 9½ · Figure for screen 9's explanation: the umbrella spins; every drop on
// the rim leaves along a straight line, the way its arrow pointed.

const S9_SAY = ["ছাতা ঘুরছে, কিনারায় পানির ফোঁটা।", "ফোঁটাগুলো গোল হয়ে ঘোরে না, সোজা ছিটকে যায়।", "যেদিকে ওদের বেগের তীর ছিল।"];
const S9_C: P = [150, 84];
const S9_R = 42;

export function UmbrellaSpray({}: Story) {
  const s = useScene(2, [600, 1400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S9_SAY[k]}</span>}>
      <Sheet w={300} h={168} label="উপর থেকে ঘুরন্ত ছাতা। কিনারার ফোঁটাগুলো সোজা লাইনে ছিটকে যাচ্ছে, প্রতিটা নিজের বেগের তীর বরাবর।" className="max-w-[17rem]">
        <Umbrella c={S9_C} r={S9_R} spin={k >= 1} />
        {[22, 112, 202, 292].map((a) => {
          const p = at(a, S9_C, S9_R);
          const v = rayDir("along", a);
          const end = plus(p, v, 44);
          return (
            <g key={a}>
              {k >= 1 && <path d={ptsD([p, end])} stroke={PH.blue} strokeWidth={1.2} strokeDasharray="3 3" className={`pointer-events-none ${FADE}`} />}
              <g style={{ transform: `translate(${k >= 1 ? end[0] - p[0] : 0}px, ${k >= 1 ? end[1] - p[1] : 0}px)` }} className="transition-transform duration-700 ease-linear motion-reduce:transition-none">
                <Drop p={p} />
              </g>
              {k >= 2 && <PArrow a={p} b={plus(p, v, 20)} tone="amber" w={2} draw tell="ফোঁটার বেগের তীর" />}
            </g>
          );
        })}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10a · Closing story scene: back on the ছাদ, টুটুল whirls the stone again;
// তিথি says it the new way.

export function RoofAgain({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="বিকেলে আবার ছাদে। টুটুল ঢিল ঘোরাচ্ছে, তিথি এবার বলছে, দ্রুতি একই, বেগ বদলায়।">
        <RoofBack />
        <Whirler x={118} y={150} mode={k >= 1 ? "spin" : "hold"} />
        <Person who="tithi" x={214} y={150} facing={-1} scale={0.95} label arm={k >= 2 ? "point" : "down"} />
        {k >= 2 && <Bubble x={214} y={84} side="left" lines={["দ্রুতি একই,", "বেগ বদলায়।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 10 · Recap card (video scene 12): the arrow rides round the circle, the
// speed chip never changes, the arrow's way does every time.

const S10_PHI = [-90, 0, 90, 180];
const S10_SAY = ["দ্রুতি: 3 m/s। তীর ডানে।", "দ্রুতি একই। দিক বদলালো।", "দ্রুতি একই। দিক আবার বদলালো।", "দিক বদলালেই বেগ বদলায়, দ্রুতি এক থাকলেও।"];
const S10_C: P = [150, 80];
const S10_R = 48;

export function CircleRecap({}: Story) {
  const s = useScene(3, [600, 1100, 1300]);
  const k = s.k;
  const phi = useGlide(S10_PHI[k], 800);
  const p = at(phi, S10_C, S10_R);
  const v = ccw(phi);
  // the speed chip rides just outside the stone, clear of its arrow
  const out: P = [Math.cos(phi * RAD), -Math.sin(phi * RAD)];
  const chipAt = plus(at(phi, S10_C, S10_R + 10), [out[0] * 35, out[1] * 9], 1);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10_SAY[k]}</span>}>
      <TopView label="ঘুরন্ত ঢিলের উপর বেগের তীর। chip-এ দ্রুতি সবসময় 3 m/s, তীরের দিক বদলায়।" phi={phi} c={S10_C} r={S10_R} h={168} sheet={{ className: "max-w-[17rem]" }}>
        {S10_PHI.slice(0, k).map((a) => {
          const q = at(a, S10_C, S10_R);
          return <PArrow key={a} a={q} b={plus(q, ccw(a), 28)} tone="amber" opacity={0.35} tell={tellV(ccw(a))} />;
        })}
        <PArrow a={p} b={plus(p, v, 28)} tone="amber" tell={tellV(v)} />
        <Tag x={chipAt[0]} y={chipAt[1]} text="দ্রুতি: 3 m/s" tone="cream" size={8.5} />
        {k >= 3 && <Tag x={150} y={152} text={" দিক বদলালেই বেগ বদলায় "} tone="mint" solid pop />}
      </TopView>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  RoofWhirl: { a: { k: 0 }, end: {} },
  WhirlBet: { start: {}, sealed: { bet: 1 } },
  LapTimer: { start: {}, two: { laps: 2 }, done: { laps: 3 } },
  TithiClaim: { a: { k: 0 }, end: {} },
  SpeedTape: { start: {}, open: { open: true }, wrong: { open: true, pick: 0 }, wrong2: { open: true, pick: 2 }, right: { open: true, pick: 1 } },
  SpeedChipRide: { a: { k: 1 }, end: {} },
  ArrowRide: { start: {}, half: { phi: 30, seen: [0, 1] }, done: { phi: 200, seen: [0, 1, 2, 3] } },
  SamePair: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, right: { pick: 1 } },
  FanFour: { a: { k: 0 }, end: {} },
  RoadPick: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, right: { pick: 1 } },
  OneWay: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, right: { pick: 1 } },
  LetGo: { a: { k: 0 }, end: {} },
  ReleasePick: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, right: { pick: 1 } },
  FinallyUniform: { a: { k: 1 }, end: {} },
  UmbrellaTurn: { start: {}, wrong: { pick: 0 }, against: { round: 1, pick: 0 }, right: { round: 1, pick: 2 }, done: { round: 3 } },
  UmbrellaSpray: { a: { k: 0 }, end: {} },
  RoofAgain: { end: {} },
  CircleRecap: { a: { k: 1 }, end: {} },
};
