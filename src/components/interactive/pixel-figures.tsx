"use client";

import { memo, useEffect, useRef, useState, type PointerEvent } from "react";

import { Btn, Head, useInView } from "./figure-kit";
import "./pixel-figures.css";
// the story figure borrows the graph-paper lesson's step list and verdict line
import "./grid-figures.css";

// Figures for "AI-এর গণিত ১ — ছবি আসলে সংখ্যা".
//
// The article's whole claim is that an image is a grid of numbers and nothing
// else, so every figure here lets the reader hold both halves at once: touch a
// pixel and watch its number move, or type a number and watch the pixel move.
//
// Copy inside the figures is English, with plain ASCII numbers throughout; the
// prose around them stays Bangla. All DOM/SVG rather than canvas, same as
// vector-figures.tsx.

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
// 1 · One rule, two number systems.
//
//     The reader already owns the hard half of binary: they carry every day in
//     decimal, they just never say it out loud. So both rows here count off the
//     same +1 and the only difference on screen is how soon a box runs out of
//     digits — ten-deep on top, two-deep underneath. It stops at 255 on purpose:
//     that is a full eight boxes, and it is where the article's pixel values
//     come from a few paragraphs later.

type Counter = {
  /** how many digits one box is allowed to hold */
  base: number;
  /** what each box is worth, biggest first */
  places: number[];
  label: string;
  note: string;
};

const DECIMAL: Counter = {
  base: 10,
  places: [100, 10, 1],
  label: "How we count",
  note: "one box holds ten digits — 0 to 9",
};

const BINARY: Counter = {
  base: 2,
  places: [128, 64, 32, 16, 8, 4, 2, 1],
  label: "How a computer counts",
  note: "one box holds just two — 0 and 1",
};

const MAX = 255;
const BIN_PRESETS = [9, 15, 99, 255];

const digitsOf = ({ base, places }: Counter, n: number) => places.map((w) => Math.floor(n / w) % base);

/** A move between two numbers. `from` drives the roll, `carried` the carry chip. */
type Step = { n: number; from: number | null; carried: boolean };

// One row of odometer boxes. Both counters are the same component — the base and
// the place values are all that differ, which is the entire point of the figure.
function Odometer({
  counter,
  step,
  onToggle,
}: {
  counter: Counter;
  step: Step;
  onToggle?: (place: number) => void;
}) {
  const { base, places } = counter;
  const now = digitsOf(counter, step.n);
  const was = step.from === null ? null : digitsOf(counter, step.from);

  // A box "rolled" when it ran out of digits and went back to 0. That is the
  // carry; the box to its left — index i - 1 — is where the carry lands.
  const rolled = places.map((_, i) => step.carried && was !== null && was[i] === base - 1 && now[i] === 0);

  return (
    <div className="pfig-od-row">
      {places.map((w, i) => {
        const d = now[i];
        const moved = was !== null && was[i] !== d;
        // Only the binary boxes are switches you can flip; a base-ten box has
        // nine other digits it could hold, so there is nothing for a click to
        // mean. It stays a plain element rather than a button nobody can press.
        const Box = onToggle ? "button" : "div";
        return (
          <Box
            key={w}
            {...(onToggle
              ? { type: "button" as const, onClick: () => onToggle(w), "aria-label": `the ${w} place, digit ${d}` }
              : {})}
            className={`pfig-od${d > 0 ? " on" : ""}${d === base - 1 ? " full" : ""}${
              rolled[i] ? " roll" : ""
            }${rolled[i + 1] ? " hit" : ""}${onToggle ? "" : " flat"}`}
          >
            <i className="pfig-od-win">
              {moved ? (
                <>
                  <em className="out" key={`o${step.n}`}>{was[i]}</em>
                  <em className="in" key={`i${step.n}`}>{d}</em>
                </>
              ) : (
                <em>{d}</em>
              )}
            </i>
            <u>{w}</u>
            {/* the carry itself, flying into the neighbour on the left */}
            {rolled[i] ? <span className="pfig-carry" key={`c${step.n}`} aria-hidden="true" /> : null}
          </Box>
        );
      })}
    </div>
  );
}

export function BinaryFigure() {
  const box = useRef<HTMLElement>(null);
  const [step, setStep] = useState<Step>({ n: 0, from: null, carried: false });
  const [run, setRun] = useState(false);
  const [awake, setAwake] = useState(true);
  const { n } = step;

  useInView(box, { enter: () => setAwake(true), leave: () => setAwake(false) });

  const bump = () => setStep((s) => (s.n >= MAX ? s : { n: s.n + 1, from: s.n, carried: true }));
  const jump = (v: number) => setStep({ n: v, from: null, carried: false });

  // Once the boxes are full there is nowhere left for a carry to go, so counting
  // has to end there. A timeout per step rather than an interval says that by
  // itself: at 255 the effect simply schedules nothing. 650ms so a carry is
  // something you watch happen rather than a flicker.
  const counting = run && n < MAX;
  useEffect(() => {
    if (!counting || !awake) return;
    const t = setTimeout(() => setStep((s) => ({ n: s.n + 1, from: s.n, carried: true })), 650);
    return () => clearTimeout(t);
  }, [counting, awake, n]);

  const dec = digitsOf(DECIMAL, n);
  const decTerms = DECIMAL.places.map((w, i) => (dec[i] ? `${dec[i]}×${w}` : null)).filter(Boolean);
  const binTerms = BINARY.places.filter((w) => n & w);

  // Trailing 1s are exactly the boxes the next +1 will knock over at once.
  let cascade = 0;
  for (let v = n; v & 1; v >>= 1) cascade += 1;

  const hint =
    n >= MAX
      ? "All eight boxes are full — there is no room left. That is why 255 is the biggest value here. Remember that number; you will meet it again shortly."
      : cascade >= 3
        ? `Press +1 now and the bottom ${cascade} boxes will all flip at once. Keep watching.`
        : dec[2] === 9
          ? "The top-right box has reached 9 — it has no room left. Press +1 and see what happens."
          : "";

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 1" title="When we count, the computer does exactly the same thing" />
      <div className="pfig-body">
        <div className="pfig-od-block">
          <p className="pfig-label">
            <b>{DECIMAL.label}</b> · {DECIMAL.note}
          </p>
          <Odometer counter={DECIMAL} step={step} />
          <p className="pfig-add">
            {decTerms.length ? decTerms.join("  +  ") : "0"} <b>= {n}</b>
          </p>
        </div>

        {/* The whole concept, sitting where the animation happens. */}
        <p className="pfig-rule">
          When a box runs out of digits it goes back to <b>0</b> and tells the box on its left — <b>here, one for you</b>.
        </p>

        <div className="pfig-od-block">
          <p className="pfig-label">
            <b>{BINARY.label}</b> · {BINARY.note}
          </p>
          <Odometer counter={BINARY} step={step} onToggle={(w) => setStep((s) => ({ n: s.n ^ w, from: s.n, carried: false }))} />
          <p className="pfig-add">
            {binTerms.length ? binTerms.join("  +  ") : "0"} <b>= {n}</b>
          </p>
        </div>

        {hint ? <p className="pfig-hint">{hint}</p> : null}
      </div>
      <div className="mfig-controls">
        <button type="button" className="mfig-btn go" onClick={bump} disabled={n >= MAX}>
          +1
        </button>
        <Btn
          on={counting}
          onClick={() => {
            if (counting) return setRun(false);
            if (n >= MAX) jump(0);
            setRun(true);
          }}
        >
          {counting ? "Stop" : "Count by itself"}
        </Btn>
        <button type="button" className="mfig-btn" onClick={() => { setRun(false); jump(0); }}>
          Back to 0
        </button>
        <span className="pfig-gap" />
        {BIN_PRESETS.map((p) => (
          <Btn key={p} on={n === p} onClick={() => { setRun(false); jump(p); }}>
            {p}
          </Btn>
        ))}
      </div>
      <figcaption>
        Keep pressing <strong>+1</strong>. The top row and the bottom row always show the same number. There is
        only one difference: a box on top holds ten digits, a box below holds just two. So the bottom boxes fill up
        fast and pass a one to the left far more often. The rule is exactly the same.
        <br />
        <br />
        We have ten fingers, so we count with ten digits. A computer has no fingers — it has switches, on or off.
        That is two. Go to <strong>9</strong> or <strong>15</strong> and press +1 once, and it will click.
        <br />
        <br />
        The number under each box is what that box is worth. Add up the worth of every box holding a digit and you
        get the total — the same in both rows.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 6 · Three numbers, every colour. Opens the colour half of the article: until
//     here a pixel was one brightness, and now the reader mixes the three lights
//     that replace it.

const MIXES = [
  { label: "Yellow", c: [255, 214, 0] },
  { label: "Orange", c: [255, 122, 26] },
  { label: "Sky blue", c: [96, 165, 250] },
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
      <Head n="Figure 6" title="Three numbers make any color" />
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
        Drag the three sliders. Turn red and green all the way up and bring blue down to zero —{" "}
        <strong>yellow</strong>. No paint box, no brush, just three numbers changing. Each number goes from 0 to
        255, so 256 × 256 × 256 = <strong>more than 16.7 million colors</strong>, all from those three numbers.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 7 · The three grids as physical sheets. They start pulled apart in 3D, slide
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
  { name: "Sun and sky", px: SCENE, start: 45 }, // start on the sun
  { name: "Flag of Bangladesh", px: FLAG, start: 77 }, // …or the red circle
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
    label: "1 · three grids",
    note: "Three separate grids, exactly the same size. Each one knows only this — how much of its own color is in each cell.",
  },
  {
    at: 50,
    label: "2 · stack them",
    note: "Put one on top of another and the lights add up. Red and green make yellow; all three at full make white.",
  },
  {
    at: 100,
    label: "3 · look from the front",
    note: "From the front it is just an ordinary color picture. Yet every pixel is still three numbers.",
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
      <Head n="Figure 7" title="A color picture is three grids, one on top of another" />
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
            The pixel at row <b>{Math.floor(i / STACK_COLS) + 1}</b>, column <b>{(i % STACK_COLS) + 1}</b> — one
            number from each grid:
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
              <span>pixel</span>
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
        Look at each sheet on its own and it is <strong>just a black-and-white picture</strong> — the tint is only
        there so you can tell them apart. Press <strong>stack them</strong> and the three become one. Wherever they
        overlap, the light adds up and the picture appears. Put your finger on any cell — the skewer goes through{" "}
        <strong>exactly the same spot</strong> on all three grids. Switch a color off and its sheet drops to zero —
        switch green off and the yellow sun turns red.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 3 · The 3x3 from the article, editable. This is the load-bearing figure: the
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
      <Head n="Figure 3" title="Change a number and the picture changes" />
      <div className="pfig-body pfig-split">
        <div className="pfig-frame">
          <PixelGrid cols={3} values={px} numbers selected={sel} onPick={setSel} />
        </div>
        <div className="pfig-col">
          <p className="pfig-label">
            Selected pixel: <b>row {Math.floor(sel / 3) + 1}, column {(sel % 3) + 1}</b>
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
          The one above
        </Btn>
        <Btn on={px.every((v) => v === 0)} onClick={() => all(0)}>All black</Btn>
        <Btn on={px.every((v) => v === 255)} onClick={() => all(255)}>All white</Btn>
        <Btn on={false} onClick={() => setPx(ORIGINAL.map((_, i) => (i % 2 ? 235 : 25)))}>
          Checkerboard
        </Btn>
      </div>
      <figcaption>
        These are the same nine numbers written above. Tap any cell and drag the slider. Bring the 240 in the middle
        down to 20 — <strong>the bright dot is gone</strong>. Nobody edited a photo; one number changed. To a
        computer, editing a photo means doing arithmetic, nothing more.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 4 · Draw something. The point is the reverse direction: a shape you made by
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
      <Head n="Figure 4" title="Draw anything — the machine only gets the list" />
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
            What the machine gets — a list of <b>{PAINT_N}</b> numbers, <b>{lit}</b> of them lit:
          </p>
          <p className="pfig-mono">[{px.slice(0, 28).join(", ")}, …]</p>
        </div>
      </div>
      <div className="mfig-controls">
        <Btn on={numbers} onClick={() => setNumbers((s) => !s)}>
          {numbers ? "Hide numbers" : "Show numbers"}
        </Btn>
        <Btn on={false} onClick={() => setPx(BLANK)}>Clear</Btn>
        <span className="mfig-read">{PAINT_COLS} × {PAINT_COLS} = {PAINT_N}</span>
      </div>
      <figcaption>
        Press and drag to draw something — a letter, a face, whatever you like. To you it is a picture. To the
        machine it is <strong>{PAINT_N} numbers</strong>, nothing else. Machine learning means looking at that list
        and saying what was drawn.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 5 · The bird. Closes the black-and-white half of the article: once the reader
//     knows what a grid of brightness values is, the "computer sees only this"
//     view lands as a conclusion instead of a puzzle.

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
      <Head n="Figure 5" title={`You see a bird. It sees ${BIRD_PX.length.toLocaleString("en-US")} numbers.`} />
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
          Put your finger on any cell — row <b>{Math.floor(i / BIRD_COLS) + 1}</b>, column{" "}
          <b>{(i % BIRD_COLS) + 1}</b> has brightness <b>{v}</b>. 0 is pitch black, 255 is pure white.
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
        The picture and the list of numbers are <strong>the same thing</strong>, shown two ways. Press{" "}
        <strong>What the computer gets</strong>: the bird is gone, and what is left is {BIRD_COLS} × {BIRD_COLS} ={" "}
        {BIRD_PX.length.toLocaleString("en-US")} numbers. Searching “bird” on your phone means finding the answer
        inside numbers like these — and a real photo holds more than a thousand times as many. How many more, we
        will work out shortly.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 2 · Why a grid at all. The article tells it as a phone call: get a pencil
//     drawing onto a friend's page using nothing but words. Naming it fails,
//     describing it fails, and a grid you have both ruled — read out one number
//     per cell, in an order you both know — works without the word "bird" ever
//     being said. The last step makes the grid finer, which is resolution, which
//     is where "12 megapixel" comes from.
//
//     It sits last in the file only because it draws with the bird's shape
//     helpers above; in the article it comes second.

/** The drawing's side, in sheet units. Every grid size on offer divides it. */
const SHEET = 48;
const PAPER = 236;

type Mark = { tone: number } & (
  | { ellipse: [cx: number, cy: number, rx: number, ry: number, deg: number] }
  | { poly: [number, number][] }
  | { line: [x1: number, y1: number, x2: number, y2: number, w: number] }
);

// Your pencil bird, back to front. One list both draws the picture you see and
// yields the numbers you read out, so the two can never disagree.
const DRAWING: Mark[] = [
  { line: [1, 39.5, 47, 35.5, 2.6], tone: 70 }, // branch
  { line: [21, 30, 20.2, 37.6, 1], tone: 60 }, // legs, tucked under the body
  { line: [25.5, 30, 26.2, 37.2, 1], tone: 60 },
  { poly: [[13.5, 27], [3.5, 33.5], [6.5, 36.2], [16.5, 30.5]], tone: 72 }, // tail
  { ellipse: [22.5, 25.5, 11.5, 7.6, -20], tone: 130 }, // body
  { ellipse: [19.5, 24.8, 8.4, 4.2, -18], tone: 78 }, // wing
  { ellipse: [32.8, 16.4, 5.8, 5.8, 0], tone: 130 }, // head
  { ellipse: [34.8, 15.2, 1.3, 1.3, 0], tone: 18 }, // eye
  { poly: [[38, 14.6], [43.4, 17.2], [37.8, 19.4]], tone: 50 }, // beak
];

const insideOf = (m: Mark): Shape =>
  "ellipse" in m ? ellipse(...m.ellipse) : "poly" in m ? polygon(m.poly) : stroke(...m.line);
const MARK_INSIDE = DRAWING.map(insideOf);
const sketchTone = (x: number, y: number) => {
  for (let k = DRAWING.length - 1; k >= 0; k--) if (MARK_INSIDE[k](x, y)) return DRAWING[k].tone;
  return PAPER;
};

const GRID_SIZES = [6, 8, 12, 24, 48];
/** The grid the story reads out loud: small enough to print a number per cell. */
const READ_N = 8;

// What each cell averages to, per grid size — the number you would say for it.
// Samples sit at most half a unit apart, so even a coarse cell sees its edges.
const CELL_TONES = Object.fromEntries(
  GRID_SIZES.map((n) => {
    const s = SHEET / n;
    const k = Math.max(4, Math.ceil(2 * s));
    const tones = Array.from({ length: n * n }, (_, i) => {
      const c = i % n;
      const r = Math.floor(i / n);
      let sum = 0;
      for (let sy = 0; sy < k; sy++)
        for (let sx = 0; sx < k; sx++) sum += sketchTone((c + (sx + 0.5) / k) * s, (r + (sy + 0.5) / k) * s);
      return clamp255(sum / (k * k));
    });
    return [n, tones];
  }),
) as Record<number, number[]>;

function Drawing({ marks = DRAWING }: { marks?: Mark[] }) {
  return (
    <g>
      {marks.map((m, k) => {
        const tone = gray(m.tone);
        if ("ellipse" in m) {
          const [cx, cy, rx, ry, deg] = m.ellipse;
          return (
            <ellipse key={k} cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${deg} ${cx} ${cy})`} style={{ fill: tone }} />
          );
        }
        if ("poly" in m) return <polygon key={k} points={m.poly.join(" ")} style={{ fill: tone }} />;
        const [x1, y1, x2, y2, w] = m.line;
        return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w} strokeLinecap="round" style={{ stroke: tone }} />;
      })}
    </g>
  );
}

/** The ruled lines of an n × n grid over the sheet. */
function Ruling({ n, size = SHEET }: { n: number; size?: number }) {
  const s = size / n;
  let d = "";
  for (let i = 1; i < n; i++) d += `M${i * s} 0V${size}M0 ${i * s}H${size}`;
  return <path d={d} className={`pfig-ruling${n > 16 ? " fine" : ""}`} vectorEffect="non-scaling-stroke" />;
}

/** The friend's page: the first `upto` cells of an n × n grid, shaded as told. */
function Shaded({ n, upto }: { n: number; upto: number }) {
  const s = SHEET / n;
  return (
    <g shapeRendering="crispEdges">
      {CELL_TONES[n].slice(0, upto).map((v, i) => (
        <rect key={i} x={(i % n) * s} y={Math.floor(i / n) * s} width={s} height={s} style={{ fill: gray(v) }} />
      ))}
    </g>
  );
}

/** Where "a small circle a bit right of the middle" could be — all of them fit. */
const GUESSES: [number, number, number][] = [
  [29, 22, 8],
  [37.5, 11.5, 3.2],
  [24.5, 13, 5.5],
];

const STORY = [
  {
    title: "“Draw a bird”",
    note: "Your friend drew a bird, sure — but the bird in their head, not yours. They heard the word “bird” and filled in the rest themselves.",
  },
  {
    title: "“A small circle, a little right of the middle…”",
    note: "How much is a little? How small is small? Every one of these fits. Describe it in words and your friend has to guess at every phrase.",
  },
  {
    title: "The same grid on both pages",
    note: "8 rows, 8 columns, 64 cells. Every cell now sits in the same place on both pages. All that is left is to say how dark each cell is.",
  },
  {
    title: "One number for every cell",
    note: "Start at the top row, on the left. Pitch black is 0, pure white is 255, and grays sit in between. You read out numbers; your friend shades cells.",
  },
  {
    title: "Make the grid finer",
    note: "The smaller the cells, the closer your friend’s picture gets to yours — but the more numbers you have to read out. Each of these cells is called a pixel.",
  },
];
const GRID_STEP = 2;
const READ_STEP = 3;
const FINE_STEP = 4;
const READ_ALL = READ_N * READ_N;

export function GridStoryFigure() {
  const box = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [said, setSaid] = useState(0); // cells read out so far, in reading order
  const [n, setN] = useState(READ_N);
  const [awake, setAwake] = useState(true);
  useInView(box, { enter: () => setAwake(true), leave: () => setAwake(false) });

  // One number every 90ms while the figure is on screen. As in the other
  // stepped figures, "still reading" is derived, so the last cell just stops it.
  const reading = step === READ_STEP && said < READ_ALL;
  useEffect(() => {
    if (!reading || !awake) return;
    const t = setTimeout(() => setSaid((k) => k + 1), 90);
    return () => clearTimeout(t);
  }, [reading, awake, said]);

  const last = STORY.length - 1;
  const go = (s: number) => {
    const next = Math.max(0, Math.min(last, s));
    if (next === READ_STEP) setSaid(0);
    setStep(next);
  };

  const size = step === FINE_STEP ? n : READ_N;
  const tones = CELL_TONES[READ_N];
  const cell = SHEET / READ_N;
  const done = step === READ_STEP && !reading;
  // the row the last number came from, and everything said on it so far
  const row = Math.floor(Math.max(0, said - 1) / READ_N);
  const heard = tones.slice(row * READ_N, said);

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 2" title="Send a picture over the phone, using only words" />
      <div className="pfig-body">
        <div className="pfig-sheets">
          <div className="pfig-sheet">
            <p className="pfig-label">Your page</p>
            <svg viewBox={`0 0 ${SHEET} ${SHEET}`} className="mfig-svg" role="img" aria-label="your pencil drawing of a bird on a branch">
              <rect width={SHEET} height={SHEET} style={{ fill: gray(PAPER) }} />
              <Drawing />
              {step >= GRID_STEP && <Ruling n={size} />}
              {/* each number sits on a chip of the very grey it stands for */}
              {step === READ_STEP &&
                tones.slice(0, said).map((v, i) => {
                  const x = ((i % READ_N) + 0.5) * cell;
                  const y = (Math.floor(i / READ_N) + 0.5) * cell;
                  return (
                    <g key={i}>
                      <rect x={x - 2.4} y={y - 1.5} width={4.8} height={3} rx={0.7} className="pfig-sheet-chip" style={{ fill: gray(v) }} />
                      <text x={x} y={y} className="pfig-sheet-num" style={{ fill: ink(v) }}>
                        {v}
                      </text>
                    </g>
                  );
                })}
              {reading && said > 0 && (
                <rect
                  x={((said - 1) % READ_N) * cell}
                  y={Math.floor((said - 1) / READ_N) * cell}
                  width={cell}
                  height={cell}
                  className="pfig-sheet-now"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
          </div>

          <div className="pfig-sheet">
            <p className="pfig-label">Your friend’s page</p>
            <svg
              viewBox={`0 0 ${SHEET} ${SHEET}`}
              className="mfig-svg"
              role="img"
              aria-label={
                step < GRID_STEP
                  ? "your friend's page: a guess at what you meant"
                  : `your friend's page, a ${size} by ${size} grid, shaded from the numbers you read out`
              }
            >
              <rect width={SHEET} height={SHEET} style={{ fill: gray(PAPER) }} />
              {/* the bird everyone draws when told "a bird" */}
              {step === 0 && <path d="M12 24Q18 15 24 24Q30 15 36 24" className="pfig-doodle" />}
              {step === 1 && (
                <g className="pfig-guess">
                  {GUESSES.map(([x, y, r]) => (
                    <g key={x}>
                      <circle cx={x} cy={y} r={r} />
                      <text x={x} y={y}>?</text>
                    </g>
                  ))}
                </g>
              )}
              {step === READ_STEP && <Shaded n={READ_N} upto={said} />}
              {step === FINE_STEP && <Shaded n={n} upto={n * n} />}
              {step >= GRID_STEP && <Ruling n={size} />}
            </svg>
          </div>
        </div>

        <div className="pfig-split">
          <ol className="gfig-steps">
            {STORY.map((x, i) => (
              <li key={x.title} className={i === step ? "on" : i < step ? "past" : ""}>
                <button type="button" onClick={() => go(i)}>
                  {x.title}
                </button>
              </li>
            ))}
          </ol>
          <div className="pfig-col">
            <p className={`gfig-say${step < GRID_STEP ? " bad" : done ? " good" : ""}`}>
              {done
                ? "64 numbers, that is all. You never said the word “bird” once. But the picture is blocky and hard to recognise as a bird. See what the next step does."
                : STORY[step].note}
            </p>
            {step === READ_STEP && (
              <p className="pfig-mono">
                row <b>{row + 1}</b>: {heard.join(", ")}
                {reading ? " …" : ""}
                <br />
                numbers read out: <b>{said}</b> / {READ_ALL}
              </p>
            )}
            {step === FINE_STEP && (
              <p className="pfig-big">
                {n} × {n}
                <small>{(n * n).toLocaleString("en-US")} numbers to read out</small>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mfig-controls">
        <button type="button" className="mfig-btn" onClick={() => go(step - 1)} disabled={step === 0}>
          ← Back
        </button>
        <button type="button" className="mfig-btn" onClick={() => go(step + 1)} disabled={step === last}>
          Next →
        </button>
        {step === READ_STEP && (
          <Btn on={reading} onClick={() => setSaid(0)}>
            Read again
          </Btn>
        )}
        {step === FINE_STEP &&
          GRID_SIZES.map((k) => (
            <Btn key={k} on={n === k} onClick={() => setN(k)}>
              {k} × {k}
            </Btn>
          ))}
        <span className="mfig-read">
          step <b>{step + 1}</b> / {STORY.length}
        </span>
      </div>

      <figcaption>
        Press <strong>Next →</strong> to move the story along. At step four you read out one number at a time and
        one cell on your friend’s page gets shaded. At the last step, change the grid size: at{" "}
        <strong>6 × 6</strong> the bird is unrecognisable, at <strong>48 × 48</strong> it is almost the original.
        Your phone’s camera does exactly this, only its grid is 4000 × 3000.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 2ক · More cells, clearer cat. One picture read through ever finer grids —
//      4 × 4 up to 64 × 64 — and nothing else to parse. It plays through by
//      itself while on screen; the strip of thumbnails underneath shows every
//      size at once and doubles as the size picker.

const CAT_SHEET = 64;
const CAT_BG = 228;

// A cat's face, in sheet units, back to front. The whiskers are thinner than a
// cell even on the finest grid, so they are the first thing a big cell loses.
const CAT: Mark[] = [
  { poly: [[13, 32], [15, 7], [31, 20]], tone: 92 }, // ears
  { poly: [[51, 32], [49, 7], [33, 20]], tone: 92 },
  { poly: [[17, 26], [17.5, 13], [27, 21]], tone: 176 }, // inside the ears
  { poly: [[47, 26], [46.5, 13], [37, 21]], tone: 176 },
  { ellipse: [32, 37, 20, 17, 0], tone: 92 }, // head
  { ellipse: [32, 45, 8, 5.5, 0], tone: 150 }, // muzzle
  { ellipse: [24, 33, 3.8, 4.6, 0], tone: 226 }, // eyes
  { ellipse: [40, 33, 3.8, 4.6, 0], tone: 226 },
  { ellipse: [24, 33, 1.1, 3.8, 0], tone: 12 }, // slit pupils
  { ellipse: [40, 33, 1.1, 3.8, 0], tone: 12 },
  { poly: [[29.6, 41], [34.4, 41], [32, 43.8]], tone: 40 }, // nose
  { line: [32, 43.8, 32, 46.2, 0.8], tone: 40 }, // mouth
  { line: [32, 46.2, 29.2, 48, 0.8], tone: 40 },
  { line: [32, 46.2, 34.8, 48, 0.8], tone: 40 },
  { line: [25, 44, 5, 39, 0.7], tone: 30 }, // whiskers
  { line: [25, 46, 4, 46.5, 0.7], tone: 30 },
  { line: [25, 48, 6, 53, 0.7], tone: 30 },
  { line: [39, 44, 59, 39, 0.7], tone: 30 },
  { line: [39, 46, 60, 46.5, 0.7], tone: 30 },
  { line: [39, 48, 58, 53, 0.7], tone: 30 },
];
const CAT_INSIDE = CAT.map(insideOf);
const catTone = (x: number, y: number) => {
  for (let k = CAT.length - 1; k >= 0; k--) if (CAT_INSIDE[k](x, y)) return CAT[k].tone;
  return CAT_BG;
};

const CAT_SIZES = [4, 8, 16, 32, 64];

// Each cell's brightness is the average of what it covers. Samples sit at most
// half a unit apart, so even a thin whisker shows up as a faint line. A size is
// worked out the first time it is drawn rather than all of them at page load.
const CAT_CELLS: Record<number, number[]> = {};
function catCells(n: number): number[] {
  const hit = CAT_CELLS[n];
  if (hit) return hit;
  const s = CAT_SHEET / n;
  const k = Math.max(4, Math.ceil(2 * s));
  const cells = Array.from({ length: n * n }, (_, i) => {
    const c = i % n;
    const r = Math.floor(i / n);
    let sum = 0;
    for (let sy = 0; sy < k; sy++)
      for (let sx = 0; sx < k; sx++) sum += catTone((c + (sx + 0.5) / k) * s, (r + (sy + 0.5) / k) * s);
    return clamp255(sum / (k * k));
  });
  CAT_CELLS[n] = cells;
  return cells;
}

/** The cat through an n × n grid, as crisp squares. */
function CatGrid({ n, lines = false }: { n: number; lines?: boolean }) {
  const s = CAT_SHEET / n;
  return (
    <svg viewBox={`0 0 ${CAT_SHEET} ${CAT_SHEET}`} className="mfig-svg" role="img" aria-label={`a cat, seen through a ${n} by ${n} grid`}>
      <g shapeRendering="crispEdges">
        {catCells(n).map((v, i) => (
          <rect key={i} x={(i % n) * s} y={Math.floor(i / n) * s} width={s} height={s} style={{ fill: gray(v) }} />
        ))}
      </g>
      {/* past 32 × 32 the ruling would be all line and no cat */}
      {lines && n <= 32 ? <Ruling n={n} size={CAT_SHEET} /> : null}
    </svg>
  );
}

export function CellSizeFigure() {
  const box = useRef<HTMLElement>(null);
  const [at, setAt] = useState(0);
  const [play, setPlay] = useState(true);
  const [awake, setAwake] = useState(false);
  useInView(box, { enter: () => setAwake(true), leave: () => setAwake(false) });

  // Plays through while on screen, holds on the clearest cat, then starts over.
  const last = CAT_SIZES.length - 1;
  useEffect(() => {
    if (!play || !awake) return;
    const t = setTimeout(() => setAt((i) => (i >= last ? 0 : i + 1)), at === last ? 2600 : 1300);
    return () => clearTimeout(t);
  }, [play, awake, at, last]);

  const n = CAT_SIZES[at];

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 2a" title="More cells, a clearer cat" />
      <div className="pfig-body">
        {/* keyed by the grid size, so every change fades the new cells in */}
        <div key={n} className="pfig-cs-main pfig-regrid">
          <CatGrid n={n} lines />
        </div>
        <div className="pfig-cs-strip">
          {CAT_SIZES.map((k, i) => (
            <button
              key={k}
              type="button"
              className={i === at ? "on" : ""}
              aria-pressed={i === at}
              onClick={() => {
                setPlay(false);
                setAt(i);
              }}
            >
              <CatGrid n={k} />
              <span>
                {k} × {k}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mfig-controls">
        <Btn on={play} onClick={() => setPlay(!play)}>
          {play ? "Pause" : "Play"}
        </Btn>
        <span className="mfig-read">
          {n} × {n} = <b>{(n * n).toLocaleString("en-US")}</b> cells
        </span>
      </div>

      <figcaption>
        The same cat; only the number of cells changes. With 16 cells you see a few gray blotches, with 4,096 you
        can make out the whiskers. Tap any thumbnail to see it large.
      </figcaption>
    </figure>
  );
}

