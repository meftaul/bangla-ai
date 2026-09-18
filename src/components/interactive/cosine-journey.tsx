"use client";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Speech, Ticks, pill, primaryBtn, useSeed, type Fixtures } from "@/components/journey/kit";
import { Arrow, Label, Plane, makeFrame, type XY } from "@/components/journey/plane";
import { Tape } from "./dimension-journey";
import { bn } from "./figure-kit";
import { dot, tupN } from "./haat-journey";

// Screens for "Math for AI 4.4 — Cosine similarity, কার ছবি বেশি মানানসই", told as a Journey.
//
// TV night. Under 3.6's fixed club rule (films normalised) মামা's Mr. Bean
// scores 5.34 and মামী's Titanic 4.09, so মামা claims his film fits him
// better. The reader bets. মামা's own taste arrow turns out longer (he rates
// everything loudly), so the person's length is in the score too. 4.3's rule
// run backwards, dividing both sides of a balance, leaves cos θ alone; a
// fixed −1…1 scale is read (0.9 is 26°, not 90%); 3.6's 3.71 is one division
// short of মামা's 0.69 with Titanic; নানু, who has watched nothing, has no
// direction and gets NaN. Last the reader computes both cosines unaided:
// 0.991 and 0.991, a tie, and a mirror shows why.
//
// Tailwind only; the sheets are journey/plane. Ink on the white sheet is fixed.

const O: XY = [0, 0];
const len = (v: readonly number[]) => Math.hypot(...v);
const cosOf = (a: XY, b: XY) => dot(a, b) / (len(a) * len(b));
/** a number to d decimals with a real minus */
const fix = (n: number, d: number) => {
  const s = Math.abs(n).toFixed(d);
  return n < 0 && Number(s) !== 0 ? `−${s}` : s;
};

// Scores run (drama, comedy), as in 3.6.
const MAMA: XY = [2, 5];
const MAMI: XY = [4, 1];
const TITANIC: XY = [5, 2];
const BEAN: XY = [1, 4];

function Card({ who, film, score, tone }: { who: string; film: string; score: string; tone: "teal" | "violet" }) {
  return (
    <div className={`rounded-xl border-2 bg-surface px-2 py-2 text-center ${tone === "teal" ? "border-cat-teal/40" : "border-cat-violet/40"}`}>
      <div className={`text-sm font-semibold ${tone === "teal" ? "text-cat-teal" : "text-cat-violet"}`}>{who}</div>
      <div className="text-xs text-muted">{film}</div>
      <div className="font-mono text-2xl font-bold">{score}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · Whose film fits better? 3.6's club rule (films normalised) gives মামা
//     and Mr. Bean 5.34, মামী and Titanic 4.09. মামা claims the win. The
//     reader seals a bet, settled only by VerdictCos (screen 7).

const FIT_BET = ["মামার ছবি, নম্বর তো বেশি", "মামীর ছবি", "দুইজনেরই একদম সমান", "এই নম্বর দেখে বলাই যায় না"];

export function WhoFits() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি সিল হলো। মামার 5.34 আর মামীর 4.09 আসলে কী মাপছে, আগে সেটা খুলে দেখা যাক।");
  };

  return (
    <>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Card who="মামা (2, 5)" film="Mr. Bean (1, 4)" score="5.34" tone="teal" />
        <Card who="মামী (4, 1)" film="Titanic (5, 2)" score="4.09" tone="violet" />
      </div>
      <Speech who="মামা" initial="মা">
        নম্বর দেখো! আমার ছবিটা আমার সাথে বেশি মানানসই। কাল সকালের চা তুমি বানাবে।
      </Speech>
      <div className="mt-3 text-sm font-medium text-muted">কার ছবি তার সাথে বেশি মানানসই?</div>
      <div className="mt-2 grid gap-2">
        {FIT_BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>দুইটা নম্বর দেখে একটাতে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The loud person. Measure the two tastes: মামা 5.39, মামী 4.12. Then
//     double মামা's card, (4, 10): same taste, score 5.34 → 10.67.

const FL = makeFrame(-0.5, 5.5, -0.5, 10.5, 20);

export function LoudPerson() {
  const pass = useGate();
  const [measured, setMeasured] = useSeed<number[]>("measured", []);
  const [doubled, setDoubled] = useSeed("doubled", false);
  const both = measured.length === 2;
  const mama: XY = doubled ? [4, 10] : MAMA;
  const score = dot(mama, BEAN) / len(BEAN);

  const measure = (i: number) => !measured.includes(i) && setMeasured([...measured, i]);
  const double = () => {
    setDoubled(true);
    pass("রুচি একই, শুধু মামা সবকিছুতে দ্বিগুণ নম্বর দিলেন, আর score-ও দ্বিগুণ। দৈর্ঘ্য শুধু ছবির থাকে না, মানুষেরও থাকে।");
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Plane f={FL} ticks={2} label={`মামার পছন্দ ${tupN(mama)}, মামীর পছন্দ (4, 1)`} className="max-w-[8rem] shrink-0">
          {measured.includes(0) && !doubled && <Tape f={FL} from={O} to={MAMA} />}
          {measured.includes(1) && <Tape f={FL} from={O} to={MAMI} />}
          {doubled && <Arrow f={FL} from={O} to={MAMA} tone="teal" w={2} dashed faint />}
          <Arrow f={FL} from={O} to={mama} tone="teal" w={2.6} />
          <Arrow f={FL} from={O} to={MAMI} tone="violet" w={2.6} />
          <Label f={FL} at={mama} dx={6} dy={4} anchor="start" className="fill-cat-teal">
            মামা
          </Label>
          <Label f={FL} at={MAMI} dy={-8} className="fill-cat-violet">
            মামী
          </Label>
        </Plane>
        <div className="grid min-w-0 flex-1 gap-2">
          {["মামার", "মামীর"].map((w, i) => (
            <button key={w} type="button" disabled={measured.includes(i)} onClick={() => measure(i)} className={`${pill(measured.includes(i))} font-sans`}>
              {measured.includes(i) ? <span className={FADE}>{w} পছন্দ {i === 0 ? "5.39" : "4.12"} লম্বা</span> : `${w} পছন্দ মাপুন`}
            </button>
          ))}
          {both && (
            <div className={`${FADE} rounded-xl border border-border bg-surface px-3 py-2 text-center`}>
              <div className="text-sm">মামা {tupN(mama)} আর Mr. Bean</div>
              <div className="font-mono text-xl font-bold">
                <span key={String(doubled)} className={`${POP} inline-block`}>
                  {fix(score, 2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      {both && !doubled && (
        <div className={`${FADE} mt-3 text-center`}>
          <div className="text-[0.95rem]">মামা যদি একই রুচি রেখে সবকিছুতে দ্বিগুণ নম্বর দিতেন?</div>
          <button type="button" onClick={double} className={`${primaryBtn} mt-2`}>
            মামার card দ্বিগুণ করুন
          </button>
        </div>
      )}
      <Ticks
        items={[
          ["দুইজনের দৈর্ঘ্য", both],
          ["মামা দ্বিগুণ", doubled],
        ]}
      />
      <Task done={doubled}>দুইজনের পছন্দের arrow ফিতা দিয়ে মাপুন, তারপর মামার card দ্বিগুণ করে score-টা দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Run 4.3's rule backwards on a balance. Divide both sides by ‖v‖ and by
//     ‖w‖, in either order, and cos θ stands alone. Dividing one side only tips the balance.
//     Then a practice pair, (3, 4) and (4, 3): 24 ÷ 5 ÷ 5 = 0.96, about 16°.

const LENGTHS = ["‖v‖", "‖w‖"];
const MOVES = ["দুই পাশ ‖v‖ দিয়ে ভাগ", "দুই পাশ ‖w‖ দিয়ে ভাগ", "শুধু ডান পাশ ভাগ"];

function Balance({ tilt }: { tilt: boolean }) {
  return (
    <svg viewBox="0 -12 200 52" className="mx-auto block h-auto w-full max-w-[14rem]" aria-hidden="true">
      <path d="M100 38L92 24H108Z" className="fill-foreground/40" />
      <g style={{ transform: `rotate(${tilt ? -8 : 0}deg)`, transformOrigin: "100px 22px" }} className="transition-transform duration-500 motion-reduce:transition-none">
        <rect x={14} y={19} width={172} height={5} rx={2.5} className={tilt ? "fill-danger/70" : "fill-foreground/50"} />
        <path d="M24 22V8M176 22V8" strokeWidth={1.5} className="stroke-foreground/40" />
      </g>
    </svg>
  );
}

export function RunBackwards() {
  const pass = useGate();
  const [cut, setCut] = useSeed<number[]>("cut", []);
  const [tilt, setTilt] = useSeed<number | null>("tilt", null);
  const [tried, setTried] = useSeed("tried", false);
  const alone = cut.length === 2;
  const left = cut.length ? `(v · w) ${cut.map((i) => `÷ ${LENGTHS[i]}`).join(" ")}` : "v · w";
  const right = [...LENGTHS.filter((_, i) => !cut.includes(i)), "cos θ"].join(" × ");

  const move = (i: number) => {
    if (i === 2) return setTilt((tilt ?? 0) + 1);
    if (cut.includes(i)) return;
    setTilt(null);
    setCut([...cut, i]);
  };
  const practise = () => {
    setTried(true);
    pass("বাক্সের নম্বর থেকে দুইটা দৈর্ঘ্য ভাগ করে দিলে পড়ে থাকে শুধু cos θ, মানে শুধু কোণের খবর।");
  };

  return (
    <>
      <Balance tilt={tilt !== null} />
      <div className="mx-auto grid max-w-sm grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
        <div key={`l${cut.length}`} className={`${POP} rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-2 py-2 font-mono text-sm`}>
          {left}
        </div>
        <span className={`font-mono text-xl ${tilt !== null ? "text-danger" : ""}`}>{tilt !== null ? "≠" : "="}</span>
        <div key={`r${cut.length}`} className={`${POP} rounded-xl border-2 border-cat-violet/40 bg-cat-violet/5 px-2 py-2 font-mono text-sm ${alone ? "text-lg font-bold" : ""}`}>
          {right}
        </div>
      </div>
      {tilt !== null && <Nope key={tilt}>দাঁড়িপাল্লা হেলে গেল। শুধু এক পাশে ভাগ করলে দুই পাশ আর সমান থাকে না।</Nope>}
      {!alone ? (
        <div className="mt-3 grid gap-2">
          {MOVES.map((m, i) => (
            <button key={m} type="button" disabled={cut.includes(i)} onClick={() => move(i)} className={`${pill(cut.includes(i))} font-sans`}>
              {m}
            </button>
          ))}
        </div>
      ) : (
        <div className={`${FADE} mt-3 text-center`}>
          <div className="text-[0.95rem]">চলুন একটা জোড়ায় চালিয়ে দেখি: (3, 4) আর (4, 3)। দুইজনই 5 লম্বা।</div>
          {!tried ? (
            <button type="button" onClick={practise} className={`${primaryBtn} mt-2`}>
              হিসাবটা চালান
            </button>
          ) : (
            <div className={`${FADE} mt-2 text-[0.95rem]`}>
              <span className="font-mono">
                24 ÷ 5 ÷ 5 = <b>0.96</b>
              </span>
              , মানে প্রায় 16°
            </div>
          )}
        </div>
      )}
      <Task done={tried}>দুই পাশে একই ভাগ করে cos θ-কে একা করুন। তারপর একটা জোড়ায় হিসাবটা চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The fixed scale. An angle slider turns two unit arrows apart, and a pin
//     slides on a −1…1 bar. Find the angles for 0.9, 0.5, 0 and −1: about 26°,
//     60°, 90° and 180°. 0.9 is not 90% alike.

const FC = makeFrame(-1.3, 1.3, -0.3, 1.3, 70);
const MARKS = [
  { c: 0.9, deg: 26 },
  { c: 0.5, deg: 60 },
  { c: 0, deg: 90 },
  { c: -1, deg: 180 },
];

export function ScaleCard() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 45);
  const [hit, setHit] = useSeed<number[]>("hit", []);
  const c = Math.cos((deg * Math.PI) / 180);
  const b: XY = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
  const all = hit.length === MARKS.length;

  const turn = (d: number) => {
    setDeg(d);
    const i = MARKS.findIndex((m) => m.deg === d);
    if (i < 0 || hit.includes(i)) return;
    const next = [...hit, i];
    setHit(next);
    if (next.length === MARKS.length) pass("0.9 মানে 90% মিল না, মানে প্রায় 26° দূরে। 0.5 মানে 60°, 0 মানে সোজা কোণ, আর −1 মানে একদম উল্টা।");
  };

  return (
    <>
      <Plane f={FC} grid={0} axes={false} label={`দুইটা 1 লম্বা arrow, মাঝে ${deg}°`} className="max-w-[13rem]">
        <path d={`M${FC.sx(-1.2)} ${FC.sy(0)}H${FC.sx(1.2)}`} strokeWidth={1} className="stroke-[#0f1b2d]/20" />
        <Arrow f={FC} from={O} to={[1, 0]} tone="teal" w={2.6} />
        <Arrow f={FC} from={O} to={b} tone="violet" w={2.6} />
        <Label f={FC} at={[0, 1.15]} size={11} className="fill-[#0f1b2d] font-mono">
          {`${deg}°`}
        </Label>
      </Plane>
      <div className="mx-auto flex max-w-sm items-center gap-3">
        <span className="font-mono text-sm text-muted">0°</span>
        <input
          type="range"
          min={0}
          max={180}
          step={1}
          value={deg}
          aria-label="দুই arrow-এর মাঝের কোণ"
          onChange={(e) => turn(Number(e.target.value))}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
        />
        <span className="font-mono text-sm text-muted">180°</span>
      </div>
      <div className="relative mx-auto mt-6 mb-6 h-2 max-w-sm rounded-full bg-linear-to-r from-danger/60 via-foreground/15 to-accent/70">
        {[-1, 0, 1].map((t) => (
          <span key={t} className="absolute top-3 -translate-x-1/2 font-mono text-xs text-muted" style={{ left: `${((t + 1) / 2) * 100}%` }}>
            {t < 0 ? "−1" : t}
          </span>
        ))}
        <span
          className="absolute -top-6 -translate-x-1/2 rounded-full bg-cat-blue px-1.5 font-mono text-xs font-bold text-white transition-[left] duration-150 motion-reduce:transition-none"
          style={{ left: `${((c + 1) / 2) * 100}%` }}
        >
          {fix(c, 2)}
        </span>
      </div>
      <Ticks items={MARKS.map((m, i) => [`cos ${m.c < 0 ? "−1" : m.c}`, hit.includes(i)])} />
      <Task done={all}>কোণটা ঘুরিয়ে এমন চারটা জায়গা খুঁজুন, যেখানে cos হয় 0.9, 0.5, 0 আর −1।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · One division short. 3.6's normalised-film score for মামা and Titanic
//     was 3.71. Divide by মামা's own length, 5.39 → 0.69. The full formula,
//     20 ÷ 5.39 ÷ 5.39, gives the same 0.69: about 46°.

export function LastDivide() {
  const pass = useGate();
  const [k, setK] = useSeed("k", 0);
  const steps = ["মামার দৈর্ঘ্য দিয়ে ভাগ করুন", "পুরো সূত্রে মিলিয়ে দেখুন"];

  const step = () => {
    setK(k + 1);
    if (k + 1 === 2) pass("3.71 ÷ 5.39 = 0.69, আর পুরো সূত্রেও 20 ÷ 5.39 ÷ 5.39 = 0.69। ৩.৬ সব ধাপ করেছিল, শুধু শেষ ভাগটা বাকি ছিল।");
  };

  return (
    <>
      <div className="mx-auto mt-2 max-w-sm rounded-xl border border-border bg-surface px-3 py-2 text-center">
        <div className="text-sm text-muted">৩.৬-এর নিয়মে মামা আর Titanic</div>
        <div className="text-[0.95rem]">
          Titanic-কে 1 লম্বা করে তারপর বাক্স: <b className="font-mono">3.71</b>
        </div>
      </div>
      <div className="mx-auto mt-3 grid max-w-sm gap-2">
        {k >= 1 && (
          <div className={`${FADE} rounded-xl border-2 border-cat-teal/40 bg-cat-teal/5 px-3 py-2 text-center`}>
            <div className="text-xs text-muted">মামার পছন্দ 5.39 লম্বা</div>
            <div className="font-mono text-lg">
              3.71 ÷ 5.39 = <b>0.69</b>
            </div>
          </div>
        )}
        {k >= 2 && (
          <div className={`${FADE} rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-3 py-2 text-center`}>
            <div className="text-xs text-muted">পুরো সূত্র: বাক্স ÷ মামার দৈর্ঘ্য ÷ Titanic-এর দৈর্ঘ্য</div>
            <div className="font-mono text-lg">
              20 ÷ 5.39 ÷ 5.39 = <b>0.69</b>
            </div>
            <div className="text-sm">মানে মামা আর Titanic প্রায় 46° দূরে।</div>
          </div>
        )}
      </div>
      {k < 2 && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={step} className={primaryBtn}>
            {steps[k]}
          </button>
        </div>
      )}
      <Task done={k >= 2}>৩.৬-এর নম্বরটা মামার নিজের দৈর্ঘ্য দিয়ে ভাগ করুন, তারপর পুরো সূত্রের সাথে মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · নানু has watched nothing: (0, 0). Run the formula: the box is 0, her
//     length is 0, and 0 ÷ 0 is NaN. Then say why: an arrow of length zero
//     has no direction, so no angle with anything.

const NANU_WHY = ["নানুর জন্য Titanic-ই ঠিক, নম্বর তো 0-ও হতে পারে", "শূন্য arrow-এর কোনো দিক নাই, তাই কোনো কোণও নাই", "ক্যালকুলেটরটা নষ্ট"];

export function NanuCard() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const [got, setGot] = useSeed("got", false);

  const why = (i: number) => {
    if (i !== 1) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setGot(true);
    pass("শূন্য arrow-এর কোনো দিক নাই, তাই কোনো কোণও নাই। নতুন মানুষ বা খালি document আলাদা করে সামলাতে হয়।");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border-2 border-border bg-surface px-4 py-2 text-center">
        <div className="text-sm font-semibold">নানুর পছন্দ</div>
        <div className="font-mono text-xl font-bold">(0, 0)</div>
      </div>
      {!ran ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={() => setRan(true)} className={primaryBtn}>
            নানু আর Titanic, সূত্রটা চালান
          </button>
        </div>
      ) : (
        <div className={FADE}>
          <div className="mx-auto mt-3 grid max-w-xs gap-0.5 rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-3 py-2 font-mono text-sm">
            <div>0 × 5 + 0 × 2 = 0</div>
            <div>‖(0, 0)‖ = 0</div>
            <div className="text-base">
              0 ÷ (0 × 5.39) = <b className="text-danger">NaN</b>
            </div>
          </div>
          <div className="mt-3 text-sm font-medium text-muted">ক্যালকুলেটর বলছে NaN, মানে “not a number”। কেন?</div>
          <div className="mt-2 grid gap-2">
            {NANU_WHY.map((o, i) => (
              <Choice key={o} n={i} look={got && i === 1 ? "right" : "idle"} disabled={got} onClick={() => why(i)}>
                {o}
              </Choice>
            ))}
          </div>
          {miss !== null && <Nope key={miss}>উঁহু। একটা arrow যদি কোথাও না যায়, সে কোন দিকে তাক করা?</Nope>}
        </div>
      )}
      <Task done={got}>নানুর জন্য সূত্রটা চালান, তারপর বলুন উত্তরটা এমন এলো কেন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · এবার আপনার পালা. The verdict: the reader picks each couple's cosine from
//     the box and the lengths, wrong tries bouncing. 0.99 and 0.99, a tie.
//     Then the mirror: swap every card's two slots and one pair lands on the
//     other.

const VERDICT = [
  { who: "মামা আর Mr. Bean", a: MAMA, b: BEAN, opts: ["5.34", "0.99", "0.69"], ans: 1, work: "22 ÷ 5.39 ÷ 4.12" },
  { who: "মামী আর Titanic", a: MAMI, b: TITANIC, opts: ["0.99", "4.09", "0.47"], ans: 0, work: "22 ÷ 4.12 ÷ 5.39" },
];
const FM = makeFrame(-0.5, 5.5, -0.5, 5.5, 26);
const swap = (v: XY): XY => [v[1], v[0]];

export function VerdictCos() {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const [mirror, setMirror] = useSeed("mirror", false);
  const both = done === VERDICT.length;
  const v = VERDICT[Math.min(done, VERDICT.length - 1)];

  const pick = (i: number) => {
    if (both) return;
    if (i !== v.ans) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setDone(done + 1);
  };
  const flip = () => {
    setMirror(true);
    pass("দুইটাই 0.991, একদম সমান! আয়নায় উল্টালেই মামা আর Mr. Bean হয়ে যায় Titanic আর মামী, তাই কোণও একই।");
  };
  const pair = (a: XY) => (mirror ? swap(a) : a);

  return (
    <>
      <div className="flex items-center gap-3">
        <Plane f={FM} ticks={1} label="চারটা arrow আর আয়নার দাগ" className="max-w-[10rem] shrink-0">
          {both && <path d={`M${FM.sx(0)} ${FM.sy(0)}L${FM.sx(5.3)} ${FM.sy(5.3)}`} strokeWidth={1.2} strokeDasharray="4 4" className="pointer-events-none stroke-[#0f1b2d]/40" />}
          <Arrow f={FM} from={O} to={pair(MAMA)} tone="teal" w={2.4} />
          <Arrow f={FM} from={O} to={pair(BEAN)} tone="teal" w={1.6} dashed />
          <Arrow f={FM} from={O} to={pair(MAMI)} tone="violet" w={2.4} />
          <Arrow f={FM} from={O} to={pair(TITANIC)} tone="violet" w={1.6} dashed />
        </Plane>
        <div className="grid min-w-0 flex-1 gap-1 text-xs">
          <div className="rounded-lg bg-surface px-2 py-1">
            বাক্স: মামা · Bean = <b className="font-mono">22</b>, মামী · Titanic = <b className="font-mono">22</b>
          </div>
          <div className="rounded-lg bg-surface px-2 py-1">
            দৈর্ঘ্য: মামা, Titanic <b className="font-mono">5.39</b>; মামী, Bean <b className="font-mono">4.12</b>
          </div>
          {VERDICT.slice(0, done).map((d) => (
            <div key={d.who} className={`${FADE} rounded-lg bg-accent/10 px-2 py-1`}>
              ✓ {d.who}: <span className="font-mono">{d.work} = </span>
              <b className="font-mono">{fix(cosOf(d.a, d.b), 3)}</b>
            </div>
          ))}
        </div>
      </div>
      {!both ? (
        <>
          <div className="mt-3 text-sm font-medium text-muted">{v.who}: cosine similarity কত?</div>
          <div className="mt-2 flex justify-center gap-2">
            {v.opts.map((o, i) => (
              <button key={o} type="button" onClick={() => pick(i)} className={pill(false)}>
                {o}
              </button>
            ))}
          </div>
          {miss !== null && <Nope key={miss}>উঁহু। বাক্সের নম্বরটাকে দুইজনের দৈর্ঘ্য দিয়েই ভাগ করতে হবে, একজনের দিয়ে না।</Nope>}
        </>
      ) : (
        <div className={`${FADE} mt-3 text-center`}>
          <div className="text-[0.95rem]">দুইটাই 0.991! এমন কাকতালীয় মিল কেন?</div>
          {!mirror && (
            <button type="button" onClick={flip} className={`${primaryBtn} mt-2`}>
              প্রতিটা card-এর দুই ঘর অদলবদল করুন
            </button>
          )}
        </div>
      )}
      <Ticks
        items={[
          [`দুইটা cosine (${bn(done)}/২)`, both],
          ["আয়না", mirror],
        ]}
      />
      <Task done={mirror}>দুই জোড়ার cosine similarity বের করুন, তারপর আয়নাটা দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  WhoFits: { start: {}, bet: { bet: 0 } },
  LoudPerson: { start: {}, measured: { measured: [0, 1] }, doubled: { measured: [0, 1], doubled: true } },
  RunBackwards: { start: {}, tilted: { cut: [0], tilt: 1 }, done: { cut: [0, 1], tried: true } },
  ScaleCard: { start: {}, some: { deg: 60, hit: [0, 1] }, all: { deg: 180, hit: [0, 1, 2, 3] } },
  LastDivide: { start: {}, done: { k: 2 } },
  NanuCard: { start: {}, ran: { ran: true }, got: { ran: true, got: true } },
  VerdictCos: { start: {}, miss: { done: 1, miss: 1 }, both: { done: 2 }, mirror: { done: 2, mirror: true } },
};
