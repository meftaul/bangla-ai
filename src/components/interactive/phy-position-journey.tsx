"use client";

import { useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, primaryBtn, usePlay, useScene, useSeed, type Fixtures } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { BusStop, Compass, GateS, PArrow, PH, Ripple, School, SchoolS, Sheet, Tag, Txt, WrongMark, chip, svgPoint, useWalk } from "@/components/interactive/phy-kit";

// Screens for "Physics for High School 1 — অবস্থান বলতে কী লাগে?"
// (src/content/articles/physics_for_high_school/01_position.mdx), the journey
// of video EP 01 (physics_9_10/01-position/script.md). Book §2.1, p. 34.
//
// The spine: তিথির নানু comes from ঢাকা and must find her school alone. The
// reader bets how many things নানু must be told (PositionBet) and it is
// settled on the last screen. On the way, the video's own beats: ঝিলটুলি is a
// whole পাড়া (JhiltuliDrop), 1 km from the gate is a whole circle (OneKmRing),
// 1 km পূর্বে is one point (WhichWay), every answer hid the gate, the origin
// (MeasuredFrom), the bus stop gives another true answer (FromBusStop), the
// phone map measures from two lines (PhoneMap), and the reader finds what is
// missing in three half-answers (WhatsMissing).
//
// Map canon (the video's): gate O, school 1 km east; bus stop 600 m south of
// the school; ফরিদপুর ≈ 23.6° N, 89.8° E. On the map 1 km = 80 units.

type Story = { story?: boolean };
type P = [number, number];

const W = 300;
const H = 200;
const KM = 80;
// The gate sits a touch below the middle so নানু, drawn at the circle's top, keeps her head on the page.
const O: P = [110, 108];
const SCHOOL: P = [O[0] + KM, O[1]];
const BUS: P = [SCHOOL[0], SCHOOL[1] + 0.6 * KM];
const LAKE: P = [52, 168];
const JHIL_D = "M152 30C204 18 270 28 285 62C299 98 288 150 254 172C220 189 170 182 152 158C137 136 140 58 152 30Z";
// A tap is in ঝিলটুলি when the browser says it landed on the drawn পাড়া: no
// coordinate maths, so page zoom or the journey's own zoom can't throw it off.
const inJhil = (e: { target: EventTarget }) => !!(e.target as Element).closest?.("[data-jhil]");

const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] } as const;
type Dir = keyof typeof DIRS;
const DIR_BN: Record<Dir, string> = { N: "উত্তরে", E: "পূর্বে", S: "দক্ষিণে", W: "পশ্চিমে" };

// ---------------------------------------------------------------------------
// The town: one map for every screen, like the video's. Streets, the ঝিল,
// and whatever a screen asks for on top.

export function TownMap({
  label,
  jhiltuli = false,
  gate = true,
  school = "hidden",
  bus = false,
  lake = true,
  sheet,
  children,
}: {
  label: string;
  jhiltuli?: boolean | "lit";
  gate?: boolean | "origin";
  school?: "hidden" | "plain" | "mint";
  bus?: boolean | "origin";
  lake?: boolean;
  sheet?: Partial<Parameters<typeof Sheet>[0]>;
  children?: ReactNode;
}) {
  return (
    <Sheet w={W} h={H} label={label} bg={PH.ground} frame="soft" {...sheet}>
      <g className="pointer-events-none" stroke="#fff" strokeWidth={7} strokeLinecap="round">
        <path d={`M12 ${O[1]}H288M12 52H288M12 148H${BUS[0] + 60}M70 12V188M150 12V188M240 12V140`} fill="none" />
      </g>
      {jhiltuli && (
        <g className="pointer-events-none">
          <path data-jhil d={JHIL_D} className="pointer-events-auto" fill={jhiltuli === "lit" ? PH.amberSoft : "#efe6d2"} stroke={jhiltuli === "lit" ? PH.amber : "#cdbb97"} strokeWidth={1.2} strokeDasharray="4 3" />
          <Txt x={258} y={44} size={10} color={PH.cream} weight={700}>
            ঝিলটুলি
          </Txt>
        </g>
      )}
      {lake && (
        <g className="pointer-events-none">
          <ellipse cx={LAKE[0]} cy={LAKE[1]} rx={30} ry={13} fill="#dbeafe" stroke="#93c5fd" strokeWidth={1} />
          <Txt x={LAKE[0]} y={LAKE[1] + 3.5} size={9} color="#3b82f6">
            ঝিল
          </Txt>
        </g>
      )}
      {gate && (
        <g className="pointer-events-none">
          <GateS x={O[0]} y={O[1]} />
          <circle cx={O[0]} cy={O[1]} r={4.5} fill={gate === "origin" ? PH.mint : PH.ink} stroke="#fff" strokeWidth={1.2} />
          <Txt x={O[0]} y={O[1] + 17} size={9.5} color={PH.mute}>
            বাসার গেট
          </Txt>
        </g>
      )}
      {bus && (
        <g className="pointer-events-none">
          <BusStop x={BUS[0] + 13} y={BUS[1] + 4} s={1.1} />
          <circle cx={BUS[0]} cy={BUS[1]} r={4.5} fill={bus === "origin" ? PH.amber : PH.ink} stroke="#fff" strokeWidth={1.2} />
          <Txt x={BUS[0]} y={BUS[1] + 17} size={9.5} color={PH.mute}>
            বাসস্টপ
          </Txt>
        </g>
      )}
      {school !== "hidden" && (
        <g className="pointer-events-none">
          {school === "mint" && <circle cx={SCHOOL[0]} cy={SCHOOL[1] - 12} r={26} fill={PH.mintSoft} className={POP} />}
          {school === "mint" && <Ripple at={[SCHOOL[0], SCHOOL[1] - 12]} />}
          <SchoolS x={SCHOOL[0]} y={SCHOOL[1] - 2} lit={school === "mint"} />
          <circle cx={SCHOOL[0]} cy={SCHOOL[1]} r={3.6} fill={school === "mint" ? PH.mint : PH.ink} stroke="#fff" strokeWidth={1} />
        </g>
      )}
      {children}
    </Sheet>
  );
}

/**
 * নানু on the map: herself, small, feet at `at`, with her name. `walking`
 * gives her a little bob (`t` sets its phase). `drop` lands her from a tap:
 * she arrives from a touch above. No glide of her own: a walk sets `at`
 * every frame (useWalk).
 */
function NanuOnMap({ at, walking = false, t = 0, drop = false }: { at: P; walking?: boolean; t?: number; drop?: boolean }) {
  const bob = walking ? -Math.abs(Math.sin(t * Math.PI * 9)) * 1.6 : 0;
  return (
    <g style={{ transform: `translate(${at[0]}px, ${at[1] + bob}px)` }} className="pointer-events-none">
      <g className={drop ? "transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none starting:-translate-y-3 starting:opacity-0" : ""}>
        <ellipse cy={1.2} rx={7} ry={1.6} fill={PH.ink} opacity={0.12} />
        <NanuFigure x={0} y={0} s={0.44} ms={0} />
        <Txt x={7} y={9.5} size={8} anchor="start" color={PH.ink} weight={700}>
          নানু
        </Txt>
      </g>
    </g>
  );
}

/** A ghost school where the school might be, with a ? on it. */
function MaybeSchool({ at }: { at: P }) {
  return (
    <g className={`pointer-events-none ${POP}`}>
      <SchoolS x={at[0]} y={at[1] - 2} s={0.7} ghost />
      <Txt x={at[0] + 15} y={at[1] - 20} size={12} color={PH.red} weight={800}>
        ?
      </Txt>
    </g>
  );
}

/** তিথির উত্তরগুলো, as phone bubbles; `lit` makes every গেট glow. */
const ANSWERS = [["ঝিলটুলিতে।"], ["বাসার ", "গেট", " থেকে 1 km।"], ["", "গেট", " থেকে 1 km পূর্বে।"]];
function TithiChat({ upTo = 3, lit = false }: { upTo?: number; lit?: boolean }) {
  return (
    <div className="mx-auto mt-2 w-full max-w-[19rem] rounded-xl border border-border bg-surface px-2.5 py-2">
      <div className="mb-1 text-xs font-semibold text-muted">নানুর সাথে ফোনে</div>
      <div className="mb-1 w-fit rounded-2xl rounded-tl-sm bg-foreground/[0.06] px-2.5 py-0.5 text-sm">স্কুলটা কোথায়?</div>
      {ANSWERS.slice(0, upTo).map((parts, i) => (
        <div key={i} className="mt-1 ml-auto w-fit rounded-2xl rounded-tr-sm bg-cat-blue/10 px-2.5 py-0.5 text-sm">
          {parts.map((p, j) =>
            j === 1 ? (
              <span key={j} className={`rounded px-0.5 transition-colors duration-500 motion-reduce:transition-none ${lit ? "bg-cat-amber/30 font-bold text-cat-amber" : ""}`}>
                {p}
              </span>
            ) : (
              <span key={j}>{p}</span>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: তিথি in ফরিদপুর; নানু's bus from ঢাকা; she
// thinks of নানু finding the school alone.

const BUS_PARK = 130;

function StageBus({ x, sign }: { x: number; sign?: string }) {
  return (
    <g style={{ transform: `translate(${x}px, 0px)` }} className="pointer-events-none transition-transform duration-[1600ms] ease-out motion-reduce:transition-none">
      <rect x={-40} y={104} width={80} height={38} rx={6} fill="#16a34a" />
      <rect x={-40} y={128} width={80} height={6} fill="#15803d" />
      {[-30, -14, 2, 18].map((wx) => (
        <rect key={wx} x={wx} y={110} width={12} height={11} rx={2} fill="#dcfce7" />
      ))}
      <circle cx={-24} cy={143} r={6} fill={PH.ink} />
      <circle cx={24} cy={143} r={6} fill={PH.ink} />
      {sign && (
        <g>
          <rect x={-22} y={92} width={44} height={11} rx={3} fill="#fff" stroke="#15803d" strokeWidth={0.8} />
          <text x={0} y={100.5} fontSize={7.5} fontWeight={700} textAnchor="middle" fill={PH.ink}>
            {sign}
          </text>
        </g>
      )}
    </g>
  );
}

export function NanuComing({}: Story) {
  const s = useScene(3, [600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="ফরিদপুরের রাস্তায় তিথি। ঢাকা থেকে নানুর বাস আসছে। তিথি ভাবছে, নানু একা একা স্কুলে যাবেন।">
        <text x={300} y={24} fontSize={10} fontWeight={700} textAnchor="end" fill={PH.ink}>
          ফরিদপুর
        </text>
        <School x={270} y={150} s={1.2} />
        <StageBus x={k >= 1 ? BUS_PARK : -60} sign="ঢাকা → ফরিদপুর" />
        <Person who="tithi" x={222} y={150} facing={-1} label arm={k >= 1 ? "wave" : "down"} mood={k >= 1 ? "happy" : "plain"} />
        {k >= 2 && <Bubble x={222} y={80} side="left" tone="think" lines={["নানু একা একা", "স্কুলে আসবেন।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: how many things must তিথি tell নানু? The pick drops that
// many blank chips into নানু's phone, each with a ?. Not marked.

const BET = ["একটা: জায়গাটার নাম", "দুইটা: কত দূরে আর কোন দিকে", "তিনটা"];

export function PositionBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  return (
    <>
      <div className="mx-auto w-full max-w-[19rem] rounded-xl border border-border bg-surface px-3 py-2.5">
        <div className="text-xs font-semibold text-muted">নানুর সাথে ফোনে</div>
        <div className="mt-1 w-fit rounded-2xl rounded-tl-sm bg-foreground/[0.06] px-2.5 py-0.5 text-sm">স্কুলটা কোথায়?</div>
        <div className="mt-1.5 ml-auto flex min-h-8 w-fit items-center gap-1.5 rounded-2xl rounded-tr-sm bg-cat-blue/10 px-2.5 py-1">
          {bet === null ? (
            <span className="text-sm text-muted">তিথি লিখছে…</span>
          ) : (
            Array.from({ length: bet + 1 }, (_, i) => (
              <span key={`${bet}${i}`} style={{ transitionDelay: `${i * 160}ms` }} className={`grid h-6 w-12 place-items-center rounded-md border-2 border-dashed border-cat-blue/50 text-sm font-bold text-cat-blue ${FADE}`}>
                ?
              </span>
            ))
          )}
        </div>
      </div>
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
      <Task done={bet !== null}>নানুকে ঠিক স্কুলে পৌঁছাতে তিথিকে কয়টা জিনিস বলতে হবে? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The obvious answer fails: "ঝিলটুলিতে". The reader drops নানু at three
// spots inside ঝিলটুলি; each could be the school, so a ghost school with a ?
// pops at each. A tap outside the পাড়া bounces.

const X2_NEED = 3;

export function JhiltuliDrop() {
  const pass = useGate();
  const [drops, setDrops] = useSeed<P[]>("drops", []);
  const [miss, setMiss] = useState<{ n: number; why: "out" | "near" } | null>(null);
  const at = drops.length ? drops[drops.length - 1] : null;
  const done = drops.length >= X2_NEED;
  const tap = (e: React.PointerEvent<SVGSVGElement>) => {
    if (done) return;
    const p = svgPoint(e, W, H);
    const why = !inJhil(e) ? "out" : drops.some((d) => Math.hypot(d[0] - p[0], d[1] - p[1]) < 26) ? "near" : null;
    if (why) {
      setMiss((m) => ({ n: (m?.n ?? 0) + 1, why }));
      return;
    }
    const next = [...drops, p];
    setDrops(next);
    setMiss(null);
    sfx.pop();
    if (next.length === X2_NEED) pass("পাড়ার নাম বললে পুরো পাড়াই খুঁজতে হয়।");
  };
  return (
    <>
      <TownMap label="ফরিদপুরের map। ঝিলটুলি পাড়াটা দাগ দেওয়া। নানুকে পাড়ার ভেতরে কোথাও নামানো যায়।" jhiltuli="lit" gate={false} sheet={{ onPointerDown: tap, className: "max-w-[22rem] cursor-crosshair" }}>
        {drops.map((d, i) => (
          <MaybeSchool key={i} at={d} />
        ))}
        {at && <NanuOnMap key={drops.length} at={at} drop />}
      </TownMap>
      <Ticks items={Array.from({ length: X2_NEED }, (_, i) => [`জায়গা ${i + 1}`, drops.length > i] as [string, boolean])} />
      {miss && !done && (
        <Nope key={miss.n}>{miss.why === "out" ? "ওটা ঝিলটুলির বাইরে। দাগ দেওয়া পাড়ার ভেতরে tap করুন।" : "ওখানে তো নানু একবার নেমেছেন। একটু দূরে আরেক জায়গায় tap করুন।"}</Nope>
      )}
      <Task done={done}>ঝিলটুলির ভেতরে তিনটা আলাদা জায়গায় tap করে নানুকে নামিয়ে দেখুন। কোনটা স্কুল?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Only the distance: 1 km from the gate. The reader swings a 1 km tape
// round the gate (drag or tap); every way it points, the tip could be the
// school. Eight directions cover the whole circle.

const X3_SECTORS = 8;
const sectorOf = (deg: number) => ((Math.round(deg / 45) % 8) + 8) % 8;

export function OneKmRing() {
  const pass = useGate();
  const [ang, setAng] = useSeed("ang", -50);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const [drag, setDrag] = useState(false);
  const done = seen.length >= X3_SECTORS;
  const aim = (e: React.PointerEvent<SVGSVGElement>) => {
    const [x, y] = svgPoint(e, W, H);
    if (Math.hypot(x - O[0], y - O[1]) < 8) return;
    const deg = (Math.atan2(y - O[1], x - O[0]) * 180) / Math.PI;
    setAng(deg);
    const sec = sectorOf(deg);
    if (!seen.includes(sec)) {
      const next = [...seen, sec];
      setSeen(next);
      sfx.tap();
      if (next.length === X3_SECTORS) pass("শুধু দূরত্ব দিলে একটা পুরো বৃত্ত।");
    }
  };
  const rad = (ang * Math.PI) / 180;
  const tip: P = [O[0] + Math.cos(rad) * KM, O[1] + Math.sin(rad) * KM];
  return (
    <>
      <TownMap
        label="বাসার গেটকে ঘিরে 1 km লম্বা একটা ফিতা। ফিতা যেদিকেই ঘোরে, মাথাটা স্কুল হতে পারে।"
        gate="origin"
        sheet={{
          onPointerDown: (e) => {
            setDrag(true);
            aim(e);
          },
          onPointerMove: (e) => drag && aim(e),
          onPointerUp: () => setDrag(false),
          className: "max-w-[22rem] cursor-grab",
        }}
      >
        <circle cx={O[0]} cy={O[1]} r={KM} fill="none" stroke={PH.amber} strokeWidth={1.2} strokeDasharray="3 5" opacity={0.3} className="pointer-events-none" />
        {/* the circle is built by the sweep: every 45° the tape has covered is drawn in */}
        {seen.map((sec) => {
          const a0 = ((sec * 45 - 22.5) * Math.PI) / 180;
          const a1 = ((sec * 45 + 22.5) * Math.PI) / 180;
          const d = `M${O[0] + Math.cos(a0) * KM} ${O[1] + Math.sin(a0) * KM}A${KM} ${KM} 0 0 1 ${O[0] + Math.cos(a1) * KM} ${O[1] + Math.sin(a1) * KM}`;
          return <Draw key={sec} d={d} ms={450} strokeWidth={2.6} className="stroke-[#d97706]" />;
        })}
        {done && <Ripple at={O} tone="amber" r={KM} />}
        {seen.map((sec) => {
          const r = (sec * 45 * Math.PI) / 180;
          return <MaybeSchool key={sec} at={[O[0] + Math.cos(r) * KM, O[1] + Math.sin(r) * KM]} />;
        })}
        <path d={`M${O[0]} ${O[1]}L${tip[0]} ${tip[1]}`} stroke={PH.amber} strokeWidth={2.6} strokeLinecap="round" className="pointer-events-none" />
        <circle cx={tip[0]} cy={tip[1] + 1.5} r={8} fill={PH.ink} opacity={0.12} className="pointer-events-none" />
        <circle cx={tip[0]} cy={tip[1]} r={7.5} fill="#fff" stroke={PH.amber} strokeWidth={2.4} className="pointer-events-none" />
        <circle cx={tip[0]} cy={tip[1]} r={2} fill={PH.amber} className="pointer-events-none" />
        <Tag x={(O[0] + tip[0]) / 2} y={(O[1] + tip[1]) / 2 - 10} text="1 km" tone="amber" />
      </TownMap>
      <div className="mt-2 text-center text-sm">
        <span className="font-semibold">দূরত্ব:</span> <span className="font-mono">1 km</span> · <span className="font-semibold">দিক:</span> <span className="text-danger">?</span>
        <span className="ml-2 text-muted tabular-nums">
          ({seen.length}/{X3_SECTORS} দিক)
        </span>
      </div>
      <Task done={done}>ফিতার মাথাটা টেনে গেটের চারদিকে ঘুরিয়ে আনুন। কোথায় কোথায় স্কুল হতে পারে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Distance + direction: তিথি knows where the school is. The reader finishes
// her message, "গেট থেকে 1 km ___", and নানু walks it. A wrong way lands on the
// circle where there is no school.

const X4_RIGHT: Dir = "E";
const X4_NOPE: Record<Dir, string> = {
  N: "নানু 1 km উত্তরে গিয়ে থামলেন। বৃত্তের উপরেই, কিন্তু স্কুল তো নাই। স্কুলটা গেটের কোন দিকে, map-এ দেখুন।",
  E: "",
  S: "নানু 1 km দক্ষিণে গিয়ে ঝিলের পাশে থামলেন। স্কুলটা গেটের কোন দিকে, compass মিলিয়ে দেখুন।",
  W: "নানু 1 km পশ্চিমে চলে গেলেন, স্কুলের উল্টা দিকে। স্কুলটা গেটের ডানে, compass-এ ডান মানে কোন দিক?",
};
const X4_WALK_MS = 1500;

export function WhichWay() {
  const pass = useGate();
  const [pick, setPick] = useSeed<Dir | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X4_WALK_MS);
  const go = (d: Dir) => {
    if (walk.running) return;
    setPick(d);
    walk.start(() => {
      if (d === X4_RIGHT) {
        sfx.chime();
        pass("দূরত্ব আর দিক মিলে ঠিক একটা বিন্দু।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const v = pick ? DIRS[pick] : [0, 0];
  const end: P = [O[0] + v[0] * KM, O[1] + v[1] * KM];
  const at = lerp(O, end, t);
  const right = pick === X4_RIGHT && !walk.running;
  const wrong = !!pick && pick !== X4_RIGHT && !walk.running;
  return (
    <>
      <TownMap label="গেটকে ঘিরে 1 km-এর বৃত্ত, পাশে compass। স্কুলটা map-এ দেখা যাচ্ছে। নানু গেট থেকে হাঁটবেন।" gate="origin" school={right ? "mint" : "plain"}>
        <circle cx={O[0]} cy={O[1]} r={KM} fill="none" stroke={PH.amber} strokeWidth={1.2} strokeDasharray="4 4" className="pointer-events-none" />
        <Compass x={262} y={170} r={14} lit={pick} />
        {pick && t > 0.02 && <PArrow a={O} b={at} tone={right ? "mint" : pick === X4_RIGHT ? "blue" : "red"} tell={t >= 1 ? `1 km ${DIR_BN[pick]}` : false} />}
        {wrong && <WrongMark x={end[0] + (end[0] > O[0] ? 16 : end[0] < O[0] ? -16 : 18)} y={Math.max(end[1] - 22, 16)} />}
        {pick && <NanuOnMap at={at} walking={walk.running} t={t} />}
      </TownMap>
      <div className="mx-auto mt-2 flex w-full max-w-[19rem] flex-wrap items-center justify-center gap-1.5 text-sm">
        <span className="mr-0.5">তিথি: গেট থেকে 1 km</span>
        {(["N", "E", "S", "W"] as Dir[]).map((d) => (
          <button key={d} type="button" disabled={walk.running || right} className={chip(pick === d)} onClick={() => go(d)}>
            <span className="font-sans">{DIR_BN[d]}</span>
          </button>
        ))}
      </div>
      {wrong && <Nope key={miss}>{X4_NOPE[pick]}</Nope>}
      <Task done={right}>তিথির মেসেজটা শেষ করুন: গেট থেকে 1 km কোন দিকে গেলে স্কুল?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The hidden third thing. Both distance and direction are measured from
// somewhere: the reader taps that spot. A wrong spot plays what it would mean:
// the same "1 km পূর্বে" laid from there lands nowhere near the school.

const X5_SPOTS: { key: "gate" | "school" | "lake"; at: P; name: string }[] = [
  { key: "school", at: SCHOOL, name: "স্কুল" },
  { key: "lake", at: [LAKE[0] + 6, LAKE[1] - 4], name: "ঝিল" },
  { key: "gate", at: O, name: "বাসার গেট" },
];
const X5_NOPE = {
  gate: "",
  school: "স্কুল থেকে 1 km পূর্বে মাপলে নানু স্কুল ছাড়িয়ে আরও 1 km চলে যান। ফিতাটা শুরু হয় কোথায়?",
  lake: "ঝিল থেকে 1 km পূর্বে গেলে নানু অন্য পাড়ায়। তিথির কথাগুলো আবার পড়ুন, কোথা থেকে মাপছে?",
};

export function MeasuredFrom() {
  const pass = useGate();
  const [pick, setPick] = useSeed<"gate" | "school" | "lake" | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(1300);
  const choose = (key: "gate" | "school" | "lake") => {
    if (walk.running) return;
    setPick(key);
    sfx.tap();
    walk.start(() => {
      if (key === "gate") {
        sfx.chime();
        pass("সব উত্তরেই লুকিয়ে ছিল বাসার গেট।");
      } else setMiss((m) => m + 1);
    });
  };
  const spot = X5_SPOTS.find((s) => s.key === pick);
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const end: P | null = spot ? [spot.at[0] + KM, spot.at[1]] : null;
  const right = pick === "gate" && !walk.running;
  const wrong = !!pick && pick !== "gate" && !walk.running;
  return (
    <>
      <TownMap label="map-এ তিনটা জায়গা tap করা যায়: বাসার গেট, স্কুল, ঝিল। যেটা tap করবেন, সেখান থেকে 1 km পূর্বে মাপা হবে।" school="plain" gate={right ? "origin" : true}>
        {spot && end && t > 0.02 && <PArrow a={spot.at} b={lerp(spot.at, end, t)} tone={right ? "mint" : pick === "gate" ? "blue" : "red"} tell={t >= 1 ? "1 km পূর্বে" : false} />}
        {spot && end && wrong && <WrongMark x={Math.min(end[0] + 16, W - 10)} y={end[1] - 22} />}
        {spot && end && <NanuOnMap at={lerp(spot.at, end, t)} walking={walk.running} t={t} />}
        {right && <circle cx={O[0]} cy={O[1]} r={11} fill="none" stroke={PH.amber} strokeWidth={2.2} className={POP} />}
        {right && <Ripple at={O} tone="amber" r={22} />}
        {X5_SPOTS.map((s) => (
          <g key={s.key} onClick={() => choose(s.key)} className="cursor-pointer" role="button" aria-label={s.name}>
            <circle cx={s.at[0]} cy={s.at[1] - 6} r={20} fill="transparent" />
            {!pick && <circle cx={s.at[0]} cy={s.at[1] - 6} r={15} fill="none" stroke={PH.blue} strokeWidth={1.4} strokeDasharray="2.5 2.5" className="pointer-events-none" />}
          </g>
        ))}
      </TownMap>
      <TithiChat lit={right} />
      {wrong && <Nope key={miss}>{X5_NOPE[pick]}</Nope>}
      <Task done={right}>তিথির দুইটা উত্তরেই দূরত্ব মাপা হচ্ছে একটা জায়গা থেকে। map-এ সেই জায়গায় tap করুন।</Task>
    </>
  );
}

// 5½ · Figure for screen 5's explanation: the same "1 km পূর্বে" means nothing
// until it is pinned somewhere. Laid from the gate it reaches the school; from
// the ঝিল, somewhere else. Then the gate is named: মূল বিন্দু, origin.

const S5_SAY = [
  "শুধু 1 km পূর্বে। কিন্তু শুরু কোথা থেকে?",
  "গেট থেকে মাপলে: স্কুল।",
  "ঝিল থেকে মাপলে: অন্য জায়গা।",
  "যেখান থেকে মাপি, সেটাই মূল বিন্দু, origin।",
];

export function OriginPin({}: Story) {
  const s = useScene(3, [600, 1600, 2200]);
  const k = s.k;
  const lakeAt: P = [LAKE[0] + 6, LAKE[1] - 4];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <TownMap label="একই 1 km পূর্বে, দুই জায়গা থেকে মাপা। গেট থেকে স্কুলে পৌঁছায়, ঝিল থেকে অন্য জায়গায়।" school={k >= 1 ? "mint" : "plain"} gate={k >= 3 ? "origin" : true} sheet={{ className: "max-w-[18rem]" }}>
        {k === 0 && <PArrow a={[150, 24]} b={[150 + KM, 24]} tone="blue" tell={false} />}
        {k === 0 && <Txt x={150 + KM + 12} y={28} size={12} color={PH.red} weight={800}>?</Txt>}
        {k >= 1 && <PArrow key="g" a={O} b={SCHOOL} tone="mint" draw tell="1 km পূর্বে" />}
        {k >= 2 && <PArrow key="l" a={lakeAt} b={[lakeAt[0] + KM, lakeAt[1]]} tone="red" draw tell="1 km পূর্বে" />}
        {k >= 2 && <Txt x={lakeAt[0] + KM + 10} y={lakeAt[1] + 4} size={12} color={PH.red} weight={800}>?</Txt>}
        {k >= 3 && <Tag x={O[0] - 6} y={O[1] - 42} text="মূল বিন্দু · origin" tone="mint" solid pop />}
      </TownMap>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · Story scene for screen 6: নানু's bus stops at the বাসস্টপ instead.

export function BusStopDrop({}: Story) {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="নানুর বাস থামলো বাসস্টপে। নানু নেমে ভাবছেন, এখান থেকে স্কুল কোথায়।">
        <BusStop x={196} y={150} s={2.2} />
        <text x={196} y={162} fontSize={8} fontWeight={700} textAnchor="middle" fill={PH.ink}>
          বাসস্টপ
        </text>
        <StageBus x={k >= 1 ? 140 : -60} />
        {k >= 2 && <NanuFigure x={232} y={150} label />}
        {k >= 2 && <Bubble x={232} y={80} side="left" lines={["এখান থেকে", "স্কুল কোথায়?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6 · From the bus stop: the reader builds তিথি's new answer from two chips,
// a distance and a direction, and নানু walks it. Wrong builds overshoot or
// wander off; the right one, 600 m উত্তরে, lands on the same school.

const X6_DIST = [0.6, 1] as const;
const X6_DIR: Dir[] = ["N", "E", "S"];
export function FromBusStop() {
  const pass = useGate();
  const [dist, setDist] = useSeed<number | null>("dist", null);
  const [dir, setDir] = useSeed<Dir | null>("dir", null);
  const [sent, setSent] = useSeed<{ dist: number; dir: Dir } | null>("sent", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(1300);
  const send = () => {
    if (dist === null || dir === null || walk.running) return;
    const order = { dist, dir };
    setSent(order);
    walk.start(() => {
      if (order.dist === 0.6 && order.dir === "N") {
        sfx.chime();
        pass("বাসস্টপ থেকে স্কুল 600 m উত্তরে।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = sent === null ? 0 : walk.running ? walk.t : 1;
  const v = sent ? DIRS[sent.dir] : [0, 0];
  const end: P = sent ? [BUS[0] + v[0] * KM * sent.dist, BUS[1] + v[1] * KM * sent.dist] : BUS;
  const at = lerp(BUS, end, t);
  const right = !!sent && sent.dist === 0.6 && sent.dir === "N" && !walk.running;
  const wrong = !!sent && !right && !walk.running;
  const word = (d: number) => (d === 1 ? "1 km" : "600 m");
  const nope = !sent
    ? ""
    : sent.dir === "N"
      ? "নানু স্কুল পেরিয়ে আরও 400 m চলে গেলেন। বাসস্টপ থেকে স্কুল 1 km এর কম দূরে।"
      : sent.dir === "E"
        ? "নানু পূর্বে হেঁটে স্কুল থেকে সরে গেলেন। বাসস্টপ থেকে স্কুল কোন দিকে, map-এ দেখুন।"
        : "নানু দক্ষিণে হাঁটলেন, স্কুলের উল্টা দিকে। স্কুলটা বাসস্টপের উপরে, মানে উত্তরে।";
  return (
    <>
      <TownMap label="বাসস্টপ থেকে স্কুল, map-এ। বাসস্টপ নতুন মূল বিন্দু। নানু বাসস্টপ থেকে হাঁটবেন।" school={right ? "mint" : "plain"} bus="origin" sheet={{ className: "max-w-[20rem]" }}>
        <Compass x={262} y={170} r={14} lit={sent?.dir ?? null} />
        {sent && t > 0.02 && <PArrow a={BUS} b={at} tone={right ? "mint" : "red"} tell={t >= 1 ? `${word(sent.dist)} ${DIR_BN[sent.dir]}` : false} />}
        {wrong && <WrongMark x={Math.min(end[0] + 18, W - 10)} y={Math.max(end[1] - 22, 14)} />}
        {sent && <NanuOnMap at={at} walking={walk.running} t={t} />}
      </TownMap>
      <div className="mx-auto mt-2 flex w-full max-w-[20rem] flex-wrap items-center justify-center gap-1.5 text-sm">
        <span>বাসস্টপ থেকে</span>
        {X6_DIST.map((d) => (
          <button key={d} type="button" disabled={walk.running || right} className={`${chip(dist === d)} font-mono`} onClick={() => setDist(d)}>
            {word(d)}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-1.5 flex w-full max-w-[20rem] flex-wrap items-center justify-center gap-1.5 text-sm">
        {X6_DIR.map((d) => (
          <button key={d} type="button" disabled={walk.running || right} className={chip(dir === d)} onClick={() => setDir(d)}>
            <span className="font-sans">{DIR_BN[d]}</span>
          </button>
        ))}
        <button type="button" className={`${primaryBtn} h-9! px-4!`} disabled={dist === null || dir === null || walk.running || right} onClick={send}>
          পাঠান
        </button>
      </div>
      {wrong && <Nope key={miss}>{nope}</Nope>}
      <Task done={right}>নানু বাসস্টপে। তিথির নতুন উত্তর বানান: কত দূরে, কোন দিকে। তারপর পাঠান।</Task>
    </>
  );
}

// 6½ · Figure for screen 6's explanation: both answers, both arrows, one
// school; each gets a tick.

const S6_SAY = ["গেট থেকে: 1 km পূর্বে।", "বাসস্টপ থেকে: 600 m উত্তরে।", "একই স্কুল। দুটোই ঠিক।"];

function Tick({ at }: { at: P }) {
  return (
    <g className={`pointer-events-none ${POP}`}>
      <circle cx={at[0]} cy={at[1]} r={7} fill={PH.mint} />
      <path d={`M${at[0] - 3.2} ${at[1]}l2.2 2.4l4.2 -4.6`} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function BothRight({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S6_SAY[k]}</span>}>
      <TownMap label="গেট থেকে 1 km পূর্বে আর বাসস্টপ থেকে 600 m উত্তরে, দুইটা তীরই একই স্কুলে।" school="mint" gate="origin" bus="origin" sheet={{ className: "max-w-[18rem]" }}>
        <PArrow a={O} b={SCHOOL} tone="mint" tell="1 km পূর্বে" />
        {k >= 1 && <PArrow key="b" a={BUS} b={SCHOOL} tone="amber" draw tell="600 m উত্তরে" />}
        {k >= 2 && <Tick at={[(O[0] + SCHOOL[0]) / 2, O[1] - 11]} />}
        {k >= 2 && <Tick at={[BUS[0] + 13, (BUS[1] + SCHOOL[1]) / 2]} />}
      </TownMap>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7 · The phone map: two fixed lines on the Earth (the equator, Greenwich), and
// how many degrees north and east of them. Three pins; the reader taps the one
// at 23.6° N, 89.8° E. Each tap draws its two measures from the two lines.

const PM = { W: 240, H: 220, lon0: -20, lon1: 110, lat0: -45, lat1: 104 };
const pmx = (lon: number) => 14 + ((lon - PM.lon0) / (PM.lon1 - PM.lon0)) * (PM.W - 28);
const pmy = (lat: number) => 18 + ((PM.lat1 - lat) / (PM.lat1 - PM.lat0)) * (PM.H - 36);
const X7_PINS: { lat: number; lon: number }[] = [
  { lat: -23.6, lon: 89.8 },
  { lat: 89.8, lon: 23.6 },
  { lat: 23.6, lon: 89.8 },
];
const X7_RIGHT = 2;
const X7_NOPE = [
  "এই pin বিষুবরেখার নিচে: 23.6° দক্ষিণে। ফরিদপুর উত্তরে।",
  "এখানে সংখ্যা দুইটা উল্টে গেছে: 89.8° উত্তরে, মানে প্রায় উত্তর মেরু!",
  "",
];
const latWord = (lat: number) => `${Math.abs(lat)}° ${lat >= 0 ? "উত্তরে" : "দক্ষিণে"}`;

export function PhoneMap() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(80);
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    sfx.pop();
    play.play(10, () => {
      if (i === X7_RIGHT) {
        sfx.chime();
        pass("ফোনের map মাপে দুইটা রেখা থেকে।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : play.running ? play.k / 10 : 1;
  const p = pick === null ? null : X7_PINS[pick];
  const right = pick === X7_RIGHT && !play.running;
  return (
    <>
      <div className="mx-auto w-full max-w-[16rem] rounded-[1.6rem] border-[6px] border-[#1e293b] bg-[#1e293b] shadow-md">
        <Sheet w={PM.W} h={PM.H} label="ফোনের map: বিষুবরেখা আর Greenwich রেখা, আর তিনটা pin।" className="rounded-[1.2rem]" bg="#eef6ff" frame="line">
          {[-30, 30, 60, 90].map((lat) => (
            <path key={lat} d={`M10 ${pmy(lat)}H${PM.W - 10}`} stroke="#cbd5e1" strokeWidth={0.6} className="pointer-events-none" />
          ))}
          {[30, 60, 90].map((lon) => (
            <path key={lon} d={`M${pmx(lon)} 10V${PM.H - 10}`} stroke="#cbd5e1" strokeWidth={0.6} className="pointer-events-none" />
          ))}
          <path d={`M10 ${pmy(0)}H${PM.W - 10}`} stroke={PH.amber} strokeWidth={1.8} className="pointer-events-none" />
          <Txt x={pmx(0) + 4} y={pmy(0) + 11} size={8} anchor="start" color={PH.amber}>
            বিষুবরেখা
          </Txt>
          <path d={`M${pmx(0)} 10V${PM.H - 10}`} stroke={PH.blue} strokeWidth={1.8} className="pointer-events-none" />
          <Txt x={pmx(0) + 4} y={PM.H - 14} size={8} anchor="start" color={PH.blue}>
            Greenwich
          </Txt>
          <circle cx={pmx(0)} cy={pmy(0)} r={3} fill={PH.ink} className="pointer-events-none" />
          {p && t > 0 && (
            <g className="pointer-events-none">
              <path d={`M${pmx(p.lon)} ${pmy(0)}V${pmy(p.lat * t)}`} stroke={PH.amber} strokeWidth={2} strokeDasharray="3 2" />
              <path d={`M${pmx(0)} ${pmy(p.lat)}H${pmx(p.lon * t)}`} stroke={PH.blue} strokeWidth={2} strokeDasharray="3 2" />
              {t >= 1 && (
                <>
                  <Tag x={pmx(p.lon) + (p.lon > 60 ? -34 : 34)} y={(pmy(0) + pmy(p.lat)) / 2} text={latWord(p.lat)} tone="amber" size={8} pop />
                  <Tag x={(pmx(0) + pmx(p.lon)) / 2} y={pmy(p.lat) + (p.lat > 80 ? 12 : -10)} text={`${p.lon}° পূর্বে`} tone="blue" size={8} pop />
                </>
              )}
            </g>
          )}
          {X7_PINS.map((q, i) => {
            const x = pmx(q.lon);
            const y = pmy(q.lat);
            const look = pick === i && !play.running ? (i === X7_RIGHT ? PH.mint : PH.red) : "#7c3aed";
            return (
              <g key={i} onClick={() => choose(i)} className="cursor-pointer" role="button" aria-label={`pin ${String.fromCharCode(65 + i)}`}>
                <circle cx={x} cy={y - 8} r={14} fill="transparent" />
                <path d={`M${x} ${y}c-4 -6 -7 -8 -7 -12a7 7 0 0 1 14 0c0 4 -3 6 -7 12Z`} fill={look} stroke="#fff" strokeWidth={1.2} className="transition-[fill] duration-300 motion-reduce:transition-none" />
                <text x={x} y={y - 9.5} fontSize={8} fontWeight={800} textAnchor="middle" fill="#fff" className="pointer-events-none">
                  {String.fromCharCode(65 + i)}
                </text>
              </g>
            );
          })}
          {right && <Tag x={pmx(89.8)} y={pmy(23.6) - 28} text="ফরিদপুর" tone="mint" solid pop />}
        </Sheet>
      </div>
      {pick !== null && pick !== X7_RIGHT && !play.running && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      <Task done={right}>ফরিদপুর বিষুবরেখা থেকে 23.6° উত্তরে, Greenwich থেকে 89.8° পূর্বে। কোন pin-টা ফরিদপুর?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn: three half-answers. For each, the reader taps the one of the
// three things that is missing; the map then plays what the missing piece
// leaves open (a whole circle, many starts, a whole line). Wrong taps bounce.

type Need = "from" | "far" | "way";
const NEED_BN: Record<Need, string> = { from: "কোথা থেকে", far: "কত দূরে", way: "কোন দিকে" };
const X8_ROUNDS: { say: string; missing: Need; nope: Partial<Record<Need, string>> }[] = [
  { say: "বাসস্টপ থেকে 600 m।", missing: "way", nope: { from: "বাসস্টপ তো বলেছে, মাপা শুরু ওখান থেকেই।", far: "600 m তো আছে। আর কোনটা নেই?" } },
  { say: "1 km পূর্বে।", missing: "from", nope: { far: "1 km তো আছে।", way: "পূর্বে, দিকও আছে। কিন্তু 1 km মাপা শুরু কোথায়?" } },
  { say: "গেট থেকে উত্তরে।", missing: "far", nope: { from: "গেট তো বলেছে।", way: "উত্তরে, দিকও আছে। কিন্তু কতখানি হাঁটবেন নানু?" } },
];

export function WhatsMissing() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [shown, setShown] = useSeed<Need | null>("shown", null);
  const [wrong, setWrong] = useState<Need | null>(null);
  const [miss, setMiss] = useState(0);
  const r = X8_ROUNDS[Math.min(round, X8_ROUNDS.length - 1)];
  const finished = round >= X8_ROUNDS.length;
  const answered = shown === r.missing;
  const tap = (n: Need) => {
    if (answered || finished) return;
    if (n === r.missing) {
      setShown(n);
      setWrong(null);
      sfx.pop();
    } else {
      setWrong(n);
      setMiss((m) => m + 1);
    }
  };
  const next = () => {
    const nr = round + 1;
    setRound(nr);
    setShown(null);
    if (nr === X8_ROUNDS.length) pass("তিনটার একটা বাদ গেলেই জায়গা হারায়।");
  };
  const sweep = (from: P, len: number) =>
    [0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
      const a = (d * Math.PI) / 180;
      return [from[0] + Math.cos(a) * len, from[1] + Math.sin(a) * len] as P;
    });
  return (
    <>
      <TownMap label="map, আর তিথির অর্ধেক উত্তর। যেটা বাদ গেছে, সেটা বের করলে map দেখায় নানু কোথায় কোথায় চলে যেতে পারেন।" school="plain" bus={round === 0 && !finished} sheet={{ className: "max-w-[19rem]" }}>
        {!finished && answered && round === 0 && (
          <g key="r0">
            <circle cx={BUS[0]} cy={BUS[1]} r={0.6 * KM} fill="none" stroke={PH.red} strokeWidth={1.3} strokeDasharray="4 3" className={FADE} />
            {sweep(BUS, 0.6 * KM).filter(([, y]) => y < H - 6).map((p, i) => (
              <MaybeSchool key={i} at={p} />
            ))}
          </g>
        )}
        {!finished && answered && round === 1 &&
          ([O, [LAKE[0] + 6, LAKE[1] - 4], [70, 40], BUS] as P[]).map((a, i) => (
            <PArrow key={`r1${i}`} a={a} b={[a[0] + KM, a[1]]} tone={i === 0 ? "mint" : "red"} draw delay={i * 180} tell="1 km পূর্বে" />
          ))}
        {!finished && answered && round === 2 && (
          <g key="r2">
            <path d={`M${O[0]} ${O[1]}V12`} stroke={PH.red} strokeWidth={1.6} strokeDasharray="4 3" className={FADE} />
            {[24, 48, 72].map((d) => (
              <MaybeSchool key={d} at={[O[0], O[1] - d]} />
            ))}
          </g>
        )}
        {finished && <PArrow a={O} b={SCHOOL} tone="mint" tell="1 km পূর্বে" />}
      </TownMap>
      {!finished ? (
        <>
          <div className="mx-auto mt-2 w-fit max-w-[19rem] rounded-2xl rounded-tr-sm bg-cat-blue/10 px-3 py-1 text-sm">
            <span className="text-muted">তিথি:</span> {r.say}
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {(["from", "far", "way"] as Need[]).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => tap(n)}
                disabled={answered}
                className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors motion-reduce:transition-none disabled:cursor-default ${
                  answered && n === r.missing ? "win-pop border-accent bg-accent text-accent-foreground" : wrong === n ? "nudge border-danger/50 bg-surface text-danger" : "border-border bg-surface hover:border-cat-blue/60"
                }`}
              >
                {NEED_BN[n]}
              </button>
            ))}
          </div>
          {wrong && !answered && <Nope key={miss}>{r.nope[wrong]}</Nope>}
          {answered && (
            <div className={`mt-2 flex items-center justify-center gap-3 text-sm ${FADE}`}>
              <span className="text-danger">{NEED_BN[r.missing]} বাদ, তাই নানু যেকোনো জায়গায়।</span>
              <button type="button" className={`${primaryBtn} h-9! px-4!`} onClick={next}>
                {round < X8_ROUNDS.length - 1 ? "পরেরটা" : "শেষ"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={`mt-2 text-center text-sm font-semibold text-accent-text ${FADE}`}>গেট থেকে 1 km পূর্বে: তিনটাই আছে।</div>
      )}
      <Ticks items={X8_ROUNDS.map((x, i) => [`${i + 1}`, round > i] as [string, boolean])} />
      <Task done={finished}>তিথির তিনটা অর্ধেক উত্তর। প্রতিটায় কোন জিনিসটা বাদ গেছে, tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9a · The closing story scene: নানু at the school gate, তিথি running out.

export function NanuArrives({}: Story) {
  const s = useScene(3, [600, 1600, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="নানু ঠিক স্কুলের সামনে পৌঁছে গেলেন। তিথি দৌড়ে বের হলো।">
        <School x={220} y={150} s={2} />
        <NanuFigure x={k >= 1 ? 140 : 20} y={150} label />
        <Person who="tithi" x={k >= 2 ? 186 : 236} y={150} facing={-1} walking={k === 2} arm={k >= 2 ? "wave" : "down"} mood="happy" label />
        {k >= 3 && <Bubble x={186} y={80} side="left" lines={["নানু! ঠিক", "জায়গায় এসেছো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

/** নানু: white sari with a green border, grey hair in a bun, feet at (x, y); glides over `ms` when x changes. `s` scales her (the map's small নানু). */
function NanuFigure({ x, y, s = 1, ms = 1400, label = false }: { x: number; y: number; s?: number; ms?: number; label?: boolean }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-out motion-reduce:transition-none">
      <g transform={`scale(${s})`}>
      <path d="M-9 -38L-13 -1H13L9 -38Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth={0.8} />
      <path d="M-13 -4H13" stroke="#15803d" strokeWidth={2.2} />
      <path d="M-9 -38q9 10 18 0" fill="none" stroke="#15803d" strokeWidth={1.6} />
      <path d="M8 -36l4 13" stroke="#c68e5f" strokeWidth={4} strokeLinecap="round" />
      <path d="M-8 -36l-3 13" stroke="#c68e5f" strokeWidth={4} strokeLinecap="round" />
      <rect x={10} y={-26} width={8} height={9} rx={2} fill="#7c3aed" />
      <circle cy={-50} r={9} fill="#c68e5f" />
      <path d="M-9.5 -51q0 -11 9.5 -11t9.5 11q-4 -6 -9.5 -6t-9.5 6Z" fill="#d1d5db" />
      <circle cx={-8} cy={-57} r={4} fill="#d1d5db" />
      <circle cx={-3.3} cy={-50} r={1.1} fill={PH.ink} />
      <circle cx={3.3} cy={-50} r={1.1} fill={PH.ink} />
      <path d="M-3 -45q3 2.6 6 0" fill="none" stroke={PH.ink} strokeWidth={1.1} strokeLinecap="round" />
      </g>
      {label && (
        <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={PH.ink}>
          নানু
        </text>
      )}
    </g>
  );
}

// 9 · Recap figure: the three chips, one at a time, on the one true answer.

const S9_SAY = ["কোথা থেকে: বাসার গেট।", "কত দূরে: 1 km।", "কোন দিকে: পূর্বে।", "তিনটা মিলে অবস্থান।"];

export function ThreeChips({}: Story) {
  const s = useScene(3, [600, 1300, 1300]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S9_SAY[k]}</span>}>
      <TownMap label="গেট থেকে 1 km পূর্বে স্কুল, তিনটা chip দিয়ে।" school={k >= 3 ? "mint" : "plain"} gate="origin" sheet={{ className: "max-w-[18rem]" }}>
        {k >= 0 && <Tag x={O[0]} y={O[1] - 42} text="কোথা থেকে" tone="mint" solid pop />}
        {k >= 1 && <PArrow key="a" a={O} b={SCHOOL} tone="amber" draw tell="1 km" />}
        {k >= 1 && <Tag x={(O[0] + SCHOOL[0]) / 2} y={O[1] + 22} text="কত দূরে" tone="amber" solid pop />}
        {k >= 2 && <Compass x={262} y={170} r={13} lit="E" />}
        {k >= 2 && <Tag x={SCHOOL[0] + 50} y={SCHOOL[1] - 30} text="কোন দিকে" tone="blue" solid pop />}
      </TownMap>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  PositionBet: { start: {}, sealed: { bet: 1 } },
  JhiltuliDrop: { start: {}, two: { drops: [[190, 70], [250, 130]] }, done: { drops: [[190, 70], [250, 130], [230, 60]] } },
  OneKmRing: { start: {}, half: { ang: 90, seen: [0, 1, 2, 7] }, done: { ang: 200, seen: [0, 1, 2, 3, 4, 5, 6, 7] } },
  WhichWay: { start: {}, wrong: { pick: "N" }, right: { pick: "E" } },
  MeasuredFrom: { start: {}, wrong: { pick: "school" }, right: { pick: "gate" } },
  FromBusStop: { start: {}, wrong: { dist: 1, dir: "N", sent: { dist: 1, dir: "N" } }, right: { dist: 0.6, dir: "N", sent: { dist: 0.6, dir: "N" } } },
  PhoneMap: { start: {}, wrong: { pick: 1 }, right: { pick: 2 } },
  WhatsMissing: { start: {}, r1: { round: 0, shown: "way" }, r2: { round: 1, shown: "from" }, r3: { round: 2, shown: "far" }, done: { round: 3 } },
  OriginPin: { a: { k: 0 }, b: { k: 2 }, end: {} },
  BothRight: { end: {} },
  ThreeChips: { end: {} },
  NanuComing: { end: {} },
  BusStopDrop: { end: {} },
  NanuArrives: { end: {} },
};
