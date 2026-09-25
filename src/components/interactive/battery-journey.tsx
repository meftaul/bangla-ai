"use client";

import { type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Draw, FADE, LOOK, Nope, POP, Scene, Stepper, Ticks, pill, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { Bubble, Person as CastPerson, Robot, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Dot, Label, Plane, Star, clamp, makeFrame, same, sg, tup, type Frame, type Tone, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";
import { ButtonRemote, Chains, Chalk, Door, Handset, Recipe, SHELF, land, type Key } from "./remote-journey";

// Screens for "Math for AI 5.1b — The weak battery, working out the presses",
// told as a Journey.
//
// The same evening as 5.1. Fahim is home with remote C, the cheap one, and
// the shopkeeper's warning about its cheap battery. Ammu chalks the fridge's
// mark. Nasib says there's no way but to press and see. Screen 1 lets the
// reader do exactly that, with a battery that drains a notch per press, and
// asks: could the presses be known before pressing any? The rest answers it
// on Fahim's khata, where pressing costs nothing: on remote A the counts are
// the mark's own numbers; on remote C, settle one count and the first slot
// forces the other; then walk the free count and the height climbs one tile a
// step, so it passes every height (that is why C reaches the whole floor);
// on remote B the height never moves (its two slots are locked together).
// Your turn sends Shiku to the sofa in one go; the Try it catches Nasib's
// dropped minus sign; the end sends Shiku round all three marks on what is
// left of the battery. 8 steps.
//
// This was 5.1's step-6 side quest ("the presses, worked out instead of
// hunted": PressesFirst, SolveWalk) and 5.1's SlotsSame, given their own
// journey. The floor machine (Door, Chalk, ButtonRemote, Chains, Recipe) and
// the story remote (Handset) are 5.1's, from remote-journey.tsx.
//
// Words are the author's Banglish (pathshala-journey §2); bubbles and scene
// captions are narrated the story-bangla-prose way. Tailwind only; ink on the
// white sheet is fixed.

const O: XY = [0, 0];
const times = (k: number, v: XY): XY => [k * v[0], k * v[1]];
const add = (a: XY, b: XY): XY => [a[0] + b[0], a[1] + b[1]];
const onSheet = ([x, y]: XY, f: Frame) => x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1;
/** a point pulled back onto the sheet, so a wild plan walks Shiku into the wall, not off the page */
const inside = ([x, y]: XY, f: Frame): XY => [clamp(x, f.x0, f.x1), clamp(y, f.y0, f.y1)];

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** a key's colour as a literal class name */
const TEXT: Record<string, string> = {
  blue: "text-cat-blue",
  coral: "text-cat-coral",
};

const A_KEYS: Key[] = SHELF[0].keys;
const B_KEYS: Key[] = SHELF[1].keys;
const C_KEYS: Key[] = SHELF[2].keys;

/** the marks of this evening: the almirah from 5.1, and Ammu's three new ones */
const ALMIRAH: XY = [3, 5];
const FRIDGE: XY = [2, 3];
const SOFA: XY = [1, 4];
const TV: XY = [0, 1];

/** the flat's floor, tall enough for remote C's long presses */
const BF = makeFrame(-1, 6, -3, 11, 15, 12);

/**
 * A planned set of presses, one hop per press: all of u, then all of v, or v
 * first when that keeps Shiku on the floor the whole way.
 */
type Hop = { from: XY; to: XY; tone: Tone };
function hopsOf(keys: Key[], amt: number[], f: Frame): Hop[] {
  const walk = (order: number[]) => {
    let p = O;
    const out: Hop[] = [];
    for (const i of order) {
      const s = Math.sign(amt[i]);
      for (let j = 0; j < Math.abs(amt[i]); j += 1) {
        const q = add(p, times(s, keys[i].v));
        out.push({ from: p, to: q, tone: keys[i].tone });
        p = q;
      }
    }
    return out;
  };
  const uFirst = walk([0, 1]);
  if (uFirst.every((h) => onSheet(h.to, f))) return uFirst;
  const vFirst = walk([1, 0]);
  return vFirst.every((h) => onSheet(h.to, f)) ? vFirst : uFirst;
}

/** the first `n` hops, drawn as small arrows */
function Hops({ f, hops, n, dashed = false }: { f: Frame; hops: Hop[]; n: number; dashed?: boolean }) {
  return (
    <>
      {hops.slice(0, n).map((h, i) => (
        <Arrow key={i} f={f} from={inside(h.from, f)} to={inside(h.to, f)} tone={dashed ? "coral" : h.tone} w={2.2} dashed={dashed} faint={dashed} />
      ))}
    </>
  );
}

/** The cheap battery: ten notches, red when it's nearly gone, and the presses left. */
function BatteryBar({ left, max }: { left: number; max: number }) {
  const on = Math.max(0, Math.ceil((left / max) * 10));
  return (
    <div className="flex items-center justify-center gap-1.5 text-sm" aria-label={`battery: ${left} press left`}>
      <span className="text-muted">battery</span>
      <span className="inline-flex items-center gap-[2px] rounded-md border-2 border-foreground/50 p-[2px]">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={`h-3 w-1.5 rounded-[1px] transition-colors duration-300 motion-reduce:transition-none ${i < on ? (on <= 3 ? "bg-danger" : "bg-accent") : "bg-foreground/10"}`}
          />
        ))}
      </span>
      <span className="font-mono tabular-nums">{Math.max(0, left)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the empty flat after
//      Maghrib. Ammu chalks the fridge's mark; the cheap remote's battery shows
//      one red notch; Nasib walks in and says to press and see. The presses
//      for the fridge are not shown: that is the widget.

const S1_FLOOR = 118;

/** the dark window that says it is evening */
function NightWindow() {
  return (
    <g className="pointer-events-none">
      <rect x={230} y={22} width={54} height={44} rx={3} fill="#1e293b" stroke="#a8a29e" strokeWidth={3} />
      <path d="M257 22V66M230 44H284" stroke="#a8a29e" strokeWidth={2} />
      <circle cx={270} cy={33} r={5} fill="#fef3c7" />
      <circle cx={272.5} cy={31.5} r={4.2} fill="#1e293b" />
    </g>
  );
}

/** a small battery icon beside a remote: `n` of three notches, red when one */
function MiniBattery({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g className={POP}>
      <rect x={x} y={y} width={18} height={9} rx={2} fill="white" stroke="#0f172a" strokeWidth={1} />
      <rect x={x + 18} y={y + 2.5} width={2} height={4} fill="#0f172a" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x + 2 + i * 5.3} y={y + 2} width={4.3} height={5} rx={0.6} fill={i < n ? (n === 1 ? "#e11d48" : "#16a34a") : "#e2e8f0"} />
      ))}
    </g>
  );
}

/** a chalk mark on the scene's floor, with its word */
function FloorMark({ x, word }: { x: number; word: string }) {
  return (
    <g className={POP}>
      <rect x={x - 11} y={161} width={22} height={13} rx={2} fill="none" stroke="white" strokeWidth={1.6} strokeDasharray="3 2" />
      <text x={x} y={158} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white" stroke="#4a3418" strokeWidth={2} paintOrder="stroke">
        {word}
      </text>
    </g>
  );
}

/** the floor tiles of the empty flat */
function Tiles() {
  return (
    <g className="pointer-events-none">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M${86 + i * 40} ${S1_FLOOR}V180`} stroke="white" strokeOpacity={0.55} strokeWidth={1} fill="none" />
      ))}
      <path d={`M40 ${S1_FLOOR + 26}H320`} stroke="white" strokeOpacity={0.55} strokeWidth={1} fill="none" />
    </g>
  );
}

export function NightMarks({}: Story) {
  const s = useScene(3, [600, 2200, 1800, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S1_FLOOR} label="evening in the empty flat: Ammu chalks the fridge's mark, remote C's battery is down to one red notch, and Nasib says to keep pressing until it works">
        <NightWindow />
        <Tiles />
        {k >= 1 && <FloorMark x={206} word="ফ্রিজ" />}
        <CastPerson who="ammu" x={k >= 1 ? 206 : 150} y={S1_FLOOR + 16} walking={k === 1} arm={k === 1 ? "point" : "down"} />
        {k === 1 && <Bubble x={206} y={S1_FLOOR - 50} side="mid" lines={["ফ্রিজ এখানে বসবে।"]} />}
        <CastPerson who="fahim" x={70} y={S1_FLOOR + 16} arm="hold" mood={k >= 2 ? "puzzled" : "plain"} />
        <Handset x={80} y={S1_FLOOR - 30} />
        {k >= 2 && <MiniBattery x={98} y={S1_FLOOR - 42} n={1} />}
        <Robot x={32} y={S1_FLOOR + 16} />
        <CastPerson who="nasib" x={k >= 3 ? 280 : 372} y={S1_FLOOR + 16} facing={-1} walking={k === 3} />
        {k >= 3 && <Bubble x={280} y={S1_FLOOR - 50} side="left" lines={["টিপে টিপে খুঁজো।", "আর উপায় নাই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The old way, and what it costs. Remote C in hand, the fridge at (2, 3),
//     and a battery that loses a notch per press. The reader hunts, as Nasib
//     says; every press shows on the battery. If it runs out, Ammu's clock
//     battery tops it up. Found at last, the pass note says what it cost.

const HUNT_BATT = 20;
const HUNT_REFILL = 10;

export function BatteryHunt() {
  const pass = useGate();
  const [amt, setAmt] = useSeed<number[]>("amt", [0, 0]);
  const [used, setUsed] = useSeed("used", 0);
  const [refills, setRefills] = useSeed("refills", 0);
  const [found, setFound] = useSeed("found", false);
  const at = land(C_KEYS, amt);
  const max = HUNT_BATT + refills * HUNT_REFILL;
  const left = max - used;
  const dead = left <= 0 && !found;

  const press = (i: number, n: number) => {
    if (dead || found) return;
    const next = amt.map((a, j) => (j === i ? n : a));
    setAmt(next);
    setUsed(used + 1);
    if (same(land(C_KEYS, next), FRIDGE)) {
      setFound(true);
      pass(`ফ্রিজ পাওয়া গেলো, ${used + 1} টা press খরচ করে।`);
    }
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[8rem] shrink-0">
          <Plane f={BF} grid={1} ticks={5} label={`remote C at ${tup(at)}, heading for the fridge at ${tup(FRIDGE)}`} className="my-0! max-w-none">
            <Chalk f={BF} at={FRIDGE} name="ফ্রিজ" on={found} />
            <Star f={BF} at={FRIDGE} done={found} />
            <Chains f={BF} keys={C_KEYS} amt={amt} />
            <Door f={BF} />
            <Shiku f={BF} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <BatteryBar left={left} max={HUNT_BATT} />
          <div className="mt-1 text-center text-xs text-muted">
            খরচ: <span className="font-mono">{used}</span> press
          </div>
          <div className="mt-2">
            <Recipe keys={C_KEYS} amt={amt} hit={found} size="text-[0.95rem]" />
          </div>
          <div className="mt-2">
            <ButtonRemote keys={C_KEYS} amt={amt} onAmt={press} f={BF} min={-3} max={6} disabled={dead || found} />
          </div>
        </div>
      </div>
      {dead && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-danger`}>
          Battery শেষ। আম্মু দেয়াল ঘড়ির battery টা খুলে দিলেন।
          <div className="mt-2">
            <button type="button" onClick={() => setRefills(refills + 1)} className={primaryBtn}>
              ঘড়ির battery লাগান
            </button>
          </div>
        </div>
      )}
      {found && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-accent-text`}>
          ফ্রিজ পাওয়া গেলো। খরচ <span className="font-mono">{used}</span> টা press। কাল আরো দুইটা mark আছে।
        </div>
      )}
      <Task done={found}>Remote C দিয়ে Shiku কে ফ্রিজের mark এ, (2, 3) এ, নামান। প্রতিটা press এ battery কমে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the fridge is done, the
//      battery is low, and two more marks turn up, each with a "?". It poses
//      the journey's question and stops there.

const X1_F = makeFrame(-1, 4, -1, 5, 20, 12);
const X1_SAY = [
  "ফ্রিজ হলো। কিন্তু battery র অনেকটা গেলো।",
  "আম্মু আরেকটা mark দিলেন: সোফা, (1, 4)।",
  "তারপর আরেকটা: টিভি, (0, 1)।",
];

export function TwoMoreMarks() {
  const s = useScene(3, [600, 1800, 1800]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={k < 3 ? <span key={k} className={FADE}>{X1_SAY[k]}</span> : <span className={FADE}>একটা button-ও না চেপে কি বলা যায়, কোন button কয়বার?</span>}
    >
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={X1_F} grid={1} axes={false} label="the fridge's mark done, and two new marks, the sofa and the TV, each with a question mark" className="my-0! max-w-none">
            <Chalk f={X1_F} at={FRIDGE} name="ফ্রিজ" on />
            {k >= 1 && <Chalk f={X1_F} at={SOFA} name="সোফা" />}
            {k >= 1 && (
              <Label f={X1_F} at={SOFA} dy={4} size={11} weight={800} className={`${POP} fill-cat-violet`}>
                ?
              </Label>
            )}
            {k >= 2 && <Chalk f={X1_F} at={TV} name="টিভি" />}
            {k >= 2 && (
              <Label f={X1_F} at={TV} dy={4} size={11} weight={800} className={`${POP} fill-cat-violet`}>
                ?
              </Label>
            )}
            <Door f={X1_F} />
            <Shiku f={X1_F} at={FRIDGE} />
          </Plane>
        </div>
        <div className="shrink-0">
          <BatteryBar left={k >= 3 ? 3 : 5} max={HUNT_BATT} />
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: to save the battery,
//      Fahim sets the remote down and draws the floor in his khata. The page
//      is shown big: the grid draws itself, then a pencil Shiku hops across
//      it three times, and the remote's one red notch stays where it was.

const S2_PAGE = { x: 138, y: 12, w: 152, h: 98 };
/** the page's grid: origin at its bottom-left corner, 13 units a tile */
const S2_O = { x: 150, y: 100, u: 13 };
const S2_AT = (c: number, r: number) => [S2_O.x + c * S2_O.u, S2_O.y - r * S2_O.u] as const;
/** three presses of u = (1, 2) on paper */
const S2_HOPS = [0, 1, 2].map((i) => [S2_AT(i, 2 * i), S2_AT(i + 1, 2 * i + 2)] as const);

export function KhataFloor({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  const [ex, ey] = S2_AT(3, 6);

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S1_FLOOR} label="Fahim sets remote C down and draws the floor in his khata; on the page a pencil Shiku hops three times while the remote's battery stays on one notch">
        <Tiles />
        <CastPerson who="fahim" x={70} y={S1_FLOOR + 16} arm="hold" />
        <Robot x={32} y={S1_FLOOR + 16} />
        {k === 0 ? (
          <g key="hand">
            <Handset x={80} y={S1_FLOOR - 30} />
            <MiniBattery x={98} y={S1_FLOOR - 42} n={1} />
          </g>
        ) : (
          <g key="floor">
            <Handset x={104} y={S1_FLOOR + 8} />
            <MiniBattery x={122} y={S1_FLOOR + 6} n={1} />
            <Khata x={78} y={S1_FLOOR - 32} />
          </g>
        )}
        {k >= 1 && (
          <g className={FADE}>
            <path d={`M102 ${S1_FLOOR - 32}L${S2_PAGE.x} ${S2_PAGE.y + S2_PAGE.h}M102 ${S1_FLOOR - 15}L${S2_PAGE.x} ${S2_PAGE.y + S2_PAGE.h}`} stroke="white" strokeOpacity={0.5} strokeWidth={0.8} strokeDasharray="2 2" />
            <rect x={S2_PAGE.x} y={S2_PAGE.y} width={S2_PAGE.w} height={S2_PAGE.h} rx={3} fill="white" stroke="#0f172a" strokeWidth={1.2} />
          </g>
        )}
        {k >= 2 && (
          <g>
            {Array.from({ length: 11 }, (_, c) => (
              <Draw key={`c${c}`} d={`M${S2_O.x + c * S2_O.u} ${S2_O.y}V${S2_PAGE.y + 6}`} delay={c * 40} ms={500} strokeWidth={0.7} className="stroke-[#cbd5e1]" />
            ))}
            {Array.from({ length: 7 }, (_, r) => (
              <Draw key={`r${r}`} d={`M${S2_O.x} ${S2_O.y - r * S2_O.u}H${S2_PAGE.x + S2_PAGE.w - 6}`} delay={r * 40} ms={500} strokeWidth={0.7} className="stroke-[#cbd5e1]" />
            ))}
            <circle cx={S2_O.x} cy={S2_O.y} r={3} fill="#0f1b2d" className={POP} />
          </g>
        )}
        {k >= 3 && (
          <g>
            {S2_HOPS.map(([[x1, y1], [x2, y2]], i) => (
              <Draw key={i} d={`M${x1} ${y1}L${x2} ${y2}`} delay={i * 500} ms={450} strokeWidth={1.8} className="stroke-[#475569]" />
            ))}
            <g className={POP} style={{ transitionDelay: "1400ms" }}>
              <rect x={ex - 5} y={ey - 5} width={10} height={10} rx={2.5} fill="#7c3aed" />
              <circle cx={ex - 2} cy={ey - 1} r={1.1} fill="white" />
              <circle cx={ex + 2} cy={ey - 1} r={1.1} fill="white" />
            </g>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · Remote A on the khata: the counts in plain sight. The reader sets both
//     counts first, then sends Shiku once; he walks it press by press. A wrong
//     plan walks him to the wrong tile and bounces.

const PS_F = makeFrame(-1, 5, -1, 6, 20, 12);

export function PlainSight() {
  const pass = useGate();
  const [plan, setPlan] = useSeed<number[]>("plan", [0, 0]);
  const [sent, setSent] = useSeed<number[] | null>("sent", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(260);
  const hops = sent ? hopsOf(A_KEYS, sent, PS_F) : [];
  const n = pl.running ? pl.k : hops.length;
  const at = n ? inside(hops[n - 1].to, PS_F) : O;
  const landed = sent ? land(A_KEYS, sent) : null;
  const won = !!landed && same(landed, ALMIRAH) && !pl.running;

  const send = () => {
    const h = hopsOf(A_KEYS, plan, PS_F);
    setSent(plan);
    const ok = same(land(A_KEYS, plan), ALMIRAH);
    if (!ok) setMiss(miss + 1);
    pl.play(h.length, () => {
      if (ok) pass("A তে mark এর সংখ্যাই press এর count.");
    });
  };

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8rem] shrink-0">
          <Plane f={PS_F} grid={1} ticks={1} label={`remote A on Fahim's khata, Shiku at ${tup(at)}`} className="my-0! max-w-none">
            <Chalk f={PS_F} at={ALMIRAH} name="আলমারি" on={won} />
            <Hops f={PS_F} hops={hops} n={n} />
            <Door f={PS_F} />
            <Shiku f={PS_F} at={at} />
          </Plane>
        </div>
        <div className="min-w-0">
          {A_KEYS.map((key, i) => (
            <div key={key.name} className="py-1">
              <div className="text-sm">
                <b className={TEXT[key.tone]}>{key.name}</b> <span className="font-mono text-[0.9rem]">{tup(key.v)}</span> কয়বার
              </div>
              <Stepper value={plan[i]} onChange={(v) => setPlan(plan.map((p, j) => (j === i ? v : p)))} min={-2} max={6} disabled={pl.running || won} label={`${key.name} কয়বার`} />
            </div>
          ))}
          {!won && (
            <div className="mt-2">
              <button type="button" onClick={send} disabled={pl.running} className={primaryBtn}>
                Shiku কে পাঠান
              </button>
            </div>
          )}
        </div>
      </div>
      {won && <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>একবারেই আলমারি। খরচ {Math.abs(plan[0]) + Math.abs(plan[1])} টা press, একটাও বাড়তি না।</div>}
      {sent && landed && !won && !pl.running && (
        <Nope key={miss}>
          Shiku নামলো {tup(landed)} এ। আলমারি (3, 5) এ। কোন count টা বদলাবেন?
        </Nope>
      )}
      <Task done={won}>আগে দুইটা count ঠিক করুন, তারপর Shiku কে একবারেই আলমারিতে পাঠান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: why A is easy and C is
//      not. A's buttons each own one direction; C's u and v both go right and
//      up at once, drawn with their right and up legs.

const X2_F = makeFrame(-0.5, 2.5, -0.5, 5.5, 15, 8);
const X2_SAY = [
  "Remote A: u শুধু ডানে যায়, v শুধু উপরে।",
  "Remote C র u = (1, 2): ডানেও 1, উপরেও 2।",
  "v = (2, 5): ডানেও 2, উপরেও 5।",
];

/** one key's arrow, with its right leg and up leg dashed under it */
function Legs({ f, v, tone }: { f: Frame; v: XY; tone: Tone }) {
  return (
    <>
      <Arrow f={f} from={O} to={[v[0], 0]} tone={tone} w={1.4} dashed faint />
      <Arrow f={f} from={[v[0], 0]} to={v} tone={tone} w={1.4} dashed faint />
      <Arrow f={f} from={O} to={v} tone={tone} w={2.4} draw />
    </>
  );
}

export function BothWays() {
  const s = useScene(3, [600, 1800, 1800]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={k < 3 ? <span key={k} className={FADE}>{X2_SAY[k]}</span> : <span className={FADE}>C র কোনো button শুধু ডানে যায় না। তাই count দুইটা চোখে পড়ে না।</span>}
    >
      <div className="flex justify-center gap-4">
        <div className="w-[4.6rem]">
          <Plane f={X2_F} grid={1} axes={false} label="remote A: one button goes only right, the other only up" className="my-0! max-w-none">
            <Arrow f={X2_F} from={O} to={A_KEYS[0].v} tone="blue" w={2.4} />
            <Arrow f={X2_F} from={O} to={A_KEYS[1].v} tone="coral" w={2.4} />
            <circle cx={X2_F.sx(0)} cy={X2_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
          </Plane>
          <div className="mt-0.5 text-center text-xs font-semibold">Remote A</div>
        </div>
        <div className={`w-[4.6rem] transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-40"}`}>
          <Plane f={X2_F} grid={1} axes={false} label="remote C: both buttons go right and up at once" className="my-0! max-w-none">
            {k >= 1 && <Legs f={X2_F} v={C_KEYS[0].v} tone="blue" />}
            {k >= 2 && <Legs f={X2_F} v={C_KEYS[1].v} tone="coral" />}
            <circle cx={X2_F.sx(0)} cy={X2_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
          </Plane>
          <div className="mt-0.5 text-center text-xs font-semibold">Remote C</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · Settle one count. On the khata, the reader fixes v at 0, 1 and 2 presses
//     in turn and hunts u each time until Shiku stands in the almirah's column
//     (3 tiles right). Each v has exactly one u that works; the landings pile
//     up on the column, one tile higher each time.

const SO_F = makeFrame(-2, 6, -2, 11, 13, 10);
const SO_BETAS = [0, 1, 2];

export function SettleOne() {
  const pass = useGate();
  const [b, setB] = useSeed("b", 0);
  const [a, setA] = useSeed("a", 0);
  const [found, setFound] = useSeed<number[][]>("found", []);
  const at = land(C_KEYS, [a, b]);
  const inCol = at[0] === ALMIRAH[0];
  const done = found.length === SO_BETAS.length;
  const [lo, hi] = [-4, 6].map((lim, j) => {
    let n = a;
    const step = j ? 1 : -1;
    while ((j ? n + 1 <= lim : n - 1 >= lim) && onSheet(land(C_KEYS, [n + step, b]), SO_F)) n += step;
    return n;
  });

  const setU = (n: number) => {
    setA(n);
    const p = land(C_KEYS, [n, b]);
    if (p[0] !== ALMIRAH[0] || found.some(([fb]) => fb === b)) return;
    const next = [...found, [b, n]];
    setFound(next);
    if (next.length === SO_BETAS.length) pass("v ঠিক করলে u র আর কোনো choice নাই।");
  };
  const pick = (nb: number) => {
    setB(nb);
    setA(0);
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={SO_F} grid={1} ticks={5} label={`Fahim's khata: v pressed ${b} times, u pressed ${a} times, Shiku at ${tup(at)}`} className="my-0! max-w-none">
            <line x1={SO_F.sx(3)} y1={SO_F.sy(-2)} x2={SO_F.sx(3)} y2={SO_F.sy(11)} strokeWidth={6} className="stroke-cat-amber/25" />
            <Chalk f={SO_F} at={ALMIRAH} name="আলমারি" />
            {found.map(([fb, fa]) => (
              <Dot key={fb} f={SO_F} at={land(C_KEYS, [fa, fb])} r={3.2} className="fill-accent" pop />
            ))}
            <Chains f={SO_F} keys={C_KEYS} amt={[a, b]} />
            <Door f={SO_F} />
            <Shiku f={SO_F} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted">
            <b className="text-cat-coral">v</b> কয়বার:
          </div>
          <div className="mt-1 flex gap-1.5">
            {SO_BETAS.map((x) => (
              <button key={x} type="button" onClick={() => pick(x)} className={pill(b === x)}>
                {x} বার
              </button>
            ))}
          </div>
          <div className="mt-2 text-sm text-muted">
            <b className="text-cat-blue">u</b> কয়বার:
          </div>
          <div className="mt-1">
            <Stepper value={a} onChange={setU} min={lo} max={hi} label="u কয়বার" />
          </div>
          <div className={`mt-2 font-mono text-[0.95rem] ${inCol ? "text-accent-text" : ""}`}>
            ডানে: {a}·1 + {b}·2 = <b>{sg(at[0])}</b>
          </div>
          <div className="text-xs text-muted">আলমারির column: ডানে 3</div>
        </div>
      </div>
      <Ticks
        items={SO_BETAS.map((x) => {
          const f = found.find(([fb]) => fb === x);
          return [f ? `v ${x} বার: u ${sg(f[1])} বার` : `v ${x} বার`, !!f] as [string, boolean];
        })}
      />
      <Task done={done}>v কে 0, 1, 2 বার রেখে দেখুন: প্রতিবার u কয়বার চাপলে Shiku আলমারির column এ (ডানে ঠিক 3) দাঁড়ায়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: slot 1 as a share. The
//      almirah wants 3 tiles right; v pays its share first, and u has to make
//      up exactly the rest, even when that means going back.

/** One slot drawn as a track from −1 to 5: v's share in coral, then u's share in blue up to the target. */
function SlotBar({ target, vShare, uLabel, vLabel, show }: { target: number; vShare: number; uLabel: string; vLabel: string; show: 0 | 1 | 2 }) {
  const X = (n: number) => 22 + (n + 1) * 36;
  const back = target < vShare;
  return (
    <svg viewBox="0 0 290 74" className="mx-auto h-auto w-full max-w-[17rem]" role="img" aria-label={`slot 1 must be ${target}: v gives ${vShare}, u makes up the rest`}>
      <path d={`M${X(-1)} 50H${X(5)}`} stroke="#94a3b8" strokeWidth={1.5} />
      {[-1, 0, 1, 2, 3, 4, 5].map((n) => (
        <g key={n}>
          <path d={`M${X(n)} 46V54`} stroke="#94a3b8" strokeWidth={1.2} />
          <text x={X(n)} y={67} textAnchor="middle" fontSize={9} fontFamily="ui-monospace, monospace" fill="#5a6b7d">
            {sg(n)}
          </text>
        </g>
      ))}
      <path d={`M${X(target)} 20V58`} stroke="#d97706" strokeWidth={2} strokeDasharray="3 2" />
      <text x={X(target)} y={14} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#b45309">
        চাই {target}
      </text>
      {show >= 1 && vShare !== 0 && (
        <g key={`v${vShare}`} className={POP}>
          <rect x={Math.min(X(0), X(vShare))} y={26} width={Math.abs(X(vShare) - X(0))} height={10} rx={3} fill="#e0664f" opacity={0.85} />
          <text x={(X(0) + X(vShare)) / 2} y={23} textAnchor="middle" fontSize={9} fontWeight={700} fill="#c2410c">
            {vLabel}
          </text>
        </g>
      )}
      {show >= 2 && target !== vShare && (
        <g key={`u${target}${vShare}`} className={POP}>
          <rect x={Math.min(X(vShare), X(target))} y={38} width={Math.abs(X(target) - X(vShare))} height={8} rx={3} fill="#2563eb" opacity={0.85} />
          {back && <path d={`M${X(target) + 6} 38l-6 4l6 4`} fill="none" stroke="#1d4ed8" strokeWidth={1.6} />}
          <text x={Math.max(X(vShare), X(target)) + 5} y={45} textAnchor="start" fontSize={9} fontWeight={700} fill="#1d4ed8">
            {uLabel}
          </text>
        </g>
      )}
    </svg>
  );
}

const X3_SAY = [
  "আলমারির first slot 3। মানে ডানে ঠিক 3 ঘর।",
  "v 0 বার: v কিছুই দেয় না। পুরা 3 ঘর u এর: u 3 বার।",
  "v 1 বার: v দেয় 2 ঘর। বাকি 1 ঘর u এর: u 1 বার।",
];

export function SlotShare() {
  const s = useScene(3, [600, 2200, 2200]);
  const k = s.k;
  const v = k >= 3 ? 4 : k === 2 ? 2 : 0;
  const u = 3 - v;

  return (
    <Scene
      scene={s}
      caption={k < 3 ? <span key={k} className={FADE}>{X3_SAY[k]}</span> : <span className={FADE}>v 2 বার: v দেয় 4 ঘর, 1 ঘর বেশি। তাই u কে 1 ঘর ফেরত আনতে হবে: u −1 বার।</span>}
    >
      <SlotBar target={3} vShare={v} vLabel={`v: ${v}`} uLabel={`u: ${sg(u)}`} show={k === 0 ? 0 : 2} />
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · Walk the free count. v's count is now called β and u's is α; the reader
//     steps β, α follows from slot 1 on its own, and a dot slides up the
//     almirah's column one tile per step until it lands on the almirah at
//     β = −1 (Fahim's own 5·u − 1·v from the shop). Screen 5 runs the same
//     walk on remote B, whose dot never moves.

const CW_BETA = [-2, -1, 0, 1, 2, 3, 4];
/** tall and narrow: every landing sits on one column, so the height is what matters */
const CW_F = makeFrame(-1, 5, -2, 12, 11, 10);

/** α is whatever puts slot 1 at the almirah's 3, once β is settled */
const alphaOf = (keys: Key[], b: number) => (ALMIRAH[0] - b * keys[1].v[0]) / keys[0].v[0];
/** and slot 2 is then whatever it turns out to be; nobody gets to pick it */
const slot2Of = (keys: Key[], b: number) => alphaOf(keys, b) * keys[0].v[1] + b * keys[1].v[1];

function SqBox({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "ok" | "bad" }) {
  const look = { plain: "border-border", ok: "border-accent bg-accent/10 text-accent-text", bad: "border-danger/60 bg-danger/5 text-danger" }[tone];
  return <span className={`inline-grid min-w-[2.8rem] place-items-center rounded-lg border-2 px-1 py-0.5 font-mono text-[0.95rem] ${look}`}>{children}</span>;
}

function ColumnWalk({ which }: { which: "B" | "C" }) {
  const keys = which === "C" ? C_KEYS : B_KEYS;
  const pass = useGate();
  const [b, setB] = useSeed("b", 0);
  const [seen, setSeen] = useSeed<number[]>("seen", [0]);
  const [done, setDone] = useSeed("done", false);
  const a = alphaOf(keys, b);
  const got = slot2Of(keys, b);
  const hit = got === ALMIRAH[1];
  const [dy] = useTween([got], 420);

  const walk = (nb: number) => {
    setB(nb);
    const next = seen.includes(nb) ? seen : [...seen, nb];
    setSeen(next);
    if (done) return;
    if (which === "C" && slot2Of(keys, nb) === ALMIRAH[1]) {
      setDone(true);
      pass("β এক ধাপ, height-ও এক ধাপ।");
    }
    if (which === "B" && next.length >= 5) {
      setDone(true);
      pass("B তে dot টা নড়েই না।");
    }
  };

  const say =
    which === "B"
      ? done
        ? "β যা-ই হোক, slot 2 আসে 3। Dot টা (3, 3) থেকে নড়েই না।"
        : "β বদলান। α নিজেই ঠিক হয়ে যাচ্ছে। Dot টা কি উপরে ওঠে?"
      : hit
        ? "এই তো। u পাঁচবার, v একবার উল্টা। দোকানে ফাহিম টিপে টিপে এটাই পেয়েছিল।"
        : "β এক ধাপ বদলালে dot টা column বেয়ে কতটুকু যায়, দেখুন।";

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[5.2rem] shrink-0">
          <Plane f={CW_F} grid={1} ticks={5} label={`remote ${which} on the khata: every landing sits on the column 3 tiles right, and walking β slides it`} className="my-0! max-w-none">
            <line x1={CW_F.sx(3)} y1={CW_F.sy(-2)} x2={CW_F.sx(3)} y2={CW_F.sy(12)} strokeWidth={1.5} strokeDasharray="3 3" className="stroke-cat-blue/40" />
            {seen.map((x) => (
              <Dot key={x} f={CW_F} at={[3, slot2Of(keys, x)]} r={2.2} className="fill-cat-blue/35" />
            ))}
            <Chalk f={CW_F} at={ALMIRAH} name="আলমারি" on={hit} />
            <Arrow f={CW_F} from={O} to={keys[0].v} tone={keys[0].tone} w={2.2} />
            <Arrow f={CW_F} from={O} to={keys[1].v} tone={keys[1].tone} w={2.2} />
            <Door f={CW_F} />
            <Dot f={CW_F} at={[3, dy]} r={4.4} className={hit ? "fill-accent" : "fill-cat-blue"} />
          </Plane>
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[0.85rem]">
            <span className={TEXT[keys[0].tone]}>u {tup(keys[0].v)}</span> <span className={TEXT[keys[1].tone]}>v {tup(keys[1].v)}</span>
          </div>
          <div className="mt-1.5 grid grid-cols-[auto_auto_auto] items-center gap-x-1.5 gap-y-1 text-xs">
            <span className="text-muted">চাই</span>
            <SqBox>{ALMIRAH[0]}</SqBox>
            <SqBox>{ALMIRAH[1]}</SqBox>
            <span className="text-muted">পেলাম</span>
            <span key={`a${a}`} className={POP}>
              <SqBox tone="ok">{sg(ALMIRAH[0])}</SqBox>
            </span>
            <span key={`b${got}`} className={POP}>
              <SqBox tone={hit ? "ok" : "bad"}>{sg(got)}</SqBox>
            </span>
            <span />
            <span className="text-center text-muted">slot 1</span>
            <span className="text-center text-muted">slot 2</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs leading-tight text-muted">
              v চাপা
              <br />
              <span className="font-mono text-cat-coral">β</span> বার
            </span>
            <Stepper value={b} onChange={walk} min={CW_BETA[0]} max={CW_BETA[CW_BETA.length - 1]} label="β" />
          </div>
        </div>
      </div>

      <div className="mt-2 text-center font-mono text-[0.85rem]">
        slot 1 বলে দেয় <span className="text-cat-blue">α</span> = {ALMIRAH[0]} − {keys[1].v[0]}β = <b>{sg(a)}</b>
      </div>
      <div>
        <Recipe keys={keys} amt={[a, b]} hit={hit} size="text-[0.9rem]" />
      </div>

      <div className="mt-2 rounded-xl bg-foreground/[0.04] px-3 py-1.5">
        <div className="text-center text-xs text-muted">β হাঁটলে height কত</div>
        <div className="mt-1 grid grid-cols-7 gap-1 text-center font-mono text-sm">
          {CW_BETA.map((x) => (
            <div key={`h${x}`} className="text-xs text-muted">
              {sg(x)}
            </div>
          ))}
          {CW_BETA.map((x) => {
            const val = slot2Of(keys, x);
            const known = seen.includes(x);
            const look = x === b ? "bg-cat-blue text-white" : known && val === ALMIRAH[1] ? "text-accent-text" : "text-muted";
            return (
              <div key={`v${x}`} className={`rounded-md py-0.5 transition-colors duration-200 motion-reduce:transition-none ${look}`}>
                {known ? sg(val) : "·"}
              </div>
            );
          })}
        </div>
      </div>
      <div key={`say${hit}${done}`} className={`${FADE} mt-1.5 text-center text-[0.9rem] ${hit ? "text-accent-text" : "text-muted"}`}>
        {say}
      </div>
      <Task done={done}>
        {which === "C" ? "β কে এক এক ধাপ বদলান। α নিজেই ঠিক হয়ে যাবে। Dot টা আলমারিতে নামান।" : "β কে অন্তত 5 রকম করে দেখুন। Dot টা কি আলমারির দিকে ওঠে?"}
      </Task>
    </>
  );
}

export function SolveWalk() {
  return <ColumnWalk which="C" />;
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: remote A and remote C on
//      the same column. A's height goes 0, 1, 2… as β goes 0, 1, 2…; C's goes
//      one tile a step too, from lower down. Both pass 5, and every other
//      height: that is what reaching the whole floor means.

const X4_F = makeFrame(2, 4, -1, 9, 11, 8);
const X4_A = [0, 1, 2, 3, 4, 5];
const X4_C = [-3, -2, -1, 0, 1, 2];
const X4_SAY = [
  "দুইটা remote, একই column: ডানে 3।",
  "Remote A: β = 0, 1, 2… তে height 0, 1, 2….",
  "Remote C: β = −3, −2, −1… তে height 3, 4, 5….",
];

export function HeightClimb() {
  const s = useScene(3, [600, 2000, 2200]);
  const k = s.k;
  const cols: { name: string; keys: Key[]; betas: number[]; from: number }[] = [
    { name: "A", keys: A_KEYS, betas: X4_A, from: 1 },
    { name: "C", keys: C_KEYS, betas: X4_C, from: 2 },
  ];

  return (
    <Scene
      scene={s}
      caption={k < 3 ? <span key={k} className={FADE}>{X4_SAY[k]}</span> : <span className={FADE}>দুইটাতেই height এক এক ঘর করে বাড়ে। তাই 5 বাদ পড়ে না, কোনো সংখ্যাই পড়ে না।</span>}
    >
      <div className="flex justify-center gap-6">
        {cols.map((c) => {
          const hAt = (b: number) => (c.name === "A" ? b : slot2Of(c.keys, b));
          return (
            <div key={c.name} className="w-[2.9rem]">
              <Plane f={X4_F} grid={1} axes={false} label={`remote ${c.name}: heights on the column 3 tiles right climb one tile per step of β`} className="my-0! max-w-none">
                <line x1={X4_F.sx(3)} y1={X4_F.sy(-1)} x2={X4_F.sx(3)} y2={X4_F.sy(9)} strokeWidth={1.2} strokeDasharray="3 3" className="stroke-cat-blue/40" />
                {k >= 3 && <circle cx={X4_F.sx(3)} cy={X4_F.sy(5)} r={7} fill="none" strokeWidth={2} className={`${POP} stroke-accent`} />}
                {k >= c.from &&
                  c.betas.map((b, i) => (
                    <g key={b} className={POP} style={{ transitionDelay: `${i * 90}ms` }}>
                      <Dot f={X4_F} at={[3, hAt(b)]} r={2.8} className={hAt(b) === 5 && k >= 3 ? "fill-accent" : "fill-cat-blue"} />
                      <Label f={X4_F} at={[3, hAt(b)]} dx={-9} dy={3} anchor="end" size={7.5} className="fill-[#5a6b7d] font-mono">
                        {sg(b)}
                      </Label>
                    </g>
                  ))}
              </Plane>
              <div className="mt-0.5 -mx-4 text-center text-xs font-semibold whitespace-nowrap">Remote {c.name}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 text-center text-[0.7rem] text-muted">dot এর পাশের সংখ্যা: β</div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: Nasib still backs remote
//      B, and says the khata trick will take it to the almirah too.

/** Fahim's khata, open, held at (x, y) */
function Khata({ x, y }: { x: number; y: number }) {
  return (
    <g className={POP}>
      <rect x={x} y={y} width={24} height={17} rx={1.5} fill="white" stroke="#0f172a" strokeWidth={0.9} />
      <path d={`M${x + 12} ${y}V${y + 17}`} stroke="#94a3b8" strokeWidth={0.8} />
      {[4, 8, 12].map((d) => (
        <path key={d} d={`M${x + 2.5} ${y + d}h7M${x + 14.5} ${y + d}h7`} stroke="#94a3b8" strokeWidth={0.7} />
      ))}
    </g>
  );
}

export function NasibInsists({}: Story) {
  const s = useScene(2, [600, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S1_FLOOR} label="Nasib takes the khata and says the same trick will take remote B to the almirah too">
        <NightWindow />
        <Tiles />
        <CastPerson who="fahim" x={90} y={S1_FLOOR + 16} />
        <Robot x={40} y={S1_FLOOR + 16} />
        <CastPerson who="nasib" x={k >= 1 ? 170 : 250} y={S1_FLOOR + 16} facing={-1} walking={k === 1} arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && <Khata x={142} y={S1_FLOOR - 32} />}
        {k >= 2 && <Bubble x={170} y={S1_FLOOR - 50} side="mid" lines={["এই কায়দায় B-ও", "আলমারিতে যাবে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · The same walk on remote B. α follows from slot 1 as before, but slot 2
//     is α + 2β = 3 for every β, so the dot never leaves (3, 3). The reader
//     tries five β and the almirah never comes.

export function StuckWalk() {
  return <ColumnWalk which="B" />;
}

// ---------------------------------------------------------------------------
// 5½ · Two figures for screen 5's explanation, no task. SlotsBuild (was 5.1's
//      SlotsSame screen): α·(1, 1) + β·(2, 2) built one row at a time, and the
//      same thing comes out in both slots whatever α and β are. TwinSlots: the
//      almirah's (3, 5) against B's locked pair; make slot 1 3 and slot 2
//      turns 3 with it.

const SB_ROWS: { lhs: string; rhs: string; note: string }[] = [
  { lhs: "u, α বার", rhs: "(α, α)", note: "u = (1, 1), তাই দুই slot এই α।" },
  { lhs: "v, β বার", rhs: "(2β, 2β)", note: "v = (2, 2), তাই দুই slot এই 2β।" },
  { lhs: "দুইটা যোগ", rhs: "(α + 2β, α + 2β)", note: "Slot এর সাথে slot। দুই slot হুবহু এক।" },
];

export function SlotsBuild() {
  const s = useScene(3, [600, 1800, 2200]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{k === 0 ? "Remote B: u যেকোনো α বার, v যেকোনো β বার।" : SB_ROWS[k - 1].note}</span>}>
      <div className="mx-auto grid max-w-[16rem] gap-1.5">
        {SB_ROWS.map((r, i) => (
          <div
            key={r.lhs}
            className={`flex items-baseline justify-between gap-2 rounded-xl px-3 py-1 transition-opacity duration-500 motion-reduce:transition-none ${
              i === 2 ? "border-t border-border" : ""
            } ${k >= i + 1 ? "bg-foreground/[0.04] opacity-100" : "opacity-25"}`}
          >
            <span className="text-sm">{r.lhs}</span>
            <b className={`font-mono text-[0.95rem] ${i === 2 && k >= 3 ? "text-danger" : ""}`}>{r.rhs}</b>
          </div>
        ))}
      </div>
    </Scene>
  );
}

const X5_SAY = [
  "আলমারি চায় first slot এ 3, second slot এ 5.",
  "Remote B দুই slot এ সবসময় একই যোগফল দেয়।",
  "First slot 3 বানান, second slot-ও সাথে সাথে 3.",
];

function X5Slot({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "ok" | "bad" }) {
  const look = { plain: "border-border", ok: "border-accent bg-accent/10 text-accent-text", bad: "border-danger/60 bg-danger/5 text-danger" }[tone];
  return (
    <span
      className={`inline-grid min-w-[4.6rem] place-items-center rounded-lg border-2 px-1.5 py-0.5 font-mono text-[0.95rem] transition-colors duration-300 motion-reduce:transition-none ${look}`}
    >
      {children}
    </span>
  );
}

export function TwinSlots() {
  const s = useScene(3, [600, 1800, 2000]);
  const k = s.k;
  const b = k >= 2 ? "3" : "α + 2β";

  return (
    <Scene
      scene={s}
      caption={k < 3 ? <span key={k} className={FADE}>{X5_SAY[k]}</span> : <span className={FADE}>আলমারির 5 এর সাথে মেলানোর কিছুই রইলো না। কঠিন না: অসম্ভব।</span>}
    >
      <div className="mx-auto grid w-fit grid-cols-[auto_auto_auto] items-center gap-x-2 gap-y-2 text-sm">
        <span className="text-muted">আলমারি</span>
        <X5Slot tone={k >= 2 ? "ok" : "plain"}>3</X5Slot>
        <X5Slot tone={k >= 3 ? "bad" : "plain"}>5</X5Slot>
        {k >= 1 && (
          <>
            <span className={`${FADE} text-muted`}>remote B</span>
            <span key={`a${b}`} className={POP}>
              <X5Slot tone={k >= 2 ? "ok" : "plain"}>{b}</X5Slot>
            </span>
            <span key={`b${b}`} className={POP}>
              <X5Slot tone={k >= 3 ? "bad" : "plain"}>{b}</X5Slot>
            </span>
          </>
        )}
        {k >= 3 && (
          <>
            <span />
            <span />
            <span className={`${POP} text-center font-mono text-lg text-danger`}>3 ≠ 5</span>
          </>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: the fridge's mark is
//      done; Ammu walks in and chalks the sofa's; the remote's battery shows
//      12 presses left. The presses for the sofa are not shown: that is the
//      widget.

export function SofaChalk({}: Story) {
  const s = useScene(2, [600, 2000, 1800]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S1_FLOOR} label="Ammu chalks the sofa's mark beside the fridge's; remote C's battery has 12 presses left">
        <NightWindow />
        <Tiles />
        <FloorMark x={206} word="ফ্রিজ" />
        {k >= 1 && <FloorMark x={150} word="সোফা" />}
        <CastPerson who="fahim" x={70} y={S1_FLOOR + 16} arm="hold" />
        <Handset x={80} y={S1_FLOOR - 30} />
        <MiniBattery x={98} y={S1_FLOOR - 42} n={1} />
        {k >= 2 && (
          <text x={122} y={S1_FLOOR - 34.5} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="white" stroke="#4a3418" strokeWidth={2.2} paintOrder="stroke" className={POP}>
            12
          </text>
        )}
        <Robot x={32} y={S1_FLOOR + 16} />
        <CastPerson who="ammu" x={k >= 1 ? 160 : 372} y={S1_FLOOR + 16} facing={-1} walking={k === 1} arm={k >= 1 ? "point" : "down"} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn. The sofa at (1, 4), the real remote C and the real battery.
//     No machine, no readout: the reader sets α and β from their own sum,
//     then sends Shiku once. He walks the plan press by press. A wrong plan
//     walks him to the wrong tile and says which slot missed; tries bounce.

const YS_BATT = 12;

export function YourSofa() {
  const pass = useGate();
  const [plan, setPlan] = useSeed<number[]>("plan", [0, 0]);
  const [sent, setSent] = useSeed<number[] | null>("sent", null);
  const [used, setUsed] = useSeed("used", 0);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(240);
  const hops = sent ? hopsOf(C_KEYS, sent, BF) : [];
  const n = pl.running ? pl.k : hops.length;
  const at = n ? inside(hops[n - 1].to, BF) : O;
  const landed = sent ? land(C_KEYS, sent) : null;
  const won = !!landed && same(landed, SOFA) && !pl.running;
  const cost = Math.abs(plan[0]) + Math.abs(plan[1]);

  const send = () => {
    const h = hopsOf(C_KEYS, plan, BF);
    setSent(plan);
    setUsed(used + cost);
    const ok = same(land(C_KEYS, plan), SOFA);
    if (!ok) setMiss(miss + 1);
    pl.play(h.length, () => {
      if (ok) pass("সোফা: u 3 বার উল্টা, v 2 বার।");
    });
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={BF} grid={1} ticks={5} label={`remote C: Shiku at ${tup(at)}, the sofa at ${tup(SOFA)}`} className="my-0! max-w-none">
            <Chalk f={BF} at={SOFA} name="সোফা" on={won} />
            <Hops f={BF} hops={hops} n={n} />
            <Door f={BF} />
            <Shiku f={BF} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <BatteryBar left={YS_BATT - used} max={YS_BATT} />
          <div className="mt-2 grid gap-1.5">
            {C_KEYS.map((key, i) => (
              <div key={key.name} className="flex items-center justify-between gap-1">
                <span className="text-sm">
                  <b className={TEXT[key.tone]}>{key.name}</b> <span className="font-mono text-xs">{tup(key.v)}</span>
                </span>
                <Stepper value={plan[i]} onChange={(v) => setPlan(plan.map((p, j) => (j === i ? v : p)))} min={i ? -3 : -5} max={i ? 3 : 5} disabled={pl.running || won} label={`${key.name} কয়বার`} />
              </div>
            ))}
          </div>
          {!won && (
            <div className="mt-2 flex justify-center">
              <button type="button" onClick={send} disabled={pl.running} className={primaryBtn}>
                পাঠান ({cost} press)
              </button>
            </div>
          )}
        </div>
      </div>
      {won && <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>একবারেই সোফা। 5 টা press, একটাও বাড়তি না।</div>}
      {sent && landed && !won && !pl.running && (
        <Nope key={miss}>
          {landed[0] !== SOFA[0]
            ? `Shiku নামলো ${tup(landed)} এ। সোফার column এই না। আগে first slot মেলান: v যা দেয়, বাকিটা u এর।`
            : `Column ঠিক আছে, Shiku ${tup(landed)} এ। Height মিলে নাই। β এক ধাপ বদলালে height কত বদলায়?`}
        </Nope>
      )}
      <Task done={won}>খাতায় হিসাব করে u আর v এর count ঠিক করুন। তারপর Shiku কে একবারেই সোফায়, (1, 4) এ, পাঠান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the sofa worked out. Start
//      at β = 0 (slot 1 needs u once, height 2), the sofa wants 4, two steps
//      up, so β = 2 and α = −3.

const X6_F = makeFrame(-1, 4, -1, 11, 10, 8);
const X6_SAY = [
  "β = 0 দিয়ে শুরু। First slot 1 রাখতে u 1 বার। Height আসে 2.",
  "সোফা চায় height 4। দুই ধাপ বেশি। তাই β = 2।",
  "β = 2: v first slot এ দেয় 4. 1 এ নামতে u দিবে −3। তাই α = −3।",
];

export function SofaPlan() {
  const s = useScene(3, [600, 2200, 2400]);
  const k = s.k;
  const heights = k >= 2 ? [2, 3, 4] : k >= 1 ? [2, 3, 4] : [2];

  return (
    <Scene
      scene={s}
      caption={k < 3 ? <span key={k} className={FADE}>{X6_SAY[k]}</span> : <span className={FADE}>−3·(1, 2) + 2·(2, 5) = (1, 4). সোফা, একবারেই।</span>}
    >
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[4.4rem] shrink-0">
          <Plane f={X6_F} grid={1} axes={false} label="the sofa's column: heights 2, 3, 4 for β = 0, 1, 2, and the plan walked to (1, 4)" className="my-0! max-w-none">
            <line x1={X6_F.sx(1)} y1={X6_F.sy(-1)} x2={X6_F.sx(1)} y2={X6_F.sy(11)} strokeWidth={1.2} strokeDasharray="3 3" className="stroke-cat-blue/40" />
            <Chalk f={X6_F} at={SOFA} name="সোফা" on={k >= 3} />
            {heights.map((h) => (
              <Dot key={h} f={X6_F} at={[1, h]} r={2.6} className="fill-cat-blue" pop />
            ))}
            {k >= 3 && <Hops f={X6_F} hops={hopsOf(C_KEYS, [-3, 2], X6_F)} n={5} />}
            <circle cx={X6_F.sx(0)} cy={X6_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
          </Plane>
        </div>
        <div className="min-w-0 font-mono text-[0.9rem] leading-relaxed">
          <div className={k >= 1 ? "" : "opacity-30"}>β = 0 → 2</div>
          <div className={k >= 1 ? "" : "opacity-30"}>β = 1 → 3</div>
          <div className={k >= 1 ? "text-accent-text" : "opacity-30"}>β = 2 → 4</div>
          <div className={`mt-1 border-t border-border pt-1 ${k >= 2 ? "" : "opacity-30"}`}>
            <span className="text-cat-blue">α</span> = 1 − 4 = <b>−3</b>
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A second figure for screen 6's explanation, no task: the book's line
//      read part by part. α lights as the first button's count, β as the
//      second's, the right side as the one dot (the almirah); then the right
//      side swaps to the sofa's (1, 4) and Shiku stands there instead.

const X6B_F = makeFrame(-1, 4, -1, 6, 14, 8);
const X6B_SAY = [
  "আলমারির বেলায় বই লেখে এই line।",
  "α: first button কয়বার চাপা।",
  "β: second button কয়বার চাপা।",
  "ডান পাশে সেই একটা dot: আলমারি।",
  "সোফার বেলায় ডান পাশে শুধু (1, 4)।",
];

export function BookLine() {
  const s = useScene(4, [600, 1800, 1800, 2000, 2200]);
  const k = s.k;
  const sofa = k >= 4;
  const at = sofa ? SOFA : ALMIRAH;
  const lit = (on: boolean, tone: string) =>
    `rounded-md px-0.5 transition-colors duration-300 motion-reduce:transition-none ${on ? tone : ""}`;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6B_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="font-mono text-lg whitespace-nowrap">
          <span className={lit(k === 1, "bg-cat-blue/15 text-cat-blue")}>α</span>
          <span className="text-cat-blue">u</span> +{" "}
          <span className={lit(k === 2, "bg-cat-coral/15 text-cat-coral")}>β</span>
          <span className="text-cat-coral">v</span> ={" "}
          <span key={`r${sofa}`} className={`${POP} inline-block ${lit(k >= 3, "bg-accent/15 text-accent-text")}`}>
            {tup(at)}
          </span>
        </div>
        <div className="w-[4.6rem] shrink-0">
          <Plane f={X6B_F} grid={1} axes={false} label={`remote C's two buttons, and the one dot the line asks for, ${tup(at)}`} className="my-0! max-w-none">
            <Chalk f={X6B_F} at={at} name={sofa ? "সোফা" : "আলমারি"} on={k >= 3} />
            <Arrow f={X6B_F} from={O} to={C_KEYS[0].v} tone="blue" w={2.2} faint={k !== 1} />
            <Arrow f={X6B_F} from={O} to={C_KEYS[1].v} tone="coral" w={2.2} faint={k !== 2} />
            <Door f={X6B_F} />
            {k >= 3 && (
              <g key={`s${sofa}`} className={POP}>
                <Shiku f={X6B_F} at={at} />
              </g>
            )}
          </Plane>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for the Try it's setup, no task: Nasib takes the khata,
//      does the TV's sum himself, and announces it can't be done.

export function NasibKhata({}: Story) {
  const s = useScene(2, [600, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S1_FLOOR} label="Nasib does the TV's sum in the khata and announces that remote C can't reach the TV">
        <NightWindow />
        <Tiles />
        <FloorMark x={246} word="টিভি" />
        <CastPerson who="fahim" x={80} y={S1_FLOOR + 16} mood={k >= 2 ? "puzzled" : "plain"} />
        <Robot x={34} y={S1_FLOOR + 16} />
        <CastPerson who="nasib" x={160} y={S1_FLOOR + 16} arm="hold" mood={k >= 2 ? "smug" : "plain"} />
        <Khata x={170} y={S1_FLOOR - 32} />
        {k === 1 && <Bubble x={160} y={S1_FLOOR - 50} side="mid" lines={["দাঁড়াও, হিসাব করি।"]} />}
        {k >= 2 && <Bubble x={160} y={S1_FLOOR - 50} side="mid" lines={["দেখলে? টিভিতে", "যাওয়াই যায় না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it: spot the mistake. Nasib's four lines for the TV at (0, 1); line
//     2 dropped a minus (α = 2, not −2). A tap on a sound line stamps it
//     "ঠিক" and plays what that line honestly means (line 1 walks v once;
//     lines 3 and 4 walk Nasib's own plan to (4, 9), where slot 2 really is
//     9 and really isn't the TV's 1), then says what to look at; the tap on
//     line 2 draws Nasib's plan going to (4, 9), off the TV's column, then
//     walks the fixed plan to the TV. Wrong tries bounce.

const NS_F = makeFrame(-1.6, 5, -1, 10, 12, 10);
const NS_LINES: { text: ReactNode; ok: boolean; why: string }[] = [
  { text: <>β = 1 ধরি। মানে v একবার।</>, ok: true, why: "β যেকোনোটা ধরা যায়। এই line ঠিক আছে।" },
  {
    text: (
      <>
        Slot 1: <span className="font-mono">α·1 + 1·2 = 0</span>, তাই <span className="font-mono">α = 2</span>.
      </>
    ),
    ok: false,
    why: "",
  },
  {
    text: (
      <>
        Slot 2: <span className="font-mono">2·2 + 1·5 = 9</span>.
      </>
    ),
    ok: true,
    why: "2·2 + 1·5 সত্যিই 9। যোগে ভুল নাই। কিন্তু প্রথম 2 টা আসলো কোথা থেকে?",
  },
  {
    text: (
      <>
        <span className="font-mono">9 ≠ 1</span>. তাই টিভিতে যাওয়া যায় না।
      </>
    ),
    ok: true,
    why: "9 আর 1 আসলেই আলাদা। ভুলটা ঢুকেছে আরো আগে।",
  },
];
const NS_RIGHT = 1;
/** Nasib's plan and the fixed one */
const NS_NASIB = hopsOf(C_KEYS, [2, 1], NS_F);
const NS_FIXED = hopsOf(C_KEYS, [-2, 1], NS_F);
/** what a tap on a sound line walks: line 1 is v once (any β will do); lines 3 and 4 are Nasib's own plan */
const NS_WRONG: Record<number, Hop[]> = { 0: hopsOf(C_KEYS, [0, 1], NS_F), 2: NS_NASIB, 3: NS_NASIB };
/** the label the walk lands with */
const NS_WRONG_SAY: Record<number, string> = { 0: "β = 1", 2: "slot 2: 9", 3: "9 ≠ 1" };

export function NasibSum() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [stamped, setStamped] = useSeed<number[]>("stamped", []);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(360);
  const won = pick === NS_RIGHT;
  const path = won ? NS_FIXED : pick !== null ? NS_WRONG[pick] : [];
  const n = pl.running ? pl.k : path.length;
  const at = n ? path[n - 1].to : O;
  const wrongOver = pick !== null && !won && !pl.running;

  const choose = (i: number) => {
    if (won || pl.running) return;
    setPick(i);
    if (i !== NS_RIGHT) {
      setMiss(miss + 1);
      if (!stamped.includes(i)) setStamped([...stamped, i]);
      pl.play(NS_WRONG[i].length);
      return;
    }
    pl.play(NS_FIXED.length, () => pass("নাসিব minus টা ফেলে দিয়েছে: α = −2।"));
  };
  const look = (i: number): Look => (i === pick ? (won ? "right" : "picked") : won ? "dim" : "idle");

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[6.4rem] shrink-0">
          <Plane f={NS_F} grid={1} ticks={5} label={`the TV at ${tup(TV)}; Nasib's plan lands at (4, 9), the fixed one on the TV`} className="my-0! max-w-none">
            <Chalk f={NS_F} at={TV} name="টিভি" on={won && !pl.running} />
            {won && (
              <>
                <Hops f={NS_F} hops={NS_NASIB} n={NS_NASIB.length} dashed />
                <Label f={NS_F} at={[4, 9]} dx={-4} dy={-7} anchor="end" size={8} className={`${FADE} fill-danger`}>
                  α = 2
                </Label>
              </>
            )}
            {won ? (
              <Hops f={NS_F} hops={NS_FIXED} n={n} />
            ) : (
              pick !== null && (
                <>
                  <Hops key={`w${miss}`} f={NS_F} hops={path} n={n} dashed={pick !== 0} />
                  {wrongOver && (
                    <Label
                      f={NS_F}
                      at={path[path.length - 1].to}
                      dx={pick === 0 ? -6 : -12}
                      dy={pick === 0 ? -7 : 3}
                      anchor="end"
                      size={8}
                      className={`${FADE} ${pick === 0 ? "fill-cat-coral" : "fill-danger"} font-mono`}
                    >
                      {NS_WRONG_SAY[pick]}
                    </Label>
                  )}
                  {wrongOver && pick === 3 && <circle cx={NS_F.sx(TV[0])} cy={NS_F.sy(TV[1])} r={7} fill="none" strokeWidth={1.6} className={`${POP} stroke-cat-violet`} />}
                </>
              )
            )}
            <Door f={NS_F} />
            <Shiku f={NS_F} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-muted">নাসিবের খাতা</div>
          <div className="mt-1 grid gap-1.5">
            {NS_LINES.map((l, i) => (
              <button
                key={i}
                type="button"
                disabled={won || pl.running}
                onClick={() => choose(i)}
                className={`relative w-full cursor-pointer rounded-xl border-2 px-2 py-1.5 text-left text-[0.85rem] leading-snug transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look(i)]}`}
              >
                <span className="mr-1 text-xs text-muted">{i + 1}.</span>
                {l.text}
                {stamped.includes(i) && (
                  <span className={`${POP} absolute -top-2 right-1 rounded-md border border-accent bg-surface px-1 text-[0.7rem] font-semibold text-accent-text`}>ঠিক</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      {wrongOver && <Nope key={miss}>{NS_LINES[pick].why}</Nope>}
      {won && !pl.running && (
        <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>α = −2 নিলে: −2·(1, 2) + 1·(2, 5) = (0, 1)। টিভি।</div>
      )}
      <Task done={won && !pl.running}>নাসিবের হিসাবের যে line এ ভুল, সেটায় tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for the Try it's explanation, no task: the TV's slot 1 as a
//      share. It must be 0; v pays 2; so u must bring 2 back (α = −2). Nasib's
//      α = 2 goes 2 further instead, and slot 1 lands on 4.

const X7_SAY = [
  "টিভির first slot 0। মানে ডানে একটুও না।",
  "v একবার: v ডানে দেয় 2 ঘর।",
  "0 তে ফিরতে u কে 2 ঘর ফেরত আনতে হবে: α = −2।",
];

export function TvFixed() {
  const s = useScene(3, [600, 1800, 2200]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={k < 3 ? <span key={k} className={FADE}>{X7_SAY[k]}</span> : <span className={FADE}>নাসিব লিখেছিল α = 2। তাতে u আরো 2 ঘর ডানে নেয়: first slot 4, 0 না।</span>}
    >
      {k < 3 ? (
        <SlotBar target={0} vShare={2} vLabel="v: 2" uLabel="u: −2" show={k === 0 ? 0 : k === 1 ? 1 : 2} />
      ) : (
        <SlotBar target={4} vShare={2} vLabel="v: 2" uLabel="নাসিবের u: 2" show={2} />
      )}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for the last step, no task: Shiku goes to the fridge, the
//      sofa and the TV, each in one go; two notches of battery are left;
//      Nasib turns the khata's pages and says nothing; Ammu mentions the
//      broker coming in the morning (5.2's stake).

const S8_MARK = [150, 206, 262];

export function BatteryLeft({}: Story) {
  const s = useScene(4, [600, 1400, 1400, 1400, 2400]);
  const k = s.k;
  const shikuX = k >= 1 ? S8_MARK[Math.min(k, 3) - 1] : 110;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S1_FLOOR} label="Shiku goes to the fridge, the sofa and the TV, each in one go, with battery left over; Nasib looks through the khata, and Ammu says the broker comes in the morning">
        <NightWindow />
        <Tiles />
        <FloorMark x={S8_MARK[0]} word="ফ্রিজ" />
        <FloorMark x={S8_MARK[1]} word="সোফা" />
        <FloorMark x={S8_MARK[2]} word="টিভি" />
        <CastPerson who="fahim" x={70} y={S1_FLOOR + 16} arm="hold" />
        <Handset x={80} y={S1_FLOOR - 30} />
        <MiniBattery x={98} y={S1_FLOOR - 42} n={2} />
        <Robot x={shikuX} y={S1_FLOOR + 50} ms={900} walking={k >= 1 && k <= 3} />
        <CastPerson who="nasib" x={26} y={S1_FLOOR + 16} arm="hold" />
        <Khata x={34} y={S1_FLOOR - 32} />
        {k >= 4 && <CastPerson who="ammu" x={300} y={S1_FLOOR + 16} facing={-1} />}
        {k >= 4 && <Bubble x={300} y={S1_FLOOR - 50} side="left" lines={["কাল সকালে দালাল", "ভাই আসবেন।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8b · A figure for the last step's recap, written with `story` so it flows
//      with the words (the step has no widget of its own), no task: the
//      journey's answer replayed calmly. Settle β, slot 1 settles α (the
//      almirah, β = 0, α = 3), then walk β: on remote C the height climbs a
//      tile a step, on remote B it sits at 3.

const X8_F = makeFrame(2, 4, -1, 9, 11, 8);
const X8_BETAS = [-3, -2, -1, 0, 1, 2];
const X8_SAY = [
  "টিপার আগেই কি বলা যায়, কোন button কয়বার?",
  "একটা count ঠিক করুন।",
  "বাকি count টা ঠিক করে দেয় first slot।",
  "Remote C তে height বাড়ে এক এক করে। তাই সব জায়গায় পৌঁছায়।",
  "Remote B তে height নড়েই না।",
];

function X8Chip({ name, value, tone, on }: { name: string; value: string; tone: string; on: boolean }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[0.95rem]">
      <span className={tone}>{name}</span>
      <span
        key={`${name}${on}`}
        className={`inline-grid min-w-[2.4rem] place-items-center rounded-lg border-2 px-1 py-0.5 ${on ? `${POP} border-accent bg-accent/10 text-accent-text` : "border-border text-muted"}`}
      >
        {on ? value : "?"}
      </span>
    </div>
  );
}

export function RecapRule({}: Story) {
  const s = useScene(4, [600, 1800, 2000, 2400, 2200]);
  const k = s.k;
  const cols: { name: string; keys: Key[]; from: number }[] = [
    { name: "C", keys: C_KEYS, from: 3 },
    { name: "B", keys: B_KEYS, from: 4 },
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X8_SAY[k]}</span>}>
      <div className="flex items-center justify-center gap-5">
        <div className="grid gap-1.5">
          <X8Chip name="β" value="0" tone="text-cat-coral" on={k >= 1} />
          <X8Chip name="α" value="3" tone="text-cat-blue" on={k >= 2} />
        </div>
        <div className="flex gap-7">
          {cols.map((c) => (
            <div key={c.name} className="w-[2.6rem]">
              <Plane f={X8_F} grid={1} axes={false} label={`remote ${c.name}: the heights on the column 3 tiles right as β is walked`} className="my-0! max-w-none">
                <line x1={X8_F.sx(3)} y1={X8_F.sy(-1)} x2={X8_F.sx(3)} y2={X8_F.sy(9)} strokeWidth={1.2} strokeDasharray="3 3" className="stroke-cat-blue/40" />
                {k >= c.from &&
                  X8_BETAS.map((b, i) => (
                    <g key={b} className={POP} style={{ transitionDelay: `${i * 110}ms` }}>
                      <Dot f={X8_F} at={[3, slot2Of(c.keys, b)]} r={2.8} className={c.name === "B" ? "fill-danger" : "fill-cat-blue"} />
                    </g>
                  ))}
                {k >= c.from && c.name === "B" && (
                  <circle cx={X8_F.sx(3)} cy={X8_F.sy(3)} r={7} fill="none" strokeWidth={1.6} className={`${POP} stroke-danger`} />
                )}
              </Plane>
              <div className="mt-0.5 -mx-2 text-center text-xs font-semibold whitespace-nowrap">Remote {c.name}</div>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8c · A story scene for the bridge to 5.2, no task: tomorrow morning the
//      broker comes with his rent khata. His phone's app says a bathroom is
//      worth 3000 taka; a new flat goes into the khata and the app says
//      −2000. Fahim is left with the question. The broker is drawn as
//      Karim's look, named দালাল ভাই in text.

export function DalalApp({}: Story) {
  const s = useScene(3, [600, 2000, 2400, 2400]);
  const k = s.k;
  const flip = k >= 2;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S1_FLOOR} label="the broker's phone app says a bathroom is worth 3000 taka; a new flat goes into his khata and the app says minus 2000; Fahim wonders how more bathrooms can mean less rent">
        <Tiles />
        <CastPerson who="karim" x={k >= 1 ? 46 : -30} y={S1_FLOOR + 16} arm="hold" walking={k === 1} />
        <text x={k >= 1 ? 46 : -30} y={S1_FLOOR + 30} textAnchor="middle" fontSize={8} fontWeight={700} fill="white" stroke="#4a3418" strokeWidth={2} paintOrder="stroke">
          দালাল ভাই
        </text>
        {k >= 1 && (
          <g className={POP}>
            <path d={`M58 ${S1_FLOOR - 22}L88 70`} stroke="white" strokeOpacity={0.5} strokeWidth={0.8} strokeDasharray="2 2" />
            <rect x={88} y={16} width={70} height={96} rx={9} fill="#1e293b" stroke="#0f172a" strokeWidth={1.2} />
            <rect x={93} y={24} width={60} height={78} rx={3} fill="white" />
            <text x={123} y={40} textAnchor="middle" fontSize={8} fill="#5a6b7d">
              app
            </text>
            <text x={123} y={58} textAnchor="middle" fontSize={9} fontWeight={700} fill="#0f172a">
              1 বাথরুম
            </text>
            <text key={`v${flip}`} x={123} y={80} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily="ui-monospace, monospace" fill={flip ? "#e11d48" : "#15803d"} className={POP}>
              {flip ? "−2000" : "3000"}
            </text>
            <text x={123} y={93} textAnchor="middle" fontSize={8} fill="#5a6b7d">
              টাকা
            </text>
          </g>
        )}
        {k >= 1 && (
          <g className={POP}>
            <rect x={170} y={78} width={78} height={36} rx={2} fill="white" stroke="#0f172a" strokeWidth={1} />
            <text x={176} y={88} fontSize={6.5} fill="#5a6b7d">
              ভাড়ার খাতা
            </text>
            {[96, 104].map((y) => (
              <path key={y} d={`M176 ${y}H242`} stroke="#94a3b8" strokeWidth={0.8} />
            ))}
            {flip && <Draw d="M176 111H242" ms={500} strokeWidth={1.4} className="stroke-[#e11d48]" />}
            {flip && (
              <text x={170} y={73} textAnchor="start" fontSize={8.5} fontWeight={700} fill="white" stroke="#4a3418" strokeWidth={2} paintOrder="stroke" className={FADE}>
                + আরেকটা flat
              </text>
            )}
          </g>
        )}
        <CastPerson who="fahim" x={284} y={S1_FLOOR + 16} facing={-1} mood={k >= 3 ? "puzzled" : "plain"} />
        {k >= 3 && <Bubble x={284} y={S1_FLOOR - 50} side="left" tone="think" lines={["বাথরুম বাড়লে", "ভাড়া কমে কেমনে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  NightMarks: { chalk: { k: 1 }, battery: { k: 2 }, end: {} },
  BatteryHunt: {
    start: {},
    hunting: { amt: [3, 1], used: 9 },
    dead: { amt: [3, 1], used: 20 },
    found: { amt: [4, -1], used: 11, found: true },
  },
  TwoMoreMarks: { start: { k: 0 }, sofa: { k: 1 }, end: {} },
  KhataFloor: { hand: { k: 0 }, page: { k: 2 }, end: {} },
  PlainSight: { start: {}, wrong: { plan: [5, 3], sent: [5, 3], miss: 1 }, right: { plan: [3, 5], sent: [3, 5] } },
  BothWays: { start: { k: 0 }, u: { k: 1 }, end: {} },
  SettleOne: { start: {}, one: { b: 1, a: 1, found: [[0, 3], [1, 1]] }, all: { b: 2, a: -1, found: [[0, 3], [1, 1], [2, -1]] } },
  SlotShare: { start: { k: 0 }, zero: { k: 1 }, one: { k: 2 }, end: {} },
  SolveWalk: { start: {}, mid: { b: 2, seen: [0, 1, 2] }, found: { b: -1, seen: [0, 1, 2, -1], done: true } },
  HeightClimb: { start: { k: 0 }, a: { k: 1 }, end: {} },
  NasibInsists: { walk: { k: 1 }, end: {} },
  StuckWalk: { start: {}, stuck: { b: 3, seen: [0, 1, 2, 3, -2], done: true } },
  SlotsBuild: { start: { k: 0 }, two: { k: 2 }, end: {} },
  TwinSlots: { start: { k: 0 }, three: { k: 2 }, end: {} },
  SofaChalk: { start: { k: 0 }, end: {} },
  YourSofa: {
    start: {},
    column: { plan: [-1, 1], sent: [-1, 1], used: 2, miss: 1 },
    off: { plan: [2, 1], sent: [2, 1], used: 3, miss: 1 },
    right: { plan: [-3, 2], sent: [-3, 2], used: 5 },
  },
  SofaPlan: { start: { k: 0 }, climb: { k: 1 }, end: {} },
  BookLine: { start: { k: 0 }, alpha: { k: 1 }, dot: { k: 3 }, end: {} },
  NasibKhata: { think: { k: 1 }, end: {} },
  NasibSum: { start: {}, wrong1: { pick: 0, stamped: [0], miss: 1 }, wrong: { pick: 2, stamped: [2], miss: 1 }, wrong4: { pick: 3, stamped: [3], miss: 1 }, right: { pick: 1, stamped: [0] } },
  TvFixed: { start: { k: 0 }, back: { k: 2 }, end: {} },
  BatteryLeft: { fridge: { k: 1 }, tv: { k: 3 }, end: {} },
  RecapRule: { start: { k: 0 }, alpha: { k: 2 }, c: { k: 3 }, end: {} },
  DalalApp: { app: { k: 1 }, flip: { k: 2 }, end: {} },
};
