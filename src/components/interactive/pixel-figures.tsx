"use client";

import { memo, useEffect, useRef, useState, type PointerEvent } from "react";

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

  // One listener on the grid instead of two per cell: with no per-cell
  // closures the cells stay memoised, so a hover re-renders two cells, not 1600.
  const cellAt = (e: PointerEvent) => {
    const at = (e.target as HTMLElement).closest<HTMLElement>("[data-i]")?.dataset.i;
    return at === undefined ? null : Number(at);
  };

  return (
    <div
      className={`pfig-grid${onPaint ? " paint" : ""}`}
      style={{ ["--cols" as string]: cols }}
      onPointerLeave={() => onHover?.(null)}
      onPointerDown={(e) => {
        const i = cellAt(e);
        if (i === null) return;
        onPick?.(i);
        if (onPaint) {
          // touch captures the pointer to the first cell; release it so the
          // drag reaches the cells it crosses
          (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
          down.current = true;
          onPaint(i);
        }
      }}
      onPointerOver={(e) => {
        const i = cellAt(e);
        if (i === null) return;
        onHover?.(i);
        if (onPaint && down.current) onPaint(i);
      }}
    >
      {values.map((v, i) => {
        const bg = fill(v, i);
        return (
          <Cell
            key={i}
            i={i}
            v={v}
            bg={bg}
            fg={text ? text(v, i) : ink(v)}
            label={label ? label(v, i) : `row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}, value ${v}`}
            sel={selected === i}
            flat={idle}
            numbers={numbers}
          />
        );
      })}
    </div>
  );
}

type CellProps = {
  i: number;
  v: number;
  bg: string;
  fg: string;
  label: string;
  sel: boolean;
  flat: boolean;
  numbers: boolean;
};

// Every prop is a primitive, so memo skips any cell whose look did not change.
const Cell = memo(function Cell({ i, v, bg, fg, label, sel, flat, numbers }: CellProps) {
  return (
    <button
      type="button"
      data-i={i}
      className={`pfig-cell${sel ? " sel" : ""}${flat ? " flat" : ""}`}
      style={{ background: bg, color: fg, ["--fill" as string]: bg }}
      aria-label={label}
      tabIndex={flat ? -1 : 0}
    >
      {numbers ? v : ""}
    </button>
  );
});

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
// 3 · The three grids as physical sheets. They start pulled apart in 3D, slide
//     together, and the stack turns to face the reader — so "three grids make a
//     colour image" is something you watch happen, not a sentence.
//
// The trick that makes it honest: each sheet is blended with `screen`, and a
// sheet only carries its own channel (rgb(v 0 0), …), so where sheets overlap
// screen gives exactly (r, g, b). The picture at the end is not drawn anywhere —
// it is the three grids, added.

type RGB = [number, number, number];
const STACK_COLS = 12;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Sample a picture at every cell centre. */
const sprite = (f: (x: number, y: number) => RGB) =>
  Array.from({ length: STACK_COLS * STACK_COLS }, (_, i) =>
    f((i % STACK_COLS) + 0.5, Math.floor(i / STACK_COLS) + 0.5).map(clamp255) as RGB,
  );

// ponytail: the pictures are generated, not decoded — flat colours are exactly
// what makes the channel split legible at 12 × 12.
const SCENE = sprite((x, y) => {
  // the sun is red + green with no blue, the cloud is all three at full
  if (Math.hypot(x - 9, y - 3.5) < 2.2) return [255, 210, 40];
  if (Math.hypot(x - 3, y - 3.2) < 1.3 || Math.hypot(x - 4.6, y - 2.6) < 1.5 || Math.hypot(x - 5.8, y - 3.4) < 1.1)
    return [242, 244, 248];
  const ground = 8.4 + Math.sin(x * 0.55) * 1.1;
  if (y > ground) return y > ground + 2 ? [28, 118, 52] : [52, 164, 72];
  const t = y / 9;
  return [lerp(40, 150, t), lerp(110, 200, t), lerp(215, 250, t)];
});
const FLAG = sprite((x, y) => (Math.hypot(x - 5.4, y - 6) < 3.2 ? [244, 42, 65] : [0, 106, 78]));

const PICTURES = [
  { name: "Sun & sky", px: SCENE, start: 45 }, // start on the sun
  { name: "Bangladesh flag", px: FLAG, start: 77 }, // …or the red circle
];
const CH = [
  { i: 0, cls: "r", name: "Red", tint: (v: number) => `rgb(${v} 0 0)` },
  { i: 1, cls: "g", name: "Green", tint: (v: number) => `rgb(0 ${v} 0)` },
  { i: 2, cls: "b", name: "Blue", tint: (v: number) => `rgb(0 0 ${v})` },
];
// One slider, three stops: pulled apart (0) → stacked (50) → seen face-on (100).
const STEPS = [
  {
    at: 0,
    label: "1 · Three grids",
    note: "Three separate grids, the same size. Each holds only how much of its own color goes in every cell.",
  },
  {
    at: 50,
    label: "2 · Stack them",
    note: "Laid on top of each other, the lights add up: red + green is yellow, all three at full is white.",
  },
  {
    at: 100,
    label: "3 · Look from the front",
    note: "From the front it is an ordinary color picture — but every pixel is still three numbers.",
  },
];
/** Tipped-over pose of a sheet: the same numbers go into the CSS transform. */
const TIP_X = 60;
const TIP_Z = -45;
const rad = (d: number) => (d * Math.PI) / 180;

export function ChannelStackFigure() {
  const box = useRef<HTMLElement>(null);
  const [pic, setPic] = useState(0);
  const [use, setUse] = useState([true, true, true]);
  const [step, setStep] = useState(0);
  // buttons glide between poses; dragging the slider should track the thumb
  const [glide, setGlide] = useState(true);
  const [at, setAt] = useState<number | null>(null);
  useInView(box, {});

  const { px, start } = PICTURES[pic];
  const i = at ?? start;
  const p = px[i].map((v, k) => (use[k] ? v : 0));
  const spread = Math.max(0, 1 - step / 50);
  const tilt = Math.min(1, 2 - step / 50);
  const note = STEPS[step < 25 ? 0 : step < 75 ? 1 : 2].note;

  // Where cell i lands once its sheet is tipped over, as a fraction of the
  // sheet's side — the skewer pierces that point on all three sheets.
  const u = ((i % STACK_COLS) + 0.5) / STACK_COLS - 0.5;
  const v = (Math.floor(i / STACK_COLS) + 0.5) / STACK_COLS - 0.5;
  const z = rad(TIP_Z * tilt);
  const sx = u * Math.cos(z) - v * Math.sin(z);
  const sy = (u * Math.sin(z) + v * Math.cos(z)) * Math.cos(rad(TIP_X * tilt));

  const go = (s: number, smooth: boolean) => {
    setGlide(smooth);
    setStep(s);
  };

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 3" title="A color image is three grids, stacked" />
      <div className="pfig-body pfig-split wide">
        <div
          className={`pfig-stack${glide ? " glide" : ""}`}
          style={{ ["--spread" as string]: spread, ["--tilt" as string]: tilt }}
        >
          {CH.map((c, k) => (
            <div
              key={c.cls}
              className={`pfig-layer ${c.cls}${use[c.i] ? "" : " off"}`}
              style={{ ["--k" as string]: k - 1 }}
            >
              <div className="pfig-plane">
                <PixelGrid
                  cols={STACK_COLS}
                  values={px.map((q) => (use[c.i] ? q[c.i] : 0))}
                  onHover={setAt}
                  onPick={setAt}
                  selected={at}
                  fill={c.tint}
                  label={(val, j) => `${c.name} grid, row ${Math.floor(j / STACK_COLS) + 1}, column ${(j % STACK_COLS) + 1}, value ${val}`}
                />
              </div>
            </div>
          ))}
          {CH.map((c, k) => (
            <span key={c.cls} className={`pfig-tag ${c.cls}`} style={{ ["--k" as string]: k - 1 }}>
              {c.name}
              <b>{p[c.i]}</b>
            </span>
          ))}
          <div className="pfig-skewer" style={{ ["--sx" as string]: sx, ["--sy" as string]: sy }}>
            <i />
          </div>
        </div>

        <div className="pfig-col">
          <p className="pfig-label">
            Row <b>{Math.floor(i / STACK_COLS) + 1}</b>, column <b>{(i % STACK_COLS) + 1}</b> — one
            pixel, one number from each grid:
          </p>
          <div className="pfig-sum">
            {CH.map((c) => (
              <div key={c.cls} className={`pfig-term ${c.cls}${use[c.i] ? "" : " off"}`}>
                <em>{c.i ? "+" : ""}</em>
                <i style={{ background: c.tint(p[c.i]) }} />
                <span>{c.name}</span>
                <b>{p[c.i]}</b>
              </div>
            ))}
            <div className="pfig-term out">
              <em>=</em>
              <i style={{ background: `rgb(${p.join(" ")})` }} />
              <span>Pixel</span>
              <b>({p.join(", ")})</b>
            </div>
          </div>
          <p className="pfig-note">{note}</p>
          <div className="pfig-row">
            {STEPS.map((s) => (
              <Btn key={s.at} on={step === s.at} onClick={() => go(s.at, true)}>
                {s.label}
              </Btn>
            ))}
          </div>
          <input
            className="pfig-slider"
            type="range"
            min={0}
            max={100}
            value={step}
            aria-label="stack the three grids"
            onChange={(e) => go(Number(e.target.value), false)}
          />
        </div>
      </div>
      <div className="mfig-controls">
        {PICTURES.map((q, k) => (
          <Btn key={q.name} on={pic === k} onClick={() => { setPic(k); setAt(null); }}>
            {q.name}
          </Btn>
        ))}
        {CH.map((c) => (
          <Btn
            key={c.cls}
            on={use[c.i]}
            onClick={() => setUse((u) => u.map((s, j) => (j === c.i ? !s : s)))}
          >
            {c.name} {use[c.i] ? "on" : "off"}
          </Btn>
        ))}
      </div>
      <figcaption>
        Each sheet is <strong>a grayscale image on its own</strong>, tinted so you can tell them
        apart. Press <strong>Stack them</strong> and they slide into one — where they overlap, their
        light adds, and the picture appears. Point at any cell: the line pierces{" "}
        <strong>the same position</strong> in all three grids. Switch a color off and its sheet
        turns to zeros — turn off green and the yellow sun goes red.
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
// 6 · The closer. Same idea as figure 1 of an earlier draft, but placed last on
//     purpose: once the reader knows what a grid of brightness values is, the
//     "computer sees only this" view lands as a conclusion instead of a puzzle.

// ponytail: a bird built from a few shapes and sampled, not a decoded photo — a
// real image would need a file + a decoder in the bundle to make this one point.
// A chickadee: its black cap, white cheek and black bib are high-contrast marks
// that still read as "bird" at 40 × 40.
const BIRD_COLS = 40;

type Shape = (x: number, y: number) => boolean;
type Tone = number | ((x: number, y: number) => number);
const ellipse = (cx: number, cy: number, rx: number, ry: number, deg = 0): Shape => {
  const c = Math.cos((deg * Math.PI) / 180);
  const s = Math.sin((deg * Math.PI) / 180);
  return (x, y) => {
    const u = ((x - cx) * c + (y - cy) * s) / rx;
    const v = (-(x - cx) * s + (y - cy) * c) / ry;
    return u * u + v * v <= 1;
  };
};
const polygon = (pts: [number, number][]): Shape => (x, y) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const stroke = (x1: number, y1: number, x2: number, y2: number, w: number): Shape => (x, y) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) <= w / 2;
};

const both = (a: Shape, b: Shape): Shape => (x, y) => a(x, y) && b(x, y);
/** Light from the top-left: a part gets brighter toward (cx, cy)'s upper left. */
const lit = (base: number, cx: number, cy: number, k: number) => (x: number, y: number) =>
  base + k * (cx - x + (cy - y));

const HEAD = ellipse(27, 13, 6, 5.8);
// [shape, brightness], painted back to front, in cell units.
const BIRD_PARTS: [Shape, Tone][] = [
  [stroke(-1, 33.5, 41, 30.5, 3.2), (x, y) => (y < 32.3 - x * 0.071 ? 104 : 58)], // branch, lit on top
  [stroke(30, 31, 37, 25, 1.2), 70], // twig
  [ellipse(37.6, 23.8, 2.6, 1.2, -45), 132], // leaf
  [polygon([[13.5, 22.5], [3.2, 31], [5.6, 33.4], [16, 25.6]]), 46], // tail
  [stroke(13.2, 24.6, 4.6, 32.2, 0.6), 112],
  [ellipse(19.5, 22, 10, 7.6, -28), lit(212, 19, 18, 2.2)], // pale belly
  [ellipse(22.5, 17.2, 5.8, 4.2, -30), lit(118, 22, 15, 3)], // grey back
  [ellipse(17.6, 20.6, 8.4, 4.6, -28), lit(96, 16, 18, 2)], // wing
  [stroke(11.2, 25, 21.8, 18.8, 0.8), 176], // pale feather edges
  [stroke(11.6, 26.4, 21.2, 20.8, 0.7), 150],
  [polygon([[9.8, 25.6], [12.6, 22.4], [14.2, 25.4]]), 52], // wingtip
  [HEAD, 236], // white cheek
  [both(HEAD, (x, y) => y < 11.3 - (x - 27) * 0.08), 24], // black cap
  [both(HEAD, (x, y) => x < 22.6 + (y - 13) * 0.5), 110], // grey nape
  [ellipse(29.2, 18.8, 3, 2.1, -15), 26], // black bib
  [ellipse(30.1, 12.3, 1.15, 1.15), 10], // eye
  [ellipse(30.45, 11.95, 0.45, 0.45), 255], // its catch-light
  [polygon([[32.6, 12.1], [36.4, 13.4], [32.6, 14.7]]), 34], // beak
  [stroke(20.6, 28.4, 20, 31.8, 0.9), 64], // legs
  [stroke(23.6, 27.8, 23.9, 31.4, 0.9), 64],
];
// An out-of-focus backdrop, like a photo: a soft bright patch top-left.
const backdrop = (x: number, y: number) =>
  150 - y * 0.6 + 28 * Math.exp(-((x - 8) ** 2 + (y - 7) ** 2) / 90) - 18 * Math.exp(-((x - 38) ** 2 + (y - 38) ** 2) / 120);
const birdTone = (x: number, y: number) => {
  for (let k = BIRD_PARTS.length - 1; k >= 0; k--) {
    const [inside, tone] = BIRD_PARTS[k];
    if (inside(x, y)) return typeof tone === "number" ? tone : tone(x, y);
  }
  return backdrop(x, y);
};

// Deterministic jitter, so the sprite reads like sampled light instead of flat
// paint — and so server and client render the identical array.
const jitter = (i: number) => {
  const s = Math.sin(i * 127.1) * 43758.5453;
  return s - Math.floor(s);
};
// Each cell averages 4 × 4 samples, the way a camera sensor averages the light
// that lands on it — which is what gives the edges their in-between greys.
const SS = 4;
const BIRD_PX = Array.from({ length: BIRD_COLS * BIRD_COLS }, (_, i) => {
  const c = i % BIRD_COLS;
  const r = Math.floor(i / BIRD_COLS);
  let sum = 0;
  for (let sy = 0; sy < SS; sy++)
    for (let sx = 0; sx < SS; sx++) sum += birdTone(c + (sx + 0.5) / SS, r + (sy + 0.5) / SS);
  return clamp255(sum / (SS * SS) + (jitter(i) - 0.5) * 8);
});

export function EyeVsMachineFigure() {
  const box = useRef<HTMLElement>(null);
  const [view, setView] = useState<"eye" | "both" | "num">("eye");
  const [at, setAt] = useState<number | null>(null);
  useInView(box, {});

  const i = at ?? 20 * BIRD_COLS + 17; // a wing pixel, so the readout is never empty
  const v = BIRD_PX[i];

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 6" title={`You see a bird. It sees ${BIRD_PX.length.toLocaleString("en-US")} numbers.`} />
      <div className="pfig-body">
        <div className={`pfig-frame fine${view === "eye" ? " seamless" : ""}`}>
          <PixelGrid
            cols={BIRD_COLS}
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
          Point at any cell — row <b>{Math.floor(i / BIRD_COLS) + 1}</b>, column <b>{(i % BIRD_COLS) + 1}</b> holds
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
        Press <strong>What the computer gets</strong>: the bird is gone and {BIRD_COLS} × {BIRD_COLS} ={" "}
        {BIRD_PX.length.toLocaleString("en-US")} numbers remain. Searching your photos for “bird” means finding the answer in
        numbers like these — and a real photo hands it 36 million of them.
      </figcaption>
    </figure>
  );
}
