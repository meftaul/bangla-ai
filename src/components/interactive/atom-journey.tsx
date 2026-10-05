"use client";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { EUROPE, FULL, GREEK, RopeBand, RopeCards, RopeLine, TONE, makeRope, type Rope, type RopeCard, type Span } from "@/components/interactive/timeline-journey";
import { UNIFY } from "@/components/interactive/unify-journey";

// Screens for "Physics 1.4 — যে atom-এর ভেঙে পড়ার কথা", told as a Journey.
//
// Thursday in the poster corner. রিনা paints the 1800–2013 stretch; নানা has a
// dog-eared book on atoms; সোম has a torch and a prism. Rutherford's atom: a
// tiny + nucleus, electrons circling it. By 1.3's own Maxwell, a circling
// charge should radiate its energy and spiral into the nucleus in a blink. আমরা
// তো এখনো বসে আছি। নানার দাবি: ম্যাক্সওয়েল ভুল হতে পারে না। The reader clips
// Dalton, Thomson, Rutherford and fires alpha particles at gold foil
// (AtomCards), bets on the spiral and watches it play (SpiralIn), finds energy
// comes in packets so electrons sit on rungs (Quantum), meets Bose and boson
// (BoseCard), loses the ether (NoEther), watches atoms break open
// (AtomBreaks), zooms the matter ladder (ZoomIn), sorts a particle zoo into
// the Standard Model and finds the Higgs (ZooToFew), answers the Question and
// the book's নিজে করো (YourTurn), taps a face for the book's MCQ ১ (TryIt),
// and the bet is opened. 11 steps.
//
// Builds on 1.2/1.3's poster rope: adds the 1790–2020 ATOM cards, its own rope
// strip (span far wider than 1.3's, so its own tick/every). Only add exports.
//
// Words follow 1.2/1.3: the book's Bangla terms and dates as printed, `.`
// endings. Scenes and figures are fixed ink.

type Story = { story?: boolean };

const INK = "#0f1b2d";
const MUTE = "#5a6b7d";
const RED = "#dc2626";
const BLUE = "#2563eb";

const smallBtn =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border-2 border-cat-blue px-3 text-sm font-semibold text-cat-blue transition-colors hover:bg-cat-blue/10 disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none";

// ---------------------------------------------------------------------------
// The poster rope, 1790–2020: the cards this journey clips.

export const ATOM: RopeCard[] = [
  { id: "dalton", name: "ডাল্টন", year: 1803, label: "1803", tone: "modern", deed: "পরমাণুবাদ। পদার্থ তৈরি ছোট ছোট মার্বেলের মতো এককে, যাকে বলা হলো অ্যাটম।" },
  { id: "michelson", name: "মাইকেলসন, মোরলি", year: 1887, label: "1887", tone: "modern", deed: "ইথার খুঁজতে গিয়ে দেখা গেলো, ইথার নেই। আলোর বেগ সবার জন্য এক।" },
  { id: "rontgen", name: "রন্টজেন", year: 1895, label: "1895", tone: "modern", deed: "এক্স-রে আবিষ্কার। হাড়ের ছবি দেখা যায় চামড়ার ভেতর দিয়ে।" },
  { id: "becquerel", name: "বেকেরেল", year: 1896, label: "1896", tone: "modern", deed: "পরমাণুর কেন্দ্র থেকে তেজস্ক্রিয় বিকিরণ হচ্ছে, দেখান।" },
  { id: "thomson", name: "থমসন", year: 1897, label: "1897", tone: "modern", deed: "মার্বেলের ভেতর থেকে বের হলো ইলেকট্রন।" },
  { id: "curie", name: "পিয়ারে, মেরি কুরি", year: 1899, label: "1899", tone: "modern", deed: "রেডিয়াম আবিষ্কার। বোঝা গেলো, পরমাণু অবিনশ্বর না।" },
  { id: "planck", name: "প্ল্যাঙ্ক", year: 1900, label: "1900", tone: "modern", deed: "কোয়ান্টাম তত্ত্ব। শক্তি আসে টুকরো টুকরো প্যাকেটে।" },
  { id: "einstein", name: "আইনস্টাইন", year: 1905, label: "1905", tone: "modern", deed: "থিওরি অব রিলেটিভিটি। আলোর বেগ ধ্রুব; E = mc²." },
  { id: "rutherford", name: "রাদারফোর্ড", year: 1911, label: "1911", tone: "modern", deed: "ক্ষুদ্র ভারী + নিউক্লিয়াস, চারপাশে প্রায় ফাঁকা।" },
  { id: "bose24", name: "সত্যেন্দ্রনাথ বসু", year: 1924, label: "1924", tone: "modern", deed: "কোয়ান্টাম পরিসংখ্যান। তাঁর নামেই কণার নাম বোজন।" },
  { id: "hubble", name: "হাবল", year: 1924, label: "1924", tone: "modern", deed: "গ্যালাক্সিরা একে অন্যের থেকে দূরে সরছে। মহাবিশ্ব প্রসারিত হচ্ছে।" },
  { id: "dirac", name: "ডিরাক", year: 1931, label: "1931", tone: "modern", deed: "প্রতি কণার (antiparticle) অস্তিত্ব ঘোষণা। পরের বছরই মিললো।" },
  { id: "higgs", name: "হিগস বোজন", year: 2013, label: "2013", tone: "modern", deed: "ভরের জন্য দায়ী কণা, ভবিষ্যদ্বাণীর বহু বছর পর পরীক্ষাগারে ধরা পড়লো।" },
];
export const ATOM_SPAN: Span = [1790, 2020];

/** which row under the rope each name hangs on, so neighbours never overlap */
function nameRows(r: Rope, cards: RopeCard[]) {
  const order = cards.map((_, i) => i).sort((i, j) => cards[i].year - cards[j].year);
  const right: number[] = [];
  const row = cards.map(() => 0);
  for (const i of order) {
    const x = r.x(cards[i].year);
    const w = cards[i].name.length * 3.3 + 4;
    let l = right.findIndex((edge) => edge < x - w / 2);
    if (l === -1) l = right.length;
    right[l] = x + w / 2;
    row[i] = l;
  }
  return row;
}

/** The 1790–2020 stretch of the poster rope at height y, the `up` cards pinned; `pop` ones pop on. */
export function AtomRope({ y, up, pop = [], lit = [] }: { y: number; up: string[]; pop?: string[]; lit?: string[] }) {
  const r = makeRope(ATOM_SPAN, y);
  const cards = ATOM.filter((c) => up.includes(c.id));
  const row = nameRows(r, cards);
  return (
    <g className="pointer-events-none">
      <RopeLine r={r} tick={10} every={30} />
      {cards.map((c, i) => (
        <g key={c.id} className={pop.includes(c.id) ? POP : undefined}>
          {lit.includes(c.id) && <circle cx={r.x(c.year)} cy={r.y} r={6} fill="#fde68a" className={FADE} />}
          <path d={`M${r.x(c.year)} ${r.y}V${r.y + 6 + row[i] * 8}`} stroke={TONE.modern} strokeWidth={0.5} />
          <circle cx={r.x(c.year)} cy={r.y} r={2.6} fill={TONE.modern} stroke="white" strokeWidth={0.6} />
          <text x={r.x(c.year)} y={r.y + 12 + row[i] * 8} textAnchor="middle" fontSize={6} fontWeight={700} fill={INK}>
            {c.name}
          </text>
        </g>
      ))}
    </g>
  );
}

/** The rope strip that heads each card's screen; the new card pops on when the screen is done. */
function RopeStrip({ up, pop = [] }: { up: string[]; pop?: string[] }) {
  return (
    <svg viewBox="0 0 320 50" className="mb-2 block h-auto w-full" role="img" aria-label="the poster rope from 1790 to 2020 and the cards on it so far">
      <rect width={320} height={50} rx={8} fill="#f5efe6" />
      <AtomRope y={16} up={up} pop={pop} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: Thursday. রিনা paints the
//      1800–2013 stretch of the poster wall; নানা sits with a dog-eared book on
//      atoms; সোম has a torch and a prism on the desk.

export function ThursdayPoster({}: Story) {
  const s = useScene(3, [600, 2000, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Thursday: Rina paints the 1800-2013 stretch of the wall; Nana sits with an old book on atoms; Som has a torch and a prism on the desk">
        <path d="M8 24Q160 30 312 24" stroke="#a16207" strokeWidth={1.4} fill="none" />
        {[14, 30, 46, 62, 130, 150, 170, 196, 214, 222, 232, 246, 262, 280].map((x, i) => (
          <rect key={x} x={x} y={30 + (i % 3) * 9} width={9} height={7} rx={1} fill="white" stroke={i < 4 ? "#2563eb" : i < 7 ? "#059669" : i < 9 ? "#7c3aed" : TONE.modern} />
        ))}
        <rect x={200} y={40} width={100} height={26} rx={3} fill="#fde68a" opacity={k >= 1 ? 0.35 : 0.12} className="transition-opacity duration-700 motion-reduce:transition-none" />
        <Person who="rina" x={230} y={150} arm={k >= 1 ? "hold" : "down"} label />
        <path d="M120 150v-26h22v26M116 124h30" stroke="#78350f" strokeWidth={2.4} fill="none" />
        <Person who="nana" x={131} y={150} arm={k >= 2 ? "hold" : "down"} label />
        {k >= 2 && <Bubble x={131} y={84} lines={["ম্যাক্সওয়েল ভুল", "হতে পারেন না।"]} />}
        <Person who="som" x={60} y={150} arm={k >= 3 ? "hold" : "down"} label />
        {k >= 3 && (
          <g className={FADE}>
            <rect x={40} y={104} width={4} height={16} fill="#334155" />
            <path d="M44 104l14 16h-14Z" fill="#93c5fd" opacity={0.7} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · Clip Dalton, Thomson, Rutherford, then fire alpha particles at gold
//     foil. Each card pops a small deed icon when clipped. After all three,
//     the widget switches to the scattering test: most particles pass
//     straight, one or two bounce back off the nucleus.

const A1_CARDS = ["dalton", "thomson", "rutherford"] as const;
type A1Id = (typeof A1_CARDS)[number];
const A1_DEED: Record<A1Id, string> = {
  dalton: "পদার্থ তৈরি মার্বেলের মতো এককে: অ্যাটম।",
  thomson: "মার্বেলের ভেতর থেকে বের হলো ইলেকট্রন।",
  rutherford: "কেন্দ্রে ক্ষুদ্র ভারী + নিউক্লিয়াস, চারপাশে প্রায় ফাঁকা।",
};

function A1Icon({ id, on }: { id: A1Id; on: boolean }) {
  if (id === "dalton")
    return (
      <g className={on ? POP : undefined}>
        <circle r={9} fill="#a8a29e" stroke="#57534e" strokeWidth={0.8} />
      </g>
    );
  if (id === "thomson")
    return (
      <g className={on ? POP : undefined}>
        <circle r={9} fill="#a8a29e" stroke="#57534e" strokeWidth={0.8} />
        <circle cx={9} cy={-2} r={2.6} fill={RED} className={on ? POP : undefined} />
      </g>
    );
  return (
    <g className={on ? POP : undefined}>
      <circle r={9} fill="none" stroke="#94a3b8" strokeDasharray="2 1.5" />
      <circle r={2.4} fill="#78350f" />
      <circle cx={7} cy={-5} r={1.3} fill={RED} />
      <circle cx={-6} cy={6} r={1.3} fill={RED} />
    </g>
  );
}

/** the fixed offsets used by the nine fired particles: most pass straight, two bounce */
const A1_SHOTS = [
  { y: -18, bounce: false },
  { y: -12, bounce: false },
  { y: -6, bounce: false },
  { y: 0, bounce: true },
  { y: 4, bounce: false },
  { y: 9, bounce: false },
  { y: 14, bounce: false },
  { y: -2, bounce: true },
  { y: 18, bounce: false },
];

export function AtomCards() {
  const pass = useGate();
  const [clipped, setClipped] = useSeed<A1Id[]>("clipped", []);
  const [cur, setCur] = useSeed<A1Id | null>("cur", null);
  const [fired, setFired] = useSeed("fired", false);
  const pl = usePlay(500);
  const shoot = usePlay(140);
  const allClipped = clipped.length === A1_CARDS.length;

  const clip = (id: A1Id) => {
    if (pl.running || clipped.includes(id)) return;
    setCur(id);
    sfx.flip();
    pl.play(1, () => setClipped((c) => (c.includes(id) ? c : [...c, id])));
  };
  const fire = () => {
    if (shoot.running || fired) return;
    sfx.whoosh(0.4);
    shoot.play(A1_SHOTS.length, () => {
      setFired(true);
      pass("বেশিরভাগ সোজা গেলো, দুই-একটা ফিরে এলো।");
    });
  };
  const shown = shoot.running ? shoot.k : fired ? A1_SHOTS.length : 0;

  return (
    <>
      {!allClipped ? (
        <>
          <svg viewBox="0 0 320 84" className="block h-auto w-full" role="img" aria-label="a mini rope from 1790 to 1930; tap a card to clip it and see its deed">
            <rect width={320} height={84} rx={10} fill="#f5efe6" />
            <RopeLine r={makeRope([1790, 1930], 20)} tick={10} every={40} />
            {clipped.map((id) => {
              const c = ATOM.find((a) => a.id === id)!;
              const x = makeRope([1790, 1930], 20).x(c.year);
              return (
                <g key={id} transform={`translate(${x} 46)`} className={POP}>
                  <A1Icon id={id} on={false} />
                </g>
              );
            })}
          </svg>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {A1_CARDS.map((id) => {
              const c = ATOM.find((a) => a.id === id)!;
              return (
                <button key={id} type="button" onClick={() => clip(id)} disabled={pl.running || clipped.includes(id)} className={`${smallBtn} h-11 flex-col gap-0`}>
                  <span>{c.name}</span>
                  <span className="font-mono text-xs opacity-70">{c.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 min-h-12 text-center text-[0.95rem]">
            {cur ? (
              <span key={cur} className={FADE}>
                {A1_DEED[cur]}
              </span>
            ) : (
              <span className="text-muted">তিনটা card একে একে ক্লিপ করুন।</span>
            )}
          </div>
          <Ticks items={A1_CARDS.map((id) => [ATOM.find((a) => a.id === id)!.name, clipped.includes(id)])} />
        </>
      ) : (
        <>
          <svg viewBox="0 0 320 96" className="block h-auto w-full" role="img" aria-label="alpha particles fired at a thin sheet of gold foil, with a tiny nucleus inside; most pass straight through, a couple bounce back">
            <rect width={320} height={96} rx={10} fill="#f5efe6" />
            <rect x={148} y={12} width={10} height={72} fill="#fbbf24" opacity={0.75} />
            <circle cx={153} cy={48} r={3} fill="#78350f" />
            {A1_SHOTS.map((sh, i) => {
              if (shown <= i) return null;
              const done = shown > i + 1 || (!shoot.running && fired);
              const x0 = 20;
              const y0 = 48 + sh.y;
              const path = sh.bounce ? `M${x0} ${y0}L${153} 48L${x0 + 30} ${y0 - 10}` : `M${x0} ${y0}L300 ${y0}`;
              return (
                <g key={i}>
                  <Draw d={path} ms={500} className="stroke-[#0891b2]" strokeWidth={1} />
                  {done && <circle cx={sh.bounce ? x0 + 30 : 300} cy={sh.bounce ? y0 - 10 : y0} r={2} fill="#0891b2" className={POP} />}
                </g>
              );
            })}
          </svg>
          <div className="mt-2 min-h-8 text-center text-[0.95rem]">
            {fired ? "বেশিরভাগ কণা সোজা চলে গেলো। মাঝেমধ্যে একটা ফিরে এলো, মানে ভেতরে একটা শক্ত ভারী কিছু আছে।" : "আলফা কণা ছুড়ে দেখুন সোনার পাতে কী হয়।"}
          </div>
          <div className="mt-1 flex justify-center">
            <button type="button" onClick={fire} disabled={shoot.running || fired} className={primaryBtn}>
              আলফা কণা ছুড়ুন
            </button>
          </div>
        </>
      )}
      <Task done={fired}>তিনটা card ক্লিপ করুন। তারপর আলফা কণা ছুড়ে সোনার পাতে কী হয় দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: a calm orbit around the
//      nucleus, Maxwell's rule named beside it, and stopped at "?" — the
//      question, not yet the answer.

const X1_SAY = [
  "রাদারফোর্ডের ছবি: কেন্দ্রে + নিউক্লিয়াস, চারপাশে ঘুরছে − ইলেকট্রন।",
  "কিন্তু 1.3-এর ম্যাক্সওয়েলের সূত্র বলে, ঘুরন্ত চার্জ ক্রমাগত শক্তি হারায়।",
  "শক্তি হারালে ইলেকট্রনের কক্ষপথ ছোট হতে থাকার কথা।",
];

export function CalmOrbit() {
  const s = useScene(2, [700, 2200, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1_SAY[k]}</span>}>
      <svg viewBox="0 0 200 100" className="mx-auto block h-auto w-full max-w-[13rem]" role="img" aria-label="a nucleus with an electron orbiting calmly, Maxwell's rule named beside it, stopped at a question mark">
        <rect width={200} height={100} rx={10} fill="white" />
        <circle cx={100} cy={50} r={4} fill="#78350f" />
        <ellipse cx={100} cy={50} rx={34} ry={18} fill="none" stroke="#94a3b8" strokeDasharray="2 2" />
        <g>
          <animateMotion dur="3s" repeatCount="indefinite" path="M134 50A34 18 0 1 1 66 50A34 18 0 1 1 134 50" />
          <circle r={3} fill={BLUE} />
        </g>
        {k >= 1 && (
          <g className={FADE}>
            <rect x={30} y={78} width={140} height={16} rx={4} fill="#f5f3ff" stroke="#7c3aed" />
            <text x={100} y={89} textAnchor="middle" fontSize={7} fontWeight={700} fill="#6d28d9">
              ম্যাক্সওয়েলের সূত্র
            </text>
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <circle cx={100} cy={18} r={9} fill="#fef3c7" stroke="#d97706" />
            <text x={100} y={22} textAnchor="middle" fontSize={11} fontWeight={800} fill="#b45309">
              ?
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2 · The bet. Three answers about what should happen to the orbit; the pick
//     drawn with a "?" and sealed. Then the theoretical spiral plays anyway
//     (what the old law predicts, not the mystery's resolution): the orbit
//     shrinks turn by turn while a clock counts down to a blink.

const G2_OPT = ["স্পাইরাল করে পড়ে যায়, atom ভেঙে যায়", "ম্যাক্সওয়েল ভুল", "নতুন কিছু দরকার"];
let S2_BET: number | null = null;

export function SpiralIn() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const pl = usePlay(900);
  const [r] = useTween([sealed ? (pl.running ? 34 - (34 - 5) * (pl.k / 9) : 34) : 34], 30);

  const seal = () => {
    setSealed(true);
    S2_BET = pick;
    sfx.stamp();
    pl.play(9, () => pass("সূত্র বলে পড়বে, বাস্তবে পড়ে না।"));
  };
  const look = (i: number): Look => (pick === i ? "picked" : sealed ? "dim" : "idle");
  const t = pl.running ? pl.k / 9 : sealed ? 1 : 0;
  return (
    <>
      <svg viewBox="0 0 240 108" className="block h-auto w-full" role="img" aria-label="an electron orbiting a nucleus; once sealed, the theoretical orbit spirals inward while a tiny clock counts down">
        <rect width={240} height={108} rx={10} fill="#f5efe6" />
        <circle cx={120} cy={44} r={4} fill="#78350f" />
        <ellipse cx={120} cy={44} rx={r} ry={r * 0.53} fill="none" stroke="#94a3b8" strokeDasharray="2 2" />
        {!sealed && (
          <g>
            <animateMotion dur="2.4s" repeatCount="indefinite" path="M154 44A34 18 0 1 1 86 44A34 18 0 1 1 154 44" />
            <circle r={3} fill={BLUE} />
          </g>
        )}
        {sealed && (
          <g>
            <animateMotion dur={`${0.5 + t * 1.5}s`} repeatCount="indefinite" path={`M${120 + r} 44A${r} ${r * 0.53} 0 1 1 ${120 - r} 44A${r} ${r * 0.53} 0 1 1 ${120 + r} 44`} />
            <circle r={3} fill={BLUE} />
          </g>
        )}
        {pick !== null && !sealed && (
          <g className={FADE}>
            <circle cx={120} cy={16} r={8} fill="#f1f5f9" stroke="#94a3b8" />
            <text x={120} y={20} textAnchor="middle" fontSize={11} fontWeight={800} fill="#94a3b8">
              ?
            </text>
          </g>
        )}
        {sealed && (
          <g>
            <rect x={188} y={30} width={40} height={28} rx={5} fill="#0f172a" />
            <text x={208} y={48} textAnchor="middle" fontSize={9} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#22d3ee">
              10⁻{Math.max(1, Math.round(t * 11))}s
            </text>
          </g>
        )}
      </svg>
      {!sealed && (
        <>
          <div className="mt-2 text-sm font-medium text-muted">ম্যাক্সওয়েলের সূত্র সত্যি হলে ইলেকট্রনটার কী হবে?</div>
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
          {pick !== null && (
            <div className="mt-2.5 flex justify-center">
              <button type="button" onClick={seal} className={primaryBtn}>
                বাজি সিল করুন
              </button>
            </div>
          )}
        </>
      )}
      {sealed && <div className={`${FADE} mt-2 text-center text-[0.95rem] text-muted`}>{pl.running ? "সূত্র অনুযায়ী কক্ষপথ ছোট হচ্ছে…" : "সূত্র বলছে, এক ব্লিঙ্কে শেষ। বাজি সিল, শেষে মিলিয়ে দেখবো।"}</div>}
      <Task done={sealed && !pl.running}>একটা উত্তর বাছুন, বাজি সিল করুন। তারপর সূত্র কী বলে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Quantum. Heat a rod with discrete packets: each tap adds one fixed
//     packet of energy, the colour steps red → orange → white, never a half
//     step. Passes once white is reached.

const Q3_COLORS = ["#7f1d1d", "#dc2626", "#f97316", "#fb923c", "#fde047", "#fef9c3"];

export function Quantum() {
  const pass = useGate();
  const [n, setN] = useSeed("n", 0);
  const [done, setDone] = useSeed("done", false);
  const pl = usePlay(260);
  const add = () => {
    if (pl.running || done) return;
    sfx.pop();
    pl.play(1, () => {
      const next = n + 1;
      setN(next);
      if (next >= Q3_COLORS.length - 1 && !done) {
        setDone(true);
        pass("শক্তি টুকরো টুকরো, তাই সিঁড়িতে থামে।");
      }
    });
  };
  return (
    <>
      <RopeStrip up={["dalton", "thomson", "rutherford"]} />
      <svg viewBox="0 0 240 110" className="block h-auto w-full" role="img" aria-label="a rod glowing dark red to white; each tap adds one packet of heat, never a fraction of one">
        <rect width={240} height={110} rx={10} fill="#f5efe6" />
        <rect x={70} y={44} width={100} height={16} rx={8} fill={Q3_COLORS[n]} className="transition-colors duration-200 motion-reduce:transition-none" />
        {Array.from({ length: Q3_COLORS.length - 1 }, (_, i) => (
          <rect key={i} x={72 + i * 19.5} y={64} width={16} height={6} rx={2} fill={i < n ? "#f59e0b" : "#e2e8f0"} className="transition-colors duration-200 motion-reduce:transition-none" />
        ))}
        <text x={120} y={90} textAnchor="middle" fontSize={7.5} fill={MUTE}>
          প্যাকেট: <tspan fontFamily="ui-monospace, monospace">{n}</tspan> / {Q3_COLORS.length - 1}
        </text>
      </svg>
      <div className="mt-1 flex justify-center">
        <button type="button" onClick={add} disabled={pl.running || done} className={primaryBtn}>
          এক প্যাকেট যোগ করুন
        </button>
      </div>
      <div className="mt-2 min-h-6 text-center text-sm text-muted">অর্ধেক প্যাকেট বলে কিছু নেই। এক এক করেই যোগ হয়।</div>
      <Task done={done}>রডটাকে সাদা না হওয়া পর্যন্ত প্যাকেট যোগ করতে থাকুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: Bohr's staircase. The
//      electron can sit only on numbered rungs, never between them, so no
//      spiral is possible.

const X3_SAY = [
  "1900: প্ল্যাঙ্ক দেখান, শক্তি আসে টুকরো টুকরো প্যাকেটে, quantum।",
  "বোর এটা ব্যবহার করলেন পরমাণুতে: ইলেকট্রন বসতে পারে শুধু নির্দিষ্ট সিঁড়িতে।",
  "মাঝখানে থামা যায় না, তাই স্পাইরাল করে পড়ার সুযোগও নেই।",
  "1900-1930: হাইজেনবার্গ, শ্রোডিঞ্জার, ডিরাক… পদার্থের কোয়ান্টাম তত্ত্ব প্রতিষ্ঠা করেন।",
];

export function QuantumStairs() {
  const s = useScene(3, [700, 2200, 2200, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3_SAY[k]}</span>}>
      <svg viewBox="0 0 200 110" className="mx-auto block h-auto w-full max-w-[13rem]" role="img" aria-label="rungs of a staircase around a nucleus; the electron can sit only on a rung, never between them">
        <rect width={200} height={110} rx={10} fill="white" />
        <circle cx={100} cy={92} r={4} fill="#78350f" />
        {k >= 1 &&
          [1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={100} cy={92} rx={14 * i} ry={7 * i} fill="none" stroke="#94a3b8" strokeDasharray="2 2" className={FADE} style={{ transitionDelay: `${i * 120}ms` }} />
          ))}
        {k >= 2 && (
          <g className={POP}>
            <circle cx={100} cy={92 - 28} r={3.4} fill={BLUE} />
            <text x={100} y={92 - 34} textAnchor="middle" fontSize={7} fontFamily="ui-monospace, monospace" fill={MUTE}>
              n=3
            </text>
          </g>
        )}
        {k >= 2 && <path d="M100 60L100 46" stroke="#e11d48" strokeWidth={1.6} strokeDasharray="2 2" className={FADE} />}
        {k >= 2 && (
          <text x={112} y={50} fontSize={11} fontWeight={800} fill="#e11d48" className={FADE}>
            ✕
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: নানা says he once taught
//      at Dhaka University, mentioning Bose's name.

export function BoseUni({}: Story) {
  const s = useScene(2, [600, 2200, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Nana says he once taught at Dhaka University, and mentions Bose's name">
        <path d="M120 150v-26h22v26M116 124h30" stroke="#78350f" strokeWidth={2.4} fill="none" />
        <Person who="nana" x={131} y={150} arm={k >= 1 ? "hold" : "down"} label />
        <Person who="som" x={220} y={150} facing={-1} label />
        {k >= 1 && <Bubble x={131} y={84} lines={["আমিও ঢাকা", "বিশ্ববিদ্যালয়ে পড়াতাম।"]} />}
        {k >= 2 && <Bubble x={220} y={84} side="left" lines={["ওখানেই তো বসু", "পড়াতেন, তাই না?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · Two identical photons in a box. Swapping them changes nothing: still
//     one arrangement. Passes once swapped.

export function BoseCard() {
  const pass = useGate();
  const [swapped, setSwapped] = useSeed("swapped", false);
  const pl = usePlay(500);
  const swap = () => {
    if (pl.running) return;
    sfx.tap();
    pl.play(1, () => {
      if (!swapped) {
        setSwapped(true);
        pass("বসু থেকে বোজন।");
      } else setSwapped(false);
    });
  };
  const t = pl.running ? pl.k : swapped ? 1 : 0;
  return (
    <>
      <RopeStrip up={["dalton", "michelson", "rontgen", "becquerel", "thomson", "curie", "planck"]} pop={swapped ? ["bose24"] : []} />
      <svg viewBox="0 0 240 90" className="block h-auto w-full" role="img" aria-label="two identical photons inside a box; swapping them leaves the same one arrangement">
        <rect width={240} height={90} rx={10} fill="#f5efe6" />
        <rect x={70} y={16} width={100} height={54} rx={6} fill="white" stroke="#94a3b8" />
        <circle cx={t ? 145 : 100} cy={43} r={9} fill="#fde047" stroke="#ca8a04" className="transition-[cx] duration-500 ease-in-out motion-reduce:transition-none" />
        <text x={t ? 145 : 100} y={47} textAnchor="middle" fontSize={9} fontWeight={800} fill="#78350f" className="transition-[x] duration-500 ease-in-out motion-reduce:transition-none">
          γ
        </text>
        <circle cx={t ? 100 : 145} cy={43} r={9} fill="#fde047" stroke="#ca8a04" className="transition-[cx] duration-500 ease-in-out motion-reduce:transition-none" />
        <text x={t ? 100 : 145} y={47} textAnchor="middle" fontSize={9} fontWeight={800} fill="#78350f" className="transition-[x] duration-500 ease-in-out motion-reduce:transition-none">
          γ
        </text>
        <text x={120} y={82} textAnchor="middle" fontSize={7.5} fill={MUTE}>
          একই রকম, তাই বদল করলেও একই ছবি
        </text>
      </svg>
      <div className="mt-1 flex justify-center">
        <button type="button" onClick={swap} disabled={pl.running} className={primaryBtn}>
          দুইটা সোয়াপ করুন
        </button>
      </div>
      <div className="mt-2 min-h-6 text-center text-sm text-muted">{swapped ? "সোয়াপ করেও ছবিটা একই। একই রকম কণায় সোয়াপ মানে নতুন সাজানো না।" : "দুইটা photon বদলে দিন, ছবিটা বদলায় কিনা দেখুন।"}</div>
      <Task done={swapped}>দুইটা photon সোয়াপ করুন। ছবি বদলায় কিনা দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · No ether. Rotate the apparatus; the fringe pattern refuses to shift
//     however it turns. Passes after one full rotation.

export function NoEther() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 0);
  const [turned, setTurned] = useSeed("turned", false);
  const pl = usePlay(700);
  const rotate = () => {
    if (pl.running) return;
    sfx.tap();
    const next = deg + 90;
    setDeg(next);
    pl.play(1, () => {
      if (next >= 360 && !turned) {
        setTurned(true);
        pass("আলোর বেগ সবার জন্য এক।");
      }
    });
  };
  return (
    <>
      <RopeStrip up={["dalton", "michelson"]} pop={["michelson"]} />
      <svg viewBox="0 0 240 100" className="block h-auto w-full" role="img" aria-label="an interferometer that can be rotated; the fringe bars below stay exactly the same however it turns">
        <rect width={240} height={100} rx={10} fill="#f5efe6" />
        <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: "120px 40px", transformBox: "view-box" }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
          <path d="M84 40H156M120 8V40" stroke="#94a3b8" strokeWidth={1.6} />
          <rect x={114} y={34} width={12} height={12} fill="#facc15" />
        </g>
        <text x={120} y={64} textAnchor="middle" fontSize={7} fill={MUTE}>
          ঘুরিয়েও দেখুন
        </text>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={70 + i * 18} y={76} width={9} height={14} fill={i % 2 ? "#1e293b" : "#f8fafc"} stroke="#94a3b8" strokeWidth={0.5} />
        ))}
      </svg>
      <div className="mt-1 flex justify-center">
        <button type="button" onClick={rotate} disabled={pl.running || turned} className={primaryBtn}>
          90° ঘোরান
        </button>
      </div>
      <div className="mt-2 min-h-6 text-center text-sm text-muted">{turned ? "পুরো এক পাক ঘুরলো। ডোরাগুলো একটুও নড়লো না।" : "যন্ত্রটা ঘুরিয়ে নিচের ডোরার দিকে চোখ রাখুন।"}</div>
      <Task done={turned}>যন্ত্রটা পুরো এক পাক ঘুরিয়ে ডোরা মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: 1905, আইনস্টাইন, and E =
//      mc² gestured at, the full story kept for 1.6.

const X5_SAY = ["ইথার নেই, আলোর বেগ ধ্রুব। এখান থেকেই 1905-এ আইনস্টাইনের থিওরি অব রিলেটিভিটি।", "সেখান থেকেই আসে E = mc², ভরকে শক্তিতে রূপান্তরের সূত্র। পুরো গল্প 1.6-এ।"];

export function EinsteinTease() {
  const s = useScene(1, [900, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5_SAY[k]}</span>}>
      <svg viewBox="0 0 200 80" className="mx-auto block h-auto w-full max-w-[12rem]" role="img" aria-label="a block of mass shrinking a little as a spark of energy flies off, with E equals m c squared beside it">
        <rect width={200} height={80} rx={10} fill="white" />
        <rect x={30} y={26} width={30} height={30} fill="#94a3b8" className="transition-all duration-700 motion-reduce:transition-none" style={{ transform: k >= 1 ? "scale(0.82)" : "scale(1)", transformOrigin: "45px 41px" }} />
        {k >= 1 && (
          <g className={POP}>
            <path d="M74 34l7 -8l-3 8l9 -3l-9 9l3 8l-7 -8Z" fill="#facc15" />
          </g>
        )}
        <text x={150} y={46} textAnchor="middle" fontSize={13} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#7c3aed">
          E=mc²
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · Atom breaks. Three tabs: Röntgen's X-ray through a hand; Becquerel's
//     sealed plate fogging near a rock; Curie's radium glow. Passes after all
//     three are viewed.

type A6 = "rontgen" | "becquerel" | "curie";
const A6_LIST: { id: A6; name: string; year: string }[] = [
  { id: "rontgen", name: "রন্টজেন", year: "1895" },
  { id: "becquerel", name: "বেকেরেল", year: "1896" },
  { id: "curie", name: "কুরি দম্পতি", year: "1899" },
];

export function AtomBreaks() {
  const pass = useGate();
  const [tab, setTab] = useSeed<A6>("tab", "rontgen");
  const [seen, setSeen] = useSeed<A6[]>("seen", []);
  const pl = usePlay(1200);
  const done = seen.length === 3;

  const run = () => {
    if (pl.running || seen.includes(tab)) return;
    sfx.whoosh(0.3);
    pl.play(1, () => {
      const next = seen.includes(tab) ? seen : [...seen, tab];
      setSeen(next);
      if (next.length === 3) pass("পরমাণুও অবিনশ্বর না।");
    });
  };
  const t = pl.running ? pl.k : seen.includes(tab) ? 1 : 0;

  return (
    <>
      <RopeStrip up={["dalton", "michelson"]} pop={seen} />
      <div className="mb-1.5 flex justify-center gap-1.5">
        {A6_LIST.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setTab(a.id)}
            className={`rounded-full border-2 px-2.5 py-0.5 text-sm font-semibold ${tab === a.id ? "border-cat-blue bg-cat-blue/10" : "border-border"}`}
          >
            {a.name} <span className="font-mono text-xs opacity-70">{a.year}</span>
          </button>
        ))}
      </div>
      <svg viewBox="0 0 240 100" className="block h-auto w-full" role="img" aria-label="Röntgen's X-ray through a hand, Becquerel's sealed plate fogging near a rock, or the Curies' radium glowing">
        <rect width={240} height={100} rx={10} fill="#f5efe6" />
        {tab === "rontgen" && (
          <g>
            <rect x={90} y={20} width={16} height={60} fill="#0f172a" opacity={0.8} />
            <path d="M110 30q22 20 0 40q-8 -10 0 -20q-8 -10 0 -20Z" fill={t ? "#e2e8f0" : "#94a3b8"} className="transition-colors duration-700 motion-reduce:transition-none" />
            {[36, 44, 52, 60].map((y) => (
              <rect key={y} x={106} y={y} width={16} height={4} fill="white" opacity={t ? 0.9 : 0} className="transition-opacity duration-700 motion-reduce:transition-none" />
            ))}
          </g>
        )}
        {tab === "becquerel" && (
          <g>
            <rect x={70} y={30} width={20} height={20} rx={2} fill="#57534e" />
            <rect x={140} y={30} width={40} height={26} fill={t ? "#334155" : "white"} stroke="#94a3b8" className="transition-colors duration-700 motion-reduce:transition-none" />
            {t > 0 &&
              [0, 1, 2].map((i) => (
                <path key={i} d={`M90 ${36 + i * 6}Q115 ${36 + i * 6} 140 ${38 + i * 8}`} stroke="#eab308" strokeWidth={0.8} strokeDasharray="2 2" opacity={0.7} className={FADE} />
              ))}
          </g>
        )}
        {tab === "curie" && (
          <g>
            {t > 0 && <circle cx={120} cy={46} r={26} fill="#a7f3d0" opacity={0.4} className={FADE} />}
            <rect x={104} y={34} width={32} height={24} rx={3} fill={t ? "#6ee7b7" : "#94a3b8"} className="transition-colors duration-700 motion-reduce:transition-none" />
            <text x={120} y={49} textAnchor="middle" fontSize={7} fontWeight={700} fill="#065f46">
              Ra
            </text>
          </g>
        )}
        <text x={120} y={90} textAnchor="middle" fontSize={7.5} fill={MUTE}>
          {tab === "rontgen" ? "হাড়ের ছবি চামড়ার ভেতর দিয়ে" : tab === "becquerel" ? "সিল করা প্লেট, তবু কুয়াশা" : "রেডিয়াম নিজে নিজেই জ্বলে"}
        </text>
      </svg>
      <div className="mt-1 flex justify-center">
        <button type="button" onClick={run} disabled={pl.running || seen.includes(tab)} className={smallBtn}>
          চালান
        </button>
      </div>
      <Ticks items={A6_LIST.map((a) => [a.name, seen.includes(a.id)])} />
      <Task done={done}>তিনটা tab-ই একবার করে চালিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: a nucleus spitting a
//      particle, becoming a different nucleus. Then a side quest: Dirac 1931,
//      the antiparticle, found the very next year.

const X6_SAY = ["রন্টজেন, বেকেরেল, কুরি: তিনজনেই দেখালেন পরমাণুর ভেতরটা চুপচাপ না।", "নিউক্লিয়াস মাঝেমধ্যে নিজে থেকেই একটা কণা ছুড়ে দেয়, বদলে যায় অন্য মৌলে।"];

export function NucleusSplits() {
  const s = useScene(1, [800, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6_SAY[k]}</span>}>
      <svg viewBox="0 0 200 80" className="mx-auto block h-auto w-full max-w-[12rem]" role="img" aria-label="a nucleus splitting off a small particle and becoming a different nucleus">
        <rect width={200} height={80} rx={10} fill="white" />
        <circle cx={70} cy={40} r={16} fill="#a7f3d0" stroke="#059669" />
        {k >= 1 && (
          <g className={POP}>
            <circle cx={70} cy={40} r={14} fill="#6ee7b7" stroke="#047857" />
            <circle cx={116} cy={30} r={3.4} fill="#78350f" />
            <Draw d="M84 34L116 30" ms={500} className="stroke-[#78350f]" strokeWidth={1} />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7 · Zoom the matter ladder. Step through: বস্তু → অণু → মৌলের পরমাণু →
//     neutral atom → proton/neutron → quark → string?. The electron dot stays
//     visible and labelled fundamental from the atom level onward.

const Z7 = ["বস্তু", "অণু", "মৌলের পরমাণু", "নিরপেক্ষ পরমাণু", "প্রোটন, নিউট্রন", "কোয়ার্ক", "স্ট্রিং?"];

function ZoomArt({ lvl }: { lvl: number }) {
  if (lvl === 0)
    return (
      <g>
        <rect x={60} y={50} width={100} height={40} rx={4} fill="#c8a27a" stroke="#78350f" />
      </g>
    );
  if (lvl === 1)
    return (
      <g>
        {[[90, 50], [130, 56], [110, 74]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={12} fill="#e0ac7e" stroke="#92400e" />
        ))}
      </g>
    );
  if (lvl === 2)
    return (
      <g>
        <circle cx={110} cy={60} r={16} fill="#e0ac7e" stroke="#92400e" />
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return <circle key={i} cx={110 + Math.cos(a) * 30} cy={60 + Math.sin(a) * 30} r={2.4} fill={BLUE} />;
        })}
      </g>
    );
  if (lvl === 3)
    return (
      <g>
        <circle cx={110} cy={60} r={10} fill="#facc15" stroke="#a16207" />
        <ellipse cx={110} cy={60} rx={34} ry={18} fill="none" stroke="#94a3b8" strokeDasharray="2 2" />
        <circle cx={110 + 34} cy={60} r={2.6} fill={BLUE} />
        <text x={150} y={56} fontSize={6.5} fill={MUTE}>
          ইলেকট্রন: মৌলিক
        </text>
      </g>
    );
  if (lvl === 4)
    return (
      <g>
        {[[100, 54], [120, 54], [110, 70]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={9} fill={i === 1 ? "#93c5fd" : "#fca5a5"} stroke="#57534e" />
        ))}
        <circle cx={172} cy={54} r={2.6} fill={BLUE} />
        <text x={150} y={34} fontSize={6.5} fill={MUTE}>
          ইলেকট্রন: মৌলিক
        </text>
      </g>
    );
  if (lvl === 5)
    return (
      <g>
        {[[102, 54], [118, 54], [110, 70]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={5} fill={["#f472b6", "#38bdf8", "#facc15"][i]} stroke="#57534e" strokeWidth={0.6} />
        ))}
        <circle cx={172} cy={54} r={2.6} fill={BLUE} />
        <text x={150} y={34} fontSize={6.5} fill={MUTE}>
          ইলেকট্রন: মৌলিক
        </text>
      </g>
    );
  return (
    <g>
      <path d="M96 60q7 -14 14 0t14 0" fill="none" stroke="#7c3aed" strokeWidth={1.6} />
      <circle cx={172} cy={54} r={2.6} fill={BLUE} />
      <text x={150} y={34} fontSize={6.5} fill={MUTE}>
        ইলেকট্রন: মৌলিক
      </text>
      <rect x={70} y={80} width={80} height={14} rx={4} fill="#f5f3ff" stroke="#7c3aed" />
      <text x={110} y={90} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#6d28d9">
        গবেষণা চলছে
      </text>
    </g>
  );
}

export function ZoomIn() {
  const pass = useGate();
  const [lvl, setLvl] = useSeed("lvl", 0);
  const done = lvl >= Z7.length - 1;
  const go = (d: 1 | -1) => {
    const n = Math.max(0, Math.min(Z7.length - 1, lvl + d));
    if (n === lvl) return;
    setLvl(n);
    sfx.tap();
    if (n === Z7.length - 1) pass("প্রতিবার ভেতরে গেলাম, ইলেকট্রন প্রতিবারই মৌলিক থাকলো।");
  };
  return (
    <>
      <svg viewBox="0 0 220 100" className="block h-auto w-full" role="img" aria-label="zooming into matter, level by level, from an object to strings, with the electron staying a fundamental particle at every level">
        <rect width={220} height={100} rx={10} fill="#f5efe6" />
        <ZoomArt lvl={lvl} />
      </svg>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" onClick={() => go(-1)} disabled={lvl === 0} className={smallBtn}>
          ← বড়
        </button>
        <div className="min-w-24 text-center text-sm font-semibold">{Z7[lvl]}</div>
        <button type="button" onClick={() => go(1)} disabled={done} className={smallBtn}>
          ছোট →
        </button>
      </div>
      <Ticks items={Z7.map((z, i) => [z, i <= lvl])} />
      <Task done={done}>একটা একটা করে জুম করুন, স্ট্রিং পর্যন্ত। ইলেকট্রন কি কখনো ভাঙে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Accelerators fire two particles; a zoo of new ones scatter out. Tap the
//     zoo to sort it into the Standard Model box; one slot stays empty for
//     mass, then reveal the Higgs boson, found 2013.

const Z8_ZOO = [
  [40, 20], [80, 14], [130, 18], [180, 22], [210, 30], [50, 40], [190, 44], [70, 12],
];

export function ZooToFew() {
  const pass = useGate();
  const [fired, setFired] = useSeed("fired", false);
  const [sorted, setSorted] = useSeed("sorted", false);
  const [higgs, setHiggs] = useSeed("higgs", false);
  const shoot = usePlay(500);
  const sortPl = usePlay(600);
  const collide = () => {
    if (shoot.running || fired) return;
    sfx.crack();
    shoot.play(1, () => setFired(true));
  };
  const sort = () => {
    if (sortPl.running || sorted) return;
    sfx.whoosh(0.5);
    sortPl.play(1, () => setSorted(true));
  };
  const tapHiggs = () => {
    if (!sorted || higgs) return;
    sfx.chime();
    setHiggs(true);
    pass("অসংখ্য কণা, অল্প কয়েকটা মৌলিক।");
  };
  return (
    <>
      <RopeStrip up={["dalton", "michelson", "rontgen", "becquerel", "thomson", "curie", "planck", "einstein", "rutherford", "bose24"]} pop={higgs ? ["higgs"] : []} />
      <svg viewBox="0 0 220 120" className="block h-auto w-full select-none" role="img" aria-label="two particles collide into a scattered zoo of new particles, which sort into a few boxes with one empty slot for mass">
        <rect width={220} height={120} rx={10} fill="#f5efe6" />
        {!sorted ? (
          <g>
            {!fired ? (
              <g>
                <circle cx={40} cy={60} r={5} fill={RED} />
                <circle cx={180} cy={60} r={5} fill={BLUE} />
              </g>
            ) : (
              <g>
                <circle cx={110} cy={60} r={4} fill="#78350f" className={POP} />
                {Z8_ZOO.map(([x, y], i) => (
                  <g key={i} className={POP} style={{ transitionDelay: `${i * 40}ms` }}>
                    <circle cx={110 + x - 110} cy={y + 40} r={3.4} fill={["#f472b6", "#38bdf8", "#facc15", "#34d399", "#a78bfa"][i % 5]} />
                  </g>
                ))}
              </g>
            )}
          </g>
        ) : (
          <g>
            {["মৌলিক কণা", "প্রতি কণা", "ভর?"].map((label, i) => (
              <g key={label} onClick={i === 2 ? tapHiggs : undefined} role={i === 2 ? "button" : undefined} aria-label={i === 2 ? "tap: the empty mass slot" : undefined} className={i === 2 && !higgs ? "cursor-pointer" : undefined}>
                <rect x={16 + i * 68} y={30} width={58} height={40} rx={6} fill={i === 2 && higgs ? "#fef3c7" : "white"} stroke={i === 2 ? "#d97706" : "#0f766e"} strokeDasharray={i === 2 && !higgs ? "3 2" : undefined} />
                <text x={45 + i * 68} y={54} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={i === 2 ? "#b45309" : "#0f766e"}>
                  {i === 2 && higgs ? "হিগস" : label}
                </text>
              </g>
            ))}
            <text x={110} y={90} textAnchor="middle" fontSize={7} fill={MUTE}>
              {higgs ? "2013: পরীক্ষাগারে ধরা পড়লো।" : "ভরের স্লটটা ফাঁকা। tap করুন।"}
            </text>
          </g>
        )}
      </svg>
      <div className="mt-1 flex justify-center gap-2">
        {!fired ? (
          <button type="button" onClick={collide} disabled={shoot.running} className={primaryBtn}>
            এক্সিলারেটরে ছুড়ুন
          </button>
        ) : !sorted ? (
          <button type="button" onClick={sort} disabled={sortPl.running} className={primaryBtn}>
            সাজান
          </button>
        ) : null}
      </div>
      <Task done={higgs}>কণাগুলো ছুড়ুন, সাজান। তারপর খালি স্লটে tap করে দেখুন কী মেলে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the Standard Model as a
//      short grid, a few fundamentals building all. Then a side quest:
//      Hubble 1924, galaxies running away, the Big Bang and dark matter.

export function StandardGrid() {
  const s = useScene(1, [900, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={0}>স্ট্যান্ডার্ড মডেল অল্প কয়েকটা মৌলিক কণা আর তাদের প্রতি কণা দিয়ে সব সাজায়।</span>}>
      <svg viewBox="0 0 200 80" className="mx-auto block h-auto w-full max-w-[12rem]" role="img" aria-label="a short grid of a few fundamental particles">
        <rect width={200} height={80} rx={10} fill="white" />
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={i} cx={26 + (i % 4) * 48} cy={i < 4 ? 26 : 54} r={9} fill={k >= 1 ? ["#f472b6", "#38bdf8", "#facc15", "#34d399"][i % 4] : "#e2e8f0"} className="transition-colors duration-500 motion-reduce:transition-none" style={{ transitionDelay: `${i * 80}ms` }} />
        ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn: two parts. Part a — drag the reason onto the spiralling
//     electron: pick the one that actually stops it. Part b — the book's
//     নিজে করো: pick three real cards off the rope that prove 20th-century
//     progress; every real card is accepted.

const Y9A = [
  { id: "quantum", text: "শক্তি টুকরো টুকরো, কোয়ান্টাম তত্ত্ব", ok: true },
  { id: "smaller", text: "নিউক্লিয়াস আরো ছোট হলেই সমস্যা মিটতো", ok: false },
  { id: "nospin", text: "ইলেকট্রন আসলে ঘোরেই না", ok: false },
];

export function YourTurn9() {
  const pass = useGate();
  const [picked, setPicked] = useSeed<string | null>("picked", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const [part, setPart] = useSeed<"a" | "b">("part", "a");
  const [three, setThree] = useSeed<string[]>("three", []);
  const [aDone, setADone] = useSeed("aDone", false);
  const pl = usePlay(500);

  const tap = (id: string) => {
    if (pl.running || aDone) return;
    const y = Y9A.find((y) => y.id === id)!;
    setPicked(id);
    sfx.tap();
    pl.play(1, () => {
      if (y.ok) {
        sfx.chime();
        setADone(true);
        setPart("b");
      } else {
        sfx.thump();
        setMiss((m) => m + 1);
      }
    });
  };
  const pickCard = (id: string) => {
    if (three.includes(id) || three.length >= 3) return;
    sfx.click();
    const next = [...three, id];
    setThree(next);
    if (next.length === 3) pass("বিংশ শতাব্দীতে বিস্ময়কর অগ্রগতি, একটার পর একটা।");
  };

  return (
    <>
      {part === "a" ? (
        <>
          <svg viewBox="0 0 200 90" className="block h-auto w-full" role="img" aria-label="the spiralling electron picture; drag the right reason onto it">
            <rect width={200} height={90} rx={10} fill="#f5efe6" />
            <circle cx={100} cy={40} r={4} fill="#78350f" />
            <ellipse cx={100} cy={40} rx={16} ry={9} fill="none" stroke="#94a3b8" strokeDasharray="2 2" />
            <circle cx={116} cy={40} r={3} fill={BLUE} />
            {picked && (
              <g className={POP}>
                <circle cx={100} cy={12} r={9} fill="#fef3c7" stroke="#d97706" />
                <text x={100} y={16} textAnchor="middle" fontSize={11} fontWeight={800} fill="#b45309">
                  ?
                </text>
              </g>
            )}
          </svg>
          <div className="mt-2 grid gap-1.5">
            {Y9A.map((y) => (
              <button
                key={y.id}
                type="button"
                onClick={() => tap(y.id)}
                disabled={pl.running || aDone}
                className={`cursor-pointer rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors disabled:cursor-default motion-reduce:transition-none ${
                  picked === y.id && !pl.running && !y.ok ? "nudge border-danger/50 text-danger" : "border-border hover:border-cat-blue/60"
                }`}
              >
                {y.text}
              </button>
            ))}
          </div>
          {picked && !pl.running && !Y9A.find((y) => y.id === picked)?.ok && <Nope key={miss}>এতে স্পাইরালের কারণটাই মেটে না। ম্যাক্সওয়েলের সূত্র তো ঠিকই থাকে।</Nope>}
        </>
      ) : (
        <>
          <div className="mb-1.5 text-center text-sm font-medium text-muted">বইয়ের নিজে করো: বিংশ শতাব্দীর অগ্রগতি প্রমাণ করে, এমন তিনটা card বেছে নিন।</div>
          <div className="grid grid-cols-3 gap-1.5">
            {["thomson", "curie", "planck", "einstein", "rutherford", "bose24"].map((id) => {
              const c = ATOM.find((a) => a.id === id)!;
              const on = three.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => pickCard(id)}
                  disabled={on || three.length >= 3}
                  className={`cursor-pointer rounded-xl border-2 px-1 py-1.5 text-center leading-tight transition-colors disabled:cursor-default motion-reduce:transition-none ${on ? "border-accent bg-accent/10" : "border-border hover:border-cat-blue/60"}`}
                >
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="font-mono text-xs text-muted">{c.label}</div>
                </button>
              );
            })}
          </div>
          <Ticks items={[["তিনটা card", three.length >= 3]]} />
        </>
      )}
      <Task done={three.length >= 3}>আগে আসল কারণটা বাছুন। তারপর দড়ি থেকে তিনটা card বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · Try it: the book's MCQ ১, as a picture. Tap a face for who first gave
//     quantum theory: প্ল্যাঙ্ক, আইনস্টাইন, রাদারফোর্ড, হাইজেনবার্গ. A wrong
//     face shows that person's own year and topic.

const T10 = [
  { id: "planck", name: "প্ল্যাঙ্ক", ok: true, color: "#0f766e" },
  { id: "einstein", name: "আইনস্টাইন", ok: false, color: "#7c3aed" },
  { id: "rutherford", name: "রাদারফোর্ড", ok: false, color: "#b45309" },
  { id: "heisenberg", name: "হাইজেনবার্গ", ok: false, color: "#dc2626" },
];
const T10_NOPE: Record<string, string> = {
  einstein: "আইনস্টাইন 1905-এ রিলেটিভিটি দিলেন, কোয়ান্টাম তত্ত্বের পাঁচ বছর পরে।",
  rutherford: "রাদারফোর্ড 1911-এ নিউক্লিয়াস দেখালেন, কোয়ান্টাম নিয়ে না।",
  heisenberg: "হাইজেনবার্গ 1900-এর পরে, quantum theory প্রতিষ্ঠার কাজে, কিন্তু প্রথম না।",
};

function Face({ color }: { color: string }) {
  return (
    <g>
      <circle r={14} fill="#e0ac7e" />
      <path d="M-14 -2q0 -13 14 -13t14 13q-4 -6 -14 -6t-14 6Z" fill={color} />
      <circle cx={-4} cy={-1} r={1.4} fill={INK} />
      <circle cx={4} cy={-1} r={1.4} fill={INK} />
    </g>
  );
}

export function TryIt10() {
  const pass = useGate();
  const [pick, setPick] = useSeed<string | null>("pick", null);
  const [right, setRight] = useSeed("right", false);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(500);
  const tap = (id: string) => {
    if (pl.running || right) return;
    const t = T10.find((t) => t.id === id)!;
    setPick(id);
    sfx.tap();
    pl.play(1, () => {
      if (t.ok) {
        sfx.chime();
        setRight(true);
        pass("প্ল্যাঙ্ক, 1900। এখান থেকেই কোয়ান্টাম তত্ত্বের শুরু।");
      } else {
        sfx.thump();
        setMiss((m) => m + 1);
      }
    });
  };
  return (
    <>
      <div className="mb-1.5 text-center text-sm font-medium text-muted">কোয়ান্টাম তত্ত্ব প্রথম কে প্রদান করেন?</div>
      <div className="grid grid-cols-4 gap-1.5">
        {T10.map((t) => (
          <button key={t.id} type="button" onClick={() => tap(t.id)} disabled={pl.running || right} className="cursor-pointer rounded-xl border-2 border-border px-1 py-2 text-center transition-colors hover:border-cat-blue/60 disabled:cursor-default motion-reduce:transition-none">
            <svg viewBox="-16 -16 32 32" className="mx-auto h-9 w-9" aria-hidden="true">
              <Face color={t.color} />
            </svg>
            <div className="mt-1 text-xs font-semibold">{t.name}</div>
          </button>
        ))}
      </div>
      {pick && !pl.running && !right && <Nope key={miss}>{T10_NOPE[pick]}</Nope>}
      {right && <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>প্ল্যাঙ্ক, ঠিক!</div>}
      <Task done={right}>সঠিক মুখে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10a · A story scene for the last step's setup, no task: রিনা paints the
//       last card on the rope; নানা closes his book.

export function LastCard({}: Story) {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="Rina paints the last card on the rope; Nana closes his book">
        <path d="M8 24Q160 30 312 24" stroke="#a16207" strokeWidth={1.4} fill="none" />
        {[14, 30, 46, 62, 130, 150, 170, 196, 214, 222, 232, 246, 262, 280].map((x, i) => (
          <rect key={x} x={x} y={30 + (i % 3) * 9} width={9} height={7} rx={1} fill="white" stroke={i < 4 ? "#2563eb" : i < 7 ? "#059669" : i < 9 ? "#7c3aed" : TONE.modern} />
        ))}
        {k >= 2 && <rect x={296} y={40} width={9} height={7} rx={1} fill="white" stroke={TONE.modern} className={POP} />}
        <Person who="rina" x={k >= 2 ? 300 : 230} y={150} arm={k >= 1 ? "hold" : "down"} walking={k === 2} label />
        <path d="M120 150v-26h22v26M116 124h30" stroke="#78350f" strokeWidth={2.4} fill="none" />
        <Person who="nana" x={131} y={150} arm={k >= 3 ? "hold" : "down"} label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 11 · The bet opened. The sealed pick comes back; the three answers judged
//      against the real story: the spiral never happens (no), Maxwell wasn't
//      wrong but incomplete at this scale (part), quantum theory was the new
//      thing needed (yes).

const V11: { ok: "yes" | "no" | "part"; say: string }[] = [
  { ok: "no", say: "বাস্তবে এমন হয় না। আমরা এখনো বসে আছি।" },
  { ok: "part", say: "ম্যাক্সওয়েলের সূত্র পুরোপুরি ভুল না, কিন্তু পরমাণুর স্কেলে যথেষ্ট না।" },
  { ok: "yes", say: "নতুন তত্ত্ব দরকার হলো: কোয়ান্টাম তত্ত্ব।" },
];

export function BetOpen14() {
  const pass = useGate();
  const [bet] = useSeed<number | null>("bet", S2_BET);
  const [open, setOpen] = useSeed("open", false);
  const pl = usePlay(1100);
  const n = pl.running ? pl.k : open ? 3 : 0;
  const reveal = () => {
    if (open) return;
    setOpen(true);
    sfx.paper();
    pl.play(3, () => pass("সূত্র বলে পড়বে, পড়ে না, তাই সূত্র বদলায়।"));
  };
  return (
    <>
      <div className="mt-2 grid gap-1.5">
        {G2_OPT.map((o, i) => {
          const shown = i < n;
          const v = V11[i];
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
      {open && bet === null && !pl.running && <div className={`${FADE} mt-2 text-center text-sm text-muted`}>দ্বিতীয় screen-এর বাজিটা মনে করে মিলিয়ে নিন।</div>}
      <Task done={open && !pl.running}>বাজি খুলে তিনটা উত্তর মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11½ · A figure for the last step's explanation, no task: the whole poster,
//       Greek to 2013, zoomed compact.

export function WholePoster() {
  const s = useScene(1, [900, 2200]);
  const k = s.k;
  const r = makeRope(FULL, 40);
  return (
    <Scene scene={s} caption={<span key={0}>1.1-এর পুরান রোপ, এখন 2013 পর্যন্ত ভরা।</span>}>
      <svg viewBox="0 0 320 96" className="mx-auto block h-auto w-full max-w-[18rem]" role="img" aria-label="the whole poster rope from ancient Greece to 2013">
        <rect width={320} height={96} rx={10} fill="white" />
        <RopeLine r={r} tick={100} every={500} />
        <RopeCards r={r} cards={[...GREEK, ...EUROPE]} compact />
        {k >= 1 && (
          <g className={FADE}>
            <RopeCards r={r} cards={UNIFY.filter((c) => r.x(c.year) >= 0)} compact />
            <RopeCards r={r} cards={ATOM.filter((c) => r.x(c.year) <= 320)} compact />
          </g>
        )}
        <RopeBand r={r} from={-624} to={-276} label="গ্রিক" tone="greek" above={16} />
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  ThursdayPoster: { paint: { k: 1 }, book: { k: 2 }, end: {} },
  AtomCards: { start: {}, one: { clipped: ["dalton"] }, all: { clipped: ["dalton", "thomson", "rutherford"] }, fired: { clipped: ["dalton", "thomson", "rutherford"], fired: true } },
  CalmOrbit: { law: { k: 1 }, end: {} },
  SpiralIn: { start: {}, a: { pick: 0 }, sealed: { pick: 2, sealed: true } },
  Quantum: { start: {}, mid: { n: 2 }, done: { n: 5, done: true } },
  QuantumStairs: { rung: { k: 2 }, end: {} },
  BoseUni: { line: { k: 1 }, end: {} },
  BoseCard: { start: {}, done: { swapped: true } },
  NoEther: { start: {}, mid: { deg: 180 }, done: { deg: 360, turned: true } },
  EinsteinTease: { start: {}, end: { k: 1 } },
  AtomBreaks: { start: {}, rontgen: { tab: "rontgen", go: true, seen: ["rontgen"] }, done: { seen: ["rontgen", "becquerel", "curie"] } },
  NucleusSplits: { split: { k: 1 } },
  ZoomIn: { start: {}, mid: { lvl: 3 }, done: { lvl: 6 } },
  ZooToFew: { start: {}, fired: { fired: true }, sorted: { fired: true, sorted: true }, higgs: { fired: true, sorted: true, higgs: true } },
  StandardGrid: { end: { k: 1 } },
  YourTurn9: { start: {}, wrong: { picked: "smaller", miss: 1 }, b: { part: "b", aDone: true }, done: { part: "b", aDone: true, three: ["thomson", "curie", "planck"] } },
  TryIt10: { start: {}, wrong: { pick: "einstein", miss: 1 }, right: { pick: "planck", right: true } },
  LastCard: { paint: { k: 2 }, end: {} },
  BetOpen14: { start: { bet: 2 }, open: { bet: 2, open: true } },
  WholePoster: { end: { k: 1 } },
};
