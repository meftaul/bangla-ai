"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Speech, Ticks, predictLook, primaryBtn, quietBtn, useCountUp, usePlay, useTween } from "@/components/journey/kit";
import { Arrow, Plane, clamp, dist, makeFrame, minus, mix, plus, INK, type Frame, type Tone, type XY } from "@/components/journey/plane";
import { bn } from "./figure-kit";

// Screens for "Math for AI 2.3 — King − man + woman, চায়ের দোকানের ধাঁধা".
//
// Shom's puzzle, settled. First honestly in the list view: king's numbers
// minus man's are just more numbers, and queen is written nowhere. Then a toy
// embedding with two boxes instead of three hundred, so every word is a point
// on paper. king − man is end − start, an arrow; carried to woman (arrows
// have no address, 2.2) it lands next to queen. All four royal pairs point
// the same way, capitals do it again (Dhaka included), the same sum is shown
// through both eyes, and the reader goes hunting for the past-tense and
// plural directions on a map of their own.
//
// The maps are hand-placed so the analogies land within a hair of the right
// word but not exactly on it, which is what ≈ means. As in real systems, the
// words that went into the sum are left out when looking for the nearest.
// Tailwind only; the sheet is journey/plane.

type Word = { w: string; at: XY };

const f1 = (n: number) => (n < 0 ? `−${(-n).toFixed(1)}` : n.toFixed(1));
const pair = (v: XY) => `(${f1(v[0])}, ${f1(v[1])})`;
/** close enough to count as landing on a word */
const NEAR = 1;

function nearest(p: XY, words: Word[], skip: string[] = []) {
  let best = words[0];
  let bd = Infinity;
  for (const wd of words) {
    if (skip.includes(wd.w)) continue;
    const d = dist(p, wd.at);
    if (d < bd) {
      bd = d;
      best = wd;
    }
  }
  return { word: best, d: bd };
}

function ShomSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="সোম" initial="সো" tint="teal" {...props} />;
}

const onEnter = (go: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    go();
  }
};

/** The words on a map: a dot and its name. `ring` marks where an arrow landed. */
function Words({
  f,
  words,
  onTap,
  ring = [],
  hot = [],
  fade = 0,
}: {
  f: Frame;
  words: Word[];
  onTap?: (wd: Word) => void;
  ring?: string[];
  hot?: string[];
  fade?: number;
}) {
  return (
    <>
      {words.map((wd) => {
        const x = f.sx(wd.at[0]);
        const y = f.sy(wd.at[1]);
        const isRing = ring.includes(wd.w);
        const isHot = hot.includes(wd.w);
        const body = (
          <>
            {onTap && <circle cx={x} cy={y} r={14} className="fill-transparent" />}
            {isRing && <circle cx={x} cy={y} r={10} strokeWidth={2.2} className="animate-pulse fill-none stroke-[#047857]" />}
            <circle cx={x} cy={y} r={4} className={isHot ? "fill-cat-violet" : INK} />
            <text
              x={x}
              y={y - 8}
              textAnchor="middle"
              fontSize={10.5}
              fontWeight={isHot || isRing ? 700 : 600}
              className={`${isRing ? "fill-[#047857]" : isHot ? "fill-cat-violet" : INK} font-mono`}
            >
              {wd.w}
            </text>
          </>
        );
        return onTap ? (
          <g
            key={wd.w}
            role="button"
            tabIndex={0}
            aria-label={wd.w}
            onClick={() => onTap(wd)}
            onKeyDown={onEnter(() => onTap(wd))}
            className="cursor-pointer outline-none"
            style={{ opacity: 1 - fade }}
          >
            {body}
          </g>
        ) : (
          <g key={wd.w} style={{ opacity: 1 - fade }} className="pointer-events-none">
            {body}
          </g>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// The royal map. Men and boys along the bottom, the crowned row above, and
// two words that have nothing to do with any of it.

const WF = makeFrame(0, 10, 0, 8, 32, 20);
const ROYAL: Word[] = [
  { w: "man", at: [1.6, 1.4] },
  { w: "woman", at: [5.6, 1.0] },
  { w: "boy", at: [3.0, 0.5] },
  { w: "girl", at: [7.4, 0.4] },
  { w: "king", at: [2.6, 5.9] },
  { w: "queen", at: [6.9, 5.8] },
  { w: "prince", at: [4.1, 4.9] },
  { w: "princess", at: [8.5, 4.8] },
  { w: "car", at: [0.8, 7.3] },
  { w: "rice", at: [9.0, 7.4] },
];
const R = (w: string) => ROYAL.find((x) => x.w === w)!;
const MAN = R("man");
const KING = R("king");
const WOMAN = R("woman");
const BOY = R("boy");
const GIRL = R("girl");
const ROYAL_V = minus(KING.at, MAN.at);
const BASES = [MAN, WOMAN, BOY, GIRL];

// ---------------------------------------------------------------------------
// 1 · Through the list eye first: subtract box by box, get more numbers.

const KING_L = [0.52, -0.13, 0.88, 0.07, -0.41];
const MAN_L = [0.31, -0.09, 0.12, 0.05, -0.38];
const num2 = (n: number) => (n < 0 ? `−${(-n).toFixed(2)}` : n.toFixed(2));
const GUESS = [
  "আরও কয়েকটা সংখ্যা, আলাদা করে যেগুলোর কোনো মানে নাই",
  "“রাজা” শব্দটা, মানে পুরুষ বাদ দিয়ে শুধু রাজত্ব",
  "কিছুই না, শব্দ তো আর বিয়োগ হয় না",
];
const GUESS_RIGHT = 0;

function NumRow({ label, v, shown = v.length, tone = "" }: { label: string; v: (number | null)[]; shown?: number; tone?: string }) {
  return (
    <div className="flex items-center gap-1.5 font-mono whitespace-nowrap">
      <span className={`w-16 shrink-0 text-right font-semibold ${tone}`}>{label}</span>
      <span className="text-muted">(</span>
      {v.map((x, i) => (
        <b
          key={`${i}-${i < shown}`}
          className={`inline-block w-[3.6rem] rounded-md border px-1 py-0.5 text-center text-sm tabular-nums ${
            i < shown && x !== null ? `${POP} border-border` : "border-dashed border-border text-muted"
          }`}
        >
          {i < shown && x !== null ? num2(x) : "?"}
        </b>
      ))}
      <span className="text-sm text-muted">… আরো ২৯৫টা)</span>
    </div>
  );
}

export function ListGuess() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const sub = usePlay(360);
  const over = guess !== null && sub.k === KING_L.length;

  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    sub.play(KING_L.length, () => pass("List-এর চোখে উত্তর আসলেই এটুকু, আরও কয়েকটা সংখ্যা। Queen কোথাও লেখা নাই।"));
  };

  return (
    <>
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="mx-auto grid w-max gap-2">
          <NumRow label="king" v={KING_L} />
          <NumRow label="− man" v={MAN_L} />
          <div className="ml-[4.4rem] border-t border-border" />
          <NumRow label="=" v={KING_L.map((x, i) => x - MAN_L[i])} shown={guess === null ? 0 : sub.k} tone="text-cat-violet" />
        </div>
      </div>
      {over && <ShomSays>এবার এর সাথে woman-এর list যোগ কর, তারপর দেখ কোন শব্দটা সবচেয়ে কাছে। Queen!</ShomSays>}
      <div className="mt-5 text-sm font-medium text-muted">king − man করলে হাতে কী আসবে?</div>
      <div className="mt-2 grid gap-2">
        {GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, GUESS_RIGHT)} disabled={guess !== null} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={over}>আগে guess করুন। তারপর ঘরে ঘরে বিয়োগটা হতে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The toy map: every word two numbers, a point on paper.

export function WordMap() {
  const pass = useGate();
  const [seen, setSeen] = useState<string[]>([]);
  const [last, setLast] = useState<Word | null>(null);

  const tap = (wd: Word) => {
    setLast(wd);
    if (seen.includes(wd.w)) return;
    const next = [...seen, wd.w];
    setSeen(next);
    if (next.length === 4) pass("কাছাকাছি মানের শব্দ, কাছাকাছি জায়গায়। কেউ বসিয়ে দেয়নি।");
  };

  return (
    <>
      <Plane f={WF} axes={false} label="a toy word map: every word is a point" className="max-w-[23rem]">
        <Words f={WF} words={ROYAL} onTap={tap} hot={seen} />
      </Plane>
      <div className="mx-auto min-h-12 max-w-sm rounded-2xl border border-border px-4 py-3 text-center">
        {last ? (
          <span key={last.w} className={`${FADE} font-mono text-lg`}>
            <b className="text-cat-violet">{last.w}</b> = {pair(last.at)}
          </span>
        ) : (
          <span className="text-muted">যেকোনো শব্দে tap করুন</span>
        )}
      </div>
      <Task done={seen.length >= 4}>
        অন্তত চারটা শব্দে tap করে দেখুন, কার সংখ্যা কত ({bn(Math.min(seen.length, 4))}/৪)
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · king − man, drawn as end − start. The wrong way round says which sum it is.

export function KingMinusMan() {
  const pass = useGate();
  const [first, setFirst] = useState<Word | null>(null);
  const [drawn, setDrawn] = useState<[Word, Word] | null>(null);
  const [miss, setMiss] = useState(0);
  const ok = drawn !== null && drawn[0] === MAN && drawn[1] === KING;

  const tap = (wd: Word) => {
    if (ok) return;
    if (!first) {
      setFirst(wd);
      setDrawn(null);
      return;
    }
    if (wd === first) {
      setFirst(null);
      return;
    }
    setDrawn([first, wd]);
    setFirst(null);
    if (first === MAN && wd === KING) pass("king − man: man থেকে king-এর দিকে তাক করা একটা arrow।");
    else setMiss((m) => m + 1);
  };

  const d = drawn ? minus(drawn[1].at, drawn[0].at) : null;

  return (
    <>
      <Plane f={WF} axes={false} label="the word map; tap a start word, then an end word" className="max-w-[23rem]">
        {drawn && <Arrow key={`${drawn[0].w}-${drawn[1].w}`} f={WF} from={drawn[0].at} to={drawn[1].at} tone={ok ? "violet" : "danger"} draw w={3} />}
        <Words f={WF} words={ROYAL} onTap={tap} hot={[first?.w ?? "", ...(drawn ? [drawn[0].w, drawn[1].w] : [])]} />
      </Plane>
      <div className="mx-auto min-h-16 max-w-md rounded-2xl border border-border px-4 py-3 text-center">
        {drawn && d ? (
          <div key={`${drawn[0].w}${drawn[1].w}`} className={FADE}>
            <div className="font-mono">
              {drawn[1].w} − {drawn[0].w}
            </div>
            <div className="font-mono text-sm text-muted">
              ({f1(drawn[1].at[0])} − {f1(drawn[0].at[0])}, {f1(drawn[1].at[1])} − {f1(drawn[0].at[1])})
            </div>
            <div className={`font-mono text-lg font-bold ${ok ? "text-cat-violet" : "text-danger"}`}>= {pair(d)}</div>
          </div>
        ) : (
          <span className="text-muted">{first ? `শুরু: ${first.w}। এবার শেষের শব্দে tap করুন।` : "আগে শুরুর শব্দে tap করুন।"}</span>
        )}
      </div>
      {miss > 0 && !ok && drawn && (
        <Nope key={miss}>
          এটা তো {drawn[1].w} − {drawn[0].w}। king − man মানে Start man, শেষ king। আবার tap করুন।
        </Nope>
      )}
      <Task done={ok}>king − man-এর arrow আঁকুন: আগে শুরুর শব্দ, তারপর শেষের শব্দ।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Carry the arrow. It snaps onto a word when it gets close, and the tip's
//     nearest word lights up wherever it goes.

const SNAP = 0.6;

/** how far p is from the segment a–b */
function toSegment(p: XY, a: XY, b: XY) {
  const ab = minus(b, a);
  const t = clamp(((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2), 0, 1);
  return dist(p, plus(a, [ab[0] * t, ab[1] * t]));
}

export function CarryArrow() {
  const pass = useGate();
  const [tail, setTail] = useState<XY>(MAN.at);
  const [held, setHeld] = useState(false);
  const [grip, setGrip] = useState<XY>([0, 0]);
  const [landed, setLanded] = useState<string[]>([]);
  const [tx, ty] = useTween(tail, held ? 1 : 650);
  const t: XY = [tx, ty];
  const tip = plus(t, ROYAL_V);
  const onWord = ROYAL.find((wd) => dist(wd.at, tail) < 0.01) ?? null;
  const near = nearest(tip, ROYAL, onWord && onWord !== MAN ? [onWord.w, "king", "man"] : onWord ? [onWord.w] : []);
  const hit = near.d < NEAR;

  const settle = (p: XY): XY => {
    const snapTo = ROYAL.find((wd) => dist(wd.at, p) < SNAP);
    const q = snapTo ? snapTo.at : p;
    return [clamp(q[0], WF.x0, WF.x1 - ROYAL_V[0]), clamp(q[1], WF.y0, WF.y1 - ROYAL_V[1])];
  };

  const land = (p: XY) => {
    const wd = BASES.find((b) => dist(b.at, p) < 0.01);
    if (!wd || landed.includes(wd.w)) return;
    setLanded([...landed, wd.w]);
    if (wd === WOMAN) pass("woman + (king − man) ≈ queen। সোমের ধাঁধা মিটলো, নিজের হাতে।");
  };

  const put = (wd: Word) => {
    setTail(wd.at);
    land(wd.at);
  };

  return (
    <>
      <Plane
        f={WF}
        axes={false}
        label={`the king − man arrow, drawn from ${onWord ? onWord.w : "an empty spot"}; drag it`}
        className="max-w-[23rem]"
        drag={{
          down: (p) => {
            setHeld(true);
            const g = toSegment(p, tail, plus(tail, ROYAL_V)) < 0.9 ? minus(p, tail) : ([0, 0] as XY);
            setGrip(g);
            setTail(settle(minus(p, g)));
          },
          move: (p) => setTail(settle(minus(p, grip))),
          up: () => {
            setHeld(false);
            land(tail);
          },
        }}
      >
        <Arrow f={WF} from={MAN.at} to={KING.at} tone="violet" faint />
        <Words f={WF} words={ROYAL} ring={hit ? [near.word.w] : []} hot={onWord ? [onWord.w] : []} />
        <Arrow f={WF} from={t} to={tip} tone="violet" w={3.2} />
        {hit && (
          <path
            d={`M${WF.sx(tip[0])} ${WF.sy(tip[1])}L${WF.sx(near.word.at[0])} ${WF.sy(near.word.at[1])}`}
            strokeDasharray="2 3"
            strokeWidth={1.2}
            className="pointer-events-none fill-none stroke-[#047857]"
          />
        )}
      </Plane>
      <div className="mx-auto max-w-md rounded-2xl border border-border px-4 py-3 text-center font-mono text-lg">
        {onWord ? onWord.w : "এই জায়গা"} + (king − man) ≈{" "}
        <b key={hit ? near.word.w : "none"} className={`${POP} inline-block ${hit ? "text-accent-text" : "font-sans text-base text-muted"}`}>
          {hit ? near.word.w : "কাছে কোনো শব্দ নাই"}
        </b>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {BASES.map((wd) => (
          <button
            key={wd.w}
            type="button"
            onClick={() => put(wd)}
            className="cursor-pointer rounded-full border-2 border-border px-3.5 py-1 font-mono text-sm font-semibold transition-colors hover:border-cat-violet/60"
          >
            {landed.includes(wd.w) ? "✓ " : ""}
            {wd.w} থেকে
          </button>
        ))}
      </div>
      <Task done={landed.includes("woman")}>Arrow-টা ধরে টেনে woman-এর ওপর বসান (বা নিচের button চাপুন)। মাথাটা কোথায় পড়ে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · All four royal pairs, drawn; then their tails brought together.

const PAIRS: { a: Word; b: Word; tone: Tone; text: string }[] = [
  { a: MAN, b: KING, tone: "violet", text: "text-cat-violet" },
  { a: WOMAN, b: R("queen"), tone: "coral", text: "text-cat-coral" },
  { a: BOY, b: R("prince"), tone: "blue", text: "text-cat-blue" },
  { a: GIRL, b: R("princess"), tone: "teal", text: "text-cat-teal" },
];
const BUNDLE: XY = [5, 1.5];

export function ParallelArrows() {
  const pass = useGate();
  const [drawn, setDrawn] = useState<number[]>([]);
  const [bundled, setBundled] = useState(false);
  const [p] = useTween([bundled ? 1 : 0], 1200);
  const settle = usePlay(1300);
  const all = drawn.length === PAIRS.length;

  const draw = (i: number) => {
    if (drawn.includes(i)) return;
    setDrawn([...drawn, i]);
  };
  const bundle = () => {
    const b = !bundled;
    setBundled(b);
    if (b) settle.play(1, () => pass("চারটা সম্পর্ক, প্রায় একটাই arrow। “রাজকীয়” জিনিসটা একটা direction।"));
  };

  return (
    <>
      <Plane f={WF} axes={false} label="the four royal pairs, each joined by an arrow" className="max-w-[23rem]">
        <Words f={WF} words={ROYAL} fade={p * 0.7} />
        {drawn.map((i) => {
          const pr = PAIRS[i];
          const v = minus(pr.b.at, pr.a.at);
          const s = mix(pr.a.at, BUNDLE, p);
          return <Arrow key={i} f={WF} from={s} to={plus(s, v)} tone={pr.tone} w={2.8} draw={p === 0} />;
        })}
      </Plane>
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
        {PAIRS.map((pr, i) => (
          <button
            key={pr.a.w}
            type="button"
            onClick={() => draw(i)}
            className={`cursor-pointer rounded-xl border-2 px-2 py-1.5 text-center font-mono text-sm transition-colors ${
              drawn.includes(i) ? "border-border bg-foreground/5" : "border-border hover:border-cat-violet/60"
            }`}
          >
            <span className="font-semibold">
              {pr.a.w} → {pr.b.w}
            </span>
            {drawn.includes(i) && <span className={`${FADE} block font-bold ${pr.text}`}>{pair(minus(pr.b.at, pr.a.at))}</span>}
          </button>
        ))}
      </div>
      {all && (
        <div className={`${FADE} mt-4 flex justify-center`}>
          <button type="button" onClick={bundle} className={bundled ? quietBtn : primaryBtn}>
            {bundled ? "আবার জায়গামতো পাঠান" : "চারটার লেজ এক জায়গায় আনুন"}
          </button>
        </div>
      )}
      <Ticks
        items={[
          ["চারটা জোড়াই আঁকুন", all],
          ["লেজ এক জায়গায়", settle.k === 1],
        ]}
      />
      <Task done={settle.k === 1}>চারটা জোড়ার arrow-ই আঁকুন, তারপর ওদের লেজ এক জায়গায় এনে পাশাপাশি রাখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Capitals. Paris − France, carried to three other countries.

const CF = makeFrame(0, 11, 0, 7, 30, 20);
const GEO: Word[] = [
  { w: "France", at: [1.0, 1.2] },
  { w: "Paris", at: [2.4, 4.8] },
  { w: "Italy", at: [3.6, 0.8] },
  { w: "Rome", at: [5.1, 4.3] },
  { w: "Japan", at: [6.2, 1.3] },
  { w: "Tokyo", at: [7.7, 4.8] },
  { w: "Bangladesh", at: [8.9, 0.9] },
  { w: "Dhaka", at: [10.2, 4.4] },
  { w: "pizza", at: [4.6, 2.6] },
  { w: "sushi", at: [7.0, 2.8] },
  { w: "hilsa", at: [9.6, 2.6] },
];
const G = (w: string) => GEO.find((x) => x.w === w)!;
const CAP_V = minus(G("Paris").at, G("France").at);
const LANDS = ["Italy", "Japan", "Bangladesh"].map(G);

export function CapitalMap() {
  const pass = useGate();
  const [from, setFrom] = useState<Word>(G("France"));
  const [went, setWent] = useState<string[]>([]);
  const [tx, ty] = useTween(from.at, 750);
  const tip = plus([tx, ty], CAP_V);
  const arrived = dist([tx, ty], from.at) < 0.02;
  const near = nearest(plus(from.at, CAP_V), GEO, [from.w, "France", "Paris"]);
  const hit = from.w !== "France" && near.d < NEAR;

  const go = (wd: Word) => {
    setFrom(wd);
    if (wd.w === "France" || went.includes(wd.w)) return;
    const next = [...went, wd.w];
    setWent(next);
    if (next.length === 2) pass("দেশ বদলায়, direction একই থাকে: “অমুক দেশের রাজধানী”।");
  };

  return (
    <>
      <Plane f={CF} axes={false} label="countries along the bottom, capitals above, food in between" className="max-w-[24rem]">
        <Arrow f={CF} from={G("France").at} to={G("Paris").at} tone="amber" faint />
        <Words f={CF} words={GEO} ring={hit && arrived ? [near.word.w] : []} hot={[from.w]} />
        <Arrow f={CF} from={[tx, ty]} to={tip} tone="amber" w={3.2} />
      </Plane>
      <div className="mx-auto max-w-md rounded-2xl border border-border px-4 py-3 text-center font-mono text-[1.05rem]">
        {from.w} + (Paris − France){" "}
        {from.w === "France" ? (
          <>= Paris</>
        ) : (
          <>
            ≈{" "}
            <b key={from.w} className={`${POP} inline-block text-accent-text`}>
              {hit ? near.word.w : "?"}
            </b>
          </>
        )}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {LANDS.map((wd) => (
          <button
            key={wd.w}
            type="button"
            onClick={() => go(wd)}
            className={`cursor-pointer rounded-full border-2 px-3.5 py-1 font-mono text-sm font-semibold transition-colors ${
              from === wd ? "border-cat-amber bg-cat-amber/10" : "border-border hover:border-cat-amber/60"
            }`}
          >
            {went.includes(wd.w) ? "✓ " : ""}
            {wd.w}
          </button>
        ))}
      </div>
      <Task done={went.length >= 2}>
        Arrow-টা অন্তত দুইটা দেশে বসিয়ে দেখুন ({bn(Math.min(went.length, 2))}/২)
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · One sum, two eyes: the numbers box by box, and the arrows on the map.

const SUM = plus(minus(KING.at, MAN.at), WOMAN.at);

export function TwoEyes() {
  const pass = useGate();
  const [view, setView] = useState<"list" | "arrow">("list");
  const [seen, setSeen] = useState<string[]>(["list"]);
  const pick = (v: "list" | "arrow") => {
    setView(v);
    if (seen.includes(v)) return;
    setSeen([...seen, v]);
    pass("সংখ্যা একই, হিসাবও একই। শুধু দেখার চোখ আলাদা।");
  };
  const rows: [string, XY, string][] = [
    ["king", KING.at, ""],
    ["− man", MAN.at, ""],
    ["+ woman", WOMAN.at, ""],
    ["=", SUM, "text-cat-violet"],
  ];

  return (
    <>
      <div className="mt-5 flex justify-center gap-2">
        {(["list", "arrow"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => pick(v)}
            className={`cursor-pointer rounded-full border-2 px-4 py-1.5 font-semibold transition-colors ${
              view === v ? "border-cat-violet bg-cat-violet text-white" : "border-border hover:border-cat-violet/60"
            }`}
          >
            {v === "list" ? "list-এর চোখে" : "arrow-এর চোখে"}
          </button>
        ))}
      </div>
      {view === "list" ? (
        <div key="list" className={`${FADE} my-5 overflow-x-auto`}>
          <table className="mx-auto border-separate border-spacing-x-3 border-spacing-y-1 font-mono">
            <thead>
              <tr className="text-xs text-muted">
                <th />
                <th className="font-normal">ঘর ১</th>
                <th className="font-normal">ঘর ২</th>
                <th className="font-normal">ঘর ৩ … ৩০০</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, v, tone], i) => (
                <tr key={name} className={`${FADE} ${tone}`} style={{ transitionDelay: `${i * 250}ms` }}>
                  <td className="pr-2 text-right font-semibold">{name}</td>
                  <td className={`rounded-md px-2 text-center ${i === 3 ? "border-t-2 border-border font-bold" : ""}`}>{f1(v[0])}</td>
                  <td className={`rounded-md px-2 text-center ${i === 3 ? "border-t-2 border-border font-bold" : ""}`}>{f1(v[1])}</td>
                  <td className="text-center text-muted">…</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-center text-[0.95rem]">
            তারপর সব শব্দের list-এর সাথে মিলিয়ে দেখা, কোনটা সবচেয়ে কাছে। উত্তর: <b className="font-mono">queen {pair(R("queen").at)}</b>
          </div>
        </div>
      ) : (
        <div key="arrow" className={FADE}>
          <Plane f={WF} axes={false} label="the same sum as arrows: king − man carried to woman" className="max-w-[23rem]">
            <Arrow f={WF} from={MAN.at} to={KING.at} tone="violet" faint />
            <Words f={WF} words={ROYAL} ring={["queen"]} hot={["woman"]} />
            <Arrow f={WF} from={WOMAN.at} to={SUM} tone="violet" w={3.2} draw />
          </Plane>
          <div className="text-center text-[0.95rem]">man থেকে king-এর দিকে যে arrow, woman থেকে সেটা ধরে হাঁটলে পৌঁছাবেন queen-এর পাশে।</div>
        </div>
      )}
      <Task done={seen.length === 2}>একই হিসাব দুই চোখেই দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The reader's own find: a map of verbs and nouns with two directions
//     hidden in it. Pick a pair for the arrow, then a word to walk it from.

const GF = makeFrame(0, 12, 0, 9, 27, 20);
const GRAM: Word[] = [
  { w: "walk", at: [0.8, 1.0] },
  { w: "walked", at: [2.2, 3.8] },
  { w: "jump", at: [2.9, 0.6] },
  { w: "jumped", at: [4.2, 3.6] },
  { w: "swim", at: [4.8, 1.3] },
  { w: "swam", at: [6.1, 4.2] },
  { w: "eat", at: [0.6, 5.4] },
  { w: "ate", at: [1.9, 8.3] },
  { w: "cat", at: [7.2, 6.6] },
  { w: "cats", at: [9.9, 6.8] },
  { w: "dog", at: [7.6, 4.6] },
  { w: "dogs", at: [10.2, 4.9] },
  { w: "car", at: [7.0, 2.2] },
  { w: "cars", at: [9.6, 2.5] },
];
type Rel = "past" | "plural";
const RELS: { id: Rel; name: string; pairs: [string, string][] }[] = [
  {
    id: "past",
    name: "past tense",
    pairs: [
      ["walk", "walked"],
      ["jump", "jumped"],
      ["swim", "swam"],
      ["eat", "ate"],
    ],
  },
  {
    id: "plural",
    name: "plural",
    pairs: [
      ["cat", "cats"],
      ["dog", "dogs"],
      ["car", "cars"],
    ],
  },
];
const Gw = (w: string) => GRAM.find((x) => x.w === w)!;
const relOf = (a: string, b: string) => RELS.find((r) => r.pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a)));

/** Which direction this try found, if it found one: the arrow is a real pair and C landed on C's partner. */
function verdict(a: string, b: string, c: string, got: string): Rel | null {
  const r = relOf(a, b);
  if (!r) return null;
  const forward = r.pairs.some(([x, y]) => x === a && y === b);
  const cp = r.pairs.find((pp) => pp[forward ? 0 : 1] === c);
  return cp && cp[forward ? 1 : 0] === got ? r.id : null;
}

export function FindPair() {
  const pass = useGate();
  const [sel, setSel] = useState<string[]>([]);
  const [found, setFound] = useState<Rel[]>([]);
  const [tries, setTries] = useState(0);
  const [a, b, c] = sel.map(Gw);
  const v = a && b ? minus(b.at, a.at) : null;
  const [pt] = useTween([c ? 1 : 0], 900);
  const tail = a ? (c ? mix(a.at, c.at, pt) : a.at) : null;
  const res = a && b && c && v ? nearest(plus(c.at, v), GRAM, sel) : null;
  const got = res && res.d < NEAR ? res.word.w : null;
  const win = a && b && c && got ? verdict(a.w, b.w, c.w, got) : null;

  const tap = (wd: Word) => {
    if (sel.length === 3 || sel.includes(wd.w)) return;
    const next = [...sel, wd.w];
    setSel(next);
    if (next.length < 3) return;
    setTries((t) => t + 1);
    const [na, nb, nc] = next.map(Gw);
    const r = nearest(plus(nc.at, minus(nb.at, na.at)), GRAM, next);
    const w = r.d < NEAR ? verdict(na.w, nb.w, nc.w, r.word.w) : null;
    if (w && !found.includes(w)) {
      const f = [...found, w];
      setFound(f);
      if (f.length === RELS.length) pass("দুইটা direction-ই আপনি নিজে খুঁজে বের করলেন।");
    }
  };

  const why = () => {
    if (!a || !b || !c) return "";
    const r = relOf(a.w, b.w);
    if (!r) return `${a.w} আর ${b.w}-এর মধ্যে পরিষ্কার কোনো সম্পর্ক নাই। walk আর walked-এর মতো একটা জোড়া নিন।`;
    if (!r.pairs.some((pp) => pp.includes(c.w))) return `${c.w} তো অন্য দলের শব্দ। “${r.name}” direction ধরে হাঁটলে ওর কোথাও পৌঁছানোর নাই। একই দলের একটা শব্দে বসান।`;
    return "কাছাকাছি গিয়েও মিললো না। Arrow-এর Start আর শেষ ঠিক আছে তো?";
  };

  const STEP = ["১. Arrow-এর শুরুর শব্দে tap করুন", "২. এবার শেষের শব্দে", "৩. কোন শব্দ থেকে হাঁটবেন?"];

  return (
    <>
      <Plane f={GF} axes={false} label="a word map of verbs and nouns" className="max-w-[24rem]">
        {a && b && <Arrow key={`${a.w}-${b.w}`} f={GF} from={a.at} to={b.at} tone="violet" faint={!!c} draw={!c} />}
        {tail && v && c && <Arrow f={GF} from={tail} to={plus(tail, v)} tone="violet" w={3.2} />}
        <Words f={GF} words={GRAM} onTap={tap} hot={sel} ring={got && pt > 0.97 ? [got] : []} />
      </Plane>
      <div className="mx-auto min-h-20 max-w-md rounded-2xl border border-border px-4 py-3 text-center">
        {sel.length < 3 ? (
          <div className="text-muted">
            {STEP[sel.length]}
            {sel.length > 0 && <span className="mt-1 block font-mono text-foreground">{sel.join(" → ")}</span>}
          </div>
        ) : (
          <div key={tries} className={FADE}>
            <div className="font-mono text-[1.05rem]">
              {c!.w} + ({b!.w} − {a!.w}) ≈ <b className={win ? "text-accent-text" : ""}>{got ?? "?"}</b>
            </div>
            {win ? (
              <div className="mt-1 text-sm font-semibold text-accent-text">মিলেছে! এটাই “{RELS.find((r) => r.id === win)!.name}” direction।</div>
            ) : (
              <Nope>{why()}</Nope>
            )}
            <button type="button" onClick={() => setSel([])} className={`${quietBtn} mt-2 h-9 px-4 text-sm`}>
              আবার বাছুন
            </button>
          </div>
        )}
      </div>
      <Ticks items={RELS.map((r) => [`${r.name} direction`, found.includes(r.id)] as [string, boolean])} />
      <Task done={found.length === RELS.length}>একটা জোড়া দিয়ে arrow বানিয়ে আরেকটা শব্দে বসান। দুইটা direction-ই খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The last picture: one arrow, walked from all four bottom-row words.

const REEL_HEADS = ["king", "queen", "prince", "princess"];

function FinaleReel({ onReplay }: { onReplay: () => void }) {
  const k = useCountUp(BASES.length + 1, 1300);
  const i = clamp(k - 1, 0, BASES.length - 1);
  const [tx, ty] = useTween(BASES[i].at, 800);
  const t: XY = [tx, ty];
  const there = dist(t, BASES[i].at) < 0.02;
  const done = k > BASES.length;

  return (
    <>
      <Plane f={WF} axes={false} label="the king − man arrow walked from man, woman, boy and girl" className="max-w-[23rem]">
        {BASES.slice(0, i).map((b) => (
          <Arrow key={b.w} f={WF} from={b.at} to={plus(b.at, ROYAL_V)} tone="violet" faint />
        ))}
        <Words f={WF} words={ROYAL} ring={k >= 1 && there ? [REEL_HEADS[i]] : []} />
        {k >= 1 && <Arrow f={WF} from={t} to={plus(t, ROYAL_V)} tone="violet" w={3.2} draw={k === 1} />}
      </Plane>
      <div className="min-h-24 text-center">
        {done ? (
          <div className={FADE}>
            <div className="text-xl font-bold">একটা arrow, চারটা সম্পর্ক</div>
            <div className="text-muted">list হিসেবে রাখুন, arrow হিসেবে ভাবুন</div>
            <button
              type="button"
              onClick={onReplay}
              className="mt-3 cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              ↺ আবার দেখুন
            </button>
          </div>
        ) : k >= 1 ? (
          <div key={k} className={`${FADE} font-mono text-lg`}>
            {BASES[i].w} + (king − man) ≈ {REEL_HEADS[i]}
          </div>
        ) : null}
      </div>
    </>
  );
}

export function Finale() {
  const [run, setRun] = useState(0);
  return <FinaleReel key={run} onReplay={() => setRun((r) => r + 1)} />;
}
