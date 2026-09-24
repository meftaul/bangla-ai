"use client";

import { useState } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, LOOK, Nope, POP, Scene, pill, predictLook, primaryBtn, usePlay, useScene, useSeed, type Fixtures, type Look } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Label, Plane, clamp, dist, makeFrame, same, tup, type XY } from "@/components/journey/plane";
import {
  CARD,
  L_CardText,
  L_Home,
  L_Place,
  L_Rickshaw,
  L_Roads,
  L_Squares,
  L_Tape,
  L_TapeCase,
  L_Tick,
  L_Trail,
  O,
  SCHOOL,
  faceOf,
  route,
  type RoadKind,
  type Story,
} from "./lanes-kit";
import { Chacha, GROUND as R_GROUND, NameTag, RoofSet } from "./rooftop-parts";

// Screens for "Math for AI 5.5b — Same arrow, new numbers", told as a Journey
// in the author's Bangla-English, 7 steps (the pathshala-journey skill).
//
// The same day as 5.5 (lanes-journey.tsx), at tiffin. Fahim has two cards for
// the school: (2, 3) on the map and (−1, 3) on the roads. His new bench-mate
// Karim runs Pythagoras on both and gets two distances, 3.61 and 3.16. The
// reader seals a bet on how far the school really is (DistanceBet), flips the
// grid under an arrow that never moves (SameSchool), measures one block of
// each road with the tape (LaneBlock), runs 4.2's box on each grid's corner
// (RoadCorner), works out the bazaar's distance unaided (YourDistance), picks
// the road maps that reach everywhere (TryWhichGrid), and opens the bet by
// laying the tape from home to school (TapeReveal).
//
// Story scenes: TiffinSums, TapeOut, KarimObjects, TapeOnMap. Every <Then>
// figure is watch-only: both cards arriving, the pair of directions named
// basis, the assembly lines, a lane block as a
// square's diagonal, the two tapes, the shadows on square roads, the bazaar's
// tape, the three maps' reach, and the card named with its grid. The map
// pieces are shared with 5.5 (lanes-kit.tsx). Ink on the maps is fixed.

/** The neighbourhood map: home at (0, 0), one block per unit. */
const M = makeFrame(-2, 5, -1, 4, 26, 12);

/** A bench in the classroom, for the tiffin scenes. */
function T_Bench({ x0 = 60, x1 = 260 }: { x0?: number; x1?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x0} y={118} width={x1 - x0} height={8} rx={2} fill="#92400e" />
      <path d={`M${x0 + 12} 126V150M${x1 - 12} 126V150`} stroke="#78350f" strokeWidth={4} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: tiffin. Fahim's khata
//      holds the school's two cards; Karim works Pythagoras on each, gets 3.61
//      and 3.16, and says one card must be wrong. Which distance is true is
//      the bet.

export function TiffinSums({}: Story) {
  const s = useScene(4, [600, 2000, 2000, 2200, 2400]);
  const k = s.k;
  const row = (y: number, name: string, card: string, sum: string, on: boolean) => (
    <g>
      <text x={24} y={y} fontSize={8.5} fontWeight={700} fill="#0f1b2d">
        {name}
      </text>
      <text x={60} y={y} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#0f1b2d">
        {card}
      </text>
      {on && (
        <text x={104} y={y} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#be123c" className={FADE}>
          {sum}
        </text>
      )}
    </g>
  );

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="tiffin at the new school: Fahim's khata with the school's two cards; Karim works Pythagoras on each and gets 3.61 and 3.16">
        <rect x={14} y={8} width={170} height={44} rx={3} fill="white" stroke="#94a3b8" />
        {row(24, "map", "(2, 3)", "→ 3.61", k >= 1)}
        {row(42, "রাস্তা", "(−1, 3)", "→ 3.16", k >= 2)}
        <T_Bench />
        <Person who="fahim" x={104} y={150} mood="plain" />
        <Person who="karim" x={208} y={150} facing={-1} arm={k === 1 || k === 2 ? "point" : "down"} mood={k >= 3 ? "puzzled" : "plain"} />
        {k === 3 && <Bubble x={208} y={82} side="right" lines={["একটা স্কুল,", "দুইটা দূরত্ব?"]} />}
        {k >= 4 && <Bubble x={208} y={82} side="right" lines={["একটা card", "নিশ্চয়ই ভুল."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: how far is the school, really? The arrow from home to
//     the school, and Karim's two sums under it. Three answers: 3.61 · 3.16 ·
//     "both, the distance changes with the grid". Sealed unmarked:
//     TapeReveal, six screens later, is what settles it.

const DB_BET = ["3.61 block", "3.16 block", "দুইটাই ঠিক: grid বদলালে দূরত্বও বদলায়"];
/** what each bet writes on the arrow, in place of its "?" */
const DB_ON_ARROW = [["3.61"], ["3.16"], ["3.61", "3.16"]];
/** the sealed tag round the bet on the arrow: `rows` lines of text, right edge at the label's anchor */
const DB_TAG = (rows: number) => {
  const x1 = M.sx(0.55) - 1;
  const x0 = x1 - 31;
  const cy = M.sy(1.9) - 3.5;
  const h = rows * 12 + 3;
  return `M${x0} ${cy - h / 2}H${x1}V${cy + h / 2}H${x0}Z`;
};

export function DistanceBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);

  const seal = () => {
    setSealed(true);
    pass("বাজি ধরা হলো. শেষে ফিতা দিয়ে মাপবো.");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[11rem]">
        <Plane f={M} grid={0} axes={false} label="the map: the arrow from home to the school, its length unknown" className="my-0! max-w-none">
          <L_Squares f={M} />
          <Arrow f={M} from={O} to={SCHOOL} tone="violet" w={3} />
          {/* the reader's bet is written on the arrow as they pick; sealing draws a tag round it */}
          <g key={bet ?? "none"} className={bet === null ? undefined : POP}>
            {(bet === null ? ["?"] : DB_ON_ARROW[bet]).map((t, j, all) => (
              <Label key={t} f={M} at={[0.55, 1.9]} dx={-4} dy={(j - (all.length - 1) / 2) * 12} anchor="end" size={10} weight={bet === null ? 600 : 800} className="fill-cat-violet font-mono">
                {t}
              </Label>
            ))}
          </g>
          {sealed && bet !== null && (
            <Draw
              d={DB_TAG(bet === 2 ? 2 : 1)}
              strokeWidth={1.6}
              ms={700}
              className="stroke-[#7c3aed]"
            />
          )}
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" />
        </Plane>
      </div>
      <div className="mx-auto mt-1 grid max-w-xs grid-cols-2 gap-1.5 text-center text-xs">
        <div className="rounded-lg border border-border px-1 py-1">
          <div className="text-muted">map card</div>
          <div className="font-mono">√(2² + 3²) = 3.61</div>
        </div>
        <div className="rounded-lg border border-border px-1 py-1">
          <div className="text-muted">রাস্তার card</div>
          <div className="font-mono">√((−1)² + 3²) = 3.16</div>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium text-muted">স্কুল আসলে কত দূরে, সোজা line এ?</div>
      <div className="mt-1.5 grid gap-1.5">
        {DB_BET.map((b, i) => (
          <Choice key={b} n={i} look={bet === i ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className={i < 2 ? "font-mono" : "text-[0.95rem]"}>{b}</span>
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
        <div className={`${FADE} mt-2.5 text-center text-[0.95rem] text-muted`}>বাজি ধরা হলো. মাপবে ফিতা.</div>
      )}
      <Task done={sealed}>স্কুল আসলে কত দূরে? একটা বেছে নিয়ে বাজি ধরুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: both cards arrive. On
//      the square grid, 2 east and 3 north reach the school; on the roads, 3
//      up the lane and 1 back reach it too. And still Pythagoras gives 3.61
//      and 3.16.

const X1F = makeFrame(-1, 3.5, -0.5, 3.5, 20, 7);
const X1_SAY = [
  "দুইটা card, একটা স্কুল.",
  "Map এর (2, 3): 2 block east, 3 block north. স্কুলে পৌঁছায়.",
  "রাস্তার (−1, 3): গলিতে 3, বড় রাস্তায় 1 পিছনে. এটাও স্কুলে পৌঁছায়.",
  "দুইটাই পৌঁছায়. তবু Pythagoras বলে একবার 3.61, একবার 3.16.",
];
const X1_WALK: XY[] = [O, [1, 0], [2, 0], [2, 1], [2, 2], [2, 3]];

export function BothArrive() {
  const s = useScene(3, [600, 2000, 2200, 2400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1_SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[17rem] justify-center gap-2">
        <div className="w-1/2 text-center">
          <Plane f={X1F} grid={0} axes={false} label="square grid: 2 east, then 3 north, to the school" className="my-0! max-w-none">
            <L_Squares f={X1F} />
            <L_Place f={X1F} at={SCHOOL} kind="school" name={false} hit={k >= 1} />
            {k >= 1 &&
              X1_WALK.slice(1).map((p, i) => <Arrow key={i} f={X1F} from={X1_WALK[i]} to={p} tone="teal" w={2} draw delay={i * 120} />)}
            <L_Home f={X1F} name={false} />
          </Plane>
          <div className="mt-0.5 text-xs text-muted">map grid</div>
          <div className="h-5 font-mono text-[0.72rem]">{k >= 3 && <span className={FADE}>3.61</span>}</div>
        </div>
        <div className="w-1/2 text-center">
          <Plane f={X1F} grid={0} axes={false} label="road grid: 3 up the lane, 1 back, to the school" className="my-0! max-w-none">
            <L_Roads f={X1F} w={2.6} />
            <L_Place f={X1F} at={SCHOOL} kind="school" name={false} hit={k >= 2} />
            {k >= 2 && <L_Trail f={X1F} pts={route(CARD)} w={2} draw />}
            <L_Home f={X1F} name={false} />
          </Plane>
          <div className="mt-0.5 text-xs text-muted">রাস্তার grid</div>
          <div className="h-5 font-mono text-[0.72rem]">{k >= 3 && <span className={FADE}>3.16</span>}</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2 · Predict, then flip the grid. One arrow from home to the school; the
//     reader guesses whether it moves when the grid changes, then switches
//     between the map's square grid and the road grid. The grid cross-fades,
//     the arrow never moves, and its card flips between (2, 3) and (−1, 3).

const SS_GUESS = ["Arrow টা নতুন কোথাও সরে যায়", "Arrow একই থাকে, শুধু সংখ্যা বদলায়", "কিছুই বদলায় না"];
const SS_RIGHT = 1;

export function SameSchool() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [grid, setGrid] = useSeed<"map" | "roads">("grid", "map");
  const [over, setOver] = useSeed("over", false);
  const roads = grid === "roads";

  const flip = (g: "map" | "roads") => {
    setGrid(g);
    if (g === "roads" && !over) {
      setOver(true);
      pass("স্কুল নড়ে নাই. নড়েছে শুধু grid.");
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[11rem]">
        <Plane f={M} grid={0} axes={false} label={`the arrow from home to school, on the ${roads ? "road grid" : "map grid"}`} className="my-0! max-w-none">
          <L_Squares f={M} show={!roads} />
          <L_Roads f={M} show={roads} />
          <g style={{ opacity: roads ? 0 : 1 }} className="transition-opacity duration-700 motion-reduce:transition-none">
            <Arrow f={M} from={O} to={[1, 0]} tone="teal" w={2.4} />
            <Arrow f={M} from={O} to={[0, 1]} tone="teal" w={2.4} />
          </g>
          <g style={{ opacity: roads ? 1 : 0 }} className="transition-opacity duration-700 motion-reduce:transition-none">
            <Arrow f={M} from={O} to={[1, 0]} tone="blue" w={2.4} />
            <Arrow f={M} from={O} to={[1, 1]} tone="coral" w={2.4} />
          </g>
          <Arrow f={M} from={O} to={SCHOOL} tone="violet" w={3} />
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" />
        </Plane>
      </div>
      <div key={grid} className={`${FADE} mt-1 text-center text-[0.95rem]`}>
        {roads ? (
          <>
            রাস্তার grid: <L_CardText c={CARD} /> <span className="text-xs text-muted">সোজা, বাঁকা</span>
          </>
        ) : (
          <>
            Map grid: <span className="font-mono font-bold text-cat-teal">(2, 3)</span> <span className="text-xs text-muted">east, north</span>
          </>
        )}
      </div>
      {guess !== null && (
        <div className={`${FADE} mt-2 flex justify-center gap-2`}>
          <button type="button" onClick={() => flip("map")} className={`${pill(!roads)} font-sans`}>
            Map grid
          </button>
          <button type="button" onClick={() => flip("roads")} className={`${pill(roads)} font-sans`}>
            রাস্তার grid
          </button>
        </div>
      )}
      <div className="mt-2.5 text-sm font-medium text-muted">Grid বদলালে arrow টার কী হয়?</div>
      <div className="mt-1.5 grid gap-1.5">
        {SS_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, SS_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="text-[0.95rem]">{o}</span>
          </Choice>
        ))}
      </div>
      <Task done={over}>আগে guess করুন. তারপর রাস্তার grid এ গিয়ে arrow টার দিকে তাকান.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2¼ · A figure for screen 2's explanation, no task: the pair of directions
//      named basis. The map's east and north under the school's arrow, card
//      (2, 3); the roads' straight and slanted pair, card (−1, 3); then the
//      road card read on the map's basis lands somewhere else, not the school.
//      A card needs its arrow and its basis.

const X2BF = makeFrame(-1.6, 3.4, -0.9, 3.6, 22, 8);
const X2B_SAY = [
  "বাসা থেকে স্কুলের arrow. নিচে map এর দুই direction: east আর north.",
  "এরকম এক জোড়া direction কে বলে basis. এই basis এ card (2,\u00a03).",
  "রাস্তার basis: সোজা আর বাঁকা. একই arrow, card (−1,\u00a03).",
  "(−1,\u00a03) কে map এর basis এ পড়লে? অন্য জায়গা. Card একা কিছু বোঝায় না.",
];

export function BasisPair() {
  const s = useScene(3, [600, 2200, 2200, 2600]);
  const k = s.k;
  const f = X2BF;
  const roads = k === 2;
  const pair = roads ? (
    <g key="roads" className={FADE}>
      <Arrow f={f} from={O} to={[1, 0]} tone="blue" w={3} />
      <Arrow f={f} from={O} to={[1, 1]} tone="coral" w={3} />
    </g>
  ) : (
    <g key="map" className={k === 0 ? undefined : FADE}>
      <Arrow f={f} from={O} to={[1, 0]} tone="teal" w={k === 1 || k === 3 ? 3 : 2.2} />
      <Arrow f={f} from={O} to={[0, 1]} tone="teal" w={k === 1 || k === 3 ? 3 : 2.2} />
    </g>
  );

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X2B_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={f} grid={0} axes={false} label="the school's arrow on the map's basis, east and north, and on the roads' basis, straight and slanted; the road card read on the map's basis lands elsewhere" className="my-0! max-w-none">
            <L_Squares f={f} show={!roads} />
            <L_Roads f={f} show={roads} w={2.6} />
            <g opacity={k === 3 ? 0.35 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
              <Arrow f={f} from={O} to={SCHOOL} tone="violet" w={2.8} />
            </g>
            {k >= 1 && k <= 2 && (
              <text key={k} x={f.sx(0.5)} y={f.sy(0) + 22} textAnchor="middle" fontSize={9} fontWeight={800} fill={roads ? "#1d4ed8" : "#0f766e"} className={POP}>
                basis
              </text>
            )}
            {k === 3 && (
              <g>
                <Arrow f={f} from={O} to={CARD} tone="coral" w={2.2} dashed draw />
                <circle cx={f.sx(CARD[0])} cy={f.sy(CARD[1])} r={4} strokeWidth={1.6} className={`${POP} fill-white stroke-cat-coral`} />
                <text x={f.sx(CARD[0]) + 8} y={f.sy(CARD[1]) + 4} fontSize={11} fontWeight={800} fill="#be123c" className={POP}>
                  ?
                </text>
              </g>
            )}
            <L_Place f={f} at={SCHOOL} kind="school" name={false} />
            <L_Home f={f} name={false} />
            {pair}
          </Plane>
        </div>
        <div className="w-[5.5rem] min-w-0 text-center">
          <div className="text-xs text-muted">{roads ? "রাস্তার basis" : "map এর basis"}</div>
          <div key={k} className={`${FADE} font-mono text-lg font-bold ${k === 0 ? "text-muted" : roads || k === 3 ? "text-cat-violet" : "text-cat-teal"}`}>
            {k === 0 ? "?" : k === 1 ? "(2, 3)" : "(−1, 3)"}
          </div>
          {k === 3 && <div className={`${FADE} text-xs text-danger`}>স্কুল না</div>}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: Fahim at two assembly
//      lines. Last year's line: he is the tallest, at the end. Today's line:
//      he stands in the middle. A dashed line at his height runs across both.

const X2_OLD: { who: "som" | "samin" | "rina" | "fahim"; x: number; s: number }[] = [
  { who: "som", x: 22, s: 0.78 },
  { who: "rina", x: 52, s: 0.84 },
  { who: "samin", x: 82, s: 0.9 },
  { who: "fahim", x: 114, s: 1 },
];
const X2_NEW: { who: "nasib" | "karim" | "fahim"; x: number; s: number }[] = [
  { who: "nasib", x: 206, s: 0.93 },
  { who: "fahim", x: 240, s: 1 },
  { who: "karim", x: 276, s: 1.14 },
];
const X2_SAY = [
  "গত বছর, পুরানো স্কুলের assembly. Height অনুযায়ী লাইন. ফাহিম সবার শেষে: সবচেয়ে লম্বা.",
  "আজ সকালে, নতুন স্কুলে. একই ফাহিম, এবার মাঝখানে.",
  "ওর height একচুলও বদলায় নাই. বদলেছে শুধু লাইন.",
];

export function AssemblyLines() {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  const head = 150 - 63;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X2_SAY[k]}</span>}>
      <div className="mx-auto max-w-[17rem] overflow-hidden rounded-xl">
        <Stage backdrop="field" label="two assembly lines by height: in last year's line Fahim is the tallest; in the new school's line he is in the middle">
          <text x={70} y={22} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0f1b2d">
            পুরানো স্কুল
          </text>
          <text x={242} y={22} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0f1b2d">
            নতুন স্কুল
          </text>
          <path d="M160 34V150" stroke="white" strokeWidth={2} strokeDasharray="4 4" />
          {X2_OLD.map((p) => (
            <Person key={`o${p.who}`} who={p.who} x={p.x} y={150} scale={p.s} mood={p.who === "fahim" ? "happy" : "plain"} />
          ))}
          {k === 0 && (
            <g className={POP}>
              <path d={`M114 ${head - 16}v10`} stroke="#b45309" strokeWidth={2} />
              <path d={`M110 ${head - 10}l4 5l4 -5`} fill="none" stroke="#b45309" strokeWidth={2} />
              <text x={114} y={head - 19} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#b45309">
                সবচেয়ে লম্বা
              </text>
            </g>
          )}
          {X2_NEW.map((p) => (
            <Person key={`n${p.who}`} who={p.who} x={k >= 1 ? p.x : p.x + 150} y={150} scale={p.s} walking={k === 1} ms={1400} mood={p.who === "fahim" ? "puzzled" : "plain"} />
          ))}
          {k >= 1 && (
            <text x={240} y={head - 8} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#1d4ed8" className={FADE}>
              মাঝখানে
            </text>
          )}
          {k >= 2 && <Draw d={`M10 ${head}H310`} strokeWidth={1.6} ms={900} className="stroke-[#7c3aed] [stroke-dasharray:6_4]" />}
        </Stage>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: Karim finds the tape from
//      3.4 in Fahim's bag, and wants to measure one block first.

export function TapeOut({}: Story) {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Karim pulls a measuring tape out of Fahim's bag; Fahim says it is his tape; Karim wants to measure one block first">
        <T_Bench />
        <rect x={150} y={100} width={24} height={18} rx={3} fill="#1e3a8a" />
        <path d="M154 100q8 -8 16 0" fill="none" stroke="#1e3a8a" strokeWidth={2} />
        <Person who="fahim" x={104} y={150} mood="plain" />
        <Person who="karim" x={214} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} mood={k === 1 ? "puzzled" : "plain"} />
        {k >= 1 && (
          <g className={POP}>
            <L_TapeCase x={200} y={106} />
          </g>
        )}
        {k >= 3 && <Draw d="M194 108H150" strokeWidth={2.4} ms={900} className="stroke-[#eab308]" />}
        {k === 1 && <Bubble x={214} y={82} side="left" lines={["এটা কী?"]} />}
        {k === 2 && <Bubble x={104} y={82} side="right" lines={["মাপার ফিতা."]} />}
        {k >= 3 && <Bubble x={214} y={82} side="left" lines={["আগে এক block", "মেপে দেখি."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · One block of each road, measured. The reader drags the tape's end from
//     home: along the main road to the end of one block (1.00), and up the
//     lane to the end of one block (1.41). Each target snaps when the tape
//     gets near it, and its length stays written on the map.

const LBF = makeFrame(-1, 2.6, -0.8, 2, 44, 12);
const LB_T: { at: XY; name: string; tone: "blue" | "coral" }[] = [
  { at: [1, 0], name: "বড় রাস্তার এক block", tone: "blue" },
  { at: [1, 1], name: "গলির এক block", tone: "coral" },
];

export function LaneBlock() {
  const pass = useGate();
  const [end, setEnd] = useSeed<XY>("end", O);
  const [got, setGot] = useSeed<boolean[]>("got", [false, false]);
  const all = got.every(Boolean);
  const len = dist(O, end);

  const pull = (p: XY) => {
    if (all) return;
    const t: XY = [clamp(p[0], LBF.x0, LBF.x1), clamp(p[1], LBF.y0, LBF.y1)];
    const i = LB_T.findIndex((g, j) => !got[j] && dist(t, g.at) < 0.22);
    if (i < 0) {
      setEnd(t);
      return;
    }
    setEnd(LB_T[i].at);
    const next = got.map((g, j) => g || j === i);
    setGot(next);
    if (next.every(Boolean)) pass("গলির এক block 1 না, 1.41.");
  };
  const key = () => {
    const i = got.indexOf(false);
    if (i >= 0) pull(LB_T[i].at);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[13rem]">
        <Plane f={LBF} grid={0} axes={false} label={`the tape from home, ${len.toFixed(2)} blocks long`} drag={all ? undefined : { down: pull, move: pull }} onKey={all ? undefined : key} className="my-0! max-w-none">
          <L_Roads f={LBF} w={4} />
          {LB_T.map((g, i) => (
            <g key={g.name}>
              {got[i] ? (
                <>
                  <path d={`M${LBF.sx(0)} ${LBF.sy(0)}L${LBF.sx(g.at[0])} ${LBF.sy(g.at[1])}`} strokeWidth={3} strokeLinecap="round" className={`pointer-events-none ${g.tone === "blue" ? "stroke-cat-blue" : "stroke-cat-coral"}`} />
                  <Label f={LBF} at={[g.at[0] / 2, g.at[1] / 2]} dx={i ? -8 : 0} dy={i ? -2 : -7} anchor={i ? "end" : "middle"} size={10} weight={800} className="fill-[#0f1b2d] font-mono">
                    {i ? "1.41" : "1.00"}
                  </Label>
                </>
              ) : (
                <circle cx={LBF.sx(g.at[0])} cy={LBF.sy(g.at[1])} r={6} strokeWidth={2} strokeDasharray="2 2" className={`pointer-events-none fill-none ${g.tone === "blue" ? "stroke-cat-blue" : "stroke-cat-coral"}`} />
              )}
            </g>
          ))}
          {len > 0.05 && !all && <L_Tape f={LBF} to={end} />}
          {len < 0.05 && !all && <circle cx={LBF.sx(0)} cy={LBF.sy(0)} r={11} strokeWidth={2} className={`${POP} pointer-events-none fill-none stroke-[#eab308]`} />}
          <L_Home f={LBF} />
        </Plane>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        ফিতা: <b className="font-mono tabular-nums">{len.toFixed(2)}</b> block
      </div>
      <div className="mx-auto mt-1.5 grid max-w-xs grid-cols-2 gap-1.5 text-center text-sm">
        {LB_T.map((g, i) => (
          <div key={g.name} className={`rounded-xl border px-2 py-1 ${got[i] ? "border-accent bg-accent/10" : "border-border"}`}>
            <div className={`text-xs ${g.tone === "blue" ? "text-cat-blue" : "text-cat-coral"}`}>{g.name}</div>
            <div className="font-mono font-bold">{got[i] ? (i ? "1.41" : "1.00") : "?"}</div>
          </div>
        ))}
      </div>
      <Task done={all}>বাসা থেকে ফিতার মাথা টেনে বড় রাস্তার এক block আর গলির এক block মাপুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: why a lane block is
//      1.41. It is the diagonal of one small square of the map: sides 1 and
//      1 meeting square, so √(1² + 1²) = 1.41. Three of them are 4.24, not 3.

const X3F = makeFrame(-0.4, 3.4, -0.4, 3.4, 26, 10);
const X3_SAY = [
  "গলির এক block: বাসা থেকে (1, 1).",
  "এটা map এর একটা ছোট square এর কোনাকুনি. দুই পাশ 1 আর 1, কোণায় right angle.",
  "তাই Pythagoras খাটে: √(1² + 1²) = √2 = 1.41.",
  "গলিতে 3 block মানে 3 × 1.41 = 4.24 পথ. করিমের হিসাব ওটাকে ধরেছিল 3.",
];

export function DiagonalBlock() {
  const s = useScene(3, [600, 2200, 2200, 2400]);
  const k = s.k;
  const f = X3F;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={f} grid={0} axes={false} label="one lane block as the diagonal of a small square, and three lane blocks each 1.41 long" className="my-0! max-w-none">
            <L_Squares f={f} />
            {k >= 1 && k < 3 && (
              <g className={FADE}>
                <Arrow f={f} from={O} to={[1, 0]} tone="teal" w={2} />
                <Arrow f={f} from={[1, 0]} to={[1, 1]} tone="teal" w={2} />
                <path d={`M${f.sx(1) - 6} ${f.sy(0)}v-6h6`} strokeWidth={1.2} className="pointer-events-none fill-none stroke-[#0f1b2d]" />
              </g>
            )}
            {(k >= 3 ? [0, 1, 2] : [0]).map((i) => (
              <Arrow key={i} f={f} from={[i, i]} to={[i + 1, i + 1]} tone="coral" w={2.6} draw={i > 0} />
            ))}
            {k >= 2 &&
              (k >= 3 ? [0, 1, 2] : [0]).map((i) => (
                <text key={i} x={f.sx(i + 0.5) - 5} y={f.sy(i + 0.5) - 3} textAnchor="end" fontSize={8} fontWeight={700} fill="#be123c" stroke="white" strokeWidth={2} paintOrder="stroke" className={POP}>
                  1.41
                </text>
              ))}
            <L_Home f={f} name={false} />
          </Plane>
        </div>
        <div className="min-w-0 text-center">
          <div className="text-xs text-muted">গলিতে 3 block</div>
          <div className="font-mono text-lg font-bold">{k >= 3 ? <span className={`${POP} inline-block text-cat-coral`}>4.24</span> : "?"}</div>
          <div className="font-mono text-xs text-muted line-through">3</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · The corner. Pythagoras needs the two legs to meet at a right angle.
//     The reader runs 4.2's box on each grid's two road directions: the map's
//     (1, 0) · (0, 1) = 0, a right angle, and the corner mark pops; the
//     roads' (1, 0) · (1, 1) = 1, not a right angle, and a slanted arc
//     draws instead. Each tap plays the sum line by line.

const RC_F = makeFrame(-0.3, 3.3, -0.3, 3.3, 24, 6);
const RC: { name: string; a: XY; b: XY; lines: string[]; ok: boolean }[] = [
  { name: "map grid", a: [1, 0], b: [0, 1], lines: ["(1, 0) · (0, 1)", "= 1×0 + 0×1", "= 0"], ok: true },
  { name: "রাস্তার grid", a: [1, 0], b: [1, 1], lines: ["(1, 0) · (1, 1)", "= 1×1 + 0×1", "= 1"], ok: false },
];

export function RoadCorner() {
  const pass = useGate();
  const [ran, setRan] = useSeed<boolean[]>("ran", [false, false]);
  const [cur, setCur] = useState<number | null>(null);
  const play = usePlay(550);
  const shown = (i: number) => (ran[i] ? 3 : cur === i && play.running ? play.k : 0);

  const run = (i: number) => {
    if (play.running || ran[i]) return;
    setCur(i);
    play.play(3, () => {
      const next = ran.map((r, j) => r || j === i);
      setRan(next);
      if (next.every(Boolean)) pass("রাস্তার কোণায় box 1. Right angle না.");
    });
  };

  return (
    <>
      <div className="mx-auto grid max-w-[19rem] grid-cols-2 gap-2">
        {RC.map((c, i) => {
          const n = shown(i);
          const f = RC_F;
          return (
            <div key={c.name} className={`rounded-xl border-2 p-1 text-center ${ran[i] ? (c.ok ? "border-accent" : "border-danger/50") : "border-border"}`}>
              <Plane f={f} grid={0} axes={false} label={`${c.name}: the two road directions ${tup(c.a)} and ${tup(c.b)}`} className="my-0! max-w-none">
                {c.ok ? <L_Squares f={f} /> : <L_Roads f={f} w={2.4} />}
                {c.ok ? (
                  <g opacity={0.35}>
                    <Arrow f={f} from={O} to={[2, 0]} tone="teal" w={1.6} />
                    <Arrow f={f} from={[2, 0]} to={SCHOOL} tone="teal" w={1.6} />
                  </g>
                ) : (
                  <g opacity={0.35}>
                    <L_Trail f={f} pts={route(CARD)} w={1.6} />
                  </g>
                )}
                <Arrow f={f} from={O} to={c.a} tone={c.ok ? "teal" : "blue"} w={2.6} />
                <Arrow f={f} from={O} to={c.b} tone={c.ok ? "teal" : "coral"} w={2.6} />
                {ran[i] &&
                  (c.ok ? (
                    <path d={`M${f.sx(0) + 8} ${f.sy(0)}v-8h-8`} strokeWidth={2} className={`${POP} pointer-events-none fill-none stroke-[#15803d]`} />
                  ) : (
                    <path d={`M${f.sx(0) + 9} ${f.sy(0)}A9 9 0 0 0 ${f.sx(0) + 6.4} ${f.sy(0) - 6.4}`} strokeWidth={2.4} className={`${POP} pointer-events-none fill-none stroke-[#dc2626]`} />
                  ))}
                <L_Place f={f} at={SCHOOL} kind="school" name={false} />
              </Plane>
              <div className="text-xs font-semibold">{c.name}</div>
              <div className="mt-0.5 h-[3.4rem] font-mono text-[0.72rem] leading-snug">
                {c.lines.slice(0, n).map((l, j) => (
                  <div key={l} className={`${FADE} ${j === 2 ? "font-bold" : ""}`}>
                    {l}
                  </div>
                ))}
              </div>
              {ran[i] ? (
                <div className={`${FADE} flex items-center justify-center gap-1 text-xs font-semibold ${c.ok ? "text-accent-text" : "text-danger"}`}>
                  <svg viewBox="-6 -6 12 12" className="h-3 w-3" aria-hidden="true">
                    <L_Tick x={0} y={0} ok={c.ok} />
                  </svg>
                  {c.ok ? "right angle" : "right angle না"}
                </div>
              ) : (
                <button type="button" onClick={() => run(i)} disabled={play.running} className={`${primaryBtn} px-3! py-1! text-sm`}>
                  box চালান
                </button>
              )}
            </div>
          );
        })}
      </div>
      <Task done={ran.every(Boolean)}>দুইটা grid এর কোণাতেই 4.2 এর box চালিয়ে দেখুন: দুই রাস্তা কি right angle এ মিলে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: two small maps. On the
//      square grid the legs 2 and 3 meet square, and Pythagoras gives 3.61.
//      On the road grid the corner isn't square and a lane block is 1.41
//      long, so √(1² + 3²) = 3.16 doesn't hold.

const X4F = makeFrame(-1, 3.5, -0.5, 3.5, 20, 7);
const X4_SAY = [
  "একই স্কুল, একই arrow.",
  "Map grid এ দুই পা, 2 আর 3, square হয়ে মিলেছে. Pythagoras বলে 3.61.",
  "রাস্তার grid এ রাস্তা দুইটা হেলে মিলেছে. এখানে Pythagoras খাটে না, 3.16 ভুল.",
  "আর গলির এক block 1 না. 1.41.",
];

export function TwoTapes() {
  const s = useScene(3, [600, 2200, 2400, 2000]);
  const k = s.k;
  const arrow = <Arrow f={X4F} from={O} to={SCHOOL} tone="violet" w={2.2} dashed />;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X4_SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[17rem] justify-center gap-2">
        <div className="w-1/2 text-center">
          <Plane f={X4F} grid={0} axes={false} label="square grid: legs 2 and 3 meet at a right angle" className="my-0! max-w-none">
            <L_Squares f={X4F} />
            {arrow}
            {k >= 1 && (
              <g className={FADE}>
                <Arrow f={X4F} from={O} to={[2, 0]} tone="teal" w={2} />
                <Arrow f={X4F} from={[2, 0]} to={[2, 3]} tone="teal" w={2} />
                <path d={`M${X4F.sx(2) - 7} ${X4F.sy(0)}v-7h7`} strokeWidth={1.2} className="pointer-events-none fill-none stroke-[#0f1b2d]" />
              </g>
            )}
            <L_Place f={X4F} at={SCHOOL} kind="school" name={false} />
          </Plane>
          <div className="mt-0.5 text-xs text-muted">map grid</div>
          <div className="flex h-5 items-center justify-center gap-1 font-mono text-[0.68rem] whitespace-nowrap">
            {k >= 1 && (
              <>
                <span className={FADE}>√(2² + 3²) = 3.61</span>
                <svg viewBox="-6 -6 12 12" className="h-3 w-3 shrink-0" aria-hidden="true">
                  <L_Tick x={0} y={0} ok />
                </svg>
              </>
            )}
          </div>
        </div>
        <div className="w-1/2 text-center">
          <Plane f={X4F} grid={0} axes={false} label="road grid: three lane blocks and one back; the corner is not square" className="my-0! max-w-none">
            <L_Roads f={X4F} w={2.6} />
            {arrow}
            {k >= 2 && (
              <g className={FADE}>
                <L_Trail f={X4F} pts={route(CARD)} w={2} />
              </g>
            )}
            <L_Place f={X4F} at={SCHOOL} kind="school" name={false} />
            {k >= 2 && (
              <path
                d={`M${X4F.sx(3) - 13} ${X4F.sy(3)}A13 13 0 0 0 ${X4F.sx(3) - 9.2} ${X4F.sy(3) + 9.2}`}
                strokeWidth={2}
                className={`${POP} pointer-events-none fill-none stroke-[#7c3aed]`}
              />
            )}
            {k >= 3 &&
              [0, 1, 2].map((i) => (
                <text key={i} x={X4F.sx(i + 0.5) - 5} y={X4F.sy(i + 0.5) - 3} textAnchor="end" fontSize={7} fontWeight={700} fill="#be123c" stroke="white" strokeWidth={2} paintOrder="stroke" className={POP}>
                  1.41
                </text>
              ))}
          </Plane>
          <div className="mt-0.5 text-xs text-muted">রাস্তার grid</div>
          <div className="flex h-5 items-center justify-center gap-1 font-mono text-[0.68rem] whitespace-nowrap">
            {k >= 2 && (
              <>
                <span className={FADE}>√(1² + 3²) = 3.16</span>
                <svg viewBox="-6 -6 12 12" className="h-3 w-3 shrink-0" aria-hidden="true">
                  <L_Tick x={0} y={0} ok={false} />
                </svg>
              </>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's side quest, no task: on square roads, 1 block
//      long, the card needs no solving. Light the school's arrow onto each
//      road, as 4.3's torches did: the shadows are 2 and 3, the card itself.

const X5F = makeFrame(-0.5, 3.5, -0.5, 3.5, 24, 10);
const X5_SAY = [
  "Square রাস্তা, প্রতিটা block 1 লম্বা: map এর নিজের grid.",
  "East এর রাস্তার উপর torch ফেলুন. Shadow 2 block.",
  "North এর রাস্তায় আরেকটা torch. Shadow 3 block.",
  "Shadow গুলাই card. বাঁকা রাস্তায় তা হয় না. সেখানে solve করতে হয়.",
];

export function ShadowRoads() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const f = X5F;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={f} grid={0} axes={false} label="the school's arrow on square roads, with its shadows 2 and 3 on the two roads" className="my-0! max-w-none">
            <L_Roads f={f} kind="square" w={2.6} />
            {k >= 1 && (
              <g className={FADE}>
                <path d={`M${f.sx(2)} ${f.sy(3)}V${f.sy(0)}`} strokeWidth={1.2} strokeDasharray="3 3" className="pointer-events-none stroke-[#d97706]" />
                <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(2)}`} strokeWidth={6} strokeLinecap="round" className="pointer-events-none stroke-[#0f1b2d]/55" />
              </g>
            )}
            {k >= 2 && (
              <g className={FADE}>
                <path d={`M${f.sx(2)} ${f.sy(3)}H${f.sx(0)}`} strokeWidth={1.2} strokeDasharray="3 3" className="pointer-events-none stroke-[#d97706]" />
                <path d={`M${f.sx(0)} ${f.sy(0)}V${f.sy(3)}`} strokeWidth={6} strokeLinecap="round" className="pointer-events-none stroke-[#0f1b2d]/55" />
              </g>
            )}
            <Arrow f={f} from={O} to={SCHOOL} tone="violet" w={2.6} />
            <L_Home f={f} name={false} />
          </Plane>
        </div>
        <div className="font-mono text-2xl font-bold">
          (<span className="text-cat-teal">{k >= 1 ? <span className={`${POP} inline-block`}>2</span> : "?"}</span>,{" "}
          <span className="text-cat-teal">{k >= 2 ? <span className={`${POP} inline-block`}>3</span> : "?"}</span>)
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · Your turn: how far is the bazaar? Its road card is (3, 1). Three sums,
//     each a tape: √(3² + 1²) = 3.16 (Pythagoras on the road card) stops
//     short; √(4² + 1²) = 4.12 (the map card) lands on the bazaar; 3 + 1.41
//     = 4.41 (the rickshaw's whole ride) runs past it. Each pick unrolls
//     its tape from home towards the bazaar; wrong tries bounce.

const BAZAAR: XY = [4, 1];
const YD = makeFrame(-1, 6, -1, 2.5, 26, 10);
const YD_OPT = [
  { sum: "√(3² + 1²) = 3.16", len: 3.16 },
  { sum: "√(4² + 1²) = 4.12", len: Math.hypot(4, 1) },
  { sum: "3 + 1.41 = 4.41", len: 4.41 },
];
const YD_RIGHT = 1;
const YD_NOPE = [
  "ফিতা বাজারের আগেই থেমে গেলো. কেন? (3, 1) হলো রাস্তার card. আর রাস্তার grid এ Pythagoras খাটে না.",
  "",
  "ফিতা বাজার ছাড়িয়ে গেলো. 4.41 হলো রিকশার পুরা পথ, রাস্তা ধরে ধরে. সোজা line এর দূরত্ব এর চেয়ে কম.",
];
const YD_DIR: XY = [4 / Math.hypot(4, 1), 1 / Math.hypot(4, 1)];

export function YourDistance() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(55);
  const t = pick === null ? 0 : play.running ? play.k / 12 : 1;
  const len = pick === null ? 0 : YD_OPT[pick].len * t;
  const end: XY = [YD_DIR[0] * len, YD_DIR[1] * len];
  const settled = pick !== null && !play.running;

  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    play.play(12, () => (i === YD_RIGHT ? pass("বাজার map এ (4, 1). দূরত্ব 4.12.") : setMiss((m) => m + 1)));
  };
  const look = (i: number): Look => (pick !== i || !settled ? "idle" : i === YD_RIGHT ? "right" : "wrong");

  return (
    <>
      <div className="mx-auto w-full max-w-[15rem]">
        <Plane f={YD} grid={0} axes={false} label={`the bazaar at (4, 1) on the map; the tape from home is ${len.toFixed(2)} long`} className="my-0! max-w-none">
          <L_Squares f={YD} />
          <L_Roads f={YD} w={2.6} />
          <g opacity={0.45}>
            <L_Trail f={YD} pts={route([3, 1])} w={1.8} />
          </g>
          <L_Place f={YD} at={BAZAAR} kind="bazaar" hit={settled && pick === YD_RIGHT} />
          {len > 0.05 && <L_Tape f={YD} to={end} />}
          <L_Home f={YD} />
        </Plane>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        বাজারের রাস্তার card <L_CardText c={[3, 1]} /> <span className="text-muted">· ফিতা</span> <b className="font-mono tabular-nums">{len.toFixed(2)}</b>
      </div>
      <div className="mt-2 grid gap-1.5">
        {YD_OPT.map((o, i) => (
          <Choice key={o.sum} n={i} look={look(i)} disabled={play.running} onClick={() => choose(i)}>
            <span className="font-mono text-[0.95rem]">{o.sum}</span>
          </Choice>
        ))}
      </div>
      {settled && pick !== YD_RIGHT && <Nope key={miss}>{YD_NOPE[pick]}</Nope>}
      <Task done={settled && pick === YD_RIGHT}>বাজার বাসা থেকে সোজা line এ কত দূরে? যে হিসাবটা ঠিক, সেটা বেছে নিন. ফিতা খুলে দেখাবে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the bazaar's road card
//      turned into a map card, then Pythagoras on the square grid.

const X6F = makeFrame(-0.5, 4.6, -0.6, 1.8, 26, 10);
const X6_SAY = [
  "বাজারের রাস্তার card (3, 1).",
  "গলিতে 1 block, তারপর বড় রাস্তায় 3. Map এ গিয়ে থামে (4, 1) এ.",
  "Map এর grid এ: 4 block east, 1 block north. কোণায় right angle.",
  "Square grid, তাই Pythagoras খাটে: √(4² + 1²) = √17 = 4.12.",
];

export function BazaarTape() {
  const s = useScene(3, [600, 2000, 2200, 2400]);
  const k = s.k;
  const f = X6F;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6_SAY[k]}</span>}>
      <div className="mx-auto w-full max-w-[14rem]">
        <Plane f={f} grid={0} axes={false} label="the bazaar's road card (3, 1) drawn, then the map legs 4 and 1, then the tape 4.12" className="my-0! max-w-none">
          <L_Squares f={f} show={k >= 2} />
          <L_Roads f={f} show={k < 2} w={2.6} />
          {k >= 1 && k < 2 && <L_Trail f={f} pts={route([3, 1])} w={2} draw />}
          {k >= 2 && (
            <g className={FADE}>
              <Arrow f={f} from={O} to={[4, 0]} tone="teal" w={2} />
              <Arrow f={f} from={[4, 0]} to={BAZAAR} tone="teal" w={2} />
              <path d={`M${f.sx(4) - 7} ${f.sy(0)}v-7h7`} strokeWidth={1.2} className="pointer-events-none fill-none stroke-[#0f1b2d]" />
            </g>
          )}
          {k >= 3 && (
            <g className={FADE}>
              <L_Tape f={f} to={BAZAAR} />
              <Label f={f} at={[2, 0.5]} dy={-6} size={10} weight={800} className="fill-[#a16207] font-mono">
                4.12
              </Label>
            </g>
          )}
          <L_Place f={f} at={BAZAAR} kind="bazaar" name={false} hit={k >= 3} />
          <L_Home f={f} name={false} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for the exercise's setup, no task: Karim's new
//      objection. The road grid sketched in Fahim's khata; Karim taps it:
//      slanted roads must make a bad grid; what grid isn't square? No answer.

export function KarimObjects({}: Story) {
  const s = useScene(2, [600, 2400, 2600]);
  const k = s.k;
  // the khata page on the bench, with the two roads of the road grid sketched on it
  const px = 128;
  const py = 94;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="at the bench, Karim points at the slanted road grid in Fahim's khata and says slanted roads make a bad grid; what grid is not square?">
        <T_Bench />
        <g className="pointer-events-none">
          <rect x={px} y={py} width={46} height={24} rx={2} fill="white" stroke="#94a3b8" />
          {[0, 1, 2].map((i) => (
            <path key={`h${i}`} d={`M${px + 4} ${py + 6 + i * 7}H${px + 42}`} stroke="#1d4ed8" strokeWidth={1} opacity={0.7} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={`d${i}`} d={`M${px + 2 + i * 9} ${py + 21}l12 -18`} stroke="#e11d48" strokeWidth={1} opacity={0.7} />
          ))}
        </g>
        <Person who="fahim" x={96} y={150} mood={k >= 2 ? "puzzled" : "plain"} />
        <Person who="karim" x={214} y={150} facing={-1} arm={k === 1 ? "point" : "down"} mood={k >= 1 ? "smug" : "plain"} />
        {k === 1 && <Bubble x={214} y={82} side="left" lines={["বাঁকা রাস্তা মানেই", "বাজে grid."]} />}
        {k >= 2 && <Bubble x={214} y={82} side="left" lines={["Square না হলে", "আবার grid কীসের?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · Try it: three road maps as pictures, slanted roads · two parallel roads
//     · square roads. The reader taps every map that can take a rickshaw
//     anywhere, then sends the rickshaws. The parallel one runs along its one
//     line and never reaches the school; a missed good map drives there
//     anyway. Wrong tries bounce.

const TF = makeFrame(-1, 4, -1, 4, 14, 6);
const TW: { kind: RoadKind; name: string; keys: [XY, XY]; trip: XY[]; reach: boolean }[] = [
  { kind: "slant", name: "বাঁকা রাস্তা", keys: [[1, 0], [1, 1]], trip: route(CARD), reach: true },
  { kind: "twin", name: "পাশাপাশি দুই রাস্তা", keys: [[1, 1], [2, 2]], trip: [O, [1, 1], [2, 2], [3, 3]], reach: false },
  {
    kind: "square",
    name: "square রাস্তা",
    keys: [[1, 0], [0, 1]],
    trip: [O, [1, 0], [2, 0], [2, 1], [2, 2], [2, 3]],
    reach: true,
  },
];
const TW_RIGHT = [0, 2];

function T_Mini({ i, k, show, paint = false }: { i: number; k: number; show: boolean; paint?: boolean }) {
  const m = TW[i];
  const t = Math.min(k, m.trip.length - 1);
  const end = m.trip[t];
  const lo = Math.max(TF.x0, TF.y0);
  const hi = Math.min(TF.x1, TF.y1);
  return (
    <Plane f={TF} grid={0} axes={false} label={`${m.name}${paint ? (m.reach ? ": they reach everywhere" : ": they reach only one line") : ""}`} className="my-0! max-w-none">
      {paint &&
        (m.reach ? (
          <rect x={TF.sx(TF.x0)} y={TF.sy(TF.y1)} width={(TF.x1 - TF.x0) * TF.u} height={(TF.y1 - TF.y0) * TF.u} className={`${FADE} fill-cat-violet/20`} />
        ) : (
          <path d={`M${TF.sx(lo)} ${TF.sy(lo)}L${TF.sx(hi)} ${TF.sy(hi)}`} strokeWidth={11} className={`${FADE} fill-none stroke-cat-violet/30`} />
        ))}
      <L_Roads f={TF} kind={m.kind} w={2.4} />
      <Arrow f={TF} from={O} to={m.keys[1]} tone="coral" w={2} />
      <Arrow f={TF} from={O} to={m.keys[0]} tone="blue" w={2} />
      <L_Place f={TF} at={SCHOOL} kind="school" name={false} hit={show && !paint && same(end, SCHOOL)} />
      {show && !paint && <L_Trail f={TF} pts={m.trip} upto={t} w={1.6} />}
      {show && !paint && <L_Rickshaw f={TF} at={end} s={0.6} facing={faceOf(m.trip, t)} ms={260} />}
      {show && !paint && !m.reach && t === m.trip.length - 1 && (
        <path d={`M${TF.sx(3) + 5} ${TF.sy(3) - 12}l7 7m0 -7l-7 7`} strokeWidth={2} strokeLinecap="round" className={`${POP} fill-none stroke-danger`} />
      )}
      <L_Home f={TF} name={false} />
    </Plane>
  );
}

export function TryWhichGrid() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<number[]>("picks", []);
  const [checked, setChecked] = useSeed("checked", false);
  const [miss, setMiss] = useState(0);
  const play = usePlay(260);
  const right = picks.length === 2 && TW_RIGHT.every((i) => picks.includes(i));
  const k = play.running ? play.k : 9;
  const settled = checked && !play.running;
  const shown = (i: number) => checked && (picks.includes(i) || TW[i].reach);

  const toggle = (i: number) => {
    if (play.running) return;
    setChecked(false);
    setPicks(picks.includes(i) ? picks.filter((p) => p !== i) : [...picks, i].sort());
  };
  const send = () => {
    const ok = right;
    setChecked(true);
    play.play(5, () => (ok ? pass("পাশাপাশি না হলেই দুই রাস্তা একটা basis.") : setMiss((m) => m + 1)));
  };
  const look = (i: number): Look => {
    if (!settled) return picks.includes(i) ? "picked" : "idle";
    if (picks.includes(i)) return TW[i].reach ? "right" : "wrong";
    return TW[i].reach ? "wrong" : "dim";
  };
  const nope = [
    picks.includes(1) && "পাশাপাশি রাস্তায় রিকশা শুধু একটা line ধরে চলে. স্কুল ওই line এ নাই.",
    !picks.includes(0) && "বাঁকা রাস্তা বাদ দিয়েছেন. আজ সকালে এগুলা দিয়েই ফাহিম স্কুলে এসেছে.",
    !picks.includes(2) && "Square রাস্তা বাদ দিয়েছেন: সাধারণ east আর north. এগুলাও সব জায়গায় যায়.",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {TW.map((m, i) => (
          <button
            key={m.name}
            type="button"
            onClick={() => toggle(i)}
            aria-pressed={picks.includes(i)}
            className={`cursor-pointer rounded-xl border-2 p-1 text-center transition-[border-color,background-color,opacity] duration-200 motion-reduce:transition-none ${LOOK[look(i)]}`}
          >
            <T_Mini i={i} k={k} show={shown(i)} />
            <div className="mt-0.5 text-xs leading-tight font-semibold">{m.name}</div>
          </button>
        ))}
      </div>
      <div className="mt-2 text-center text-xs text-muted">ছোট ঘরটা বাসা. প্রতিটা map এ স্কুল (2, 3) এ.</div>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={send} disabled={!picks.length || play.running || (settled && right)} className={primaryBtn}>
          রিকশা পাঠান
        </button>
      </div>
      {settled && !right && <Nope key={miss}>{nope}</Nope>}
      {settled && right && <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>দুইটাই স্কুলে পৌঁছায়. আর সেখান থেকে যেকোনো জায়গায়.</div>}
      <Task done={settled && right}>যেসব map এ রিকশা যেকোনো জায়গায় যেতে পারে, সবগুলায় tap করুন. তারপর রিকশা পাঠান.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for the exercise's explanation, no task: each map's reach,
//      painted. The slanted roads paint the whole map, the square roads too;
//      the parallel roads paint one line, and the school is off it.

const X7_SAY = [
  "তিনটা map. প্রতিটা যেখানে যেখানে যেতে পারে, রঙ করি.",
  "বাঁকা রাস্তা: পুরা map.",
  "Square রাস্তা: এটাও পুরা map.",
  "পাশাপাশি রাস্তা: একটা line. স্কুল তার বাইরে.",
];

export function ReachPaint() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  const order = [0, 2, 1];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X7_SAY[k]}</span>}>
      <div className="mx-auto grid max-w-[17rem] grid-cols-3 gap-1.5">
        {TW.map((m, i) => (
          <div key={m.name} className="text-center">
            <T_Mini i={i} k={0} show={false} paint={k > order.indexOf(i)} />
            <div className="text-[0.7rem] leading-tight text-muted">{m.name}</div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for the finale's setup, no task: five minutes before
//      tiffin ends. The map lies on the bench; Fahim holds the tape's case on
//      home, Karim pulls the tape to the school. No number yet.

export function TapeOnMap({}: Story) {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  // the map, lying on the bench top, drawn in a little perspective
  const P = (x: number, y: number): XY => [130 + x * 22 - y * 6, 116 - y * 6];
  const pt = (x: number, y: number) => P(x, y).join(",");
  const home = P(0, 0.4);
  const school = P(2, 3);

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="the map lies on the bench; Fahim holds the tape on home and Karim pulls it to the school">
        <T_Bench x0={50} x1={270} />
        <polygon points={`${pt(-1, 0)} ${pt(4, 0)} ${pt(4, 4)} ${pt(-1, 4)}`} fill="white" stroke="#94a3b8" />
        <circle cx={home[0]} cy={home[1]} r={2.6} fill="#f59e0b" />
        <rect x={school[0] - 3} y={school[1] - 3} width={6} height={5} fill="#dc2626" />
        {k >= 2 && <Draw d={`M${home[0]} ${home[1]}L${school[0]} ${school[1]}`} strokeWidth={2} ms={900} className="stroke-[#eab308]" />}
        <Person who="fahim" x={96} y={150} arm={k >= 1 ? "hold" : "down"} mood="plain" />
        {k >= 1 && (
          <g className={POP}>
            <L_TapeCase x={122} y={112} />
          </g>
        )}
        <Person who="karim" x={k >= 2 ? 200 : 236} y={150} facing={-1} walking={k === 2} ms={900} arm={k >= 2 ? "hold" : "down"} mood="plain" />
        {k >= 3 && <Bubble x={200} y={82} side="left" lines={["এবার দেখি", "কে ঠিক."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · The finale: the bet opened by the tape. Karim's two sums sit side by
//     side; the reader drags the tape from home to the school on the map. It
//     reads 3.61: the map card's sum turns green, the road card's red.

export function TapeReveal() {
  const pass = useGate();
  const [end, setEnd] = useSeed<XY>("end", O);
  const [measured, setMeasured] = useSeed("measured", false);
  const len = dist(O, end);

  const pull = (p: XY) => {
    if (measured) return;
    const t: XY = [clamp(p[0], M.x0, M.x1), clamp(p[1], M.y0, M.y1)];
    if (dist(t, SCHOOL) < 0.45) {
      setEnd(SCHOOL);
      setMeasured(true);
      pass("ফিতা বললো 3.61. দুইটা card-ই সত্যি.");
    } else setEnd(t);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[12.5rem]">
        <Plane
          f={M}
          grid={0}
          axes={false}
          label={`the tape from home, ${len.toFixed(2)} blocks long`}
          drag={measured ? undefined : { down: pull, move: pull }}
          onKey={measured ? undefined : () => pull(SCHOOL)}
          className="my-0! max-w-none"
        >
          <L_Squares f={M} />
          <L_Roads f={M} w={2.6} />
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" hit={measured} />
          {len > 0.05 && <L_Tape f={M} to={end} />}
          {!measured && len < 0.05 && <circle cx={M.sx(0)} cy={M.sy(0)} r={11} strokeWidth={2} className={`${POP} pointer-events-none fill-none stroke-[#eab308]`} />}
        </Plane>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        ফিতা: <b className={`font-mono tabular-nums ${measured ? "text-accent-text" : ""}`}>{len.toFixed(2)}</b> block
      </div>
      <div className="mx-auto mt-2 grid max-w-xs grid-cols-2 gap-2 text-center">
        <div className={`rounded-xl border px-2 py-1.5 transition-colors duration-500 motion-reduce:transition-none ${measured ? "border-accent bg-accent/10" : "border-border"}`}>
          <div className="text-xs text-muted">map card (2, 3)</div>
          <div className="font-mono text-[0.78rem] whitespace-nowrap">√(2² + 3²) = 3.61</div>
          {measured && <div className={`${FADE} text-xs font-semibold text-accent-text`}>ফিতার সাথে মিলে</div>}
        </div>
        <div className={`rounded-xl border px-2 py-1.5 transition-colors duration-500 motion-reduce:transition-none ${measured ? "border-danger/50 bg-danger/5" : "border-border"}`}>
          <div className="text-xs text-muted">রাস্তার card (−1, 3)</div>
          <div className="font-mono text-[0.78rem] whitespace-nowrap">√(1² + 3²) = 3.16</div>
          {measured && <div className={`${FADE} text-xs font-semibold text-danger`}>মিলে না</div>}
        </div>
      </div>
      <Task done={measured}>ফিতার মাথাটা বাসা থেকে টেনে স্কুল পর্যন্ত নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for the finale's explanation, no task: the card named with
//      its grid. The arrow v alone; on the map grid (e₁, e₂) its card is
//      (2, 3); on the road grid B = {w, z} it is (−1, 3), written [v]_B.

const XAF = makeFrame(-1, 4, -1, 4, 20, 8);
const XA_SAY = [
  "বাসা থেকে স্কুলের arrow. নাম দিলাম v.",
  "Map grid এ, e₁ আর e₂ দিয়ে, ওর card (2, 3).",
  "রাস্তার grid এ, w = (1, 0) আর z = (1, 1) দিয়ে, ওর card (−1, 3).",
  "Arrow একটা, card দুইটা. Grid ছাড়া card এর কোনো মানে নাই.",
];

export function NameTheCard() {
  const s = useScene(3, [600, 1800, 2200, 2200]);
  const k = s.k;
  const roads = k >= 2;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{XA_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-3">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={XAF} grid={0} axes={false} label="the arrow v from home to school, on the map grid and then on the road grid" className="my-0! max-w-none">
            <L_Squares f={XAF} show={k === 1} />
            <L_Roads f={XAF} show={roads} w={2.6} />
            {k === 1 && (
              <g className={FADE}>
                <Arrow f={XAF} from={O} to={[1, 0]} tone="teal" w={2.2} />
                <Arrow f={XAF} from={O} to={[0, 1]} tone="teal" w={2.2} />
              </g>
            )}
            {roads && (
              <g className={FADE}>
                <Arrow f={XAF} from={O} to={[1, 0]} tone="blue" w={2.2} />
                <Arrow f={XAF} from={O} to={[1, 1]} tone="coral" w={2.2} />
              </g>
            )}
            <Arrow f={XAF} from={O} to={SCHOOL} tone="violet" w={2.8} />
            <Label f={XAF} at={[1, 1.5]} dx={-7} size={10} className="fill-cat-violet font-mono">
              v
            </Label>
            <L_Home f={XAF} name={false} />
          </Plane>
        </div>
        <div className="min-w-0 space-y-1.5 text-left">
          {k >= 1 && (
            <div className={`${FADE} ${k === 2 ? "opacity-50" : ""}`}>
              <div className="text-xs text-muted">map grid</div>
              <div className="font-mono text-base font-bold text-cat-teal">v = (2, 3)</div>
            </div>
          )}
          {k >= 2 && (
            <div className={FADE}>
              <div className="text-xs text-muted">রাস্তার grid B = &#x7B;w, z&#x7D;</div>
              <div className="font-mono text-base font-bold text-cat-violet">
                [v]<sub>B</sub> = (−1, 3)
              </div>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7¾ · A figure for the finale's bridge, no task: that evening, the landlord
//      Chacha on his roof beside the new flat, khata in hand, with no rent for
//      it. The roof and Chacha are 5.6's own (rooftop-parts.tsx); his line is
//      the one he says there.

export function LandlordRoof() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="that evening, the landlord Chacha on his roof beside the new rooftop flat, his khata in hand, wondering what rent to ask">
        <RoofSet />
        <Chacha x={k >= 1 ? 112 : 350} y={R_GROUND} facing={-1} arm={k >= 2 ? "hold" : "down"} />
        {k >= 1 && <NameTag x={112} y={R_GROUND + 12} name="বাড়িওয়ালা চাচা" />}
        {k >= 2 && <Bubble x={112} y={R_GROUND - 68} side="mid" lines={["ভাড়া কত চামু?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names).

export const fixtures: Fixtures = {
  TiffinSums: { start: { k: 0 }, one: { k: 1 }, two: { k: 2 }, ask: { k: 3 }, end: {} },
  DistanceBet: { start: {}, picked: { bet: 2 }, sealed: { bet: 0, sealed: true } },
  BothArrive: { start: { k: 0 }, map: { k: 1 }, roads: { k: 2 }, end: {} },
  SameSchool: { start: {}, guessed: { guess: 0 }, roads: { guess: 0, grid: "roads", over: true } },
  BasisPair: { start: { k: 0 }, map: { k: 1 }, roads: { k: 2 }, end: {} },
  AssemblyLines: { start: { k: 0 }, new: { k: 1 }, end: {} },
  KarimObjects: { start: { k: 0 }, bad: { k: 1 }, end: {} },
  LandlordRoof: { start: { k: 0 }, walk: { k: 1 }, end: {} },
  TapeOut: { start: { k: 0 }, what: { k: 1 }, tape: { k: 2 }, end: {} },
  LaneBlock: { start: {}, pulling: { end: [0.7, 0.3] }, one: { end: [1, 0], got: [true, false] }, done: { end: [1, 1], got: [true, true] } },
  DiagonalBlock: { start: { k: 0 }, square: { k: 1 }, root: { k: 2 }, end: {} },
  RoadCorner: { start: {}, map: { ran: [true, false] }, done: { ran: [true, true] } },
  TwoTapes: { start: { k: 0 }, square: { k: 1 }, road: { k: 2 }, end: {} },
  ShadowRoads: { start: { k: 0 }, east: { k: 1 }, end: {} },
  YourDistance: { start: {}, short: { pick: 0 }, long: { pick: 2 }, right: { pick: 1 } },
  BazaarTape: { start: { k: 0 }, ride: { k: 1 }, legs: { k: 2 }, end: {} },
  TryWhichGrid: { start: {}, picked: { picks: [0, 1] }, wrong: { picks: [1, 2], checked: true }, missed: { picks: [2], checked: true }, right: { picks: [0, 2], checked: true } },
  ReachPaint: { start: { k: 0 }, slant: { k: 1 }, end: {} },
  TapeOnMap: { start: { k: 0 }, hold: { k: 1 }, pull: { k: 2 }, end: {} },
  TapeReveal: { start: {}, pulling: { end: [1.4, 2.2] }, done: { end: [2, 3], measured: true } },
  NameTheCard: { start: { k: 0 }, map: { k: 1 }, roads: { k: 2 }, end: {} },
};
