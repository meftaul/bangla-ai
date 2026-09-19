"use client";

import type { ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, POP, Scene, Speech, Ticks, pill, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Label, Plane, dist, makeFrame, mix, type XY } from "@/components/journey/plane";
import { Tape } from "./dimension-journey";
import { Bubble, Card as CastCard, Person, Robot, Stage, Stall, StoryFrame, Tree } from "@/components/journey/cast";
import { bn } from "./figure-kit";

// Screens for "Math for AI 3.6 — শুধু দিক, movie club-এর গোলমাল", told as a Journey.
//
// নাসিবের movie club scores each film against a visitor's taste with a rule
// used as a black box here ("ঘরে ঘরে গুণ, তারপর যোগ"; Article 4 explains it).
// ফাহিমের মামা loves comedy, yet Titanic almost ties Mr. Bean: 20 vs 22. The
// films as arrows show why: Titanic is simply longer, and a longer arrow in the
// same direction scores more. So the length has to go: the reader stretches
// (3, 4) and (1.5, 2) until each is exactly 1 long, and both land on
// (0.6, 0.8); checks that it really is 1 and meets v̂; normalises ten arrows
// onto one ring, where only e₁ and e₂ don't move; and reruns the club's rule on
// the normalised films, where the comedy wins clearly and মামা finally gets his
// film. Last, the honest limit: normalising সামিন's two customers, who spend
// in the same proportion ten times apart, collapses them into one row and the
// question "who spends the most?" stops having an answer.
//
// The explanations get scenes that play by themselves, one or more in every
// <Then>: the near-tie that feels wrong and the rule as a closed box (1¼, 1⅓),
// a new song tipping Titanic past Mr. Bean (1½), direction against length and
// 3.2's শরবত doubled beside the double Titanic (2¼, 2½), the table as two tapes
// and the two arrows sliding down one line (3½, 3¾), the tailor's tape against
// the walk, the hat dropping on v and λ-knob turned to 1/5 (4½, 4⅔, 4¾), 3.5's
// drone tracing the unit ring, Shiku's e₁ and e₂ already on it, and (0, 0) left
// as a question (5½, 5⅔, 5¾), same cards on a new ruler, the double Titanic
// merging, the fair fight as needles and cosine similarity named (6¼–6¾), what
// normalising wiped from সামিন's খাতা and when length is news (7½, 7¾), and
// the Check's (5, 12) worked slot by slot with its wrong answers on the ring
// (8, 8½). The setup
// words get story scenes on the fair's stage (1a, 4a, 5a, 6a, 7a, 9a, 9b):
// মামা at the club, নাসিব's doubt, the sack of films, the three films on the
// counter, সামিন's খাতা, মামা going home, and ডাক্তার আপার twin mix-up.
//
// Tailwind only; the sheets are journey/plane, the tape comes from 2.5's
// screens. Ink on the white sheet is fixed.

const O: XY = [0, 0];
/** length of a list of numbers: square, add, root */
const len = (v: readonly number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
/** a machine number, at most two decimals, no trailing zeros */
const sh = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return r < 0 ? `−${-r}` : `${r}`;
};
const tupS = (v: readonly number[]) => `(${v.map(sh).join(", ")})`;
const unit = (v: readonly number[]): XY => [v[0] / len(v), v[1] / len(v)];
/** the unit vector rounded to two decimals, the way the screens show it */
const unit2 = (v: readonly number[]): XY => unit(v).map((n) => Math.round(n * 100) / 100) as XY;

// The movie club. Scores run (drama, comedy).
const KINDS = ["drama", "comedy"];
const TASTE: XY = [2, 5];
const TITANIC: XY = [5, 2];
const BEAN: XY = [1, 4];
/** the club's rule: multiply slot by slot, then add */
const score = (film: readonly number[]) => TASTE[0] * film[0] + TASTE[1] * film[1];

const INK = {
  coral: { text: "text-cat-coral", border: "border-cat-coral/40", bar: "bg-cat-coral" },
  teal: { text: "text-cat-teal", border: "border-cat-teal/40", bar: "bg-cat-teal" },
  violet: { text: "text-cat-violet", border: "border-cat-violet/40", bar: "bg-cat-violet" },
};
type Ink = keyof typeof INK;

function FilmCard({ name, kind, v, tone, children }: { name: string; kind: string; v: readonly number[]; tone: Ink; children?: ReactNode }) {
  return (
    <div className={`rounded-xl border-2 bg-surface px-3 py-2 text-center ${INK[tone].border}`}>
      <div className={`text-sm font-semibold ${INK[tone].text}`}>{name}</div>
      <div className="text-xs text-muted">{kind}</div>
      <div className="font-mono text-lg font-bold">{tupS(v)}</div>
      {children}
    </div>
  );
}

/** The club's rule on one film, one line at a time: `k` lines shown (0–3). */
function RuleLines({ v, k }: { v: readonly number[]; k: number }) {
  const parts = TASTE.map((t, i) => t * v[i]);
  return (
    <div className="mt-2 min-h-[4.2rem] space-y-0.5 border-t border-border pt-2 font-mono text-sm">
      {KINDS.map(
        (kind, i) =>
          k > i && (
            <div key={kind} className={FADE}>
              <span className="font-sans text-xs text-muted">{kind}</span> {TASTE[i]} × {sh(v[i])} = {sh(parts[i])}
            </div>
          ),
      )}
      {k > 2 && (
        <div className={`${FADE} text-base`}>
          <span className="font-sans text-xs text-muted">যোগ</span> <b>{sh(parts[0] + parts[1])}</b>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props for the story scenes that cast.tsx doesn't have: a film box (a poster
// with a strip of film across its top), something carried that glides with
// its carrier, the club's sack of films, and সামিন's খাতা. Fixed ink, like the
// rest of a Stage.

const S_INK = "#0f1b2d";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** A film box, bottom-centre at (x, y), a title in white if there's room. */
function S_Film({ x = 0, y = 0, w = 14, h = 20, color, title }: { x?: number; y?: number; w?: number; h?: number; color: string; title?: string }) {
  const holes = Math.max(1, Math.floor((w - 2) / 5));
  return (
    <g className="pointer-events-none">
      <rect x={x - w / 2} y={y - h} width={w} height={h} rx={1.5} fill={color} stroke={S_INK} strokeOpacity={0.35} strokeWidth={0.8} />
      <rect x={x - w / 2} y={y - h} width={w} height={4} fill="#1f2937" />
      {Array.from({ length: holes }, (_, i) => (
        <rect key={i} x={x - w / 2 + 1.5 + i * 5} y={y - h + 1} width={2} height={2} fill="white" />
      ))}
      {title && (
        <text x={x} y={y - h / 2 + 4.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="white">
          {title}
        </text>
      )}
    </g>
  );
}

/** Something that glides to (x, y) over `ms`, the way a Person does: draw it around (0, 0). */
function S_Carry({ x, y, ms = 1200, children }: { x: number; y: number; ms?: number; children: ReactNode }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {children}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the movie club opens at
//      the fair. নাসিব calls out the service beside the stall and holds up
//      the shape of a score card, (drama, comedy); then ফাহিমের মামা walks up
//      first thing in the morning and says what he wants. No films scored yet.

const S1_Y = 150;
const S1_STALL = 186;
const S1_NASIB = 262;
const S1_MAMA = 100;
const S1_FILMS = ["#e11d48", "#0d9488", "#7c3aed"];

export function MamaAtClub({}: Story) {
  const s = useScene(4, [600, 2400, 1400, 1900]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="নাসিবের movie club stall at the fair; নাসিব shows a score card (drama, comedy), and ফাহিমের মামা walks up asking for a comedy">
        <Stall x={S1_STALL} y={S1_Y} w={96} sign="Movie Club" color="#7c3aed" />
        {S1_FILMS.map((c, i) => (
          <S_Film key={c} x={S1_STALL - 26 + i * 26} y={S1_Y - 24} w={20} h={20} color={c} />
        ))}
        <Person who="nasib" x={S1_NASIB} y={S1_Y} facing={-1} mood="happy" arm={k === 1 ? "wave" : k >= 2 ? "hold" : "down"} label />
        {k === 1 && <Bubble x={S1_NASIB} y={S1_Y - 66} side="left" lines={["পছন্দ বলুন,", "মুভি বেছে দেবো!"]} />}
        {k >= 2 && <CastCard x={S1_NASIB - 6} y={S1_Y - 76} text="(drama, comedy)" tone="blue" />}
        <Person who="mama" x={k >= 3 ? S1_MAMA : -30} y={S1_Y} walking={k === 3} ms={1500} mood={k >= 4 ? "happy" : "plain"} label={k >= 3} />
        {k >= 4 && <Bubble x={S1_MAMA} y={S1_Y - 66} lines={["আমার ", "comedy movie লাগবে!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The loud film. মামা (2, 5) loves comedy. Titanic (5, 2) against Mr. Bean
//     (1, 4): predict the winner, then run the club's rule line by line.
//     20 vs 22, almost a tie.

const LOUD_GUESS = ["Mr. Bean, অনেক বেশি ব্যবধানে", "Mr. Bean, তবে অল্প ব্যবধানে", "Titanic"];

export function LoudFilm() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed("ran", false);
  const { k, running, play } = usePlay(450);
  const shown = ran && !running ? 6 : k;
  const over = ran && !running;

  const run = () => {
    setRan(true);
    play(6, () => pass("মাত্র 22 বনাম 20, প্রায় সমান!"));
  };

  return (
    <>
      <Speech who="ফাহিমের মামা" initial="মা">
        আমি Comedy মুভি  ছাড়া দেখিই না। একটা ভালো Comedy মুভি দাও তো।
      </Speech>
      <div className="mx-auto mt-4 max-w-xs rounded-xl border-2 border-cat-blue/40 bg-surface px-3 py-2 text-center">
        <div className="text-xs font-semibold text-muted">মামার পছন্দ (drama, comedy)</div>
        <div className="font-mono text-xl font-bold text-cat-blue">{tupS(TASTE)}</div>
      </div>
      <div className="mt-3 text-center text-sm text-muted">Club-এর নিয়মটা এরকম: মামার পছন্দ আর ছবির score ঘরে ঘরে গুণ করে যোগ করা হয়। নম্বর যত বেশি, ছবি তত মানানসই।</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <FilmCard name="Titanic" kind="drama" v={TITANIC} tone="coral">
          {ran && <RuleLines v={TITANIC} k={Math.min(shown, 3)} />}
        </FilmCard>
        <FilmCard name="Mr. Bean's Holiday" kind="comedy" v={BEAN} tone="teal">
          {ran && <RuleLines v={BEAN} k={Math.max(shown - 3, 0)} />}
        </FilmCard>
      </div>
      {guess !== null && !ran && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={run} className={primaryBtn}>
            Run the rule
          </button>
        </div>
      )}
      <div className="mt-4 text-sm font-medium text-muted">বলুন তো, কোন ছবি বেশি নম্বর পাবে?</div>
      <div className="mt-2 grid gap-2">
        {LOUD_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {over && guess !== null && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
          {guess === 1
            ? "আপনার guess ঠিক। কিন্তু comedy-পাগল মামার জন্য একটা drama-র কি এত কাছাকাছি হওয়ার কথা ছিল?"
            : guess === 0
              ? "উঁহু, ব্যবধান মাত্র 2। Titanic তো প্রায় ধরেই ফেলেছিল! 22 হল 20 এর মাত্র 1.5 গুণ।"
              : "অল্পের জন্য বেঁচে গেল Mr. Bean, 22 vs 20। তবে আপনার সন্দেহটা অমূলক না"}
        </div>
      )}
      <Task done={over}>আগে বলুন কে জিতবে, তারপর club-এর নিয়মটা চালিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1¼ · A figure for screen 1's explanation, no task: the খটকা. মামার card
//      (2, 5) leans on comedy; in the comedy slot Mr. Bean has 4 and Titanic
//      only 2, yet the club's totals, 22 and 20, sit almost side by side.

/** A bar that grows to `frac` of its track when `on`, its number beside it. */
function X_Bar({ on, frac, tone, n }: { on: boolean; frac: number; tone: Ink; n: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-4 flex-1 rounded-md bg-foreground/5">
        <div style={{ width: on ? `${frac * 100}%` : "0%" }} className={`h-full rounded-md transition-[width] duration-700 ease-out motion-reduce:transition-none ${INK[tone].bar}`} />
      </div>
      <span className="w-9 shrink-0 font-mono text-sm font-bold tabular-nums">{on ? n : ""}</span>
    </div>
  );
}

const X1_ROWS: { name: string; v: XY; tone: Ink }[] = [
  { name: "Mr. Bean", v: BEAN, tone: "teal" },
  { name: "Titanic", v: TITANIC, tone: "coral" },
];

export function OddTie() {
  const s = useScene(3, [600, 1500, 1600]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "মামার card (2, 5)। সবচেয়ে বড় নম্বরটা comedy-র ঘরে।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>Comedy-র ঘরে Mr. Bean পেয়েছে 4, আর Titanic মাত্র 2।</span>
        ) : (
          <span key="c3" className={FADE}>অথচ club-এর নম্বরে দুইজন প্রায় গায়ে গায়ে, 22 আর 20।</span>
        )
      }
    >
      <div className="mx-auto max-w-xs">
        <div className="mb-2 text-center text-sm">
          <span className="text-muted">মামার card </span>
          <span className="font-mono font-bold text-cat-blue">
            (2,{" "}
            <span className={`rounded px-0.5 transition-colors duration-500 motion-reduce:transition-none ${k >= 1 ? "bg-cat-blue/15" : ""}`}>5</span>)
          </span>
        </div>
        <div className="grid grid-cols-[4.4rem_1fr_1fr] items-center gap-x-2 gap-y-1.5">
          <span />
          <span className="text-center text-xs text-muted">Comedy-র ঘর</span>
          <span className="text-center text-xs text-muted">club-এর নম্বর</span>
          {X1_ROWS.map((r) => (
            <div key={r.name} className="contents">
              <span className={`text-right text-sm font-semibold ${INK[r.tone].text}`}>{r.name}</span>
              <X_Bar on={k >= 2} frac={r.v[1] / 5} tone={r.tone} n={`${r.v[1]}`} />
              <X_Bar on={k >= 3} frac={score(r.v) / 24} tone={r.tone} n={`${score(r.v)}`} />
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 1⅓ · A figure for screen 1's explanation, no task: the rule as a closed
//      box. মামার card and Mr. Bean's card slide in, 22 comes out; what it
//      does is written on the box, but why it works gets a "কেন?" tag and is
//      left for the next article.

const X1B_IN: { who: string; card: string; border: string }[] = [
  { who: "মামা", card: "(2, 5)", border: "border-cat-blue/40" },
  { who: "Mr. Bean", card: "(1, 4)", border: INK.teal.border },
];

export function BlackBox() {
  const s = useScene(3, [700, 1400, 1500]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k < 1 ? (
          "Club-এর নিয়মটা আপাতত একটা black box।"
        ) : k < 2 ? (
          <span key="c1" className={FADE}>মামার পছন্দ আর ছবির card, দুইটাই ঢুকলো ভেতরে।</span>
        ) : k < 3 ? (
          <span key="c2" className={FADE}>বের হলো একটা নম্বর, 22। কী করে সেটা জানি, ঘরে ঘরে গুণ করে যোগ।</span>
        ) : (
          <span key="c3" className={FADE}>কিন্তু এটা কেন কাজ করে? সেই গল্পটা পরের কোনো journey-তে আসবে।</span>
        )
      }
    >
      <div className="mx-auto flex max-w-xs items-center justify-center gap-2 pt-2">
        <div className="w-[5.6rem] shrink-0 space-y-1.5">
          {X1B_IN.map((c, i) => {
            const face = (
              <>
                <div className="text-xs text-muted">{c.who}</div>
                <div className="font-mono text-sm font-bold">{c.card}</div>
              </>
            );
            return (
              <div key={c.who} className={`relative rounded-lg border-2 bg-surface px-2 py-0.5 text-center ${c.border}`}>
                {face}
                {k >= 1 && (
                  // a copy of the card slides off into the box; the card itself stays put
                  <div
                    style={{ transitionDelay: `${i * 200}ms` }}
                    className={`absolute -inset-0.5 translate-x-24 rounded-lg border-2 bg-surface px-2 py-0.5 opacity-0 transition-[translate,opacity] duration-1000 ease-in motion-reduce:transition-none starting:translate-x-0 starting:opacity-100 ${c.border}`}
                  >
                    {face}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="relative z-10 grid h-20 w-24 shrink-0 place-items-center rounded-xl px-2 text-center shadow-md" style={{ backgroundColor: "#1f2937", color: "#e2e8f0" }}>
          <div className="text-xs leading-snug">ঘরে ঘরে গুণ, তারপর যোগ</div>
          {k >= 3 && <span className={`${POP} absolute -top-3 -right-2 rounded-full bg-cat-amber px-2 text-sm font-bold text-white`}>কেন?</span>}
        </div>
        <div className="w-10 shrink-0 text-center">
          {k >= 2 && <span className={`${POP} inline-block font-mono text-2xl font-bold text-cat-teal`}>22</span>}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: what's at stake. Mr. Bean
//      22 and Titanic 20 race as bars; then a new song nudges both of
//      Titanic's scores to (5.5, 2.5), and its bar sails past Bean's mark to
//      23.5. Two points was all that stood between মামা and Titanic.

const SC_SONG: XY = [5.5, 2.5];
const SC_TOP = 25;

export function SongTips() {
  const s = useScene(4, [400, 800, 1300, 1000]);
  const k = s.k;
  const tit = k >= 3 ? SC_SONG : TITANIC;
  const rows: { name: string; card: XY; n: number; on: boolean; tone: Ink; key: string }[] = [
    { name: "Mr. Bean", card: BEAN, n: score(BEAN), on: k >= 1, tone: "teal", key: "b" },
    { name: "Titanic", card: tit, n: k >= 4 ? score(SC_SONG) : score(TITANIC), on: k >= 2, tone: "coral", key: k >= 3 ? "t2" : "t" },
  ];

  return (
    <Scene
      scene={s}
      caption={
        k < 3 ? (
          "মামার পছন্দ (2, 5) ধরে আজকের হিসাব। Mr. Bean এগিয়ে, তবে মাত্র 2 নম্বরে।"
        ) : k < 4 ? (
          <span className={FADE}>এবার Titanic-এ একটা নতুন গান যোগ হলো, তাই তার দুইটা score-ই একটু বাড়লো।</span>
        ) : (
          <span className={FADE}>ব্যস, Titanic পেল 23.5, আর দাগ পেরিয়ে গেল। মামার হাতে এবার Titanic!</span>
        )
      }
    >
      <div className="mx-auto max-w-xs space-y-3 pt-1">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-2">
            <div className="w-[4.6rem] shrink-0 text-right leading-tight">
              <div className={`text-sm font-semibold ${INK[r.tone].text}`}>{r.name}</div>
              <div key={r.key} className={`${FADE} font-mono text-xs ${r.key === "t2" ? "font-bold text-cat-coral" : "text-muted"}`}>
                {tupS(r.card)}
              </div>
            </div>
            <div className="relative h-5 flex-1 rounded-md bg-foreground/5">
              <div
                style={{ width: r.on ? `${(r.n / SC_TOP) * 100}%` : "0%" }}
                className={`h-full rounded-md transition-[width] duration-700 ease-out motion-reduce:transition-none ${INK[r.tone].bar}`}
              />
              {r.key !== "b" && k >= 1 && (
                <div style={{ left: `${(score(BEAN) / SC_TOP) * 100}%` }} className={`${FADE} absolute -inset-y-1 w-0 border-l-2 border-dashed border-cat-teal`} />
              )}
              {r.key === "t2" && k < 4 && (
                <span className={`${POP} absolute top-1/2 left-1 -translate-y-1/2 rounded-full bg-surface px-2 text-xs font-semibold text-cat-coral`}>+ নতুন score</span>
              )}
            </div>
            <div className="w-9 shrink-0 font-mono text-sm font-bold tabular-nums">
              {r.on ? (
                <span key={r.n} className={`${POP} inline-block`}>
                  {sh(r.n)}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2 · Why so loud? The two films as arrows. Measure both (5.39 vs 4.12), then
//     stretch Titanic by ×0.5 and ×2: same direction, and the score follows
//     the length, 10 and 40.

const FW = makeFrame(0, 10, 0, 5, 28);
const W_SCALES = [0.5, 1, 2];

export function WhyLoud() {
  const pass = useGate();
  const [measured, setMeasured] = useSeed<string[]>("measured", []);
  const [lam, setLam] = useSeed("lam", 1);
  const [seen, setSeen] = useSeed<number[]>("seen", [1]);
  const both = measured.length === 2;
  const tip: XY = [TITANIC[0] * lam, TITANIC[1] * lam];
  const done = both && seen.includes(0.5) && seen.includes(2);

  const measure = (id: string) => {
    if (!measured.includes(id)) setMeasured([...measured, id]);
  };
  const turn = (n: number) => {
    setLam(n);
    if (seen.includes(n)) return;
    const next = [...seen, n];
    setSeen(next);
    if (next.includes(0.5) && next.includes(2)) pass("Arrow দ্বিগুণ লম্বা, score-ও দ্বিগুণ।");
  };

  return (
    <>
      <Plane f={FW} ticks={1} label={`Titanic as an arrow to ${tupS(tip)}, Mr. Bean to (1, 4)`} className="max-w-[20rem]">
        {lam !== 1 && <Arrow f={FW} from={O} to={TITANIC} tone="coral" w={2} dashed faint />}
        {lam === 1 && measured.includes("t") && <Tape f={FW} from={O} to={TITANIC} />}
        {measured.includes("b") && <Tape f={FW} from={O} to={BEAN} />}
        <Arrow f={FW} from={O} to={tip} tone="coral" w={3} />
        <Arrow f={FW} from={O} to={BEAN} tone="teal" w={3} />
        <Label f={FW} at={tip} dx={-4} dy={-8} anchor="end" className="fill-cat-coral">
          Titanic
        </Label>
        <Label f={FW} at={BEAN} dx={6} dy={4} anchor="start" className="fill-cat-teal">
          Mr. Bean
        </Label>
      </Plane>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={measured.includes("t")} onClick={() => measure("t")} className={`${pill(measured.includes("t"))} font-sans`}>
          {measured.includes("t") ? <span className={FADE}>Titanic 5.39 ঘর লম্বা</span> : "Titanic মাপুন"}
        </button>
        <button type="button" disabled={measured.includes("b")} onClick={() => measure("b")} className={`${pill(measured.includes("b"))} font-sans`}>
          {measured.includes("b") ? <span className={FADE}>Mr. Bean 4.12 ঘর লম্বা</span> : "Mr. Bean মাপুন"}
        </button>
      </div>
      {both && (
        <div className={`${FADE} mt-4 rounded-2xl border border-border px-4 py-3`}>
          <div className="text-center text-[0.95rem]">ধরেন club-এর কেউ Titanic-এর দুইটা score-ই দ্বিগুণ করে বসালো, বা অর্ধেক। ছবিটা তো একই আছে, দিকও একই। তাহলে score-এর কী হবে?</div>
          <div className="mt-3 flex justify-center gap-2">
            {W_SCALES.map((s) => (
              <button key={s} type="button" onClick={() => turn(s)} className={pill(lam === s)}>
                × {s}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-xs text-muted">Titanic</div>
              <div className="font-mono text-sm">length {sh(len(tip))}</div>
              <div className="font-mono text-lg">
                score{" "}
                <b key={lam} className={`${POP} inline-block ${score(tip) > score(BEAN) ? "text-cat-coral" : ""}`}>
                  {sh(score(tip))}
                </b>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">Mr. Bean</div>
              <div className="font-mono text-sm">length 4.12</div>
              <div className="font-mono text-lg">
                score <b>{score(BEAN)}</b>
              </div>
            </div>
          </div>
        </div>
      )}
      <Ticks
        items={[
          ["দুইটা arrow মাপা", both],
          ["× 2", seen.includes(2)],
          ["× 0.5", seen.includes(0.5)],
        ]}
      />
      <Task done={done}>আগে দুইটা arrow ফিতা দিয়ে মাপুন। তারপর Titanic-কে দ্বিগুণ আর অর্ধেক করে score-টা দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2¼ · A figure for screen 2's explanation, no task: kind against length.
//      মামার রুচি as a dashed ray; Mr. Bean points almost along it but is
//      short (4.12); Titanic points far away but is long (5.39), and still
//      scores 20 against 22. The pull came from the length.

const X2_F = makeFrame(0, 5.4, 0, 5.2, 24, 6);
const X2_RAY: XY = [5.2 * (TASTE[0] / TASTE[1]), 5.2];

export function LongNotNear() {
  const s = useScene(4, [600, 1300, 1500, 1500]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "ড্যাশ দাগটা মামা যেমন পছন্দ করে তার দিক, comedy-র দিকে হেলানো।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>Mr. Bean তাক করা মামা যেদিকে প্রায় সেদিকেই, তবে arrow-টা shorter।</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>Titanic তাক করা অন্য দিকে, কিন্তু arrow-টা লম্বা।</span>
        ) : (
          <span key="c4" className={FADE}>দিকে পিছিয়ে থেকেও Titanic পেল 20। জোরটা এসেছে length থেকে।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8.8rem] shrink-0">
          <Plane f={X2_F} label="মামার taste as a dashed ray toward (2, 5); Mr. Bean (1, 4) points almost along it, 4.12 long; Titanic (5, 2) points far away, 5.39 long" className="my-0! max-w-none">
            {k >= 1 && <path d={`M${X2_F.sx(0)} ${X2_F.sy(0)}L${X2_F.sx(X2_RAY[0])} ${X2_F.sy(X2_RAY[1])}`} strokeWidth={2} strokeDasharray="5 4" className={`${FADE} stroke-cat-blue`} />}
            {k >= 1 && (
              <Label f={X2_F} at={X2_RAY} dx={5} dy={15} anchor="start" size={10} className={`${FADE} fill-cat-blue`}>
                মামা
              </Label>
            )}
            {k >= 2 && <Arrow f={X2_F} from={O} to={BEAN} tone="teal" w={3} draw />}
            {k >= 3 && <Arrow f={X2_F} from={O} to={TITANIC} tone="coral" w={3} draw />}
            {k >= 3 && (
              <Label f={X2_F} at={TITANIC} dx={-2} dy={-8} anchor="end" size={10} className={`${FADE} fill-cat-coral`}>
                Titanic
              </Label>
            )}
          </Plane>
        </div>
        <div className="min-w-0 space-y-2 text-sm">
          <div className="min-h-[2.6rem]">
            {k >= 2 && (
              <div className={FADE}>
                <div className="font-semibold text-cat-teal">Mr. Bean</div>
                <div className="leading-tight">
                  মোটামুটি কাছাকাছি দিকে, length <span className="font-mono">4.12</span>
                </div>
              </div>
            )}
          </div>
          <div className="min-h-[2.6rem]">
            {k >= 3 && (
              <div className={FADE}>
                <div className="font-semibold text-cat-coral">Titanic</div>
                <div className="leading-tight">
                  দিকে দূরে, length <b className={`font-mono transition-colors duration-500 motion-reduce:transition-none ${k >= 4 ? "text-cat-coral" : ""}`}>5.39</b>
                </div>
              </div>
            )}
          </div>
          <div className="min-h-6">
            {k >= 4 && (
              <div className={`${FADE} font-mono`}>
                <b className="text-cat-coral">20</b> <span className="font-sans text-muted">বনাম</span> <b className="text-cat-teal">22</b>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: 3.2's শরবত next to the
//      loud film. The recipe card (2, 4) fills ৪টা glass; doubled to (4, 8) it
//      fills ৮টা, all the same colour. Then Titanic (5, 2) and its double
//      (10, 4) drawn on one line: same direction, twice the arrow, 20 → 40.

const SC_RECIPE: XY = [2, 4];
const SC_FT = makeFrame(0, 10.6, 0, 4.4, 15, 8);
const SC_DOUBLE: XY = [10, 4];

function SC_Glasses({ n, from = 0 }: { n: number; from?: number }) {
  return (
    <div className="flex justify-center gap-1">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="relative h-7 w-4 overflow-hidden rounded-b-md border-2 border-t-0 border-muted/60">
          <div
            style={{ transitionDelay: `${(from + i) * 90}ms` }}
            className="absolute inset-x-0 bottom-0 h-[80%] bg-cat-amber/70 transition-[height] duration-500 ease-out motion-reduce:transition-none starting:h-0"
          />
        </div>
      ))}
    </div>
  );
}

export function DoubleBatch() {
  const s = useScene(4, [400, 1200, 1300, 1100]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          `শরবতের card (2, 4), মানে ${bn(2)}টা লেবু আর ${bn(4)} চামচ চিনি।`
        ) : k < 3 ? (
          <span className={FADE}>পুরো card দ্বিগুণ: গ্লাস বেশি, কিন্তু রং আর স্বাদ হুবহু আগের মতো।</span>
        ) : k < 4 ? (
          <span className={FADE}>এবার Titanic-এর card (5, 2)। মামার কাছে নম্বর 20।</span>
        ) : (
          <span className={FADE}>দ্বিগুণ Titanic একই লাইনে, শুধু arrow দ্বিগুণ লম্বা। আর নম্বরও 20 থেকে 40।</span>
        )
      }
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div className="text-center">
          {k >= 1 && (
            <div className={FADE}>
              <SC_Glasses n={4} />
              <div className="mt-1 font-mono text-sm font-bold text-cat-blue">{tupS(SC_RECIPE)}</div>
            </div>
          )}
        </div>
        <div className="pb-1 font-mono text-sm text-muted">{k >= 2 && <span className={FADE}>× 2 →</span>}</div>
        <div className="text-center">
          {k >= 2 && (
            <div className={FADE}>
              <SC_Glasses n={8} from={2} />
              <div className="mt-1 font-mono text-sm font-bold text-cat-teal">{tupS([SC_RECIPE[0] * 2, SC_RECIPE[1] * 2])}</div>
            </div>
          )}
        </div>
      </div>
      <Plane f={SC_FT} axes={false} label="Titanic (5, 2) scores 20; doubled to (10, 4) it points the same way, twice as long, and scores 40" className="my-1! max-w-[12rem]">
        {k >= 3 && <line x1={SC_FT.sx(0)} y1={SC_FT.sy(0)} x2={SC_FT.sx(10.6)} y2={SC_FT.sy(4.24)} strokeWidth={1} strokeDasharray="3 4" className="stroke-[#0f1b2d]/30" />}
        {k >= 4 && <Arrow f={SC_FT} from={O} to={SC_DOUBLE} tone="violet" w={3} draw />}
        {k >= 3 && <Arrow f={SC_FT} from={O} to={TITANIC} tone="coral" w={3.4} draw />}
        {k >= 3 && (
          <Label f={SC_FT} at={TITANIC} dx={-4} dy={-7} anchor="end" size={10} className={`${FADE} fill-cat-coral`}>
            20
          </Label>
        )}
        {k >= 4 && (
          <Label f={SC_FT} at={SC_DOUBLE} dx={5} dy={8} anchor="start" size={10} className={`${FADE} fill-cat-violet`}>
            40
          </Label>
        )}
        <circle cx={SC_FT.sx(0)} cy={SC_FT.sy(0)} r={3} className="fill-[#0f1b2d]" />
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · Shrink to one. A λ slider on (3, 4), then on (1.5, 2), each stopped where
//     its length is exactly 1. Both land on (0.6, 0.8): λ was 1 ÷ its length.

const FS = makeFrame(0, 4, 0, 4, 48);
const SHRINK: XY[] = [
  [3, 4],
  [1.5, 2],
];
const LANDING = unit(SHRINK[0]);

export function ShrinkToOne() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const [lam, setLam] = useSeed("lam", 1);
  const [hit, setHit] = useSeed<boolean[]>("hit", [false, false]);
  const v = SHRINK[stage];
  const L = len(v);
  const tip: XY = [v[0] * lam, v[1] * lam];
  const now = L * lam;
  const on = hit[stage];
  const all = hit[0] && hit[1];

  const slide = (n: number) => {
    if (on) return;
    setLam(n);
    if (Math.abs(L * n - 1) > 1e-6) return;
    const next = stage === 0 ? [true, false] : [true, true];
    setHit(next);
    if (stage === 1) pass("নিজের lengthে ভাগ করলে length 1।");
  };
  const nextArrow = () => {
    setStage(1);
    setLam(1);
  };

  return (
    <>
      <Plane f={FS} ticks={1} label={`${tupS(v)} times ${sh(lam)} is ${tupS(tip)}, length ${now.toFixed(2)}`} className="max-w-[15rem]">
        <path
          d={`M${FS.sx(1)} ${FS.sy(0)}A${FS.u} ${FS.u} 0 0 0 ${FS.sx(0)} ${FS.sy(1)}`}
          strokeWidth={2}
          strokeDasharray="4 4"
          className="pointer-events-none fill-none stroke-[#d97706]"
        />
        <Label f={FS} at={[1, 0]} dx={4} dy={-8} anchor="start" size={9} className="fill-[#b45309]">
          length 1
        </Label>
        {stage === 1 && <Arrow f={FS} from={O} to={SHRINK[0]} tone="ink" w={1.5} dashed faint />}
        <Arrow f={FS} from={O} to={v} tone="ink" w={2} dashed faint />
        <Arrow f={FS} from={O} to={tip} tone={on ? "teal" : "blue"} w={3} />
        {all && <circle cx={FS.sx(LANDING[0])} cy={FS.sy(LANDING[1])} r={5} className={`${POP} pointer-events-none fill-accent`} />}
      </Plane>
      <div className={FADE}>
        <div className="mt-3 text-center font-mono text-lg">
          {sh(lam)} × {tupS(v)} = <b className={on ? "text-cat-teal" : "text-cat-blue"}>{tupS(tip)}</b>
        </div>
        <div className="text-center">
          length{" "}
          <b className={`font-mono text-lg ${on ? "text-accent-text" : ""}`}>{now.toFixed(2)}</b>
        </div>
        <label className="mx-auto mt-2 flex max-w-sm items-center gap-3">
          <span className="shrink-0 font-serif text-lg italic text-muted">λ</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={lam}
            disabled={on}
            aria-label="λ, কত গুণ"
            onChange={(e) => slide(Number(e.target.value))}
            className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)] disabled:cursor-default"
          />
        </label>
        <div className="mt-2 min-h-7 text-center text-[0.95rem]">
          {stage === 0 && hit[0] ? (
            <span className={FADE}>
              লাগলো 1/5, মানে 0.2। length 5 ছিল, তাই পাঁচ ভাগের এক ভাগ। এবার একই দিকে একটাছোট arrow।
            </span>
          ) : all ? (
            <span className={`${FADE} text-accent-text`}>দুইটা arrow শুরু করেছিল আলাদা length নিয়ে, অথচ থামলো একই বিন্দুতে!</span>
          ) : stage === 1 ? (
            <span className="text-muted">(1.5, 2)-এর length 2.5। এবার λ কত লাগবে বলে মনে হয়?</span>
          ) : (
            <span className="text-muted">(3, 4)-এর length 5। কমলা দাগটা ঠিক 1 দূরে, arrow-এর মাথাটা ওখানে নিয়ে আসুন।</span>
          )}
        </div>
        {stage === 0 && hit[0] && (
          <div className={`${FADE} mt-1 flex justify-center`}>
            <button type="button" onClick={nextArrow} className={primaryBtn}>
              পরের arrow
            </button>
          </div>
        )}
        {all && (
          <table className={`${FADE} mx-auto mt-2 text-center font-mono tabular-nums`}>
            <thead>
              <tr className="font-sans text-xs text-muted">
                <th className="px-3 pb-1 font-normal">arrow</th>
                <th className="px-3 pb-1 font-normal">length</th>
                <th className="px-3 pb-1 font-normal">λ</th>
                <th className="px-3 pb-1 font-normal">কোথায় থামলো</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3">(3, 4)</td>
                <td className="px-3">5</td>
                <td className="px-3">1/5</td>
                <td className="px-3 font-bold text-cat-teal">(0.6, 0.8)</td>
              </tr>
              <tr>
                <td className="px-3">(1.5, 2)</td>
                <td className="px-3">2.5</td>
                <td className="px-3">1/2.5</td>
                <td className="px-3 font-bold text-cat-teal">(0.6, 0.8)</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
      <Ticks
        items={[
          ["(3, 4)-কে length 1", hit[0]],
          ["(1.5, 2)-কে length 1", hit[1]],
        ]}
      />
      <Task done={all}>λ বাড়িয়ে কমিয়ে দুইটা arrow-এর length ঠিক 1 বানান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the table as two tapes.
//      (3, 4) is 5 long, (1.5, 2) is 2.5 long, and a dashed mark stands at 1.
//      Each tape is divided by its own length, ÷ 5 and ÷ 2.5, and both stop
//      on the mark: the longer one needed the bigger division.

const X3_TOP = 5.4;
const X3_TAPES: { v: string; L: number; by: string }[] = [
  { v: "(3, 4)", L: 5, by: "÷ 5" },
  { v: "(1.5, 2)", L: 2.5, by: "÷ 2.5" },
];

export function OwnLength() {
  const s = useScene(3, [600, 1500, 1500]);
  const k = s.k;
  const mark = `${(1 / X3_TOP) * 100}%`;

  return (
    <Scene
      scene={s}
      caption={
        k < 1 ? (
          "(3, 4) 5 লম্বা, (1.5, 2) 2.5 লম্বা। কমলা দাগটা 1-এ।"
        ) : k < 2 ? (
          <span key="c1" className={FADE}>বড়টাকে ভাগ করলাম তার নিজের length 5 দিয়ে। থামলো ঠিক 1-এ।</span>
        ) : k < 3 ? (
          <span key="c2" className={FADE}>ছোটটাকে তার নিজের 2.5 দিয়ে। সেও এসে থামলো 1-এ।</span>
        ) : (
          <span key="c3" className={FADE}>বেশি লম্বা হলে বেশি ভাগ, কম লম্বা হলে কম। দুইজনই এখন 1।</span>
        )
      }
    >
      <div className="mx-auto max-w-xs pt-1">
        <div className="grid grid-cols-[4.4rem_1fr_3.1rem] items-center gap-x-2 gap-y-2.5">
          <span />
          <div className="relative h-3">
            <span style={{ left: mark }} className="absolute -top-0.5 -translate-x-1/2 font-mono text-xs font-bold text-cat-amber">
              1
            </span>
          </div>
          <span />
          {X3_TAPES.map((t, i) => {
            const cut = k >= i + 1;
            return (
              <div key={t.v} className="contents">
                <span className="text-right font-mono text-sm font-bold whitespace-nowrap">{t.v}</span>
                <div className="relative h-4 rounded-md bg-foreground/5">
                  <div
                    style={{ width: `${((cut ? 1 : t.L) / X3_TOP) * 100}%` }}
                    className={`h-full rounded-md transition-[width,background-color] duration-1000 ease-in-out motion-reduce:transition-none ${cut ? "bg-cat-teal" : "bg-cat-blue"}`}
                  />
                  <div style={{ left: mark }} className="absolute -inset-y-1 w-0 border-l-2 border-dashed border-cat-amber" />
                </div>
                <span className="font-mono text-sm tabular-nums">
                  {cut ? (
                    <b key="cut" className={`${POP} inline-block text-cat-violet`}>
                      {t.by}
                    </b>
                  ) : (
                    <span className="text-muted">{t.L}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A figure for screen 3's explanation, no task: why both stopped on one
//      spot. (3, 4)'s own line, dashed; (1.5, 2) is exactly half of it, on the
//      same line. Multiplying by λ slides each tip along that line, so both
//      glide down to (0.6, 0.8) and become one. Its name lands: normalise.

const X3_F = makeFrame(0, 3.3, 0, 4.2, 30, 6);
const X3_LINE: XY = [3.15, 4.2];

export function SameLine() {
  const s = useScene(4, [600, 1300, 1500, 1700]);
  const k = s.k;
  const [a, b] = useTween(k >= 3 ? [0.2, 0.4] : [1, 1], 1200);
  const R = X3_F.u;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "(3, 4)-এর নিজের লাইন, শুরু থেকে একই দিকে টানা।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>(1.5, 2) ঠিক তার অর্ধেক, একই লাইনের ওপর।</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>λ দিয়ে গুণ করলে arrow লাইন ধরেই ছোট হয়, লাইন ছাড়ে না।</span>
        ) : (
          <span key="c4" className={FADE}>length এর  পার্থক্য ঘুচতেই দুইজন হুবহু এক। এই কাজের নাম normalise।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[7rem] shrink-0">
          <Plane f={X3_F} label="(3, 4) and its half (1.5, 2) on one line through the start; both shrink along it to (0.6, 0.8)" className="my-0! max-w-none">
            <path d={`M${X3_F.sx(1)} ${X3_F.sy(0)}A${R} ${R} 0 0 0 ${X3_F.sx(0)} ${X3_F.sy(1)}`} strokeWidth={2} strokeDasharray="4 4" className="fill-none stroke-[#d97706]" />
            {k >= 1 && <path d={`M${X3_F.sx(0)} ${X3_F.sy(0)}L${X3_F.sx(X3_LINE[0])} ${X3_F.sy(X3_LINE[1])}`} strokeWidth={1.2} strokeDasharray="3 4" className={`${FADE} stroke-[#0f1b2d]/40`} />}
            {k >= 2 && <Arrow f={X3_F} from={O} to={[3 * a, 4 * a]} tone="blue" w={3} />}
            {k >= 2 && <Arrow f={X3_F} from={O} to={[1.5 * b, 2 * b]} tone="violet" w={3.4} />}
            {k >= 4 && <circle cx={X3_F.sx(0.6)} cy={X3_F.sy(0.8)} r={5} className={`${POP} fill-accent`} />}
          </Plane>
        </div>
        <div className="min-w-0 space-y-2 font-mono text-sm">
          {k >= 2 && (
            <div className={FADE}>
              <div className="font-bold text-cat-blue">(3, 4)</div>
              <div className="font-bold text-cat-violet">
                (1.5, 2) <span className="font-sans text-xs font-normal text-muted">অর্ধেক</span>
              </div>
            </div>
          )}
          {k >= 3 && (
            <div className={FADE}>
              <span className="font-sans text-xs text-muted">দুইজনই থামলো</span>
              <div className="font-bold text-cat-teal">(0.6, 0.8)</div>
            </div>
          )}
          {k >= 4 && <div className={`${POP} rounded-lg bg-cat-teal/10 px-2 py-1 text-center font-sans font-bold text-cat-teal`}>normalise</div>}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: a doubt on the way to
//      মামা. নাসিব sets off from the stall with the new card (0.6, 0.8), then
//      stops short and stares at it: two numbers this small, and still 1 long?
//      Or did the slider cheat? মামা waits. The length is not told.

const S4_Y = 150;
const S4_FROM = 118;
const S4_TO = 172;
const S4_MAMA = 262;

export function TooSmallDoubt({}: Story) {
  const s = useScene(4, [600, 1500, 1600, 2600]);
  const k = s.k;
  const nx = k >= 2 ? S4_TO : S4_FROM;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="নাসিব carries the card (0.6, 0.8) toward মামা, stops, and wonders whether two numbers this small can really be 1 long">
        <Stall x={58} y={S4_Y} w={80} sign="Movie Club" color="#7c3aed" />
        <Person who="mama" x={S4_MAMA} y={S4_Y} facing={-1} label />
        <Person who="nasib" x={nx} y={S4_Y} walking={k === 2} ms={1300} mood={k >= 3 ? "puzzled" : "plain"} arm={k >= 1 ? "hold" : "down"} label />
        {k >= 1 && (
          <S_Carry x={nx} y={S4_Y - 76} ms={1300}>
            <CastCard x={0} y={0} text="(0.6, 0.8)" />
          </S_Carry>
        )}
        {k === 3 && <Bubble x={S4_TO} y={S4_Y - 90} tone="think" lines={["এত ছোট দুইটা সংখ্যা,", "length সত্যিই 1?"]} />}
        {k >= 4 && <Bubble x={S4_TO} y={S4_Y - 90} tone="think" lines={["Slider টা ভুলভাল দেখাচ্ছে না তো"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · Is (0.6, 0.8) really 1 long? Square, add, root by hand. The hat gets its name: v̂.

const HAT = [
  { k: "প্রথম ঘর", n: 0.6 },
  { k: "দ্বিতীয় ঘর", n: 0.8 },
];

export function HatCheck() {
  const pass = useGate();
  const [squared, setSquared] = useSeed<number[]>("squared", []);
  const [added, setAdded] = useSeed("added", false);
  const [rooted, setRooted] = useSeed("rooted", false);

  const square = (i: number) => {
    if (!squared.includes(i)) setSquared([...squared, i]);
  };
  const root = () => {
    setRooted(true);
    pass("0.36 + 0.64 = 1, length ঠিক 1।");
  };

  return (
    <>
      <div className="mx-auto mt-4 max-w-xs rounded-xl border-2 border-cat-teal/40 bg-surface px-3 py-2 text-center text-cat-teal">
        <div className="text-xs font-semibold text-muted">(3, 4)-কে 5 দিয়ে ভাগ করে পাওয়া</div>
        <div className="font-mono text-xl font-bold">(0.6, 0.8)</div>
      </div>
      <div className={FADE}>
        <div className="mt-4 text-center text-sm text-muted">আগের মতোই, প্রথমে প্রতিটা ঘরের বর্গ। ঘরগুলোতে tap করুন।</div>
        <div className="mx-auto mt-2 grid max-w-xs grid-cols-2 gap-2">
          {HAT.map((b, i) => {
            const on = squared.includes(i);
            return (
              <button
                key={b.k}
                type="button"
                disabled={on}
                onClick={() => square(i)}
                className={`flex cursor-pointer flex-col items-center rounded-xl border-2 px-1 py-2.5 transition-colors duration-300 motion-reduce:transition-none disabled:cursor-default ${
                  on ? "border-cat-teal/40 bg-cat-teal/5" : "border-border hover:border-cat-teal/60"
                }`}
              >
                <span className="text-xs text-muted">{b.k}</span>
                <span className="font-mono text-2xl font-bold">{b.n}</span>
                {on ? (
                  <span className={`${POP} inline-block font-mono text-sm`}>
                    {b.n}² = <b className="text-cat-teal">{sh(b.n * b.n)}</b>
                  </span>
                ) : (
                  <span className="text-xs text-muted">বর্গ করুন</span>
                )}
              </button>
            );
          })}
        </div>
        {squared.length === 2 && !added && (
          <div className={`${FADE} mt-3 flex justify-center`}>
            <button type="button" onClick={() => setAdded(true)} className={primaryBtn}>
              বর্গগুলো যোগ করুন
            </button>
          </div>
        )}
        {added && (
          <div className={`${FADE} mt-3 text-center font-mono text-lg`}>
            0.36 + 0.64 = <b className="text-cat-teal">1</b>
          </div>
        )}
        {added && !rooted && (
          <div className={`${FADE} mt-3 flex justify-center`}>
            <button type="button" onClick={root} className={`${primaryBtn} bg-cat-violet`}>
              Root নিন
            </button>
          </div>
        )}
        {rooted && (
          <>
            <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>
              √1 = <b className="font-mono">1</b>। Slider ফাঁকি দেয়নি।
            </div>
            <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-cat-teal/5 px-4 py-3 text-center`}>
              <div className="font-mono text-xl">v̂ = v ÷ ‖v‖</div>
              <div className="font-mono">
                (3, 4) ÷ 5 = <b className="text-cat-teal">(0.6, 0.8)</b>
              </div>
              <div className="mt-1 text-[0.95rem]">পড়তে হয় “v-hat”। মাথার ছোট্ট টুপিটা বলে দেয়, এই arrow-টার length ১</div>
            </div>
          </>
        )}
      </div>
      <Ticks
        items={[
          ["বর্গ", squared.length === 2],
          ["যোগ", added],
          ["root", rooted],
        ]}
      />
      <Task done={rooted}>বর্গ, যোগ আর root করে মেপে দেখুন, (0.6, 0.8) কত লম্বা।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: two small numbers, one
//      long arrow. (0.6, 0.8) on the sheet; squared they shrink to 0.36 and
//      0.64, yet add to exactly 1, so the tailor's tape along it reads 1 and
//      its tip sits on the ring. Then সামিন's walk, east 0.6 and north 0.8:
//      1.4, the other tape.

const X4_F = makeFrame(0, 1.05, 0, 1.05, 120, 8);
const X4_TIP: XY = [0.6, 0.8];

export function TwoTapes() {
  const s = useScene(4, [600, 1400, 1500, 1600]);
  const k = s.k;
  const R = X4_F.u;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "0.6 আর 0.8, দুইটাই 1-এর চেয়ে ছোট।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>বর্গ করলে আরও ছোট হয়, 0.36 আর 0.64।</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>কিন্তু যোগ করলে ঠিক 1। দর্জির ফিতায় arrow-টার length 1 </span>
        ) : (
          <span key="c4" className={FADE}>1.4 আসে সামিনের মতো হেঁটে মাপলে: আগে পূর্বে, তারপর উত্তরে।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={X4_F} grid={0.2} label="the arrow (0.6, 0.8) is exactly 1 long on the tape, its tip on the ring; walking east 0.6 then north 0.8 makes 1.4" className="my-0! max-w-none">
            <path
              d={`M${X4_F.sx(1)} ${X4_F.sy(0)}A${R} ${R} 0 0 0 ${X4_F.sx(0)} ${X4_F.sy(1)}`}
              strokeWidth={2}
              strokeDasharray="4 4"
              className={`fill-none stroke-[#d97706] transition-opacity duration-500 motion-reduce:transition-none ${k >= 3 ? "opacity-100" : "opacity-30"}`}
            />
            {k >= 3 && <Draw d={`M${X4_F.sx(0)} ${X4_F.sy(0)}L${X4_F.sx(X4_TIP[0])} ${X4_F.sy(X4_TIP[1])}`} strokeWidth={9} ms={900} className="stroke-cat-teal/30" />}
            {k >= 4 && <Draw d={`M${X4_F.sx(0)} ${X4_F.sy(0)}H${X4_F.sx(X4_TIP[0])}V${X4_F.sy(X4_TIP[1])}`} strokeWidth={2.5} ms={1200} className="stroke-cat-amber" />}
            <Arrow f={X4_F} from={O} to={X4_TIP} tone="blue" w={3} />
            {k >= 1 && (
              <>
                <Label f={X4_F} at={[0.3, 0]} dy={-5} size={9} className={`${FADE} fill-[#5a6b7d] font-mono`}>
                  0.6
                </Label>
                <Label f={X4_F} at={[0.6, 0.4]} dx={4} anchor="start" size={9} className={`${FADE} fill-[#5a6b7d] font-mono`}>
                  0.8
                </Label>
              </>
            )}
          </Plane>
        </div>
        <div className="min-w-0 space-y-1.5 font-mono text-sm tabular-nums">
          <div className="min-h-[2.5rem]">
            {k >= 2 && (
              <div className={FADE}>
                <div>0.6² = 0.36</div>
                <div>0.8² = 0.64</div>
              </div>
            )}
          </div>
          <div className="min-h-[2.5rem]">
            {k >= 3 && (
              <div className={FADE}>
                <div>
                  <span className="font-sans">যোগ</span> <b className="text-cat-teal">1</b>, <span className="font-sans">root</span> <b className="text-cat-teal">1</b>
                </div>
                <div className="font-sans text-xs text-cat-teal">দর্জির ফিতা, L2</div>
              </div>
            )}
          </div>
          <div className="min-h-[2.5rem]">
            {k >= 4 && (
              <div className={FADE}>
                <div className="text-cat-amber">0.6 + 0.8 = 1.4</div>
                <div className="font-sans text-xs text-muted">সামিনের হাঁটা, L1</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4⅔ · A figure for screen 4's explanation, no task: the hat, slot by slot.
//      v is (3, 4); its length ‖v‖ is 5; v ÷ ‖v‖ gives (0.6, 0.8); and once it
//      is 1 long a little hat drops onto the v: v̂, a unit vector.

const X4H_LINES = [
  { on: 1, body: <>v = (3, 4)</> },
  { on: 2, body: <>‖v‖ = 5</> },
  {
    on: 3,
    body: (
      <>
        v ÷ ‖v‖ = <b className="text-cat-teal">(0.6, 0.8)</b>
      </>
    ),
  },
];

export function HatOn() {
  const s = useScene(4, [600, 1300, 1300, 1600]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "ধরি v মানে card (3, 4)।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>দর্জির ফিতায় তার length 5। এটাকে লেখা হয় ‖v‖।</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>নিজের length দিয়ে ভাগ, আর পেলাম (0.6, 0.8)।</span>
        ) : (
          <span key="c4" className={FADE}>এখন ঠিক 1 লম্বা, তাই মাথায় টুপি। এর নাম unit vector।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-4 pt-1">
        <div className="relative w-14 shrink-0 text-center font-serif text-6xl leading-none text-cat-teal italic">
          <svg
            viewBox="0 0 24 12"
            aria-hidden="true"
            className={`absolute top-0 left-1/2 w-6 -translate-x-1/3 transition-[translate,opacity] duration-700 ease-out motion-reduce:transition-none ${k >= 4 ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"}`}
          >
            <path d="M2 11L12 2L22 11" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="fill-none stroke-current" />
          </svg>
          <span className="inline-block pt-3">v</span>
        </div>
        <div className="min-w-0 space-y-1">
          {X4H_LINES.map((l) => (
            <div key={l.on} className="min-h-6 font-mono text-[0.95rem]">
              {k >= l.on && <div className={FADE}>{l.body}</div>}
            </div>
          ))}
          <div className="min-h-7">
            {k >= 4 && (
              <span className={`${POP} inline-block rounded-lg bg-cat-teal/10 px-2 py-0.5 font-bold text-cat-teal`}>
                unit vector <span className="font-mono">v̂</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's explanation, no task: dividing is stretching.
//      (3, 4) ÷ 5 and 1/5 × (3, 4) both give (0.6, 0.8); then 3.2's λ-knob
//      turns from 1 down to exactly 1/5. v̂ is the old stretch, with λ chosen.

const X4K_C = 45;
/** the knob's angle for λ, clockwise from straight up, 0 at −135° and 1 at +135° */
const x4Deg = (lam: number) => -135 + 270 * lam;
const x4At = (lam: number, r: number): XY => {
  const a = (x4Deg(lam) * Math.PI) / 180;
  return [X4K_C + r * Math.sin(a), X4K_C - r * Math.cos(a)];
};

export function DivideIsStretch() {
  const s = useScene(4, [600, 1400, 1300, 1700]);
  const k = s.k;
  const lam = k >= 4 ? 0.2 : 1;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "5 দিয়ে ভাগ করলে পাই (0.6, 0.8)।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>1/5 দিয়ে গুণ করলেও হুবহু তাই। একই কথা।</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>মানে এটা আমাদের শিখে আসা সেই পুরানো λ-knob।</span>
        ) : (
          <span key="c4" className={FADE}>শুধু knob-টা ঘোরানো হলো মেপে মেপে, ঠিক 1/5-এ।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-4">
        <div className="min-w-0 space-y-2 font-mono text-sm">
          <div className="min-h-[2.6rem]">
            {k >= 1 && (
              <div className={FADE}>
                <div>(3, 4) ÷ 5</div>
                <div>
                  = <b className="text-cat-teal">(0.6, 0.8)</b>
                </div>
              </div>
            )}
          </div>
          <div className="min-h-[2.6rem]">
            {k >= 2 && (
              <div className={FADE}>
                <div>
                  <span className="text-cat-violet">1/5</span> × (3, 4)
                </div>
                <div>
                  = <b className="text-cat-teal">(0.6, 0.8)</b>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="w-[5.6rem] shrink-0">
          {k >= 3 && (
            <svg viewBox="0 0 90 100" role="img" aria-label={`λ knob at ${lam}`} className={`${FADE} block h-auto w-full`}>
              <rect x={1} y={1} width={88} height={98} rx={10} fill="white" stroke="#cbd5e1" />
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => {
                const [x1, y1] = x4At(t, 31);
                const [x2, y2] = x4At(t, 37);
                return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={t === 0.2 && k >= 4 ? 3 : 1.5} stroke={t === 0.2 && k >= 4 ? "#d97706" : "#94a3b8"} />;
              })}
              <text x={x4At(0, 40)[0] - 2} y={x4At(0, 40)[1] + 9} textAnchor="middle" fontSize={9} fill="#5a6b7d">
                0
              </text>
              <text x={x4At(1, 40)[0] + 2} y={x4At(1, 40)[1] + 9} textAnchor="middle" fontSize={9} fill="#5a6b7d">
                1
              </text>
              <circle cx={X4K_C} cy={X4K_C} r={26} fill="#f1f5f9" stroke="#0f1b2d" strokeOpacity={0.3} />
              <g
                style={{ transform: `rotate(${x4Deg(lam)}deg)`, transformOrigin: `${X4K_C}px ${X4K_C}px` }}
                className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
              >
                <line x1={X4K_C} y1={X4K_C} x2={X4K_C} y2={X4K_C - 22} strokeWidth={3.5} strokeLinecap="round" stroke="#0f1b2d" />
              </g>
              <circle cx={X4K_C} cy={X4K_C} r={4} fill="#0f1b2d" />
              <text x={X4K_C} y={92} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0f1b2d" fontFamily="ui-monospace, monospace">
                λ = {lam === 1 ? "1" : "1/5"}
              </text>
            </svg>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: the club's sack. নাসিব
//      says there are many more films; out of the sack they tumble, tall ones
//      and short ones, each leaning its own way, and the rule has to work on
//      every one of them. Nobody is normalised yet.

const S5_Y = 150;
const S5_NASIB = 112;
const S5_SACK = 150;
const S5_FILMS: { x: number; h: number; rot: number; c: string }[] = [
  { x: 190, h: 30, rot: -14, c: "#e11d48" },
  { x: 208, h: 16, rot: 10, c: "#0d9488" },
  { x: 226, h: 38, rot: 0, c: "#7c3aed" },
  { x: 245, h: 22, rot: -22, c: "#d97706" },
  { x: 263, h: 34, rot: 16, c: "#2563eb" },
  { x: 280, h: 13, rot: -6, c: "#db2777" },
  { x: 298, h: 26, rot: 24, c: "#0891b2" },
];

function S5_Sack({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 19} ${y}q-4 -22 13 -29h12q17 7 13 29Z`} fill="#c8a165" stroke="#7c5a2a" strokeWidth={1} />
      <path d={`M${x - 6} ${y - 29}l-7 -10q3 2 6 -1q3 3 7 0q4 3 7 0q3 3 6 1l-7 10Z`} fill="#c8a165" stroke="#7c5a2a" strokeWidth={1} strokeLinejoin="round" />
      <path d={`M${x - 8} ${y - 29}h16`} stroke="#b91c1c" strokeWidth={2.4} strokeLinecap="round" />
      <path d={`M${x - 8} ${y - 14}q8 3 14 -2`} fill="none" stroke="#7c5a2a" strokeWidth={0.8} />
    </g>
  );
}

export function ClubSack({}: Story) {
  const s = useScene(4, [600, 2400, 1500, 1500]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="নাসিব empties the club's sack: films of every size tumble out, each leaning a different way">
        <Stall x={50} y={S5_Y} w={72} sign="Movie Club" color="#7c3aed" />
        {S5_FILMS.map((f, i) => {
          const out = k >= (i < 4 ? 2 : 3);
          const wait = (i < 4 ? i : i - 4) * 160;
          return (
            <g
              key={f.x}
              style={{
                transform: out ? `translate(${f.x}px, ${S5_Y}px) rotate(${f.rot}deg)` : `translate(${S5_SACK}px, ${S5_Y - 26}px) scale(0.3)`,
                opacity: out ? 1 : 0,
                transitionDelay: `${wait}ms`,
              }}
              className="transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-none"
            >
              <S_Film w={13} h={f.h} color={f.c} />
            </g>
          );
        })}
        <S5_Sack x={S5_SACK} y={S5_Y} />
        <Person who="nasib" x={S5_NASIB} y={S5_Y} mood={k >= 4 ? "puzzled" : "happy"} arm={k === 1 ? "wave" : k >= 2 ? "point" : "down"} label />
        {k === 1 && <Bubble x={S5_NASIB} y={S5_Y - 66} lines={["Collection এ ছবি আছে", "আরও অনেক!"]} />}
        {k >= 4 && <Bubble x={S5_NASIB} y={S5_Y - 66} lines={["নিয়মটা খাটাতে হবে", "সবগুলোর ওপরেই!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · On the ring. Ten arrows of all lengths. The reader first marks the ones
//     that won't move, then normalises: every arrow glides onto the ring of
//     radius 1 while the sheet zooms in three times so the ring is readable.
//     Only e₁ and e₂ stay put; (1, 1) and (3, 3) land together.

const R_SPAN = 4;
const R_U = 32;
/** the sheet, zoomed in `z` times; its pixel size never changes */
const ringFrame = (z: number) => makeFrame(-R_SPAN / z, R_SPAN / z, -R_SPAN / z, R_SPAN / z, R_U * z);
const RING: XY[] = [
  [1, 0],
  [0, 1],
  [3, 1],
  [-2, 3],
  [-3, 1],
  [-3, -2],
  [-1, -3],
  [2, -3],
  [1, 1],
  [3, 3],
];
const STILL = RING.map((v, i) => (Math.abs(len(v) - 1) < 1e-9 ? i : -1)).filter((i) => i >= 0);

export function OnTheRing() {
  const pass = useGate();
  const [marks, setMarks] = useSeed<number[]>("marks", []);
  const [normed, setNormed] = useSeed("normed", false);
  const [t] = useTween([normed ? 1 : 0], 1100);
  const FR = ringFrame(1 + 2 * t);
  const right = marks.length === STILL.length && STILL.every((i) => marks.includes(i));

  const tap = (p: XY) => {
    if (normed) return;
    let best = -1;
    let d = 0.7;
    RING.forEach((v, i) => {
      if (dist(p, v) < d) {
        d = dist(p, v);
        best = i;
      }
    });
    if (best < 0) return;
    setMarks(marks.includes(best) ? marks.filter((m) => m !== best) : [...marks, best]);
  };
  const normalise = () => {
    setNormed(true);
    pass("length মুছে থাকলো শুধু দিক।");
  };

  return (
    <>
      <Plane f={FR} ticks={1} label={normed ? "ten arrows, each shrunk to length 1, on a ring" : "ten arrows of different lengths from the centre"} drag={normed ? undefined : { down: tap }} className="max-w-[18rem]">
        <circle
          cx={FR.sx(0)}
          cy={FR.sy(0)}
          r={FR.u}
          strokeWidth={2}
          strokeDasharray="4 4"
          className={`pointer-events-none fill-none stroke-[#d97706] transition-opacity duration-500 motion-reduce:transition-none ${normed ? "opacity-100" : "opacity-0"}`}
        />
        {RING.map((v, i) => {
          const tip = mix(v, unit(v), t);
          const still = normed && STILL.includes(i);
          return <Arrow key={i} f={FR} from={O} to={tip} tone={still ? "teal" : marks.includes(i) ? "violet" : "blue"} w={still ? 3.4 : 2.2} />;
        })}
        {!normed &&
          RING.map((v, i) => (
            <circle
              key={`g${i}`}
              cx={FR.sx(v[0])}
              cy={FR.sy(v[1])}
              r={8}
              strokeWidth={1.5}
              className={`pointer-events-none ${marks.includes(i) ? "fill-cat-violet/25 stroke-cat-violet" : "fill-transparent stroke-cat-blue/30"}`}
            />
          ))}
        {normed && (
          <>
            <Label f={FR} at={[1, 0]} dx={8} dy={14} anchor="start" size={11} className={`${POP} fill-cat-teal`}>
              e₁
            </Label>
            <Label f={FR} at={[0, 1]} dx={-8} dy={-6} anchor="end" size={11} className={`${POP} fill-cat-teal`}>
              e₂
            </Label>
          </>
        )}
      </Plane>
      <div className="min-h-7 text-center text-[0.95rem]">
        {!normed ? (
          <span className="text-muted">
            সব arrow-এর length 1 বানালে কোনগুলো একটুও নড়বে না? সেগুলোর মাথায় tap করুন ({bn(marks.length)}টা বাছাই)।
          </span>
        ) : right ? (
          <span className={`${FADE} text-accent-text`}>ঠিক ধরেছেন! নড়েনি শুধু e₁ আর e₂, কারণ ওরা আগে থেকেই 1 লম্বা।</span>
        ) : (
          <span className={FADE}>নড়েনি শুধু e₁ আর e₂, মানে পূর্বে এক step আর উত্তরে এক step। বাকি সবাই ছোট বা বড় হয়ে রিংয়ে এসে বসেছে।</span>
        )}
      </div>
      {!normed && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={normalise} className={primaryBtn}>
            সবার length 1 বানান
          </button>
        </div>
      )}
      <Task done={normed}>যেগুলো নড়বে না বলে মনে হয়, সেগুলোতে tap করুন। তারপর সবার length 1 বানিয়ে মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: 3.5's drone again, tied
//      to the pole by a rope exactly 1 long. It flies once round and its path
//      is the very ring the arrows landed on. Then the rope turns into compass
//      needles: every spot on the ring is a direction, each 1 long.

const SC_FD = makeFrame(-1.25, 1.25, -1.25, 1.25, 50, 6);
const SC_FLY_MS = 2600;
const SC_NEEDLES: { v: XY; dx: number; dy: number; anchor: "start" | "end" }[] = [
  { v: [0.6, 0.8], dx: 4, dy: -6, anchor: "start" },
  { v: [-0.8, 0.6], dx: -4, dy: -6, anchor: "end" },
  { v: [-0.6, -0.8], dx: -4, dy: 12, anchor: "end" },
];
const scAt = (a: number): XY => [Math.cos(a), Math.sin(a)];

function SC_Drone({ at }: { at: XY }) {
  const x = SC_FD.sx(at[0]);
  const y = SC_FD.sy(at[1]);
  return (
    <g transform={`translate(${x} ${y})`} className="pointer-events-none">
      <path d="M-8 -4L8 4M-8 4L8 -4" strokeWidth={1.6} className="stroke-[#0f1b2d]" />
      {[-8, 8].map((dx) =>
        [-4, 4].map((dy) => <ellipse key={`${dx}${dy}`} cx={dx} cy={dy} rx={4} ry={1.6} strokeWidth={1} className="fill-white stroke-[#0f1b2d]" />),
      )}
      <rect x={-4} y={-3} width={8} height={6} rx={2} className="fill-cat-violet" />
    </g>
  );
}

/** the drone's one lap: mounted fresh each play, so a replay starts from 0 */
function SC_Lap({ still }: { still: boolean }) {
  const [t] = useTween([1], SC_FLY_MS, [0]);
  const a = t * 2 * Math.PI;
  const p = scAt(a);
  const r = SC_FD.u;
  const trail =
    still || t > 0.999 ? (
      <circle cx={SC_FD.sx(0)} cy={SC_FD.sy(0)} r={r} strokeWidth={2.4} className="fill-none stroke-[#d97706]" />
    ) : (
      <path d={`M${SC_FD.sx(1)} ${SC_FD.sy(0)}A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 0 ${SC_FD.sx(p[0])} ${SC_FD.sy(p[1])}`} strokeWidth={2.4} className="fill-none stroke-[#d97706]" />
    );
  return (
    <g className="pointer-events-none">
      {trail}
      {!still && <line x1={SC_FD.sx(0)} y1={SC_FD.sy(0)} x2={SC_FD.sx(p[0])} y2={SC_FD.sy(p[1])} strokeWidth={1.2} className="stroke-[#0f1b2d]/60" />}
      {!still && <SC_Drone at={p} />}
    </g>
  );
}

export function DroneRing() {
  const s = useScene(3, [400, 900, SC_FLY_MS + 400]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "খুঁটিতে বাঁধা drone, আর দড়িটা ঠিক 1 লম্বা।"
        ) : k < 3 ? (
          <span className={FADE}>Drone যেদিকেই উড়ুক, খুঁটি থেকে দূরত্ব সেই 1-ই থাকে।</span>
        ) : (
          <span className={FADE}>দড়ি সবসময় 1, বদলায় শুধু দিক। তাই রিংয়ের প্রতিটা বিন্দু একেকটা দিক।</span>
        )
      }
    >
      <Plane f={SC_FD} grid={0.5} label="a drone tied to a pole by a rope 1 long flies round and traces the unit ring; then arrows 1 long point to (0.6, 0.8), (−0.8, 0.6) and (−0.6, −0.8)" className="my-1! max-w-[9.5rem]">
        {k >= 2 && <SC_Lap still={k >= 3} />}
        {k === 1 && (
          <g className={FADE}>
            <line x1={SC_FD.sx(0)} y1={SC_FD.sy(0)} x2={SC_FD.sx(1)} y2={SC_FD.sy(0)} strokeWidth={1.2} className="stroke-[#0f1b2d]/60" />
            <SC_Drone at={[1, 0]} />
            <Label f={SC_FD} at={[0.5, 0]} dy={-6} size={9} className="fill-[#5a6b7d]">
              দড়ি 1
            </Label>
          </g>
        )}
        {k >= 3 && (
          <>
            <Arrow f={SC_FD} from={O} to={[1, 0]} tone="teal" w={2.4} draw />
            {SC_NEEDLES.map((n, i) => (
              <g key={i}>
                <Arrow f={SC_FD} from={O} to={n.v} tone="blue" w={2.4} draw delay={150 * (i + 1)} />
                <Label f={SC_FD} at={n.v} dx={n.dx} dy={n.dy} anchor={n.anchor} size={9} className={`${FADE} fill-cat-blue font-mono`}>
                  {tupS(n.v)}
                </Label>
              </g>
            ))}
          </>
        )}
        <circle cx={SC_FD.sx(0)} cy={SC_FD.sy(0)} r={4} strokeWidth={1.5} className="fill-cat-amber stroke-[#0f1b2d]" />
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5⅔ · A figure for screen 5's explanation, no task: who didn't move. Shiku
//      takes one step east, e₁, then one step north, e₂: each 1 long, so the
//      ring passes right through their tips. Then (1, 1) and (3, 3), one
//      direction, glide onto the ring and land on the very same spot, while
//      the sheet zooms in so the ring is big enough to read.

/** the sheet, zoomed in as `z` goes 0 → 1; its pixel size never changes */
const x5Frame = (z: number) => {
  const span = 3.2 - 1.95 * z;
  return makeFrame(0, span, 0, span, 128 / span, 6);
};
const X5_F = x5Frame(0);
const X5_PAIR: XY[] = [
  [1, 1],
  [3, 3],
];
const X5_LAND = unit([1, 1]);

/** Shiku walking one step from the start: mounted fresh each beat, so it always sets off from (0, 0) */
function X5_Walker({ to }: { to: XY }) {
  const [x, y] = useTween(to, 1000, [0, 0]);
  const moving = Math.abs(x - to[0]) + Math.abs(y - to[1]) > 0.02;
  return (
    <g transform={`translate(${X5_F.sx(x)} ${X5_F.sy(y)}) scale(0.5)`}>
      <Robot x={0} y={0} ms={0} walking={moving} />
    </g>
  );
}

export function StillAndMerged() {
  const s = useScene(5, [600, 1500, 1500, 1300, 1300]);
  const k = s.k;
  const [m] = useTween([k >= 5 ? 1 : 0], 1200);
  const F = x5Frame(m);
  const R = F.u;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "Shiku-র remote-এর প্রথম button: পূর্বে এক পা।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>দ্বিতীয় button: উত্তরে এক পা। দুইটাই ঠিক 1 লম্বা।</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>তাই রিংটা ওদের মাথা ছুঁয়েই যায়। ওরা জন্ম থেকেই unit vector।</span>
        ) : k < 5 ? (
          <span key="c4" className={FADE}>এবার (1, 1) আর (3, 3), দুইজন একই দিকে তাক করা।</span>
        ) : (
          <span key="c5" className={FADE}>length মুছতেই দুইজন এসে পড়লো রিংয়ের একই বিন্দুতে।</span>
        )
      }
    >
      <div className="mx-auto w-[8.75rem]">
        <Plane f={F} label="Shiku's steps e₁ (1, 0) and e₂ (0, 1) are already 1 long and sit on the ring; (1, 1) and (3, 3) both shrink onto the ring at the same point" className="my-0! max-w-none">
          {k >= 3 && (
            <path d={`M${F.sx(1)} ${F.sy(0)}A${R} ${R} 0 0 0 ${F.sx(0)} ${F.sy(1)}`} strokeWidth={2} strokeDasharray="4 4" className={`${FADE} fill-none stroke-[#d97706]`} />
          )}
          {k >= 4 &&
            X5_PAIR.map((v, i) => <Arrow key={i} f={F} from={O} to={mix(v, X5_LAND, m)} tone={i ? "blue" : "violet"} w={i ? 2.6 : 3.2} draw={m === 0} delay={i * 200} />)}
          {k >= 4 && m === 0 && (
            <Label f={F} at={[3, 3]} dx={-10} dy={-2} anchor="end" size={9} className={`${FADE} fill-cat-blue font-mono`}>
              (3, 3)
            </Label>
          )}
          {k >= 5 && <circle cx={F.sx(X5_LAND[0])} cy={F.sy(X5_LAND[1])} r={4.5} style={{ transitionDelay: "1000ms" }} className={`${POP} fill-accent`} />}
          {k >= 1 && <Arrow f={F} from={O} to={[1, 0]} tone="teal" w={3} draw delay={k === 1 ? 900 : 0} />}
          {k >= 2 && <Arrow f={F} from={O} to={[0, 1]} tone="teal" w={3} draw delay={k === 2 ? 900 : 0} />}
          {k >= 1 && (
            <Label f={F} at={[1, 0]} dx={2} dy={-7} anchor="start" size={10} className={`${FADE} fill-cat-teal`}>
              e₁
            </Label>
          )}
          {k >= 2 && (
            <Label f={F} at={[0, 1]} dx={5} dy={3} anchor="start" size={10} className={`${FADE} fill-cat-teal`}>
              e₂
            </Label>
          )}
          {k === 1 && <X5_Walker to={[1, 0]} />}
          {k === 2 && <X5_Walker to={[0, 1]} />}
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5¾ · A figure for screen 5's explanation, no task: the open question.
//      (2, 1) shrinks and shrinks until only a dot is left at (0, 0), with no
//      head to point anywhere. Then the recipe, v ÷ its length, with a "?"
//      where the answer would go. Not answered.

const X5Z_F = makeFrame(-0.3, 2.4, -0.3, 1.4, 44, 6);

export function ZeroQuestion() {
  const s = useScene(4, [600, 1300, 2200, 1500]);
  const k = s.k;
  const [t] = useTween([k >= 2 ? 0 : 1], 1900);
  const tip: XY = [2 * t, t];

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "(2, 1)-কে একটু একটু করে ছোট করি।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>ছোট হতে হতে…</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>…শেষে শুধু একটা বিন্দু, (0, 0)। Arrow-এর মাথাটাও নাই।</span>
        ) : (
          <span key="c4" className={FADE}>এর length 1 বানাতে হলে ভাগ করবেন কী দিয়ে? নিজেই ভেবে দেখুন।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8.2rem] shrink-0">
          <Plane f={X5Z_F} grid={0.5} label="the arrow (2, 1) shrinks until only the point (0, 0) is left" className="my-0! max-w-none">
            {k >= 1 && <Arrow f={X5Z_F} from={O} to={tip} tone="blue" w={3} />}
            <circle cx={X5Z_F.sx(0)} cy={X5Z_F.sy(0)} r={k >= 3 ? 5 : 3} className={`fill-[#0f1b2d] transition-[r] duration-500 motion-reduce:transition-none`} />
          </Plane>
        </div>
        <div className="min-w-0 font-mono text-sm tabular-nums">
          <div className="min-h-6">{k >= 1 && <b className={k >= 3 ? "text-foreground" : "text-cat-blue"}>{tupS(tip)}</b>}</div>
          <div className="mt-2 min-h-[3.4rem]">
            {k >= 4 && (
              <div className={FADE}>
                <div>(0, 0) ÷ ‖(0, 0)‖</div>
                <div>
                  = <b className={`${POP} inline-block text-2xl text-cat-amber`}>?</b>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: the real test. মামা is
//      still standing there. নাসিব announces it, and the three films go up on
//      the counter one by one with their cards, Titanic (5, 2), the double
//      Titanic (10, 4) and Mr. Bean (1, 4). Then: make all three 1 long. Who
//      wins stays for the screen.

const S6_Y = 150;
const S6_STALL = 215;
const S6_MAMA = 44;
const S6_NASIB = 102;
const S6_FILMS: { x: number; title: string; color: string; card: string; tone: "coral" | "amber" | "teal" }[] = [
  { x: 160, title: "Titanic", color: "#e11d48", card: "(5, 2)", tone: "coral" },
  { x: 215, title: "Titanic ×2", color: "#7c3aed", card: "(10, 4)", tone: "amber" },
  { x: 270, title: "Mr. Bean", color: "#0d9488", card: "(1, 4)", tone: "teal" },
];

export function ThreeFilms({}: Story) {
  const s = useScene(5, [600, 2400, 1100, 1100, 1400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="মামা still waits; নাসিব puts Titanic (5, 2), double Titanic (10, 4) and Mr. Bean (1, 4) on the counter and says to make all three 1 long">
        <Stall x={S6_STALL} y={S6_Y} w={170} color="#7c3aed" />
        {S6_FILMS.map(
          (f, i) =>
            k >= i + 2 && (
              <g key={f.title} className={POP}>
                <S_Film x={f.x} y={S6_Y - 24} w={50} h={22} color={f.color} title={f.title} />
                <CastCard x={f.x} y={S6_Y - 11} text={f.card} tone={f.tone} />
              </g>
            ),
        )}
        <Person who="mama" x={S6_MAMA} y={S6_Y} label />
        <Person who="nasib" x={S6_NASIB} y={S6_Y} mood="happy" arm={k === 1 ? "wave" : k >= 5 ? "point" : "down"} label />
        {k === 1 && <Bubble x={S6_NASIB} y={S6_Y - 66} lines={["এবার আসল পরীক্ষা!"]} />}
        {k >= 5 && <Bubble x={S6_NASIB} y={S6_Y - 66} lines={["তিনজনেরই length 1", "বানিয়ে দেখি!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · The fair fight. Titanic, a Titanic scored double, and Mr. Bean. Their old
//     scores are 20, 40, 22. Normalise all three, rerun the club's rule:
//     3.71, 3.71, 5.33. The comedy wins clearly, and doubling bought nothing.

const FIGHT: { name: string; v: XY; tone: Ink }[] = [
  { name: "Titanic", v: TITANIC, tone: "coral" },
  { name: "দ্বিগুণ Titanic", v: [10, 4], tone: "violet" },
  { name: "Mr. Bean", v: BEAN, tone: "teal" },
];
const FIGHT_GUESS = ["Mr. Bean স্পষ্ট জিতবে", "আবার প্রায় সমান", "দ্বিগুণ Titanic-ই জিতবে"];
const FAIR = FIGHT.map((m) => unit2(m.v));
const FAIR_SCORE = FAIR.map(score);
const FAIR_MAX = Math.max(...FAIR_SCORE);

export function FairFight() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [normed, setNormed] = useSeed("normed", false);
  const [ran, setRan] = useSeed("ran", false);

  const run = () => {
    setRan(true);
    pass("length সরাতেই Mr. Bean জিতলো।");
  };

  return (
    <>
      <div className="mt-4 overflow-x-auto">
        <table className="mx-auto text-center tabular-nums">
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-2 pb-1 font-normal">ছবি</th>
              <th className="px-2 pb-1 font-normal">score card</th>
              <th className="px-2 pb-1 font-normal">নম্বর</th>
            </tr>
          </thead>
          <tbody>
            {FIGHT.map((m, i) => (
              <tr key={m.name}>
                <td className={`px-2 py-1 text-sm font-semibold ${INK[m.tone].text}`}>{m.name}</td>
                <td key={normed ? "n" : "o"} className={`${FADE} px-2 font-mono whitespace-nowrap ${normed ? "text-cat-blue" : ""}`}>
                  {tupS(normed ? FAIR[i] : m.v)}
                </td>
                <td className="px-2 font-mono whitespace-nowrap">
                  {ran ? (
                    <>
                      <s className="text-muted">{score(m.v)}</s> <b className={FADE}>{FAIR_SCORE[i].toFixed(2)}</b>
                    </>
                  ) : (
                    score(m.v)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {guess !== null && !ran && (
        <div className={`${FADE} mt-3 flex flex-wrap justify-center gap-2`}>
          <button type="button" onClick={() => setNormed(true)} disabled={normed} className={primaryBtn}>
            ১ · সবার length 1 করুন
          </button>
          <button type="button" onClick={run} disabled={!normed} className={`${primaryBtn} bg-cat-violet`}>
            ২ · Run the rule
          </button>
        </div>
      )}
      {normed && !ran && <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>খেয়াল করেছেন? দুইটা Titanic-এর card এখন হুবহু এক।</div>}
      {ran && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm space-y-1.5`}>
          {FIGHT.map((m, i) => (
            <div key={m.name} className="flex items-center gap-2 text-sm">
              <span className="w-28 shrink-0 text-right">{m.name}</span>
              <div className="h-4 flex-1 rounded-md bg-foreground/5">
                <div style={{ width: `${(FAIR_SCORE[i] / FAIR_MAX) * 100}%` }} className={`h-full rounded-md ${INK[m.tone].bar}`} />
              </div>
            </div>
          ))}
          <div className="pt-1 text-center font-mono text-sm text-muted">
            <div>2 × 0.93 + 5 × 0.37 = 3.71</div>
            <div>2 × 0.24 + 5 × 0.97 = 5.33</div>
          </div>
        </div>
      )}
      <div className="mt-4 text-sm font-medium text-muted">তিনটা ছবিরই length 1 করে মামার পছন্দের সাথে নিয়মটা আবার চালালে কী হবে?</div>
      <div className="mt-2 grid gap-2">
        {FIGHT_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, ran, 0)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {ran && guess !== null && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
          {guess === 0 ? "আপনার guess ঠিক। এবার ব্যবধান আর মাত্র 2 না, প্রায় দেড় গুণ।" : "উঁহু, এবার আর হাড্ডাহাড্ডি না। Card-গুলো 1 unit লম্বা হওয়ার পর Titanic-এর বাড়তি জোর আর কোনো কাজে লাগলো না।"}
        </div>
      )}
      <Ticks
        items={[
          ["length 1 করা", normed],
          ["Run the rule", ran],
        ]}
      />
      <Task done={ran}>আগে একটা guess করুন। তারপর তিনটা ছবির length 1 করে, run the rule again।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6¼ · A figure for screen 6's explanation, no task: same cards, new ruler.
//      Mr. Bean (1, 4) and Titanic (5, 2) at 22 and 20, nearly level; the
//      cards stay exactly as they are, only the measuring changes to "make
//      it 1 long first"; the bars rerun to 5.33 and 3.71, a clear gap.

const X6_ROWS: { name: string; v: XY; tone: Ink; i: number }[] = [
  { name: "Mr. Bean", v: BEAN, tone: "teal", i: 2 },
  { name: "Titanic", v: TITANIC, tone: "coral", i: 0 },
];

export function ClearWin() {
  const s = useScene(4, [600, 1400, 1500, 1500]);
  const k = s.k;
  const fair = k >= 3;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "আগের হিসাব: 22 বনাম 20, প্রায় সমান।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>ছবির card একটাও বদলালো না। বদলালো শুধু মাপার নিয়ম।</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>এবার 5.33 বনাম 3.71। ব্যবধান এখন স্পষ্ট।</span>
        ) : (
          <span key="c4" className={FADE}>মামা Comedy মুভি  নিয়েই বাড়ি গেলেন।</span>
        )
      }
    >
      <div className="mx-auto max-w-xs">
        <div className="mb-2 text-center text-xs text-muted">
          মাপার নিয়ম:{" "}
          <b key={k >= 2 ? "n" : "o"} className={`${FADE} ${k >= 2 ? "text-cat-violet" : "text-foreground"}`}>
            {k >= 2 ? "আগে length 1 করে, তারপর গুণ-যোগ" : "সরাসরি গুণ-যোগ"}
          </b>
        </div>
        <div className="space-y-1.5">
          {X6_ROWS.map((r) => (
            <div
              key={r.name}
              className={`grid grid-cols-[4.4rem_3.6rem_1fr] items-center gap-2 rounded-lg px-1 py-0.5 transition-colors duration-500 motion-reduce:transition-none ${
                k >= 4 && r.i === 2 ? "bg-cat-teal/10" : ""
              }`}
            >
              <span className={`text-right text-sm font-semibold ${INK[r.tone].text}`}>{r.name}</span>
              <span className={`text-center font-mono text-sm transition-shadow duration-500 motion-reduce:transition-none ${k === 2 ? "rounded ring-2 ring-cat-violet/40" : ""}`}>{tupS(r.v)}</span>
              <X_Bar
                on={k >= 1}
                frac={fair ? FAIR_SCORE[r.i] / FAIR_MAX : score(r.v) / score(BEAN)}
                tone={r.tone}
                n={fair ? FAIR_SCORE[r.i].toFixed(2) : `${score(r.v)}`}
              />
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6⅓ · A figure for screen 6's explanation, no task: the double gains
//      nothing. Titanic (5, 2) and double Titanic (10, 4), 20 and 40; each is
//      divided by its own length, 5.39 and 10.77; both come out (0.93, 0.37),
//      slide together into one card, and score the same 3.71.

const X6T: { name: string; v: XY; tone: Ink; by: string }[] = [
  { name: "Titanic", v: TITANIC, tone: "coral", by: "÷ 5.39" },
  { name: "দ্বিগুণ Titanic", v: [10, 4], tone: "violet", by: "÷ 10.77" },
];

export function TwinCards() {
  const s = useScene(4, [600, 1400, 1300, 1600]);
  const k = s.k;
  const one = k >= 4;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "Titanic আর দ্বিগুণ Titanic, নম্বর 20 আর 40।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>যার যার নিজের length দিয়ে ভাগ। দ্বিগুণ লম্বা, তাই ভাগও দ্বিগুণ।</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>দুইজনের card-ই দাঁড়ালো (0.93, 0.37)।</span>
        ) : (
          <span key="c4" className={FADE}>হুবহু এক card, তাই নম্বরও এক। বাড়তি জোরটুকু মুছে গেছে।</span>
        )
      }
    >
      <div className="mx-auto grid max-w-xs grid-cols-2 gap-2">
        {X6T.map((t, i) => (
          <div key={t.name} className="text-center">
            <div className={`rounded-xl border-2 bg-surface px-2 py-1 ${INK[t.tone].border}`}>
              <div className={`text-xs font-semibold ${INK[t.tone].text}`}>{t.name}</div>
              <div className="font-mono text-base font-bold">{tupS(t.v)}</div>
              <div className="text-xs text-muted">
                নম্বর <span className="font-mono">{score(t.v)}</span>
              </div>
            </div>
            <div className="h-6 pt-1 font-mono text-sm text-cat-violet">{k >= 2 && <span className={FADE}>{t.by}</span>}</div>
            <div className="h-8">
              {k >= 3 && (
                <div
                  className={`${FADE} rounded-lg border-2 border-cat-blue/40 bg-surface py-0.5 font-mono text-sm font-bold text-cat-blue transition-[translate,opacity] duration-1000 ease-in-out motion-reduce:transition-none ${
                    one ? (i ? "-translate-x-[calc(50%+0.25rem)] opacity-0" : "translate-x-[calc(50%+0.25rem)]") : ""
                  }`}
                >
                  (0.93, 0.37)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 h-6 text-center text-sm">
        {one && (
          <span style={{ transitionDelay: "900ms" }} className={FADE}>
            নম্বর <b className="font-mono">3.71</b>, দুইজনেরই
          </span>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the fair fight seen as
//      directions. মামার রুচি is a needle on the ring; Titanic and its double
//      fall on one and the same needle; Mr. Bean's needle sits right beside
//      মামা's. The narrower the gap, the bigger the score: 5.33 against 3.71.

const SC_FC = makeFrame(-0.3, 1.22, -0.08, 1.28, 104, 8);
const SC_MAMA = unit(TASTE);
const SC_TU = unit(TITANIC);
const SC_BU = unit(BEAN);
const scAng = (v: XY) => Math.atan2(v[1], v[0]);
/** a pie slice from the centre between two directions, `r` long */
const scWedge = (a: XY, b: XY, r: number) => {
  const [p, q] = [scAng(a), scAng(b)].sort((m, n) => m - n);
  const R = r * SC_FC.u;
  return `M${SC_FC.sx(0)} ${SC_FC.sy(0)}L${SC_FC.sx(r * Math.cos(p))} ${SC_FC.sy(r * Math.sin(p))}A${R} ${R} 0 0 0 ${SC_FC.sx(r * Math.cos(q))} ${SC_FC.sy(r * Math.sin(q))}Z`;
};

export function TasteCompass() {
  const s = useScene(4, [400, 1200, 1300, 1200]);
  const k = s.k;
  const R1 = SC_FC.u;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "নীল কাঁটাটা মামার পছন্দের দিক । সব ছবি এখন 1 unit লম্বা , তাই সবাই এই রিংয়ে।"
        ) : k < 3 ? (
          <span className={FADE}>Titanic আর দ্বিগুণ Titanic পড়লো একই কাঁটায়। বাড়তি জোরটা আর নাই।</span>
        ) : k < 4 ? (
          <span className={FADE}>Mr. Bean-এর কাঁটা মামার কাঁটার একদম পাশে।</span>
        ) : (
          <span className={FADE}>ফাঁক যত কম, নম্বর তত বেশি। তাই Mr. Bean 5.33, আর Titanic 3.71।</span>
        )
      }
    >
      <Plane f={SC_FC} grid={0.5} label="on the unit ring: মামার taste points at (0.37, 0.93); Titanic and double Titanic both at (0.93, 0.37), far away; Mr. Bean at (0.24, 0.97), right beside it" className="my-1! max-w-[11rem]">
        <path
          d={`M${SC_FC.sx(1)} ${SC_FC.sy(0)}A${R1} ${R1} 0 0 0 ${SC_FC.sx(0)} ${SC_FC.sy(1)}`}
          strokeWidth={2}
          strokeDasharray="4 4"
          className="pointer-events-none fill-none stroke-[#d97706]"
        />
        {k >= 4 && (
          <g className={FADE}>
            <path d={scWedge(SC_MAMA, SC_TU, 0.42)} className="fill-cat-coral/20" />
            <path d={scWedge(SC_MAMA, SC_BU, 0.62)} className="fill-cat-teal/40" />
          </g>
        )}
        {k >= 1 && <Arrow f={SC_FC} from={O} to={SC_MAMA} tone="blue" w={3} draw />}
        {k >= 1 && (
          <Label f={SC_FC} at={SC_MAMA} dx={4} dy={-7} anchor="start" size={10} className={`${FADE} fill-cat-blue`}>
            মামা
          </Label>
        )}
        {k >= 2 && <Arrow f={SC_FC} from={O} to={SC_TU} tone="coral" w={3} draw />}
        {k >= 2 && (
          <Label f={SC_FC} at={[SC_TU[0] * 0.55, SC_TU[1] * 0.55]} dy={16} anchor="start" size={10} className={`${FADE} fill-cat-coral`}>
            দুই Titanic
          </Label>
        )}
        {k >= 3 && <Arrow f={SC_FC} from={O} to={SC_BU} tone="teal" w={3} draw />}
        {k >= 3 && (
          <Label f={SC_FC} at={SC_BU} dx={-7} dy={-1} anchor="end" size={10} className={`${FADE} fill-cat-teal`}>
            Mr. Bean
          </Label>
        )}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A figure for screen 6's explanation, no task: everywhere, and a name.
//      Recommendation, search and ChatGPT's word vectors line up as the places
//      this trick runs; then মামার পছন্দ (2, 5), still 5.39 long, shrinks onto
//      the ring beside Mr. Bean's needle (the sheet zooming in as it goes),
//      and the name lands, cosine similarity, left for the next article. Its
//      value is not shown.

/** the sheet, zoomed in as `z` goes 0 → 1; its pixel size never changes */
const x6Frame = (z: number) => {
  const span = 5.5 - 4.2 * z;
  return makeFrame(0, span, 0, span, 116 / span, 6);
};
const X6C_USES = ["Recommendation system", "Google-এর search", "ChatGPT-র শব্দের vector"];

export function CosineName() {
  const s = useScene(4, [600, 1600, 1300, 1600]);
  const k = s.k;
  const [t] = useTween([k >= 3 ? 1 : 0], 1300);
  const F = x6Frame(t);
  const R = F.u;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "বড় বড় system, সবখানেই এই technique।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>এবার মামার পছন্দের arrow, এখনো 5.39 লম্বা।</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>তাকেও normalise করলাম। সেও এখন রিংয়ে, Mr. Bean-এর পাশে।</span>
        ) : (
          <span key="c4" className={FADE}>দুই unit vector-এ club-এর নিয়ম চালালে যা আসে, তার নাম cosine similarity।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8rem] shrink-0">
          <Plane f={F} label="মামার taste (2, 5) shrinks onto the unit ring beside Mr. Bean's unit needle" className="my-0! max-w-none">
            <path d={`M${F.sx(1)} ${F.sy(0)}A${R} ${R} 0 0 0 ${F.sx(0)} ${F.sy(1)}`} strokeWidth={1.6} strokeDasharray="3 3" className="fill-none stroke-[#d97706]" />
            {k >= 2 && <Arrow f={F} from={O} to={SC_BU} tone="teal" w={2.4} />}
            {k >= 2 && <Arrow f={F} from={O} to={mix(TASTE, SC_MAMA, t)} tone="blue" w={3} draw={t === 0} />}
            {t > 0.99 && (
              <>
                <Label f={F} at={SC_BU} dx={-8} dy={-7} anchor="start" size={10} className={`${FADE} fill-cat-teal`}>
                  Mr. Bean
                </Label>
                <Label f={F} at={SC_MAMA} dx={9} dy={12} anchor="start" size={10} className={`${FADE} fill-cat-blue`}>
                  মামা
                </Label>
              </>
            )}
          </Plane>
        </div>
        <div className="min-w-0">
          <div className="min-h-[4rem] space-y-1 text-xs">
            {X6C_USES.map((u, i) => (
              <div key={u} style={{ transitionDelay: `${i * 250}ms` }} className={`flex items-center gap-1.5 transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-0"}`}>
                <span className="size-1.5 shrink-0 rounded-full bg-cat-teal" />
                {u}
              </div>
            ))}
          </div>
          <div className="mt-2 min-h-[3rem]">
            {k >= 4 && (
              <div className={POP}>
                <div className="inline-block rounded-lg bg-cat-violet/10 px-2 py-0.5 font-bold text-cat-violet">cosine similarity</div>
                <div className="mt-0.5 text-xs text-muted">সেই গল্পটা পরের কোনো journey-তে আসবে</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: মামা খুশি, নাসিবও. মামা
//      heads off with his film while নাসিব declares normalise for every sum
//      at the stall; then সামিন walks in with his খাতা and opens it: what each
//      customer spent on (চা, শরবত). Whose sums they are stays in the widget.

const S7_Y = 150;
const S7_NASIB = 122;
const S7_MAMA = 180;
const S7_SAMIN = 222;

/** সামিন's খাতা, open, centred at (x, y): the header and a few scribbled rows. */
function S7_Khata({ x, y }: { x: number; y: number }) {
  return (
    <g className={`${POP} pointer-events-none`}>
      <rect x={x - 38} y={y - 25} width={76} height={50} rx={3} fill="#1d4ed8" />
      <rect x={x - 35} y={y - 22} width={70} height={44} rx={1.5} fill="white" />
      <text x={x} y={y - 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={S_INK}>
        (চা, শরবত)
      </text>
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <path d={`M${x - 31} ${y - 3 + r * 8}h62`} stroke="#93c5fd" strokeWidth={0.6} />
          <path d={`M${x - 29} ${y - 5 + r * 8}q3 -3 6 0t6 0t6 0M${x + 6} ${y - 5 + r * 8}q2 -3 4 0t4 0M${x + 18} ${y - 5 + r * 8}q2 -3 4 0t4 0`} fill="none" stroke="#475569" strokeWidth={0.9} />
        </g>
      ))}
    </g>
  );
}

export function SaminKhata({}: Story) {
  const s = useScene(4, [600, 1500, 2600, 1800]);
  const k = s.k;
  const mamaGone = k >= 2;
  const mx = mamaGone ? 380 : S7_MAMA;
  const mf = mamaGone ? 1 : -1;
  const sx = k >= 3 ? S7_SAMIN : 380;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="মামা leaves happy with his film, নাসিব says normalise every sum from now on, and সামিন walks in and opens his খাতা of (চা, শরবত) spending">
        <Stall x={52} y={S7_Y} w={76} sign="Movie Club" color="#7c3aed" />
        <Person who="nasib" x={S7_NASIB} y={S7_Y} mood={k >= 2 ? "smug" : "happy"} arm={k === 2 ? "point" : "down"} label />
        {k === 2 && <Bubble x={S7_NASIB} y={S7_Y - 66} lines={["এখন থেকে সব", "হিসাবেই normalise!"]} />}
        <Person who="mama" x={mx} y={S7_Y} facing={mf} walking={k === 2} ms={2200} mood="happy" arm="hold" label={!mamaGone} />
        <S_Carry x={mx} y={S7_Y - 31} ms={2200}>
          <S_Film x={19 * mf} w={12} h={15} color="#0d9488" />
        </S_Carry>
        <Person who="samin" x={sx} y={S7_Y} facing={-1} walking={k === 3} ms={1600} arm="hold" label={k >= 3} />
        {k < 4 && (
          <S_Carry x={sx - 16} y={S7_Y - 42} ms={1600}>
            <rect x={-7} y={-5} width={14} height={10} rx={1.5} fill="#1d4ed8" />
          </S_Carry>
        )}
        {k >= 4 && <S7_Khata x={S7_SAMIN} y={S7_Y - 98} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · Where normalising is the wrong move. সামিনের খাতা: two customers who
//     spend in exactly the same proportion, ten times apart. "Who spends the
//     most?" is easy — until the reader normalises them both and the two rows
//     turn into the same row. The honest limit of the whole journey, felt
//     rather than told.

const SPEND: { who: string; v: XY }[] = [
  { who: "করিম", v: [20, 10] },
  { who: "ডাক্তার আপা", v: [200, 100] },
];
const BIG_GUESS = ["করিম", "ডাক্তার আপা", "এখন আর বলার উপায় নাই"];

export function BigSpender() {
  const pass = useGate();
  const [normed, setNormed] = useSeed("normed", false);
  const [guess, setGuess] = useSeed<number | null>("guess", null);

  const norm = () => {
    setNormed(true);
  };
  const choose = (i: number) => {
    setGuess(i);
    pass("Normalise খরচের খবরটা মুছে দিলো।");
  };

  return (
    <>
      <div className="mx-auto mt-2 max-w-sm overflow-hidden rounded-xl border-2 border-cat-teal/40">
        <div className="flex items-baseline gap-2 border-b border-border bg-cat-teal/5 px-3 py-1.5 text-xs font-semibold text-muted">
          <span className="w-24 shrink-0">সামিনের খাতা</span>
          <span className="font-mono">(চা, শরবত) টাকা</span>
        </div>
        {SPEND.map(({ who, v }) => (
          <div key={who} className="flex items-baseline gap-2 px-3 py-2">
            <span className="w-24 shrink-0 text-sm font-semibold">{who}</span>
            <span className={`font-mono text-[0.95rem] ${normed ? "text-muted line-through" : "text-cat-teal"}`}>({v[0]}, {v[1]})</span>
            {normed && (
              <b className={`${POP} ml-auto font-mono text-cat-teal`}>
                ({sh(v[0] / len(v))}, {sh(v[1] / len(v))})
              </b>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 text-center text-[0.95rem]">
        {normed ? (
          <span className={FADE}>দুইটা row এখন হুবহু এক।</span>
        ) : (
          <span className="text-muted">এখন জিজ্ঞেস করলে উত্তরটা সোজা: সবচেয়ে বড় ক্রেতা ডাক্তার আপা।</span>
        )}
      </div>
      {!normed && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={norm} className={primaryBtn}>
            দুইজনকেই normalise করুন
          </button>
        </div>
      )}
      {normed && (
        <div className={FADE}>
          <div className="mt-3 text-sm font-medium text-muted">এবার বলুন তো, সবচেয়ে বড় ক্রেতা কে?</div>
          <div className="mt-2 grid gap-2">
            {BIG_GUESS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, guess !== null, 2)} disabled={guess !== null} onClick={() => choose(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </div>
      )}
      <Ticks items={[["normalise করা", normed], ["উত্তর দেওয়া", guess !== null]]} />
      <Task done={guess !== null}>আগে দুইজনকে normalise করুন, তারপর প্রশ্নটার উত্তর দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: what normalising wiped.
//      করিম (20, 10) and ডাক্তার আপা (200, 100): her length bar is ten times
//      his. Both lean the same way, চা twice শরবত. Normalise: both cards turn
//      into (0.89, 0.45), and the two bars shrink to the same sliver, 1.

const X7_MAX = len(SPEND[1].v);

/** a small arrow pointing the way (2, 1) points, the lean both customers share */
function X7_Lean() {
  return (
    <svg viewBox="0 0 24 16" aria-hidden="true" className="w-6 text-cat-teal">
      <path d="M2 14L17.5 6.2" strokeWidth={2.2} strokeLinecap="round" className="fill-none stroke-current" />
      <path d="M22 4L15.3 3.4L18.8 10.3Z" className="fill-current" />
    </svg>
  );
}

export function TenTimesGone() {
  const s = useScene(4, [600, 1400, 1400, 1500]);
  const k = s.k;
  const normed = k >= 3;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "করিম আর ডাক্তার আপা। আপার arrow করিমের দশ গুণ লম্বা।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>তবে দুইজনই চায়ে শরবতের দ্বিগুণ খরচ করেন, তাই একই দিকে তাক করা।</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>Normalise করতেই দুইজনই হুবহু (0.89, 0.45)।</span>
        ) : (
          <span key="c4" className={FADE}>একই দিকে সেটা বোঝা যাচ্ছে। কিন্তু দশ গুণের খবরটা আর কোথাও জমা নাই।</span>
        )
      }
    >
      <div className="mx-auto max-w-xs space-y-2">
        <div className="grid grid-cols-[6rem_1.5rem_1fr] gap-2 text-xs text-muted">
          <span />
          <span />
          <span>length</span>
        </div>
        {SPEND.map(({ who, v }) => (
          <div key={who} className="grid grid-cols-[6rem_1.5rem_1fr] items-center gap-2">
            <div className="leading-tight">
              <div className="text-sm font-semibold">{who}</div>
              <div key={normed ? "n" : "o"} className={`${FADE} font-mono text-xs ${normed ? "font-bold text-cat-teal" : ""}`}>
                {normed ? tupS(unit2(v)) : tupS(v)}
              </div>
            </div>
            <div>{k >= 2 && <span className={`${POP} inline-block`}>{<X7_Lean />}</span>}</div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 flex-1 rounded-md bg-foreground/5">
                <div
                  style={{ width: normed ? "4px" : `${(len(v) / X7_MAX) * 100}%` }}
                  className="h-full min-w-1 rounded-md bg-cat-blue transition-[width] duration-1000 ease-in-out motion-reduce:transition-none"
                />
              </div>
              <span className="w-12 shrink-0 font-mono text-xs tabular-nums">{normed ? "1" : sh(len(v))}</span>
            </div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7¾ · A figure for screen 7's explanation, no task: nuisance or news. Left,
//      মামার ছবি বাছাই: the two Titanics' extra length is the nuisance, so
//      both shrink onto the ring and become one, the sheet zooming in as they
//      go. Right, "সবচেয়ে বড় ক্রেতা কে?": করিম's and আপা's lengths are the
//      answer itself, so they stay.

/** the left sheet, zoomed in as `z` goes 0 → 1; its pixel size never changes */
const x7Frame = (z: number) => {
  const xs = 10.6 - 8.2 * z;
  return makeFrame(0, xs, 0, (xs * 4.4) / 10.6, 127 / xs, 6);
};
const X7N_FR = makeFrame(0, 212, 0, 106, 0.6, 6);

function X7N_Panel({ title, on, tag, children }: { title: string; on: boolean; tag: ReactNode; children: ReactNode }) {
  return (
    <div className={`text-center transition-opacity duration-500 motion-reduce:transition-none ${on ? "opacity-100" : "opacity-50"}`}>
      <div className="text-xs font-semibold text-muted">{title}</div>
      {children}
      <div className="mt-1 min-h-5 text-xs leading-tight">{tag}</div>
    </div>
  );
}

export function NoiseOrNews() {
  const s = useScene(4, [600, 1400, 1500, 1500]);
  const k = s.k;
  const [t] = useTween([k >= 2 ? 1 : 0], 1200);
  const FL = x7Frame(t);
  const RL = FL.u;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "মামার ছবি বাছাইয়ে Titanic-এর বাড়তি loudness-টা ঝামেলা ।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>তাই মুছে ফেলাই ঠিক কাজ। দুই Titanic এক হয়ে গেল।</span>
        ) : k < 4 ? (
          <span key="c3" className={FADE}>সামিনের প্রশ্নে কিন্তু lengthটাই আসল information।</span>
        ) : (
          <span key="c4" className={FADE}>সবচেয়ে বড় ক্রেতা আপা। এখানে normalise করলে উত্তরটাই মুছে যেত।</span>
        )
      }
    >
      <div className="mx-auto grid max-w-xs grid-cols-2 gap-3">
        <X7N_Panel
          title="মামার ছবি বাছাই"
          on={k < 3}
          tag={k >= 2 ? <span className={`${FADE} text-cat-teal`}>মুছে ফেলাই ঠিক</span> : k >= 1 ? <span className={`${FADE} text-cat-coral`}>loudness-টা ঝামেলা </span> : null}
        >
          <Plane f={FL} grid={0} label="the two Titanics, (5, 2) and (10, 4), shrink onto the unit ring and become one" className="my-1! max-w-none">
            <path d={`M${FL.sx(1)} ${FL.sy(0)}A${RL} ${RL} 0 0 0 ${FL.sx(0)} ${FL.sy(1)}`} strokeWidth={1.4} strokeDasharray="3 3" className="fill-none stroke-[#d97706]" />
            {k >= 1 && <Arrow f={FL} from={O} to={mix(SC_DOUBLE, SC_TU, t)} tone="violet" w={2.4} draw={t === 0} />}
            {k >= 1 && <Arrow f={FL} from={O} to={mix(TITANIC, SC_TU, t)} tone="coral" w={2.8} draw={t === 0} />}
          </Plane>
        </X7N_Panel>
        <X7N_Panel
          title="সবচেয়ে বড় ক্রেতা কে?"
          on={k >= 3}
          tag={k >= 4 ? <span className={`${FADE} font-semibold text-cat-blue`}>হাত দেবেন না</span> : k >= 3 ? <span className={`${FADE} text-cat-blue`}>lengthটাই খবর</span> : null}
        >
          <Plane f={X7N_FR} grid={0} label="করিম (20, 10) and ডাক্তার আপা (200, 100) on one line; her arrow is ten times longer, and that length is the answer" className="my-1! max-w-none">
            {k >= 3 && <Arrow f={X7N_FR} from={O} to={SPEND[1].v} tone="blue" w={k >= 4 ? 3.6 : 2.4} draw />}
            {k >= 3 && <Arrow f={X7N_FR} from={O} to={SPEND[0].v} tone="teal" w={2.8} draw />}
            {k >= 3 && (
              <Label f={X7N_FR} at={SPEND[0].v} dx={3} dy={11} anchor="start" size={9} className={`${FADE} fill-cat-teal`}>
                করিম
              </Label>
            )}
            {k >= 3 && (
              <Label f={X7N_FR} at={SPEND[1].v} dx={-2} dy={24} anchor="end" size={9} className={`${FADE} fill-cat-blue`}>
                আপা
              </Label>
            )}
          </Plane>
        </X7N_Panel>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · A figure for the Check's explanation, no task: v̂ = v ÷ ‖v‖ on card
//     (5, 12), slot by slot. Each slot squared (25, 144), added (169), rooted
//     (13); then each slot divided by that same 13, and out comes (0.38, 0.92).

const SC_CARD: XY = [5, 12];
const SC_LEN = len(SC_CARD);

function SC_Row({ on, label, children }: { on: boolean; label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[1.375rem] grid-cols-[2.6rem_1fr] items-baseline gap-2">
      {on && (
        <>
          <span className={`${FADE} text-right text-xs text-muted`}>{label}</span>
          <div className={`${FADE} font-mono tabular-nums`}>{children}</div>
        </>
      )}
    </div>
  );
}

export function HatFlow() {
  const s = useScene(5, [400, 1000, 1000, 1100, 1300]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k < 3 ? (
          "আগে দর্জির ফিতায় মাপ: প্রতিটা ঘরের বর্গ, তারপর যোগ, তারপর root।"
        ) : k < 5 ? (
          <span className={FADE}>Card-টা 13 লম্বা। এবার দুইটা ঘরকেই সেই একই 13 দিয়ে ভাগ।</span>
        ) : (
          <span className={FADE}>পেলাম (0.38, 0.92)। দিক একই রইলো, আর length এখন 1।</span>
        )
      }
    >
      <div className="mx-auto max-w-[16rem] space-y-0.5 text-sm">
        <SC_Row on label="card">
          <div className="grid grid-cols-2 text-center text-base font-bold">
            <span>5</span>
            <span>12</span>
          </div>
        </SC_Row>
        <SC_Row on={k >= 1} label="বর্গ">
          <div className="grid grid-cols-2 text-center">
            <span>5² = 25</span>
            <span>12² = 144</span>
          </div>
        </SC_Row>
        <SC_Row on={k >= 2} label="যোগ">
          <div className="text-center">25 + 144 = 169</div>
        </SC_Row>
        <SC_Row on={k >= 3} label="root">
          <div className="text-center">
            √169 = <b className="text-cat-violet">{SC_LEN}</b>
          </div>
        </SC_Row>
        <SC_Row on={k >= 4} label="ভাগ">
          <div className="grid grid-cols-2 text-center">
            {SC_CARD.map((n) => (
              <span key={n}>
                {n} ÷ <span className="text-cat-violet">13</span>
              </span>
            ))}
          </div>
        </SC_Row>
        <SC_Row on={k >= 5} label="unit">
          <div className="grid grid-cols-2 text-center text-base font-bold text-cat-teal">
            {SC_CARD.map((n) => (
              <span key={n}>
                <span className={`${POP} inline-block`}>{sh(n / SC_LEN)}</span>
              </span>
            ))}
          </div>
        </SC_Row>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for the Check's explanation, no task: the tempting wrong
//      answers on the ring. (5/13, 12/13) lands right on it; ÷ 17, the walk's
//      total, stops inside at 0.76; and (1, 1) pokes out past it, √2 long.

const X8_F = makeFrame(0, 1.15, 0, 1.15, 110, 6);
const X8_HATS: { card: string; v: XY; tone: "teal" | "coral" | "violet"; note: string; L: string }[] = [
  { card: "(5/13, 12/13)", v: [5 / 13, 12 / 13], tone: "teal", note: "÷ 13, ফিতার মাপ", L: "1" },
  { card: "(5/17, 12/17)", v: [5 / 17, 12 / 17], tone: "coral", note: "÷ 17, হাঁটার মাপ", L: "0.76" },
  { card: "(1, 1)", v: [1, 1], tone: "violet", note: "দেখতে “এক এক”", L: "√2 ≈ 1.41" },
];

export function WrongHats() {
  const s = useScene(3, [600, 1500, 1500]);
  const k = s.k;
  const R = X8_F.u;

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "13 দিয়ে ভাগ করলে arrow-এর মাথা ঠিক রিংয়ের ওপর।"
        ) : k < 3 ? (
          <span key="c2" className={FADE}>17 দিয়ে ভাগ করলে থামে রিংয়ের ভেতরে, length মাত্র 0.76।</span>
        ) : (
          <span key="c3" className={FADE}>আর (1, 1) বেরিয়ে যায় রিংয়ের বাইরে, √2 লম্বা।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8.2rem] shrink-0">
          <Plane f={X8_F} grid={0.25} label="on the unit ring: (5/13, 12/13) lands on it, (5/17, 12/17) stops inside at 0.76, (1, 1) pokes outside at 1.41" className="my-0! max-w-none">
            <path d={`M${X8_F.sx(1)} ${X8_F.sy(0)}A${R} ${R} 0 0 0 ${X8_F.sx(0)} ${X8_F.sy(1)}`} strokeWidth={2} strokeDasharray="4 4" className="fill-none stroke-[#d97706]" />
            {X8_HATS.map((h, i) => k >= i + 1 && <Arrow key={h.card} f={X8_F} from={O} to={h.v} tone={h.tone} w={2.8} draw />)}
          </Plane>
        </div>
        <div className="min-w-0 space-y-1.5">
          {X8_HATS.map((h, i) => (
            <div key={h.card} className="min-h-[2.4rem] leading-tight">
              {k >= i + 1 && (
                <div className={FADE}>
                  <div className={`font-mono text-sm font-bold ${INK[h.tone].text}`}>{h.card}</div>
                  <div className="text-xs text-muted">
                    {h.note}, length <span className="font-mono">{h.L}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for the last screen's heading, no task: মামা ছবি নিয়ে
//      বাড়ি গেলেন. মামা, film in hand, says goodbye at the club, then walks
//      off home while নাসিব waves and the afternoon sun sinks.

const S9_Y = 150;
const S9_NASIB = 120;
const S9_MAMA = 182;
const S9_SUN = [46, 62, 96, 128];

export function MamaGoesHome({}: Story) {
  const s = useScene(3, [600, 2400, 2600]);
  const k = s.k;
  const gone = k >= 2;
  const mx = gone ? 380 : S9_MAMA;
  const mf = gone ? 1 : -1;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="late afternoon: মামা says goodbye to নাসিব and walks home with his comedy film">
        <circle
          r={13}
          fill="#fde047"
          style={{ transform: `translate(262px, ${S9_SUN[k]}px)`, transitionDuration: "2200ms" }}
          className="transition-transform ease-in-out motion-reduce:transition-none"
        />
        <Tree x={292} y={S9_Y} s={1.1} />
        <Tree x={250} y={S9_Y} s={0.8} />
        <Stall x={52} y={S9_Y} w={76} sign="Movie Club" color="#7c3aed" />
        <Person who="nasib" x={S9_NASIB} y={S9_Y} mood="happy" arm={gone ? "wave" : "down"} label />
        <Person who="mama" x={mx} y={S9_Y} facing={mf} walking={k === 2} ms={2400} mood="happy" arm="hold" label={!gone} />
        <S_Carry x={mx} y={S9_Y - 31} ms={2400}>
          <S_Film x={19 * mf} w={12} h={15} color="#0d9488" />
        </S_Carry>
        {k === 1 && <Bubble x={S9_MAMA} y={S9_Y - 66} lines={["যাই, Comedy মুভি টা", "বাড়ি গিয়ে দেখি!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9b · A story scene for the last screen's teaser, no task: late afternoon at
//      ডাক্তার আপার stall, “তোমার twin কে?”. She walks up, a card shows the
//      volunteer's slip, kg written as gram, and she finds every twin changed.
//      Why is the next journey's question, so the scene stops there.

const S9B_STALL = 234;
const S9B_APA = 140;

export function TwinMixup({}: Story) {
  const s = useScene(3, [600, 1800, 1500]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="ডাক্তার আপার stall, the twin game: a card shows kg written as gram, and she finds everyone's twin has changed">
        <Tree x={34} y={S9_Y} s={1.1} />
        <Stall x={S9B_STALL} y={S9_Y} w={100} color="#0f766e" />
        <rect x={S9B_STALL - 42} y={S9_Y - 82} width={84} height={16} rx={3} fill="#fef3c7" stroke="#92400e" strokeWidth={1} />
        <text x={S9B_STALL} y={S9_Y - 71} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={S_INK}>
          তোমার twin কে?
        </text>
        {k >= 2 && <CastCard x={S9B_STALL} y={S9_Y - 11} text="kg → gram" tone="coral" />}
        <Person who="apa" x={k >= 1 ? S9B_APA : -30} y={S9_Y} walking={k === 1} ms={1500} mood={k >= 3 ? "puzzled" : "plain"} arm={k >= 3 ? "point" : "down"} label={k >= 1} />
        {k >= 3 && <Bubble x={S9B_APA} y={S9_Y - 66} lines={["সবার twin", "বদলে গেল!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  LoudFilm: { start: {}, ran: { guess: 0, ran: true } },
  WhyLoud: { start: {}, measured: { measured: ["t", "b"] }, doubled: { measured: ["t", "b"], lam: 2, seen: [1, 2, 0.5] } },
  ShrinkToOne: {
    start: {},
    sliding: { lam: 0.5 },
    first: { lam: 0.2, hit: [true, false] },
    all: { stage: 1, lam: 0.4, hit: [true, true] },
  },
  HatCheck: { start: {}, squared: { squared: [0, 1] }, done: { squared: [0, 1], added: true, rooted: true } },
  OnTheRing: { start: {}, marked: { marks: [0, 1, 8] }, normed: { marks: [0, 8], normed: true } },
  BigSpender: { start: {}, normed: { normed: true }, over: { normed: true, guess: 2 } },
  FairFight: { start: {}, normed: { guess: 1, normed: true }, ran: { guess: 1, normed: true, ran: true } },
  // the scenes shoot fully played; `k` seeds a beat part-way through
  SongTips: { played: {}, song: { k: 3 } },
  DoubleBatch: { played: {}, sherbet: { k: 2 } },
  DroneRing: { played: {}, rope: { k: 1 } },
  TasteCompass: { played: {}, titanic: { k: 2 } },
  HatFlow: { played: {}, rooted: { k: 3 } },
  OddTie: { mid: { k: 2 }, done: {} },
  BlackBox: { mid: { k: 1 }, done: {} },
  LongNotNear: { mid: { k: 2 }, done: {} },
  OwnLength: { mid: { k: 1 }, done: {} },
  SameLine: { mid: { k: 2 }, done: {} },
  TwoTapes: { mid: { k: 2 }, done: {} },
  HatOn: { mid: { k: 2 }, done: {} },
  DivideIsStretch: { mid: { k: 3 }, done: {} },
  StillAndMerged: { walk: { k: 1 }, mid: { k: 4 }, done: {} },
  ZeroQuestion: { mid: { k: 1 }, done: {} },
  ClearWin: { mid: { k: 2 }, done: {} },
  TwinCards: { mid: { k: 3 }, done: {} },
  CosineName: { mid: { k: 2 }, done: {} },
  TenTimesGone: { mid: { k: 2 }, done: {} },
  NoiseOrNews: { mid: { k: 2 }, done: {} },
  WrongHats: { mid: { k: 2 }, done: {} },
  // story scenes, likewise
  MamaAtClub: { played: {}, nasib: { k: 1 }, walking: { k: 3 } },
  TooSmallDoubt: { played: {}, walking: { k: 2 }, doubt: { k: 3 } },
  ClubSack: { played: {}, calling: { k: 1 }, tumbling: { k: 2 } },
  ThreeFilms: { played: {}, test: { k: 1 }, two: { k: 3 } },
  SaminKhata: { played: {}, happy: { k: 1 }, declares: { k: 2 }, walking: { k: 3 } },
  MamaGoesHome: { played: {}, goodbye: { k: 1 } },
  TwinMixup: { played: {}, card: { k: 2 } },
};
