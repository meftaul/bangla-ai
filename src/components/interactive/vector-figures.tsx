"use client";

import { useMemo, useRef, useState } from "react";

import { Btn, Head, useInView } from "./figure-kit";
import { NumberLine } from "./matrix-engine/number-line";
import { useSketch } from "./matrix-engine/use-sketch";

// Figures for the "ডাটা কীভাবে সংখ্যা হয়" section of the deep-learning article.
//
// Unlike matrix-figures.tsx these are SVG/DOM rather than canvas. That is on
// purpose: every label here is Bangla, and the browser's text shaping for Bangla
// conjuncts is reliable in HTML/SVG but fussy in canvas fillText. The one
// exception is FunctionLineFigure, whose labels are plain digits — it reuses the
// deck's NumberLine canvas engine unchanged.

// ---------------------------------------------------------------------------
// 1 · f(x) as a machine: one rule, applied to every point on the line at once.

const FUNCS = [
  { key: "reset", label: "শুরুর অবস্থা", f: (x: number) => x, note: "প্রতিটা পয়েন্ট নিজের জায়গায়" },
  { key: "double", label: "f(x) = 2x", f: (x: number) => 2 * x, note: "টেনে লম্বা করে দেয় — ২ যায় ৪ এ" },
  { key: "half", label: "f(x) = x/2", f: (x: number) => x / 2, note: "চেপে ছোট করে দেয়" },
  { key: "neg", label: "f(x) = −x", f: (x: number) => -x, note: "উল্টে দেয়" },
  { key: "shift", label: "f(x) = x + 1", f: (x: number) => x + 1, note: "সরিয়ে দেয় — origin আর ০ তে থাকে না" },
] as const;

export function FunctionLineFigure() {
  const box = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<string>("reset");

  const line = useSketch(stage, (host) => new NumberLine(host));

  useInView(box, { enter: () => line.current?.resize() });

  const note = FUNCS.find((o) => o.key === sel)?.note ?? "";

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ৫" title="ফাংশন = ব্লেন্ডার — যা ঢালবেন, তাই বদলে বেরোবে" />
      <div className="mfig-stage mfig-stage-short" ref={stage} />
      <div className="mfig-controls">
        {FUNCS.map((o) => (
          <Btn
            key={o.key}
            on={sel === o.key}
            onClick={() => {
              setSel(o.key);
              line.current?.apply(o.f);
            }}
          >
            {o.label}
          </Btn>
        ))}
      </div>
      <figcaption>
        {note}। ফাংশন শুধু একটা সংখ্যার উত্তর দেয় না — <strong>একটা নিয়ম, যা প্রতিটা পয়েন্টে একসাথে
        খাটে</strong>। ফিকে বিন্দুগুলো দেখাচ্ছে সংখ্যাগুলো আগে কোথায় ছিল।
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 2 · Vectorization: an apartment is a point once you pick its numbers. The
//     three modes answer the article's own question — "দশটা সংখ্যা গ্রাফ পেপারে
//     বসাবো কীভাবে?" — by showing that the plot dies at 3 but the vector doesn't.

type Flat = {
  id: string;
  name: string;
  area: number; // sqft
  price: number; // lakh taka
  /** area, price, bed, bath, floor, age, parking, balcony, lift, road-distance */
  all: number[];
};

const FLATS: Flat[] = [
  { id: "mirpur", name: "মিরপুর", area: 900, price: 55, all: [900, 55, 2, 2, 4, 8, 0, 1, 1, 300] },
  { id: "moham", name: "মোহাম্মদপুর", area: 1050, price: 70, all: [1050, 70, 3, 2, 2, 5, 1, 1, 1, 150] },
  { id: "dhanmondi", name: "ধানমন্ডি", area: 1200, price: 95, all: [1200, 95, 3, 3, 6, 3, 1, 2, 1, 80] },
  { id: "uttara", name: "উত্তরা", area: 1500, price: 110, all: [1500, 110, 3, 3, 5, 2, 1, 2, 1, 120] },
  { id: "banani", name: "বনানী", area: 1800, price: 165, all: [1800, 165, 4, 4, 8, 1, 2, 3, 1, 60] },
  { id: "gulshan", name: "গুলশান", area: 2200, price: 240, all: [2200, 240, 4, 5, 10, 1, 2, 3, 1, 40] },
];

const FEATURES = [
  "area", "price", "bedroom", "bathroom", "floor",
  "বয়স", "parking", "balcony", "lift", "road দূরত্ব",
];

const W = 420;
const H = 250;
const PAD = { l: 46, r: 16, t: 16, b: 34 };
const sx = (a: number) => PAD.l + ((a - 800) / 1500) * (W - PAD.l - PAD.r);
const sy = (p: number) => H - PAD.b - ((p - 40) / 220) * (H - PAD.t - PAD.b);
const BASE = H - PAD.b; // the 1D line: area only, price ignored

export function VectorizeFigure() {
  const box = useRef<HTMLElement>(null);
  const [dim, setDim] = useState<1 | 2 | 10>(1);
  const [pick, setPick] = useState<string>("dhanmondi");

  const flat = FLATS.find((f) => f.id === pick) ?? FLATS[0];
  useInView(box, {});

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ৬" title="একটা এপার্টমেন্ট = কয়েকটা সংখ্যা = একটা পয়েন্ট" />
      <div className="mfig-plot">
        <svg viewBox={`0 0 ${W} ${H}`} className="mfig-svg" role="img" aria-label="এপার্টমেন্টের ভেক্টর প্লট">
          {/* axes */}
          <line x1={PAD.l} y1={BASE} x2={W - PAD.r} y2={BASE} className="mfig-axis" />
          <line
            x1={PAD.l}
            y1={PAD.t}
            x2={PAD.l}
            y2={BASE}
            className="mfig-axis"
            style={{ opacity: dim === 1 ? 0.15 : 1 }}
          />
          <text x={W - PAD.r} y={BASE + 22} className="mfig-axlabel" textAnchor="end">
            area (sqft) →
          </text>
          <text
            x={PAD.l - 8}
            y={PAD.t + 6}
            className="mfig-axlabel"
            textAnchor="end"
            style={{ opacity: dim === 1 ? 0 : 1 }}
          >
            price ↑
          </text>

          {FLATS.map((f) => {
            const cy = dim === 1 ? BASE : sy(f.price);
            const on = f.id === pick;
            return (
              <g key={f.id} className="mfig-pt" onClick={() => setPick(f.id)}>
                {/* drop line makes "this dot means these two numbers" literal */}
                {dim !== 1 && on && (
                  <>
                    <line x1={sx(f.area)} y1={cy} x2={sx(f.area)} y2={BASE} className="mfig-drop" />
                    <line x1={sx(f.area)} y1={cy} x2={PAD.l} y2={cy} className="mfig-drop" />
                  </>
                )}
                <circle cx={sx(f.area)} cy={cy} r={on ? 7 : 5} className={on ? "mfig-dot on" : "mfig-dot"} />
                <text x={sx(f.area)} y={cy - 12} className={on ? "mfig-ptlabel on" : "mfig-ptlabel"}>
                  {f.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* At 10 features there is no picture left to draw — only the list. */}
        {dim === 10 && (
          <div className="mfig-veil">
            <p>১০টা ফিচার — গ্রাফ পেপার এখানেই হার মানে।</p>
            <div className="mfig-vec">
              {flat.all.map((v, i) => (
                <span key={FEATURES[i]} title={FEATURES[i]}>
                  {v}
                </span>
              ))}
            </div>
            <p className="mfig-sub">কিন্তু ভেক্টর হিসেবে লিখতে কোনো সমস্যাই নেই।</p>
          </div>
        )}
      </div>
      <div className="mfig-controls">
        <Btn on={dim === 1} onClick={() => setDim(1)}>
          ১টা সংখ্যা
        </Btn>
        <Btn on={dim === 2} onClick={() => setDim(2)}>
          ২টা সংখ্যা
        </Btn>
        <Btn on={dim === 10} onClick={() => setDim(10)}>
          ১০টা সংখ্যা
        </Btn>
        <span className="mfig-read">
          {flat.name} = [{dim === 1 ? flat.area : dim === 2 ? `${flat.area}, ${flat.price}` : flat.all.join(", ")}]
        </span>
      </div>
      <figcaption>
        যেকোনো ডট চাপুন। একটা সংখ্যায় এপার্টমেন্ট শুধু একটা লাইনে বসে; দুইটা সংখ্যা দিলে সে{" "}
        <strong>2D স্পেসে একটা পয়েন্ট</strong> হয়ে যায়। ১০টা ফিচারে ছবিটা আর আঁকা যায় না, কিন্তু
        সংখ্যার লিস্ট — অর্থাৎ ভেক্টর — ঠিকই থেকে যায়। এই কনভার্শনটাই <strong>ভেক্টরাইজেশন</strong>।
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 3 · Embedding space: meaning becomes distance. Positions are hand-placed (a
//     real embedding would be projected down from hundreds of dimensions), but
//     the property being shown — near in meaning => near in space — is the real one.

type Word = { w: string; x: number; y: number; group: string };

const WORDS: Word[] = [
  { w: "আম", x: 17, y: 22, group: "ফল" },
  { w: "কলা", x: 29, y: 16, group: "ফল" },
  { w: "কাঁঠাল", x: 21, y: 34, group: "ফল" },
  { w: "লিচু", x: 33, y: 30, group: "ফল" },

  { w: "বাঘ", x: 71, y: 18, group: "প্রাণী" },
  { w: "সিংহ", x: 83, y: 24, group: "প্রাণী" },
  { w: "হাতি", x: 69, y: 32, group: "প্রাণী" },
  { w: "বিড়াল", x: 81, y: 37, group: "প্রাণী" },

  { w: "ঢাকা", x: 19, y: 70, group: "শহর" },
  { w: "চট্টগ্রাম", x: 32, y: 78, group: "শহর" },
  { w: "সিলেট", x: 17, y: 84, group: "শহর" },
  { w: "রাজশাহী", x: 31, y: 66, group: "শহর" },

  { w: "রাজা", x: 71, y: 68, group: "রাজপরিবার" },
  { w: "রানী", x: 84, y: 71, group: "রাজপরিবার" },
  { w: "রাজপুত্র", x: 69, y: 82, group: "রাজপরিবার" },
  { w: "রাজকন্যা", x: 83, y: 85, group: "রাজপরিবার" },
];

export function EmbeddingFigure() {
  const box = useRef<HTMLElement>(null);
  const [pick, setPick] = useState("আম");

  useInView(box, {});

  const { sel, near } = useMemo(() => {
    const s = WORDS.find((w) => w.w === pick) ?? WORDS[0];
    const n = WORDS.filter((w) => w.w !== s.w)
      .map((w) => ({ w, d: Math.hypot(w.x - s.x, w.y - s.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    return { sel: s, near: n };
  }, [pick]);

  const nearSet = new Set(near.map((n) => n.w.w));

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ৭" title="Embedding স্পেস — অর্থ যেখানে দূরত্ব হয়ে যায়" />
      <div className="mfig-embed">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mfig-lines" aria-hidden="true">
          {near.map((n) => (
            <line key={n.w.w} x1={sel.x} y1={sel.y} x2={n.w.x} y2={n.w.y} className="mfig-link" />
          ))}
        </svg>
        {WORDS.map((w) => {
          const cls = w.w === sel.w ? "on" : nearSet.has(w.w) ? "near" : "";
          return (
            <button
              type="button"
              key={w.w}
              className={`mfig-word ${cls}`}
              style={{ left: `${w.x}%`, top: `${w.y}%` }}
              onClick={() => setPick(w.w)}
              aria-pressed={w.w === sel.w}
            >
              {w.w}
            </button>
          );
        })}
      </div>
      <div className="mfig-controls">
        <span className="mfig-read" style={{ marginLeft: 0 }}>
          <b>{sel.w}</b> এর সবচেয়ে কাছে&nbsp;: {near.map((n) => n.w.w).join(", ")}
        </span>
      </div>
      <figcaption>
        যেকোনো শব্দে চাপ দিন — তিনটা নিকটতম প্রতিবেশী জুড়ে যাবে। খেয়াল করুন, প্রতিবেশীরা সবসময়{" "}
        <strong>একই অর্থের দলে</strong> পড়ে। টেক্সটকে এভাবে সংখ্যায় নেওয়াকেই বলে embedding — আর
        কাছাকাছি অর্থ মানেই কাছাকাছি অবস্থান।
      </figcaption>
    </figure>
  );
}
