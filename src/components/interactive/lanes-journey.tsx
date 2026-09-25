"use client";

import { useState, type KeyboardEvent } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  Draw,
  FADE,
  LOOK,
  Nope,
  POP,
  Scene,
  Stepper,
  Ticks,
  primaryBtn,
  usePlay,
  useScene,
  useSeed,
  type Fixtures,
  type Look,
} from "@/components/journey/kit";
import { Bubble, Building, Gate, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Label, Plane, clamp, makeFrame, same, tup, type XY } from "@/components/journey/plane";
import {
  CARD,
  L_BigRick,
  L_Bell,
  L_CardText,
  L_Clock,
  L_Home,
  L_NamedCard,
  L_Place,
  L_Remote,
  L_Rickshaw,
  L_Roads,
  L_Squares,
  L_Trail,
  O,
  SCHOOL,
  faceOf,
  land,
  on,
  route,
  type Story,
} from "./lanes-kit";

// Screens for "Math for AI 5.5 — The road to school, a card for the rickshaw
// mama", told as a Journey in the author's Bangla-English, 7 steps (the
// pathshala-journey skill).
//
// Fahim's first day at the new school. The map says the school is (2, 3) from
// home: 2 east, 3 north. But the new neighbourhood has only two kinds of road,
// the straight main road (1, 0) and the slanting lane (1, 1), and nothing goes
// north. The rickshaw mama wants the trip as a card: blocks straight, blocks
// slanting. The reader seals a bet on the card (SchoolBet), watches the map's
// own numbers overshoot and pedals the rickshaw to the gate (NoNorthRoad: 3 up
// the lane, 1 back), sees why the lane forces a minus (WhyMinus), gets the card
// on paper by matching two lines (PeelEquations), does Ammu's two errands
// unaided (YourErrand), finds the slip in Nasib's card for the fuchka stall
// (SpotTheSlip), and opens the bet at the school gate (BetOpened).
//
// The second idea — the same arrow gets new numbers on a new grid, and
// Pythagoras only works on square roads — is its own journey, 5.5b
// (twocard-journey.tsx). The map pieces both use live in lanes-kit.tsx.
//
// Story scenes: LastNight, FirstDay, FahimReads, WhyBack, AmmuErrands,
// NasibCard, BellRings. Every <Then> figure is watch-only: the road grid laid
// over the map, the card filling slot by slot, the lane count forced by north,
// the peel order, the system's name (SystemBrace, in the side quest), the
// mosque's minus, the fuchka card checked, the trap and the rule (NoWayTrap),
// and the bridge to 5.5b at tiffin.
// Tailwind only; the maps are journey/plane sheets, and ink on them is fixed.

/** The neighbourhood map: home at (0, 0), one block per unit. */
const M = makeFrame(-2, 5, -1, 4, 26, 12);

// ---------------------------------------------------------------------------
// 1r · A story scene for screen 1's recall line, no task: last night, from
//      5.4. The khata's six flats settle onto one flat sheet, and Nasib, who
//      lost, carries the last box up the stairs.

const LN_GR = 150;
/** the khata's six flats, first loose on the page, then settled on the sheet */
const LN_LOOSE: XY[] = [
  [46, 56],
  [74, 100],
  [96, 50],
  [116, 96],
  [58, 80],
  [120, 60],
];
const LN_SHEET: XY[] = [
  [60, 88],
  [77, 80],
  [94, 72],
  [77, 90],
  [94, 82],
  [109, 74],
];
const ln_step = (i: number): XY => [236 + 20 * i + 10, LN_GR - 14 * (i + 1)];

/** stairs going up to the right from x, each step 20 wide and 14 high */
function LN_Stairs({ x, n = 4 }: { x: number; n?: number }) {
  let d = `M${x} ${LN_GR}`;
  for (let i = 0; i < n; i++) d += `V${LN_GR - 14 * (i + 1)}H${x + 20 * (i + 1)}`;
  d += `V${LN_GR}Z`;
  return <path d={d} fill="#d6c3a1" stroke="#8a6a48" strokeWidth={1.2} className="pointer-events-none" />;
}

/** a taped cardboard box, bottom-centre at (x, y); it glides to a new spot */
function LN_Box({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none transition-transform motion-reduce:transition-none" style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: "1600ms" }}>
      <rect x={-15} y={-22} width={30} height={22} rx={1.5} fill="#c98f4f" stroke="#8a5a2b" strokeWidth={1} />
      <rect x={-15} y={-22} width={30} height={4} fill="#b77c3e" />
      <rect x={-3} y={-22} width={6} height={22} fill="#e8c48a" opacity={0.8} />
    </g>
  );
}

export function LastNight({}: Story) {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  const up = k >= 2;
  const [nx, ny] = up ? ln_step(1) : [190, LN_GR];

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="last night: the khata's six flats settle onto one flat sheet, and Nasib carries the last box up the stairs">
        <rect x={30} y={36} width={104} height={80} rx={3} fill="white" stroke="#8a6a48" strokeWidth={1.2} />
        <text x={82} y={30} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#0f1b2d">
          খাতা
        </text>
        {k >= 1 && <path d="M42 90L98 64L122 74L66 100Z" fill="#14b8a6" fillOpacity={0.22} stroke="#0f766e" strokeWidth={1.2} className={FADE} />}
        {LN_LOOSE.map((p, i) => {
          const [x, y] = k >= 1 ? LN_SHEET[i] : p;
          return (
            <circle
              key={i}
              r={3.2}
              fill="#0f766e"
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
            />
          );
        })}
        <LN_Stairs x={236} />
        {!up && <LN_Box x={214} y={LN_GR} />}
        <Person who="nasib" x={nx} y={ny} walking={up} arm={up ? "hold" : "down"} ms={1600} label={!up} />
        {up && <LN_Box x={nx + 16} y={ny - 22} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the first morning. The
//      clock says 7:40, the bell is at 8. Fahim comes out in his uniform, Ammu
//      reads the map's card (2, 3), and the rickshaw mama at the gate wants
//      blocks straight and blocks slanting. The answer card is not shown:
//      that is the bet.

export function FirstDay({}: Story) {
  const s = useScene(4, [600, 2200, 2200, 2400, 2600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="morning outside the new flat, 7:40 on the clock: Fahim in his school uniform, Ammu with the map's card (2, 3), and the rickshaw mama asking how many blocks straight and how many slanting">
        <Building x={4} y={150} w={60} h={112} color="#e7d7c1" />
        <L_Clock x={34} y={62} h={7} m={40} />
        <Person who="ammu" x={92} y={150} arm={k === 2 ? "hold" : k === 1 ? "wave" : "down"} mood="plain" />
        {k === 1 && <Bubble x={92} y={84} side="right" lines={["আটটায় ঘণ্টা।", "দেরি করিস না।"]} />}
        {k >= 2 && <L_NamedCard x={112} y={70} name="map বলছে" text="(2, 3)" tone="amber" />}
        <Person who="fahim" x={k >= 1 ? 150 : 44} y={150} walking={k === 1} ms={1600} mood={k >= 4 ? "puzzled" : "plain"} />
        <L_BigRick x={250} y={150} />
        {k === 3 && <Bubble x={270} y={86} side="left" lines={["ম্যাপ-ট্যাপ বুঝি না,", "মামা।"]} />}
        {k >= 4 && <Bubble x={270} y={86} side="left" lines={["কয় ব্লক সোজা যামু,", "কয় ব্লক বাঁকা?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The map with its two roads and no north; four cards for
//     Mama: (2, 3) · (2, 1) · (−1, 3) · "can't get there". Sealed unmarked:
//     BetOpened, six screens later, is what settles it.

const BET = ["(2, 3)", "(2, 1)", "(−1, 3)", "যাওয়াই যাবে না"];

export function SchoolBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);

  const seal = () => {
    setSealed(true);
    pass("বাজি ধরা হলো। চলেন রিকশায় উঠি।");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[12.5rem]">
        <Plane f={M} grid={0} axes={false} label="the neighbourhood map: home, the school at (2, 3), a straight road east and slanting lanes north-east, and no road north" className="my-0! max-w-none">
          <L_Roads f={M} />
          <path d={`M${M.sx(0)} ${M.sy(0.2)}V${M.sy(1.1)}`} strokeWidth={2} strokeDasharray="3 3" className="pointer-events-none stroke-[#94a3b8]" />
          <path d={`M${M.sx(0) - 5} ${M.sy(0.85) - 5}l10 10m0 -10l-10 10`} strokeWidth={2} className="pointer-events-none stroke-danger" />
          <Label f={M} at={[0, 1.2]} dy={-3} size={8} className="fill-[#5a6b7d]">
            north এ রাস্তা নাই
          </Label>
          <Arrow f={M} from={O} to={[1, 0]} tone="blue" w={2.6} />
          <Arrow f={M} from={O} to={[1, 1]} tone="coral" w={2.6} />
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" />
          {bet !== null && (
            <g key={bet} className={POP}>
              <rect x={M.sx(2.6)} y={M.sy(0.55)} width={62} height={20} rx={4} fill="white" stroke="#1d4ed8" strokeWidth={1.4} strokeDasharray={sealed ? undefined : "4 2"} />
              {sealed && <circle cx={M.sx(2.6) + 62} cy={M.sy(0.55)} r={5} fill="#dc2626" className={POP} />}
              <text x={M.sx(2.6) + 31} y={M.sy(0.55) + 13.5} textAnchor="middle" fontSize={bet === 3 ? 7.5 : 10} fontWeight={700} fill="#1d4ed8" fontFamily={bet === 3 ? undefined : "ui-monospace, monospace"}>
                {BET[bet]}
              </text>
            </g>
          )}
        </Plane>
      </div>
      <div className="mt-1 text-center text-xs text-muted">
        Card মানে (<span className="text-cat-blue">কয় block সোজা</span>, <span className="text-cat-coral">কয় block বাঁকা</span>). Minus মানে উল্টা দিকে।
      </div>
      <div className="mt-2 text-sm font-medium text-muted">ফাহিম মামাকে কোন card দিবে?</div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {BET.map((b, i) => (
          <Choice key={b} n={i} look={bet === i ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className={i < 3 ? "font-mono" : "text-sm"}>{b}</span>
          </Choice>
        ))}
      </div>
      {!sealed ? (
        bet !== null && (
          <div className={`${FADE} mt-2.5 flex justify-center`}>
            <button type="button" onClick={seal} className={primaryBtn}>
              বাজি ধরলাম
            </button>
          </div>
        )
      ) : (
        <div className={`${FADE} mt-2.5 text-center text-[0.95rem] text-muted`}>বাজি ধরা হলো। উত্তর দিবে রিকশা নিজেই।</div>
      )}
      <Task done={sealed}>আপনি হলে মামাকে কোন card দিতেন? বেছে নিয়ে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the map's square grid
//      and the school's map card (2, 3); then the main roads, then the lanes
//      laid over it; the square grid fades, and the road card is a "?".

const X1F = makeFrame(-1, 4, -1, 4, 22, 10);
const X1_SAY = [
  "Map এ স্কুল 2 block east, 3 block north: (2, 3).",
  "বড় রাস্তাগুলা সব east এ গেছে। সোজা এক block মানে (1, 0)।",
  "গলিগুলা সব বাঁকা, north-east এ। গলিতে এক block মানে (1, 1)।",
  "আর north এ কোনো রাস্তা নাই। তাহলে রাস্তায় স্কুলের card কী?",
];

export function TwoGrids() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={X1F} grid={0} axes={false} label="the map's square grid, with the main roads and the slanting lanes laid over it" className="my-0! max-w-none">
            <L_Squares f={X1F} show={k < 3} />
            <L_Roads f={X1F} show={k >= 1} lanes={k >= 2} />
            <Arrow f={X1F} from={O} to={SCHOOL} tone="ink" w={2.2} dashed />
            {k >= 1 && <Arrow f={X1F} from={O} to={[1, 0]} tone="blue" w={2.6} draw />}
            {k >= 2 && <Arrow f={X1F} from={O} to={[1, 1]} tone="coral" w={2.6} draw />}
            <L_Home f={X1F} name={false} />
            <L_Place f={X1F} at={SCHOOL} kind="school" name={false} />
          </Plane>
        </div>
        <div className="min-w-0 text-center">
          <div className="text-xs text-muted">map এর card</div>
          <div className="font-mono text-lg font-bold">(2, 3)</div>
          <div className="mt-2 text-xs text-muted">রাস্তার card</div>
          <div className="font-mono text-lg font-bold">
            {k >= 3 ? <span className={`${POP} inline-block text-cat-violet`}>(?, ?)</span> : <span className="text-muted/50">…</span>}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: Fahim climbs in and reads
//      Mama the map's two numbers, 2 straight and 3 slanting. Mama says
//      nothing and pedals off. Where the rickshaw stops is the widget's job.

export function FahimReads({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 1800]);
  const k = s.k;
  const rx = k >= 3 ? 256 : 170;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="Fahim climbs into the rickshaw and reads out the map's numbers, 2 straight and 3 slanting; the rickshaw mama says nothing and pedals off">
        <Building x={6} y={150} w={58} h={100} color="#e7d7c1" />
        <path d="M0 162H320" stroke="white" strokeWidth={2} strokeDasharray="10 8" opacity={0.7} />
        {k === 0 && <Person who="fahim" x={108} y={150} mood="plain" />}
        {k >= 2 && <L_NamedCard x={98} y={58} name="map বলছে" text="(2, 3)" tone="amber" />}
        <L_BigRick x={rx} y={150} ms={1600} riders={k >= 1 ? ["fahim"] : []} />
        {k === 2 && <Bubble x={rx - 10} y={84} side="right" lines={["মামা, 2 সোজা,", "3 বাঁকা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · In the rickshaw. First the obvious way: Fahim reads the map's numbers
//     to Mama, 2 straight and 3 slanting, and the rickshaw rolls past the
//     school to (5, 3). Then the pedals are the reader's, on 5.1's remote
//     (L_Remote): straight ± and slanting ±, one block per press, starting
//     from that wrong card. The only way to the gate is 3 up the lane and 1
//     back on the main road.

const MAP_CARD: XY = [2, 3];

export function NoNorthRoad() {
  const pass = useGate();
  const [tried, setTried] = useSeed("tried", false);
  const [amt, setAmt] = useSeed<number[]>("amt", [2, 3]);
  const [done, setDone] = useSeed("done", false);
  const [face, setFace] = useState<1 | -1>(1);
  const play = usePlay(320);
  const first = route(MAP_CARD);
  const pos = tried ? land(amt) : first[play.running ? play.k : 0];
  const there = same(pos, SCHOOL);
  const trip = tried ? route(amt) : first.slice(0, play.k + 1);

  const tryMap = () => play.play(first.length - 1, () => setTried(true));
  const press = (i: number, n: number) => {
    const next = amt.map((a, j) => (j === i ? n : a));
    const to = land(next);
    if (to[0] !== pos[0]) setFace(to[0] < pos[0] ? -1 : 1);
    setAmt(next);
    if (!done && same(to, SCHOOL)) {
      setDone(true);
      pass("North এ রাস্তা নাই, তবু স্কুল পাওয়া গেলো।");
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[13rem]">
        <Plane f={M} grid={0} axes={false} label={`the rickshaw at ${tup(pos)} on the map, card ${tup(tried ? amt : MAP_CARD)}`} className="my-0! max-w-none">
          <L_Roads f={M} />
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" hit={there} />
          {tried && !same(amt as XY, MAP_CARD) && (
            <g opacity={0.3}>
              <L_Trail f={M} pts={first} w={1.6} />
            </g>
          )}
          <L_Trail f={M} pts={trip} />
          <L_Rickshaw f={M} at={pos} facing={tried ? face : 1} ms={tried ? 300 : 320} />
        </Plane>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        Card <L_CardText c={tried ? amt : MAP_CARD} hit={there} /> <span className="text-muted">· map এ</span> <span className="font-mono font-bold">{tup(pos)}</span>
      </div>
      {!tried ? (
        <div className="mt-2.5 flex justify-center">
          <button type="button" onClick={tryMap} disabled={play.running} className={primaryBtn}>
            মামা, 2 সোজা, 3 বাঁকা
          </button>
        </div>
      ) : (
        <>
          {same(amt as XY, MAP_CARD) && (
            <div className={`${FADE} mt-1 text-center text-sm text-danger`}>মামা থামলেন (5, 3) এ। স্কুল ছাড়িয়ে আরো 3 block east এ।</div>
          )}
          <div className="mt-2">
            <L_Remote amt={amt} onAmt={press} f={M} disabled={done} />
          </div>
        </>
      )}
      <Task done={done}>{tried ? "রাস্তার button চেপে চেপে রিকশাকে স্কুলের গেটে থামান।" : "আগে ফাহিমের কথামতো মামাকে চালাতে দিন।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the card fills slot by
//      slot. Three lane blocks go into slot 2; one block back on the main road
//      goes into slot 1 as −1; the minus is ringed: it only means "back".

const X2F = makeFrame(-1, 4, -1, 4, 20, 10);
const X2_SAY = [
  "মামার card এ দুইটা slot: আগে সোজা, তারপর বাঁকা।",
  "গলিতে 3 block। তাই slot 2 এ 3।",
  "তারপর বড় রাস্তায় 1 block পিছনে। পিছনে যাওয়া লেখা হয় minus দিয়ে: −1।",
  "(−1, 3). Minus টা ভুল না। এর মানে শুধু “উল্টা দিকে”।",
];

export function CardFills() {
  const s = useScene(3, [600, 1800, 2200, 2200]);
  const k = s.k;
  const trip = route(CARD);
  const upto = k >= 2 ? 4 : k >= 1 ? 3 : 0;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X2_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={X2F} grid={0} axes={false} label="the trip to school: 3 blocks up the lane, then 1 block back on the main road" className="my-0! max-w-none">
            <L_Roads f={X2F} />
            <L_Home f={X2F} name={false} />
            <L_Place f={X2F} at={SCHOOL} kind="school" name={false} hit={k >= 2} />
            <L_Trail f={X2F} pts={trip} upto={upto} draw />
            <L_Rickshaw f={X2F} at={trip[upto]} facing={faceOf(trip, upto)} ms={700} />
          </Plane>
        </div>
        <div className="font-mono text-2xl font-bold">
          (<span className="text-cat-blue">
            {k >= 2 ? (
              <span className={`${POP} inline-block rounded-full px-0.5 transition-shadow duration-500 motion-reduce:transition-none ${k >= 3 ? "ring-2 ring-cat-violet" : ""}`}>−1</span>
            ) : (
              "?"
            )}
          </span>
          , <span className="text-cat-coral">{k >= 1 ? <span className={`${POP} inline-block`}>3</span> : "?"}</span>)
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: in the rickshaw. It rolls
//      east, then turns round and rolls back. Fahim asks why; Mama keeps
//      pedalling and points him at the lane. The reason is not given: the
//      widget is where the reader finds it.

export function WhyBack({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="Fahim in the rickshaw: it rolls ahead, then turns round and rolls back; Fahim asks why, and the rickshaw mama tells him to ask the lane">
        <Building x={6} y={150} w={46} h={78} color="#d6d3d1" />
        <Building x={262} y={150} w={52} h={92} color="#e7d7c1" />
        <path d="M0 162H320" stroke="white" strokeWidth={2} strokeDasharray="10 8" opacity={0.7} />
        <L_BigRick x={k === 0 ? 96 : k === 1 ? 214 : 150} y={150} ms={1400} facing={k >= 2 ? -1 : 1} riders={["fahim"]} />
        {k === 2 && <Bubble x={162} y={92} side="right" lines={["মামা, পিছনে", "যাচ্ছেন কেন?"]} />}
        {k >= 3 && <Bubble x={129} y={86} side="left" lines={["গলিরে জিগান,", "আমারে না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · Why back? The reader sends the rickshaw 3 blocks up the lane and
//     watches two bars: north and east, each against what the school needs.
//     North lands exactly; east overshoots by 1. Then the reader drags the
//     rickshaw along the main road until east fits.

const WM_Y = 3;

function L_Bars({ north, east }: { north: number; east: number }) {
  const U = 20;
  const X0 = 40;
  const rows = [
    { name: "north", v: north, need: 3, fill: "fill-cat-coral" },
    { name: "east", v: east, need: 2, fill: "fill-cat-blue" },
  ];
  return (
    <svg viewBox="0 0 196 50" className="mx-auto block h-auto w-full max-w-[13rem]" role="img" aria-label={`north ${north} of 3, east ${east} of 2`}>
      {rows.map((r, i) => {
        const y = 4 + i * 24;
        const ok = r.v === r.need;
        return (
          <g key={r.name}>
            <text x={X0 - 5} y={y + 11} textAnchor="end" fontSize={10} fontWeight={600} className="fill-foreground">
              {r.name}
            </text>
            <rect x={X0} y={y} width={4 * U} height={15} rx={3} className="fill-foreground/5" />
            <rect
              x={X0}
              y={y}
              width={Math.max(0, Math.min(r.v, r.need)) * U}
              height={15}
              rx={3}
              className={`${r.fill} transition-[width] duration-300 motion-reduce:transition-none`}
            />
            <rect
              x={X0 + r.need * U}
              y={y}
              width={Math.max(0, r.v - r.need) * U}
              height={15}
              className="fill-danger transition-[width] duration-300 motion-reduce:transition-none"
            />
            <path d={`M${X0 + r.need * U} ${y - 2}V${y + 17}`} strokeWidth={1.6} strokeDasharray="2 2" className="stroke-foreground/70" />
            <text x={X0 + 4 * U + 6} y={y + 11} fontSize={9.5} className={ok ? "fill-accent-text font-bold" : "fill-muted"}>
              {r.v} · স্কুল {r.need}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function WhyMinus() {
  const pass = useGate();
  const [driven, setDriven] = useSeed("driven", false);
  const [x, setX] = useSeed("x", 3);
  const [fixed, setFixed] = useSeed("fixed", false);
  const play = usePlay(480);
  const lane = driven ? 3 : play.k;
  const pos: XY = driven ? [x, WM_Y] : [lane, lane];
  const trip = route([0, lane]);

  const drive = () => play.play(3, () => setDriven(true));
  const slide = (to: number) => {
    if (!driven || fixed) return;
    const nx = clamp(to, 0, 5);
    setX(nx);
    if (nx === SCHOOL[0]) {
      setFixed(true);
      pass("গলি east এও ঠেলে। −1 সেটা কেটে দেয়।");
    }
  };
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowLeft") slide(x - 1);
    if (e.key === "ArrowRight") slide(x + 1);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[13rem]">
        <Plane
          f={M}
          grid={0}
          axes={false}
          label={`the rickshaw at ${tup(pos)}; drag it along the main road`}
          drag={driven && !fixed ? { down: (p) => slide(Math.round(p[0])), move: (p) => slide(Math.round(p[0])) } : undefined}
          onKey={driven && !fixed ? key : undefined}
          className="my-0! max-w-none"
        >
          <L_Roads f={M} />
          {driven && !fixed && <path d={`M${M.sx(0)} ${M.sy(WM_Y)}H${M.sx(5)}`} strokeWidth={7} strokeLinecap="round" className={`${FADE} pointer-events-none stroke-cat-blue/30`} />}
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" hit={fixed} />
          <L_Trail f={M} pts={trip} />
          {driven && x !== 3 && <Arrow f={M} from={[3, WM_Y]} to={[x, WM_Y]} tone="blue" w={2.4} />}
          <L_Rickshaw f={M} at={pos} facing={driven && x < 3 ? -1 : 1} ms={driven ? 200 : 450} />
        </Plane>
      </div>
      <div className="mt-2">
        <L_Bars north={lane} east={driven ? x : lane} />
      </div>
      {!driven && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={drive} disabled={play.running} className={primaryBtn}>
            গলিতে 3 block
          </button>
        </div>
      )}
      {driven && !fixed && (
        <div className={`${FADE} mt-1.5 text-center text-[0.95rem]`}>
          {x > SCHOOL[0] ? "North মিলে গেছে। East এ এখনো বেশি। রিকশাটা বড় রাস্তা ধরে টানুন।" : "এবার east এ কম পড়ে গেছে। একটু ফেরত আনুন।"}
        </div>
      )}
      {fixed && (
        <div className={`${FADE} mt-1.5 text-center text-[0.95rem]`}>
          Card <L_CardText c={CARD} hit />: north এর জন্য গলি, বাড়তি east কাটতে minus।
        </div>
      )}
      <Task done={fixed}>রিকশাকে গলিতে পাঠান। তারপর বড় রাস্তা ধরে টানুন, যতক্ষণ না east-ও মিলে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the lane count is forced
//      by north. 2 lane blocks stop one short, 4 go one too high, 3 fit, and
//      then −1 on the main road trims the extra east.

const X3F = makeFrame(-1, 5, -1, 5, 17, 8);
const X3_SAY = [
  "শুধু গলিই north এ ওঠে। তাহলে গলিতে কয় block?",
  "2 block: north এ এক কম। বাকি একটা আর কোনো রাস্তা দিয়ে যোগ করা যায় না।",
  "4 block: এক বেশি উঁচুতে।",
  "3 block, একদম ঠিক। তারপর বড় রাস্তায় −1 বাড়তি east টা ফেরত নেয়।",
];

export function LaneForced() {
  const s = useScene(3, [600, 2000, 1800, 2400]);
  const k = s.k;
  const card: XY = k === 1 ? [0, 2] : k === 2 ? [0, 4] : k === 3 ? CARD : [0, 0];
  const trip = route(card);
  const end = trip[trip.length - 1];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3_SAY[k]}</span>}>
      <div className="mx-auto w-[9.5rem]">
        <Plane f={X3F} grid={0} axes={false} label="two, four and three blocks up the lane, against the school's row" className="my-0! max-w-none">
          <L_Roads f={X3F} />
          <path d={`M${X3F.sx(-1)} ${X3F.sy(3)}H${X3F.sx(5)}`} strokeWidth={1.2} strokeDasharray="3 3" className="pointer-events-none stroke-cat-violet" />
          <L_Home f={X3F} name={false} />
          <L_Place f={X3F} at={SCHOOL} kind="school" name={false} hit={k === 3} />
          <g key={k}>
            <L_Trail f={X3F} pts={trip} draw />
          </g>
          {(k === 1 || k === 2) && (
            <path
              d={`M${X3F.sx(end[0]) + 9} ${X3F.sy(end[1])}V${X3F.sy(3)}`}
              strokeWidth={2}
              className={`${FADE} pointer-events-none stroke-danger`}
              strokeDasharray="2 2"
            />
          )}
          <L_Rickshaw f={X3F} at={end} facing={faceOf(trip, trip.length - 1)} ms={600} s={0.85} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · On paper, without driving: two lines to match. The reader turns the two
//     numbers (straight, slanting) and the rickshaw on the small map follows
//     at once; the north line and the east line each show their sum and tick
//     when they match the school. Turning "straight" never moves the north
//     line, so the north line is the one to settle first: slanting = 3; then
//     the east line leaves straight = −1. Then the check.

function PE_Cell({ tone, v }: { tone: "blue" | "coral"; v: number }) {
  return (
    <span
      key={v}
      className={`${POP} inline-grid h-6 min-w-7 place-items-center rounded-md border-2 px-1 font-mono text-sm font-bold ${tone === "blue" ? "border-cat-blue text-cat-blue" : "border-cat-coral text-cat-coral"}`}
    >
      {v < 0 ? `−${-v}` : v}
    </span>
  );
}

export function PeelEquations() {
  const pass = useGate();
  const [amt, setAmt] = useSeed<number[]>("amt", [0, 0]);
  const [done, setDone] = useSeed("done", false);
  const [face, setFace] = useState<1 | -1>(1);
  const [st, sl] = amt;
  const pos = land(amt);
  const northOk = sl === SCHOOL[1];
  const eastOk = st + sl === SCHOOL[0];
  const trip = route(amt);

  const turn = (i: number, n: number) => {
    const next = amt.map((a, j) => (j === i ? n : a));
    const to = land(next);
    if (to[0] !== pos[0]) setFace(to[0] < pos[0] ? -1 : 1);
    setAmt(next);
    if (!done && next[1] === SCHOOL[1] && next[0] + next[1] === SCHOOL[0]) {
      setDone(true);
      pass("আগে north এর line, তারপর east.");
    }
  };
  const sum = (n: number) => <span className="font-mono tabular-nums">{n < 0 ? `−${-n}` : n}</span>;
  const row = (ok: boolean) => `rounded-lg px-1.5 py-0.5 transition-colors duration-300 motion-reduce:transition-none ${ok ? "bg-accent/10" : ""}`;

  return (
    <>
      <div className="mx-auto w-full max-w-[10.5rem]">
        <Plane f={M} grid={0} axes={false} label={`the card ${tup(amt)} drawn on the map, ending at ${tup(pos)}`} className="my-0! max-w-none">
          <L_Roads f={M} />
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" hit={done} />
          {on(M, pos) && <L_Trail f={M} pts={trip} />}
          {on(M, pos) && <L_Rickshaw f={M} at={pos} facing={face} />}
        </Plane>
      </div>
      <div className="mx-auto mt-1.5 grid w-fit grid-cols-[2.6rem_auto_auto] items-center gap-x-1.5 gap-y-1 text-[0.95rem]">
        <span className={`text-xs text-muted ${row(northOk)}`}>north</span>
        <span className={`flex items-center gap-1 ${row(northOk)}`}>
          <span className="font-mono">3 =</span> <span className="font-mono text-xs text-muted">0 ×</span> <PE_Cell tone="blue" v={st} /> + <PE_Cell tone="coral" v={sl} />
        </span>
        <span className="flex w-12 items-center gap-1">
          = {sum(sl)}
          {northOk && (
            <svg viewBox="-6 -6 12 12" className="h-3 w-3" aria-hidden="true">
              <path d="M-4 0l3 3.5l6 -7" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={`${POP} fill-none stroke-[#15803d]`} />
            </svg>
          )}
        </span>
        <span className={`text-xs text-muted ${row(eastOk)}`}>east</span>
        <span className={`flex items-center gap-1 ${row(eastOk)}`}>
          <span className="font-mono">2 =</span> <span className="font-mono text-xs text-muted">1 ×</span> <PE_Cell tone="blue" v={st} /> + <PE_Cell tone="coral" v={sl} />
        </span>
        <span className="flex w-12 items-center gap-1">
          = {sum(st + sl)}
          {eastOk && (
            <svg viewBox="-6 -6 12 12" className="h-3 w-3" aria-hidden="true">
              <path d="M-4 0l3 3.5l6 -7" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={`${POP} fill-none stroke-[#15803d]`} />
            </svg>
          )}
        </span>
      </div>
      {!done ? (
        <div className="mt-2 flex items-center justify-center gap-3 text-sm">
          <span className="flex flex-col items-center gap-0.5">
            <Stepper value={st} onChange={(n) => turn(0, n)} min={-3} max={3} label="সোজা" />
            <b className="text-cat-blue">সোজা</b>
          </span>
          <span className="flex flex-col items-center gap-0.5">
            <Stepper value={sl} onChange={(n) => turn(1, n)} min={-1} max={4} label="বাঁকা" />
            <b className="text-cat-coral">বাঁকা</b>
          </span>
        </div>
      ) : (
        <div className={`${POP} mt-2 text-center font-mono text-sm font-semibold text-accent-text`}>−1 × (1, 0) + 3 × (1, 1) = (2, 3)</div>
      )}
      <Task done={done}>দুইটা সংখ্যা ঘুরিয়ে দুইটা line-ই মিলান। কোন line টা আগে মিলানো সহজ, খেয়াল করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: why the north line
//      first. Both lines start with two unknowns; the main road's part of the
//      north line is struck out (it never goes north); one unknown is left,
//      slanting = 3; carried up, it leaves the east line one unknown too:
//      straight = −1.

const X4_SAY = [
  "দুইটা line, প্রতিটায় দুইটা করে অজানা? আসলে না।",
  "বড় রাস্তা কখনো north এ যায় না। তাই north এর line থেকে সোজা বাদ।",
  "ওখানে অজানা বাকি একটাই: বাঁকা = 3।",
  "3 টা উপরে নিয়ে যান। এবার east এর line এও অজানা একটা: সোজা = −1।",
];

function L_Box({ tone, value }: { tone: "blue" | "coral"; value: string | null }) {
  return (
    <span
      className={`inline-grid h-7 min-w-8 place-items-center rounded-md border-2 px-1 font-mono font-bold ${tone === "blue" ? "border-cat-blue text-cat-blue" : "border-cat-coral text-cat-coral"}`}
    >
      {value === null ? "" : <span className={`${POP} inline-block`}>{value}</span>}
    </span>
  );
}

export function PeelOrder() {
  const s = useScene(3, [600, 2200, 1800, 2400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X4_SAY[k]}</span>}>
      <div className="mx-auto grid w-fit grid-cols-[3.5rem_auto] items-center gap-x-2 gap-y-2 text-[1.05rem]">
        <span className="text-xs text-muted">east</span>
        <span className="flex items-center gap-1.5">
          <span className="font-mono">2 =</span> <L_Box tone="blue" value={k >= 3 ? "−1" : null} /> + <L_Box tone="coral" value={k >= 3 ? "3" : null} />
        </span>
        <span className="text-xs text-muted">north</span>
        <span className="relative flex items-center gap-1.5">
          <span className="font-mono">3 =</span>
          <span className={`flex items-center gap-1.5 transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-30" : ""}`}>
            <span className="font-mono text-sm">0 ×</span>
            <L_Box tone="blue" value={null} /> +
          </span>
          <L_Box tone="coral" value={k >= 2 ? "3" : null} />
          {k >= 1 && (
            <svg viewBox="0 0 60 20" className="pointer-events-none absolute top-1 left-7 h-5 w-[3.8rem]" aria-hidden="true">
              <Draw d="M2 16L58 4" strokeWidth={2.2} className="stroke-danger" />
            </svg>
          )}
        </span>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's side quest, no task: the two lines tied by a
//      brace get their name, system of linear equations; the north line's
//      one unknown is why ours opened easily; then a bigger system, all
//      boxes empty, left for Article 10.

const X4S_SAY = [
  "দুইটা অজানা, সোজা আর বাঁকা। দুইটা equation দিয়ে বাঁধা।",
  "একসাথে বাঁধা এমন equation গুলাকে বলে system of linear equations.",
  "আমাদেরটা সহজে খুলে গেছে। North এর line এ অজানা ছিল একটাই।",
  "যেকোনো size এর system কীভাবে solve করতে হয়, সেটা Article 10 এ।",
];

function X4S_Box({ tone, dim = false, small = false }: { tone: "blue" | "coral" | "violet"; dim?: boolean; small?: boolean }) {
  const ink = { blue: "border-cat-blue", coral: "border-cat-coral", violet: "border-cat-violet" }[tone];
  return (
    <span
      className={`inline-block rounded-md border-2 ${ink} ${small ? "h-5 w-6" : "h-7 w-8"} transition-opacity duration-500 motion-reduce:transition-none ${dim ? "opacity-30" : ""}`}
    />
  );
}

export function SystemBrace() {
  const s = useScene(3, [600, 2200, 2400, 2400]);
  const k = s.k;
  const big = k >= 3;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X4S_SAY[k]}</span>}>
      <div className="mx-auto flex w-fit items-stretch gap-1.5">
        <svg viewBox="0 0 12 100" preserveAspectRatio="none" className={`w-3 shrink-0 transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-0"}`} aria-hidden="true">
          <path d="M11 2Q5 2 5 10V42Q5 50 1 50Q5 50 5 58V90Q5 98 11 98" fill="none" strokeWidth={1.6} className="stroke-cat-violet" />
        </svg>
        <div key={big ? "big" : "two"} className={`grid content-center gap-1.5 text-[1.05rem] ${big ? FADE : ""}`}>
          {big ? (
            [0, 1, 2].map((r) => (
              <span key={r} className="flex items-center gap-1 font-mono text-sm">
                <X4S_Box tone="blue" small /> + <X4S_Box tone="coral" small /> + <X4S_Box tone="violet" small />
              </span>
            ))
          ) : (
            <>
              <span className="flex items-center gap-1.5 rounded-lg px-1">
                <span className="font-mono">2 =</span> <X4S_Box tone="blue" /> + <X4S_Box tone="coral" />
              </span>
              <span className={`flex items-center gap-1.5 rounded-lg px-1 transition-colors duration-500 motion-reduce:transition-none ${k >= 2 ? "bg-accent/10" : ""}`}>
                <span className="font-mono">3 =</span> <span className={`font-mono text-sm transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "opacity-30" : ""}`}>0 ×</span>
                <X4S_Box tone="blue" dim={k >= 2} /> + <X4S_Box tone="coral" />
              </span>
            </>
          )}
        </div>
      </div>
      <div className="mt-1.5 h-5 text-center text-sm font-bold text-cat-violet">{k >= 1 && <span className={`${POP} inline-block`}>system of linear equations</span>}</div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: back at the gate this
//      morning. Ammu holds up her afternoon list, the bazaar (4, 1) and the
//      mosque (0, 2), and the rickshaw mama wants a card for each.

export function AmmuErrands({}: Story) {
  const s = useScene(3, [600, 2400, 2400, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="Ammu at the gate with her afternoon list: the bazaar at (4, 1) and the mosque at (0, 2), and the rickshaw mama asking for a card for each">
        <Building x={4} y={150} w={56} h={112} color="#e7d7c1" />
        <Person who="ammu" x={84} y={150} arm={k >= 1 ? "hold" : "down"} mood="plain" />
        {k === 1 && <Bubble x={84} y={84} side="right" lines={["বিকালে আমি", "বাজারে যাবো।"]} />}
        {k === 2 && <Bubble x={84} y={84} side="right" lines={["আসরের সময় তোর", "আব্বু মসজিদে।"]} />}
        {k >= 1 && <L_NamedCard x={166} y={48} name="বাজার" text="(4, 1)" tone="amber" />}
        {k >= 2 && <L_NamedCard x={166} y={84} name="মসজিদ" text="(0, 2)" tone="teal" />}
        <Person who="fahim" x={128} y={150} mood={k >= 3 ? "puzzled" : "plain"} />
        <L_BigRick x={250} y={150} />
        {k >= 3 && <Bubble x={270} y={86} side="left" lines={["দুইটারই কার্ড", "দেওন লাগবো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · Your turn. Ammu's two errands, both counted from home: the bazaar at
//     (4, 1) and the mosque at (0, 2). The reader dials a road card by hand,
//     then Mama drives it block by block. A wrong card drives to the wrong
//     corner and the Nope says which slot is off; wrong tries bounce.

const ERRANDS: { at: XY; kind: "bazaar" | "mosque"; name: string }[] = [
  { at: [4, 1], kind: "bazaar", name: "বাজার" },
  { at: [0, 2], kind: "mosque", name: "মসজিদ" },
];
const EF = makeFrame(-3, 6, -1, 4, 22, 10);

function clipTrip(pts: XY[]): { pts: XY[]; off: boolean } {
  const i = pts.findIndex((p) => !on(EF, p));
  return i < 0 ? { pts, off: false } : { pts: pts.slice(0, i), off: true };
}

export function YourErrand() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [card, setCard] = useSeed<number[]>("card", [0, 0]);
  const [driven, setDriven] = useSeed<number[] | null>("driven", null);
  const [solved, setSolved] = useSeed<boolean[]>("solved", [false, false]);
  const [miss, setMiss] = useState(0);
  const play = usePlay(320);
  const goal = ERRANDS[at];
  const trip = driven ? clipTrip(route(driven)) : null;
  const k = trip ? (play.running ? play.k : trip.pts.length - 1) : 0;
  const pos = trip ? trip.pts[k] : O;
  const end = trip && !play.running ? trip.pts[trip.pts.length - 1] : null;
  const right = !!trip && !!end && !trip.off && same(end, goal.at);

  const dial = (i: number, n: number) => {
    setCard(card.map((c, j) => (j === i ? n : c)));
    setDriven(null);
  };
  const drive = () => {
    const c = [...card];
    const t = clipTrip(route(c));
    const ok = !t.off && same(t.pts[t.pts.length - 1], goal.at);
    setDriven(c);
    const finish = () => {
      if (!ok) {
        setMiss((m) => m + 1);
        return;
      }
      const s = solved.map((v, j) => v || j === at);
      setSolved(s);
      if (s.every(Boolean)) pass("বাজার (3, 1), মসজিদ (−2, 2)।");
    };
    if (t.pts.length > 1) play.play(t.pts.length - 1, finish);
    else finish();
  };
  const nextErrand = () => {
    setAt(1);
    setCard([0, 0]);
    setDriven(null);
  };

  const nope = () => {
    if (!trip || !end) return "";
    if (trip.off) return "এই card এ মামা map থেকেই বের হয়ে যান। ছোট সংখ্যা দিয়ে try করুন।";
    const where = `মামা থামলেন ${tup(end)} এ। ${goal.name} ${tup(goal.at)} এ।`;
    return end[1] !== goal.at[1] ? `${where} North মিলে নাই, তাই আগে বাঁকা slot টা ঠিক করুন।` : `${where} North ঠিক আছে। এবার সোজা slot টা ঠিক করুন।`;
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[13.5rem]">
        <Plane f={EF} grid={0} axes={false} label={`the rickshaw at ${tup(pos)}; the ${goal.kind} is at ${tup(goal.at)} on the map`} className="my-0! max-w-none">
          <L_Roads f={EF} />
          <L_Home f={EF} />
          {ERRANDS.map((e, i) => (
            <g key={e.kind} opacity={i === at || solved[i] ? 1 : 0.35}>
              <L_Place f={EF} at={e.at} kind={e.kind} hit={solved[i] && (i === at ? !play.running : true)} />
            </g>
          ))}
          {trip && <L_Trail f={EF} pts={trip.pts} upto={k} />}
          <L_Rickshaw f={EF} at={pos} facing={trip ? faceOf(trip.pts, k) : 1} />
        </Plane>
      </div>
      <div className="mt-1 text-center text-sm">
        Map এ {goal.name}: <b className="font-mono">{tup(goal.at)}</b>
      </div>
      {!solved[at] ? (
        <>
          <div className="mt-1.5 flex items-center justify-center gap-1 font-mono text-lg">
            (<Stepper value={card[0]} onChange={(n) => dial(0, n)} min={-3} max={3} disabled={play.running} label="সোজা" />,
            <Stepper value={card[1]} onChange={(n) => dial(1, n)} min={-1} max={3} disabled={play.running} label="বাঁকা" />)
          </div>
          <div className="mt-0.5 text-center text-xs">
            <span className="text-cat-blue">সোজা</span>, <span className="text-cat-coral">বাঁকা</span>
          </div>
          <div className="mt-2 flex justify-center">
            <button type="button" onClick={drive} disabled={play.running} className={primaryBtn}>
              মামা, চালান
            </button>
          </div>
        </>
      ) : (
        <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>
          <L_CardText c={goal.at[1] === 1 ? [3, 1] : [-2, 2]} hit /> দিয়ে মামা পৌঁছে গেলেন {goal.name} এ।
          {at === 0 && (
            <div className="mt-2 flex justify-center">
              <button type="button" onClick={nextErrand} className={primaryBtn}>
                এবার মসজিদ
              </button>
            </div>
          )}
        </div>
      )}
      {end && !right && !play.running && <Nope key={miss}>{nope()}</Nope>}
      <Ticks
        items={[
          ["বাজার", solved[0]],
          ["মসজিদ", solved[1]],
        ]}
      />
      <Task done={solved.every(Boolean)}>প্রতিটা card এক slot এক slot করে বের করুন, বসান, তারপর মামাকে চালাতে দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the mosque is straight
//      north of home, 2 blocks. Up the lane 2 blocks lands 2 too far east;
//      back 2 on the main road: card (−2, 2).

const X6F = makeFrame(-1, 3, -1, 3, 22, 10);
const X6_SAY = [
  "মসজিদ বাসার ঠিক north এ, 2 block। কিন্তু north এ রাস্তা নাই।",
  "গলিতে 2 block। North ঠিক, কিন্তু east এ 2 block বেশি।",
  "বড় রাস্তায় 2 block ফেরত। Card (−2, 2).",
];

export function MosqueMinus() {
  const s = useScene(2, [600, 2000, 2000]);
  const k = s.k;
  const trip = route([-2, 2]);
  const upto = k >= 2 ? 4 : k >= 1 ? 2 : 0;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={X6F} grid={0} axes={false} label="the mosque at (0, 2): two blocks up the lane, then two back" className="my-0! max-w-none">
            <L_Roads f={X6F} />
            <path d={`M${X6F.sx(0)} ${X6F.sy(0.3)}V${X6F.sy(1.7)}`} strokeWidth={1.6} strokeDasharray="3 3" className="pointer-events-none stroke-[#94a3b8]" />
            <L_Home f={X6F} name={false} />
            <L_Place f={X6F} at={[0, 2]} kind="mosque" name={false} hit={k >= 2} />
            <L_Trail f={X6F} pts={trip} upto={upto} draw />
            <L_Rickshaw f={X6F} at={trip[upto]} facing={faceOf(trip, upto)} ms={900} s={0.9} />
          </Plane>
        </div>
        <div className="font-mono text-2xl font-bold">
          (<span className="text-cat-blue">{k >= 2 ? <span className={`${POP} inline-block`}>−2</span> : "?"}</span>,{" "}
          <span className="text-cat-coral">{k >= 1 ? <span className={`${POP} inline-block`}>2</span> : "?"}</span>)
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for the exercise's setup, no task: still in the
//      rickshaw. Nasib, who has joined the same school, holds up the card he
//      made for the fuchka stall, (3, 2). Mama glances at it over his
//      shoulder. Which line is wrong is left to the reader.

export function NasibCard({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="Fahim and Nasib in the rickshaw; Nasib holds up the card he made for the fuchka stall, (3, 2), and the rickshaw mama looks back at it">
        <Building x={250} y={150} w={64} h={84} color="#fef3c7" label="ফুচকা" />
        <path d="M0 162H320" stroke="white" strokeWidth={2} strokeDasharray="10 8" opacity={0.7} />
        <L_BigRick x={k >= 1 ? 150 : 60} y={150} ms={1400} riders={["fahim", "nasib"]} />
        {k >= 2 && <L_NamedCard x={66} y={66} name="নাসিবের card" text="(3, 2)" tone="coral" />}
        {k === 2 && <Bubble x={140} y={96} side="right" lines={["ছুটির পরে ফুচকা।", "Card বানিয়ে ফেলছি।"]} />}
        {k >= 3 && <Bubble x={171} y={92} side="right" lines={["এইডা দিয়া গেলে", "ফুচকা পাইবা না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · Try it: spot the slip. Nasib's working for the fuchka stall at (1, 2)
//     on the map, four lines, card (3, 2). First the reader lets Mama drive
//     Nasib's card: it ends at (5, 2), past the stall. Then the reader taps
//     the wrong line. Right lines bounce with a word on why they are right;
//     the wrong one (straight = 1 + 2 = 3) turns into 1 − 2 = −1, and Mama
//     drives (−1, 2) to the stall.

const FUCHKA: XY = [1, 2];
const NASIB: XY = [3, 2];
const FIX: XY = [-1, 2];
const SL_LINES = ["north:  2 = বাঁকা", "east:  1 = সোজা + 2", "সোজা = 1 + 2 = 3", "card:  (3, 2)"];
const SL_FIXED = ["north:  2 = বাঁকা", "east:  1 = সোজা + 2", "সোজা = 1 − 2 = −1", "card:  (−1, 2)"];
const SL_WRONG = 2;
const SL_WHY = [
  "এই line টা ঠিক। North এ শুধু গলিই ওঠে, তাই বাঁকা = 2।",
  "এটাও ঠিক। গলির 2 block east এও 2 ঠেলে, বাকিটা সোজা।",
  "",
  "Card টা আগের line থেকেই এসেছে। ভুলটা তার আগে কোথাও।",
];

export function SpotTheSlip() {
  const pass = useGate();
  const [driven, setDriven] = useSeed("driven", false);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [fixed, setFixed] = useSeed("fixed", false);
  const [miss, setMiss] = useState(0);
  const play = usePlay(300);
  const card = fixed ? FIX : NASIB;
  const trip = route(card);
  const k = play.running ? play.k : driven ? trip.length - 1 : 0;
  const pos = trip[k];
  const settled = !play.running;

  const drive = () => play.play(route(NASIB).length - 1, () => setDriven(true));
  const tap = (i: number) => {
    if (!driven || fixed || play.running) return;
    setPick(i);
    if (i !== SL_WRONG) {
      setMiss((m) => m + 1);
      return;
    }
    setFixed(true);
    play.play(route(FIX).length - 1, () => pass("1 থেকে 2 বাদ: সোজা = −1।"));
  };
  const look = (i: number): Look => (pick !== i ? "idle" : i === SL_WRONG ? "right" : "wrong");

  return (
    <>
      <div className="mx-auto w-full max-w-[11rem]">
        <Plane f={M} grid={0} axes={false} label={`the fuchka stall at (1, 2); the rickshaw at ${tup(pos)}`} className="my-0! max-w-none">
          <L_Roads f={M} />
          <L_Home f={M} />
          <L_Place f={M} at={FUCHKA} kind="fuchka" hit={fixed && settled} />
          {fixed && (
            <g opacity={0.3}>
              <L_Trail f={M} pts={route(NASIB)} w={1.6} />
            </g>
          )}
          {(driven || play.running) && <L_Trail f={M} pts={trip} upto={k} />}
          <L_Rickshaw f={M} at={pos} facing={faceOf(trip, k)} />
        </Plane>
      </div>
      {!driven ? (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={drive} disabled={play.running} className={primaryBtn}>
            নাসিবের card চালান
          </button>
        </div>
      ) : (
        !fixed && <div className={`${FADE} mt-1 text-center text-sm text-danger`}>মামা থামলেন (5, 2) এ। ফুচকা (1, 2) এ।</div>
      )}
      <div className="mx-auto mt-1.5 max-w-xs rounded-xl border border-border bg-surface p-1.5">
        <div className="px-1 pb-1 text-xs text-muted">নাসিবের খাতা</div>
        <div className="grid gap-1">
          {(fixed ? SL_FIXED : SL_LINES).map((l, i) => (
            <button
              key={i}
              type="button"
              disabled={!driven || fixed}
              onClick={() => tap(i)}
              className={`w-full cursor-pointer rounded-lg border-2 px-2.5 py-1 text-left text-[0.95rem] transition-[color,background-color,border-color] duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look(i)]}`}
            >
              <span key={l} className={fixed && i >= 2 ? `${POP} inline-block font-semibold` : ""}>
                {l}
              </span>
            </button>
          ))}
        </div>
      </div>
      {pick !== null && pick !== SL_WRONG && !fixed && <Nope key={miss}>{SL_WHY[pick]}</Nope>}
      <Task done={fixed && settled}>{driven ? "নাসিবের খাতায় যে line এ ভুল, সেটায় tap করুন।" : "আগে নাসিবের card টা মামাকে দিয়ে চালান।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for the exercise's explanation, no task: the right card
//      checked block by block. Up the lane 2 to (2, 2), back 1 to (1, 2), the
//      stall; Nasib's (3, 2) shown faint, stopping 4 blocks east of it.

const X7F = makeFrame(-1, 5, -0.5, 3, 20, 10);
const X7_SAY = [
  "ঠিক card (−1, 2)। মিলিয়ে দেখি।",
  "গলিতে 2 block: (2, 2)।",
  "বড় রাস্তায় 1 block পিছনে: (1, 2)। ফুচকার দোকান।",
  "নাসিবের (3, 2) গেলে থামতো (5, 2) এ, দোকান থেকে 4 block দূরে।",
];

export function StallCheck() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  const trip = route(FIX);
  const upto = k >= 2 ? 3 : k >= 1 ? 2 : 0;
  const X = X7F;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X7_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-3">
        <div className="w-[9.5rem] shrink-0">
          <Plane f={X} grid={0} axes={false} label="the fuchka stall's card (−1, 2): two blocks up the lane, one back; Nasib's (3, 2) stops at (5, 2)" className="my-0! max-w-none">
            <L_Roads f={X} />
            <L_Home f={X} name={false} />
            <L_Place f={X} at={FUCHKA} kind="fuchka" name={false} hit={k >= 2} />
            {k >= 3 && (
              <g opacity={0.35} className={FADE}>
                <L_Trail f={X} pts={route(NASIB)} w={1.6} />
              </g>
            )}
            <L_Trail f={X} pts={trip} upto={upto} draw />
            <L_Rickshaw f={X} at={trip[upto]} facing={faceOf(trip, upto)} ms={800} s={0.9} />
          </Plane>
        </div>
        <div className="font-mono text-xl font-bold">
          (<span className="text-cat-blue">{k >= 2 ? <span className={`${POP} inline-block`}>−1</span> : "?"}</span>,{" "}
          <span className="text-cat-coral">{k >= 1 ? <span className={`${POP} inline-block`}>2</span> : "?"}</span>)
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for the finale's setup, no task: the rickshaw pulls up
//      at the school gate at 7:58, Fahim jumps down and runs in, and at 8:00
//      the bell rings.

export function BellRings({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="the rickshaw pulls up at the school gate, Fahim runs in, and at eight the school bell rings">
        <Building x={150} y={150} w={166} h={100} color="#fecaca" />
        <Gate x={206} y={150} text="স্কুল" />
        <L_Clock x={186} y={40} h={k >= 3 ? 8 : 7} m={k >= 3 ? 0 : 58} r={11} />
        <L_Bell x={160} y={44} ringing={k >= 3} />
        <L_BigRick x={k >= 1 ? 96 : -70} y={150} />
        {k >= 1 && <Person who="fahim" x={k >= 2 ? 244 : 130} y={150} walking={k === 2} ms={1300} mood={k >= 3 ? "happy" : "plain"} />}
        {k >= 3 && <Bubble x={250} y={84} side="right" lines={["বাঁচলাম।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · The finale. The four sealed cards, and Mama drives each one on the
//     road grid: (2, 3) ends at (5, 3), (2, 1) at (3, 1), (−1, 3) at the
//     school, and "can't get there" is answered by this morning's ride.

const BO_CARDS: XY[] = [
  [2, 3],
  [2, 1],
  [-1, 3],
  [-1, 3],
];
const BO_SAY = [
  "(2, 3) হলো map এর সংখ্যা, রাস্তায় পড়া। মামা থামেন (5, 3) এ, স্কুল ছাড়িয়ে 3 block।",
  "(2, 1) থামে (3, 1) এ। পুরা অন্য রাস্তা।",
  "(−1, 3) থামে ঠিক স্কুলের গেটে।",
  "“যাওয়াই যাবে না”? মামা তো আজ সকালেই গেলেন, (−1, 3) দিয়ে।",
];

export function BetOpened() {
  const pass = useGate();
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const play = usePlay(300);
  const trip = pick === null ? [O] : route(BO_CARDS[pick]);
  const k = play.running ? play.k : trip.length - 1;
  const end = trip[k];

  const drive = (i: number) => {
    if (play.running) return;
    setPick(i);
    const next = tried.includes(i) ? tried : [...tried, i];
    play.play(route(BO_CARDS[i]).length - 1, () => {
      setTried(next);
      if (next.length === 4 && tried.length < 4) pass("বাজি: (−1, 3) জিতেছে।");
    });
  };
  const look = (i: number): Look => (!tried.includes(i) ? (pick === i ? "picked" : "idle") : i === 2 ? "right" : "wrong");

  return (
    <>
      <div className="mx-auto w-full max-w-[12.5rem]">
        <Plane f={M} grid={0} axes={false} label={pick === null ? "the road map, the rickshaw at home" : `card ${BET[pick]}: the rickshaw at ${tup(end)}`} className="my-0! max-w-none">
          <L_Roads f={M} />
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" hit={!play.running && pick !== null && same(end, SCHOOL)} />
          <L_Trail f={M} pts={trip} upto={k} />
          <L_Rickshaw f={M} at={end} facing={faceOf(trip, k)} />
        </Plane>
      </div>
      <div className="mt-1 min-h-10 text-center text-[0.95rem]">
        {pick !== null && !play.running && tried.includes(pick) ? (
          <span key={pick} className={FADE}>
            {BO_SAY[pick]}
          </span>
        ) : (
          <span className="text-muted">একটা card এ tap করুন, মামা ওটা রাস্তায় চালাবেন।</span>
        )}
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {BET.map((b, i) => (
          <Choice key={b} n={i} look={look(i)} disabled={play.running} onClick={() => drive(i)}>
            <span className={i < 3 ? "font-mono" : "text-sm"}>{b}</span>
          </Choice>
        ))}
      </div>
      <Task done={tried.length === 4}>বাজি খুলুন: চারটা card-ই মামাকে দিয়ে চালিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7¼ · A figure for the finale's explanation, no task: the trap and the rule.
//      No road north, crossed out, and "can't get there?"; north has one road
//      only, the lane, so its slot fills first (3); then the rest opens by
//      itself, the main road taking back the extra east (−1).

const X7T = makeFrame(-1, 4, -1, 4, 20, 10);
const X7T_SAY = [
  "North এ রাস্তা নাই। তার মানে কি north এ যাওয়াই যাবে না?",
  "North এ যায় একটাই রাস্তা, গলি। তাই আগে বাঁকা slot টা: 3।",
  "বাকিটা নিজেই খুলে যায়। বাড়তি east টা বড় রাস্তা ফেরত নেয়: −1।",
];

export function NoWayTrap() {
  const s = useScene(2, [600, 2200, 2400]);
  const k = s.k;
  const trip = route(CARD);
  const upto = k >= 2 ? 4 : k >= 1 ? 3 : 0;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X7T_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={X7T} grid={0} axes={false} label="no road north, yet the rickshaw reaches the school: three blocks up the lane, then one back" className="my-0! max-w-none">
            <L_Roads f={X7T} />
            <g style={{ opacity: k === 0 ? 1 : 0.35 }} className="transition-opacity duration-500 motion-reduce:transition-none">
              <path d={`M${X7T.sx(0)} ${X7T.sy(0.3)}V${X7T.sy(1.7)}`} strokeWidth={1.8} strokeDasharray="3 3" className="pointer-events-none stroke-[#94a3b8]" />
              <path d={`M${X7T.sx(0) - 5} ${X7T.sy(1) - 5}l10 10m0 -10l-10 10`} strokeWidth={2} className="pointer-events-none stroke-danger" />
            </g>
            <L_Home f={X7T} name={false} />
            <L_Place f={X7T} at={SCHOOL} kind="school" name={false} hit={k >= 2} />
            <L_Trail f={X7T} pts={trip} upto={upto} draw />
            <L_Rickshaw f={X7T} at={trip[upto]} facing={faceOf(trip, upto)} ms={900} s={0.9} />
          </Plane>
        </div>
        <div className="font-mono text-2xl font-bold">
          (<span className="text-cat-blue">{k >= 2 ? <span className={`${POP} inline-block`}>−1</span> : "?"}</span>,{" "}
          <span className="text-cat-coral">
            {k >= 1 ? <span className={`${POP} inline-block rounded-full px-0.5 ${k === 1 ? "ring-2 ring-cat-coral" : ""}`}>3</span> : "?"}
          </span>
          )
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for the finale's explanation, no task: the bridge to 5.5b.
//      Tiffin. Fahim writes the school's two cards in his khata, the map's
//      (2, 3) and the road's (−1, 3); Karim, his new bench-mate, looks over
//      and frowns at one school with two cards.

export function TwoCardsTease() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="tiffin at the new school: Fahim writes the school's two cards, (2, 3) and (−1, 3), and Karim looks over, puzzled that one school has two cards">
        <rect x={60} y={118} width={200} height={8} rx={2} fill="#92400e" />
        <path d="M72 126V150M248 126V150" stroke="#78350f" strokeWidth={4} />
        <Person who="fahim" x={110} y={150} arm={k >= 1 ? "hold" : "down"} mood="plain" />
        {k >= 1 && <L_NamedCard x={58} y={46} name="map" text="(2, 3)" tone="teal" />}
        {k >= 2 && <L_NamedCard x={58} y={84} name="রাস্তা" text="(−1, 3)" tone="coral" />}
        <Person who="karim" x={k >= 2 ? 214 : 340} y={150} facing={-1} walking={k === 2} ms={1400} mood={k >= 3 ? "puzzled" : "plain"} />
        {k >= 3 && <Bubble x={214} y={82} side="right" lines={["একটা স্কুলের", "দুইটা card?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names).

export const fixtures: Fixtures = {
  LastNight: { start: { k: 0 }, sheet: { k: 1 }, end: {} },
  FahimReads: { start: { k: 0 }, seat: { k: 1 }, says: { k: 2 }, end: {} },
  SystemBrace: { start: { k: 0 }, name: { k: 1 }, one: { k: 2 }, end: {} },
  NoWayTrap: { start: { k: 0 }, lane: { k: 1 }, end: {} },
  FirstDay: { start: { k: 0 }, ammu: { k: 1 }, card: { k: 2 }, mama: { k: 3 }, end: {} },
  SchoolBet: { start: {}, picked: { bet: 2 }, sealed: { bet: 3, sealed: true } },
  TwoGrids: { start: { k: 0 }, main: { k: 1 }, lanes: { k: 2 }, end: {} },
  NoNorthRoad: { start: {}, tried: { tried: true }, back: { tried: true, amt: [0, 3] }, done: { tried: true, amt: [-1, 3], done: true } },
  CardFills: { start: { k: 0 }, lane: { k: 1 }, back: { k: 2 }, end: {} },
  WhyBack: { start: { k: 0 }, ahead: { k: 1 }, ask: { k: 2 }, end: {} },
  WhyMinus: { start: {}, driven: { driven: true }, under: { driven: true, x: 1 }, fixed: { driven: true, x: 2, fixed: true } },
  LaneForced: { start: { k: 0 }, two: { k: 1 }, four: { k: 2 }, end: {} },
  PeelEquations: { start: {}, north: { amt: [0, 3] }, off: { amt: [2, 1] }, done: { amt: [-1, 3], done: true } },
  PeelOrder: { start: { k: 0 }, strike: { k: 1 }, three: { k: 2 }, end: {} },
  AmmuErrands: { start: { k: 0 }, bazaar: { k: 1 }, mosque: { k: 2 }, end: {} },
  YourErrand: {
    start: {},
    wrong: { card: [4, 1], driven: [4, 1] },
    bazaar: { card: [3, 1], driven: [3, 1], solved: [true, false] },
    mosqueWrong: { at: 1, card: [0, 2], driven: [0, 2], solved: [true, false] },
    done: { at: 1, card: [-2, 2], driven: [-2, 2], solved: [true, true] },
  },
  MosqueMinus: { start: { k: 0 }, lane: { k: 1 }, end: {} },
  NasibCard: { start: { k: 0 }, ride: { k: 1 }, card: { k: 2 }, end: {} },
  SpotTheSlip: { start: {}, driven: { driven: true }, wrong: { driven: true, pick: 1 }, fixed: { driven: true, pick: 2, fixed: true } },
  StallCheck: { start: { k: 0 }, lane: { k: 1 }, back: { k: 2 }, end: {} },
  BellRings: { start: { k: 0 }, arrive: { k: 1 }, run: { k: 2 }, end: {} },
  BetOpened: { start: {}, first: { pick: 0, tried: [0] }, right: { pick: 2, tried: [0, 2] }, done: { pick: 3, tried: [0, 1, 2, 3] } },
  TwoCardsTease: { start: { k: 0 }, map: { k: 1 }, karim: { k: 2 }, end: {} },
};
