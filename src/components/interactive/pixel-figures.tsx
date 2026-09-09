"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Btn, Head, useInView } from "./figure-kit";
import "./pixel-figures.css";

// Figures for "AI-এর গণিত ১ — ছবি আসলে সংখ্যা".
//
// The article's whole claim is that an image is a grid of numbers and nothing
// else, so every figure here lets the reader hold both halves at once: touch a
// pixel and watch its number move, or type a number and watch the pixel move.
//
// Copy inside the figures is English on purpose — the surrounding prose is
// Bangla, but translated UI microcopy read stilted, and the values are digits
// either way. All DOM/SVG rather than canvas, same as vector-figures.tsx.

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const gray = (v: number) => `rgb(${v} ${v} ${v})`;
/** Ink that stays readable on a given grey — the grid draws its own values. */
const ink = (v: number) => (v > 138 ? "#0b1020" : "#e9edf7");

// ---------------------------------------------------------------------------
// A grid of numbers that is also a picture. Every figure below is built on it.

type GridProps = {
  cols: number;
  values: number[];
  /** print the value inside each cell */
  numbers?: boolean;
  selected?: number | null;
  onPick?: (i: number) => void;
  /** when set, dragging across cells paints them */
  onPaint?: (i: number) => void;
  onHover?: (i: number | null) => void;
  /** cell background; defaults to the grey the value means */
  fill?: (v: number, i: number) => string;
  /** value text colour; defaults to whatever reads on `fill` */
  text?: (v: number, i: number) => string;
  label?: (v: number, i: number) => string;
};

function PixelGrid({
  cols,
  values,
  numbers = false,
  selected = null,
  onPick,
  onPaint,
  onHover,
  fill = gray,
  text,
  label,
}: GridProps) {
  // Drag-to-paint: the pointer leaves the cell it started in, so the "still
  // pressed" flag lives here and is cleared on a window-level pointerup.
  const down = useRef(false);
  useEffect(() => {
    if (!onPaint) return;
    const up = () => {
      down.current = false;
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [onPaint]);

  const idle = !onPick && !onPaint;

  return (
    <div
      className="pfig-grid"
      style={{ ["--cols" as string]: cols }}
      onPointerLeave={() => onHover?.(null)}
    >
      {values.map((v, i) => (
        <button
          type="button"
          key={i}
          className={`pfig-cell${selected === i ? " sel" : ""}${idle ? " flat" : ""}`}
          style={{ background: fill(v, i), color: text ? text(v, i) : ink(v) }}
          aria-label={label ? label(v, i) : `row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}, value ${v}`}
          tabIndex={idle ? -1 : 0}
          onPointerDown={() => {
            onPick?.(i);
            if (onPaint) {
              down.current = true;
              onPaint(i);
            }
          }}
          onPointerEnter={() => {
            onHover?.(i);
            if (onPaint && down.current) onPaint(i);
          }}
        >
          {numbers ? v : ""}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · Counting with two digits. Toggle the bits, or let it count and watch the
//     carry happen — that is the article's "২ মানে ১০, ৩ মানে ১১" claim, live.

const PLACES = [128, 64, 32, 16, 8, 4, 2, 1];
const BIN_PRESETS = [2, 3, 10, 240, 255];

export function BinaryFigure() {
  const box = useRef<HTMLElement>(null);
  const [n, setN] = useState(2);
  const [run, setRun] = useState(false);
  const [awake, setAwake] = useState(true);

  useInView(box, { enter: () => setAwake(true), leave: () => setAwake(false) });

  // The ticker only runs while the figure is on screen — a scrolled-past figure
  // should not keep re-rendering.
  useEffect(() => {
    if (!run || !awake) return;
    const t = setInterval(() => setN((v) => (v + 1) % 256), 450);
    return () => clearInterval(t);
  }, [run, awake]);

  const bits = PLACES.map((p) => (n & p ? 1 : 0));
  const on = PLACES.filter((p) => n & p);

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 1" title="Counting with only two digits" />
      <div className="pfig-body">
        <div className="pfig-bits">
          {PLACES.map((p, i) => (
            <button
              type="button"
              key={p}
              className={`pfig-bit${bits[i] ? " on" : ""}`}
              aria-pressed={bits[i] === 1}
              aria-label={`the ${p} place`}
              onClick={() => setN((v) => v ^ p)}
            >
              <i>{bits[i]}</i>
              <u>{p}</u>
            </button>
          ))}
        </div>
        <p className="pfig-big">
          {n}
          <small>{on.length ? on.join(" + ") : "0"} = {n} — the way we write it</small>
        </p>
        <p className="pfig-mono">
          the way a computer writes it: <b>{bits.join("")}</b>
        </p>
      </div>
      <div className="mfig-controls">
        <Btn on={run} onClick={() => setRun((r) => !r)}>
          {run ? "Stop" : "Count up"}
        </Btn>
        {BIN_PRESETS.map((p) => (
          <Btn key={p} on={n === p && !run} onClick={() => { setRun(false); setN(p); }}>
            {p}
          </Btn>
        ))}
      </div>
      <figcaption>
        Switch the boxes on and off, or press <strong>Count up</strong> and watch where it carries.
        After 1 there is no next digit, so it has to move one box left — exactly what we do after 9.
        Each box is worth the number under it, and{" "}
        <strong>the lit boxes add up to the value</strong>. 240 = 128 + 64 + 32 + 16 = <strong>11110000</strong>.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 2 · Three numbers, every colour. Answers the article's "লাল সবুজ নীল মিশিয়ে
//     যেকোনো রঙ" sentence by letting the reader do the mixing.

const MIXES = [
  { label: "Yellow", c: [255, 214, 0] },
  { label: "Orange", c: [255, 122, 26] },
  { label: "Sky", c: [96, 165, 250] },
  { label: "Purple", c: [147, 51, 234] },
  { label: "White", c: [255, 255, 255] },
  { label: "Black", c: [0, 0, 0] },
];

export function ColorMixerFigure() {
  const box = useRef<HTMLElement>(null);
  const [rgb, setRgb] = useState([255, 214, 0]);
  useInView(box, {});

  const [r, g, b] = rgb;
  const set = (i: number, v: number) => setRgb((c) => c.map((old, j) => (j === i ? clamp255(v) : old)));
  const chans = [
    { key: "Red", cls: "r", v: r },
    { key: "Green", cls: "g", v: g },
    { key: "Blue", cls: "b", v: b },
  ];

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 2" title="Three numbers make any color" />
      <div className="pfig-body pfig-split">
        <div
          className="pfig-sw"
          style={{ background: `rgb(${r} ${g} ${b})` }}
          aria-label={`color: red ${r}, green ${g}, blue ${b}`}
        >
          <span>({r}, {g}, {b})</span>
        </div>
        <div className="pfig-col">
          {chans.map((c, i) => (
            <div key={c.key} className="pfig-row">
              <span className="pfig-label" style={{ width: "3.2rem" }}>{c.key}</span>
              <input
                className={`pfig-slider ${c.cls}`}
                type="range"
                min={0}
                max={255}
                value={c.v}
                aria-label={c.key}
                onChange={(e) => set(i, Number(e.target.value))}
              />
              <span className="pfig-mono" style={{ width: "2.2rem", textAlign: "right" }}>
                <b>{c.v}</b>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mfig-controls">
        {MIXES.map((m) => (
          <Btn key={m.label} on={rgb.every((v, i) => v === m.c[i])} onClick={() => setRgb(m.c)}>
            {m.label}
          </Btn>
        ))}
      </div>
      <figcaption>
        Drag the three sliders. Red and green wide open with blue at zero gives{" "}
        <strong>yellow</strong> — no paint box involved, just three numbers changing. Each one runs
        0 to 255, so 256 × 256 × 256 = <strong>over 16 million colors</strong> from three numbers.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 3 · The three stacked grids, pulled apart. Switching a channel off is the
//     fastest way to feel that a colour image really is three grayscale images.

const FLAG_COLS = 11;
// ponytail: the sprite is generated, not decoded — a flag is two flat colours,
// which is exactly what makes the channel split legible at this size.
const FLAG: number[][] = Array.from({ length: FLAG_COLS * FLAG_COLS }, (_, i) => {
  const x = i % FLAG_COLS;
  const y = Math.floor(i / FLAG_COLS);
  const inCircle = Math.hypot(x - (FLAG_COLS / 2 - 1), y - (FLAG_COLS - 1) / 2) < 2.9;
  return inCircle ? [244, 42, 65] : [0, 106, 78];
});
const CH = [
  { i: 0, cls: "r", name: "Red", tint: (v: number) => `rgb(${v} 0 0)` },
  { i: 1, cls: "g", name: "Green", tint: (v: number) => `rgb(0 ${v} 0)` },
  { i: 2, cls: "b", name: "Blue", tint: (v: number) => `rgb(0 0 ${v})` },
];

export function ChannelStackFigure() {
  const box = useRef<HTMLElement>(null);
  const [use, setUse] = useState([true, true, true]);
  const [numbers, setNumbers] = useState(false);
  const [at, setAt] = useState<number | null>(null);
  useInView(box, {});

  const i = at ?? Math.floor((FLAG_COLS * FLAG_COLS) / 2);
  const p = FLAG[i];

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 3" title="A color image is three grids, stacked" />
      <div className="pfig-body">
        <div className="pfig-chans">
          {CH.map((c) => (
            <div key={c.cls} className={`pfig-chan ${c.cls}${use[c.i] ? "" : " off"}`}>
              <h4>{c.name}</h4>
              <PixelGrid
                cols={FLAG_COLS}
                values={FLAG.map((q) => q[c.i])}
                numbers={numbers}
                onHover={setAt}
                onPick={setAt}
                selected={at}
                fill={(v) => c.tint(v)}
                text={() => "rgba(255,255,255,.85)"}
              />
            </div>
          ))}
          <div className="pfig-chan out">
            <h4>Result</h4>
            <PixelGrid
              cols={FLAG_COLS}
              values={FLAG.map((_, j) => j)}
              onHover={setAt}
              onPick={setAt}
              selected={at}
              fill={(_, j) => {
                const q = FLAG[j];
                return `rgb(${use[0] ? q[0] : 0} ${use[1] ? q[1] : 0} ${use[2] ? q[2] : 0})`;
              }}
              label={(_, j) => `pixel ${j + 1}`}
            />
          </div>
        </div>
        <p className="pfig-label">
          Point at a cell — every grid highlights <b>the same position</b>: red <b>{p[0]}</b>, green{" "}
          <b>{p[1]}</b>, blue <b>{p[2]}</b>.
        </p>
      </div>
      <div className="mfig-controls">
        {CH.map((c) => (
          <Btn
            key={c.cls}
            on={use[c.i]}
            onClick={() => setUse((u) => u.map((s, j) => (j === c.i ? !s : s)))}
          >
            {c.name} {use[c.i] ? "on" : "off"}
          </Btn>
        ))}
        <Btn on={numbers} onClick={() => setNumbers((s) => !s)}>
          {numbers ? "Hide numbers" : "Show numbers"}
        </Btn>
      </div>
      <figcaption>
        Each of the three grids is <strong>a grayscale image on its own</strong>, just shown in its
        own color. Switch one off and the result on the right changes. Turn off red and the red
        circle goes black, because those cells had nothing in them but red.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 4 · The 3x3 from the article, editable. This is the load-bearing figure: the
//     reader changes a number and the picture changes under their hand.

const ORIGINAL = [10, 20, 15, 25, 240, 30, 12, 18, 22];

export function PixelLabFigure() {
  const box = useRef<HTMLElement>(null);
  const [px, setPx] = useState<number[]>(ORIGINAL);
  const [sel, setSel] = useState(4); // the 240 in the middle
  useInView(box, {});

  const set = (i: number, v: number) => setPx((p) => p.map((old, j) => (j === i ? clamp255(v) : old)));
  const all = (v: number) => setPx(ORIGINAL.map(() => v));

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 4" title="Change a number, change the picture" />
      <div className="pfig-body pfig-split">
        <div className="pfig-frame">
          <PixelGrid cols={3} values={px} numbers selected={sel} onPick={setSel} />
        </div>
        <div className="pfig-col">
          <p className="pfig-label">
            Selected: <b>row {Math.floor(sel / 3) + 1}, column {(sel % 3) + 1}</b>
          </p>
          <p className="pfig-big">{px[sel]}</p>
          <div className="pfig-row">
            <input
              className="pfig-slider"
              type="range"
              min={0}
              max={255}
              value={px[sel]}
              aria-label="brightness"
              onChange={(e) => set(sel, Number(e.target.value))}
            />
          </div>
          <div className="pfig-row">
            <Btn on={false} onClick={() => set(sel, px[sel] - 20)}>−20</Btn>
            <Btn on={false} onClick={() => set(sel, px[sel] + 20)}>+20</Btn>
            <Btn on={false} onClick={() => set(sel, 0)}>0</Btn>
            <Btn on={false} onClick={() => set(sel, 255)}>255</Btn>
          </div>
          <p className="pfig-mono">
            [{px.slice(0, 3).join(", ")}]<br />[{px.slice(3, 6).join(", ")}]<br />[{px.slice(6).join(", ")}]
          </p>
        </div>
      </div>
      <div className="mfig-controls">
        <Btn on={px.every((v, i) => v === ORIGINAL[i])} onClick={() => setPx(ORIGINAL)}>
          The image above
        </Btn>
        <Btn on={px.every((v) => v === 0)} onClick={() => all(0)}>All black</Btn>
        <Btn on={px.every((v) => v === 255)} onClick={() => all(255)}>All white</Btn>
        <Btn on={false} onClick={() => setPx(ORIGINAL.map((_, i) => (i % 2 ? 235 : 25)))}>
          Checkerboard
        </Btn>
      </div>
      <figcaption>
        These are the same nine numbers written above. Click any cell and drag the slider. Take the
        240 in the middle down to 20 and <strong>the bright dot disappears</strong> — nothing was
        “edited”, one number changed. To a computer, editing an image is arithmetic and nothing else.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 5 · Draw something. The point is the reverse direction: a shape you made by
//     hand is, the instant you finish, just a list of numbers.

const PAINT_COLS = 14;
const PAINT_N = PAINT_COLS * PAINT_COLS;
const BLANK = Array<number>(PAINT_N).fill(18);

export function PaintFigure() {
  const box = useRef<HTMLElement>(null);
  const [px, setPx] = useState<number[]>(BLANK);
  const [brush, setBrush] = useState(235);
  const [numbers, setNumbers] = useState(false);
  useInView(box, {});

  const paint = (i: number) => setPx((p) => (p[i] === brush ? p : p.map((v, j) => (j === i ? brush : v))));
  const lit = px.filter((v) => v > 90).length;

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 5" title="Draw something — the machine only gets the list" />
      <div className="pfig-body pfig-split wide">
        <div className="pfig-frame">
          <PixelGrid cols={PAINT_COLS} values={px} numbers={numbers} onPaint={paint} />
        </div>
        <div className="pfig-col">
          <p className="pfig-label">
            Brush brightness: <b>{brush}</b>
          </p>
          <input
            className="pfig-slider"
            type="range"
            min={0}
            max={255}
            value={brush}
            aria-label="brush brightness"
            onChange={(e) => setBrush(Number(e.target.value))}
          />
          <div className="pfig-row">
            <Btn on={brush === 235} onClick={() => setBrush(235)}>White</Btn>
            <Btn on={brush === 128} onClick={() => setBrush(128)}>Gray</Btn>
            <Btn on={brush === 18} onClick={() => setBrush(18)}>Eraser</Btn>
          </div>
          <p className="pfig-label">
            What the machine receives — a list of <b>{PAINT_N}</b> numbers, <b>{lit}</b> of them lit:
          </p>
          <p className="pfig-mono">[{px.slice(0, 28).join(", ")}, …]</p>
        </div>
      </div>
      <div className="mfig-controls">
        <Btn on={numbers} onClick={() => setNumbers((s) => !s)}>
          {numbers ? "Hide numbers" : "Show numbers"}
        </Btn>
        <Btn on={false} onClick={() => setPx(BLANK)}>Clear</Btn>
        <span className="mfig-read">14 × 14 = {PAINT_N}</span>
      </div>
      <figcaption>
        Press and drag to draw — a letter, a face, anything. To you that is a picture; to the machine
        it is <strong>{PAINT_N} numbers</strong>, full stop. Machine learning means looking at that
        list and saying what was drawn.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 6 · Where the count goes. The article's punchline number, but reachable by
//     dragging — the jump from 9 to 36,000,000 should be felt, not read.

const SIZES = [
  { w: 3, h: 3, name: "the 3×3 above" },
  { w: 28, h: 28, name: "a handwritten digit" },
  { w: 224, h: 224, name: "an AI model's input" },
  { w: 1920, h: 1080, name: "one HD video frame" },
  { w: 3000, h: 4000, name: "a photo from your phone" },
];

/** Drop the trailing zeros a fixed decimal leaves behind: 36.0 -> 36, 2.10 -> 2.1. */
const trim = (s: string) => (s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s);

const inWords = (n: number) => {
  if (n >= 1e6) return `${trim((n / 1e6).toFixed(1))} million`;
  if (n >= 1e3) return `${trim((n / 1e3).toFixed(1))} thousand`;
  return `${n}`;
};

/** One number per second, read aloud — the count in a unit a body understands. */
const readTime = (n: number) => {
  if (n < 90) return `${n} seconds`;
  if (n < 5400) return `${Math.round(n / 60)} minutes`;
  if (n < 172800) return `${trim((n / 3600).toFixed(1))} hours`;
  if (n < 3.15e7) return `${Math.round(n / 86400)} days`;
  return `${trim((n / 3.15e7).toFixed(1))} years`;
};

export function ScaleFigure() {
  const box = useRef<HTMLElement>(null);
  const [pick, setPick] = useState(0);
  const [color, setColor] = useState(false);
  useInView(box, {});

  const size = SIZES[pick];
  const ch = color ? 3 : 1;
  const total = size.w * size.h * ch;
  const max = useMemo(() => 3000 * 4000 * 3, []);

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 6" title="How many numbers is one image?" />
      <div className="pfig-body">
        <p className="pfig-big">
          {total.toLocaleString("en-US")}
          <small>
            {size.w} × {size.h}
            {color ? " × 3" : ""} — that is {inWords(total)} numbers in a single image
          </small>
        </p>
        <div className="pfig-col">
          {SIZES.map((s, i) => {
            const t = s.w * s.h * ch;
            return (
              <button
                type="button"
                key={s.name}
                className={`pfig-scale-row${i === pick ? " on" : ""}`}
                onClick={() => setPick(i)}
              >
                <span>{s.name}</span>
                {/* log scale: on a linear one the first four rows are invisible */}
                <span className="pfig-bar">
                  <i style={{ width: `${(Math.log10(t) / Math.log10(max)) * 100}%` }} />
                </span>
                <span>{inWords(t)}</span>
              </button>
            );
          })}
        </div>
        <p className="pfig-label">
          At one number per second, reading this one image out loud would take <b>{readTime(total)}</b>.
        </p>
      </div>
      <div className="mfig-controls">
        <Btn on={!color} onClick={() => setColor(false)}>Grayscale (1 grid)</Btn>
        <Btn on={color} onClick={() => setColor(true)}>Color (3 grids)</Btn>
        <span className="mfig-read">{size.w} × {size.h} × {ch}</span>
      </div>
      <figcaption>
        The bars are on a log scale — on a linear one the first rows would be invisible, they are
        that small. From 9 grayscale numbers to 36 million for a color phone photo is{" "}
        <strong>five steps</strong>.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 7 · The closer. Same idea as figure 1 of an earlier draft, but placed last on
//     purpose: once the reader knows what a grid of brightness values is, the
//     "computer sees only this" view lands as a conclusion instead of a puzzle.

// ponytail: a hand-drawn sprite, not a decoded photo — a real image would need a
// file + a decoder in the bundle to make exactly this one point.
const BIRD = [
  "............",
  ".....###....",
  "....#####...",
  "....##o##+..",
  "....#####...",
  "...#######..",
  "..#########.",
  ".####***###.",
  ".###*****##.",
  "..#########.",
  "...##...##..",
  "..++++++++..",
];
const TONE: Record<string, number> = { ".": 231, "#": 38, "*": 112, o: 250, "+": 168 };

// Deterministic jitter, so the sprite reads like sampled light instead of flat
// paint — and so server and client render the identical array.
const jitter = (i: number) => {
  const s = Math.sin(i * 127.1) * 43758.5453;
  return s - Math.floor(s);
};
const BIRD_PX = BIRD.flatMap((row, r) =>
  [...row].map((ch, c) => clamp255(TONE[ch] + (jitter(r * 12 + c) - 0.5) * 18)),
);

export function EyeVsMachineFigure() {
  const box = useRef<HTMLElement>(null);
  const [view, setView] = useState<"eye" | "both" | "num">("eye");
  const [at, setAt] = useState<number | null>(null);
  useInView(box, {});

  const i = at ?? 41; // a body pixel, so the readout is never empty
  const v = BIRD_PX[i];

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 7" title="You see a bird. It sees 144 numbers." />
      <div className="pfig-body">
        <div className="pfig-frame">
          <PixelGrid
            cols={12}
            values={BIRD_PX}
            numbers={view !== "eye"}
            onHover={setAt}
            onPick={setAt}
            selected={at}
            fill={(g) => (view === "num" ? "rgba(255,255,255,.04)" : gray(g))}
            text={(g) => (view === "num" ? "#8d97ae" : ink(g))}
          />
        </div>
        <p className="pfig-label">
          Point at any cell — row <b>{Math.floor(i / 12) + 1}</b>, column <b>{(i % 12) + 1}</b> holds
          brightness <b>{v}</b>. 0 is pitch black, 255 is pure white.
        </p>
      </div>
      <div className="mfig-controls">
        <Btn on={view === "eye"} onClick={() => setView("eye")}>
          What you see
        </Btn>
        <Btn on={view === "both"} onClick={() => setView("both")}>
          Both at once
        </Btn>
        <Btn on={view === "num"} onClick={() => setView("num")}>
          What the computer gets
        </Btn>
      </div>
      <figcaption>
        The picture and the list of numbers are <strong>the same thing</strong>, shown two ways.
        Press <strong>What the computer gets</strong>: the bird is gone and 12 × 12 = 144 numbers
        remain. Searching your photos for “bird” means finding the answer in numbers like these — and
        a real photo hands it 36 million of them.
      </figcaption>
    </figure>
  );
}
