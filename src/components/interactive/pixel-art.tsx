// The pictures behind "ছবি আসলে সংখ্যা", as data: the pencil bird you read out
// over the phone, the photo-like chickadee, and the shape helpers both are
// drawn with. Shared by pixel-figures.tsx (the article's figures) and
// image-journey.tsx (the same story told one screen at a time), so the two can
// never show different numbers for the same cell.
//
// No styles and no hooks here — only numbers, and one plain SVG component.

export const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
export const gray = (v: number) => `rgb(${v} ${v} ${v})`;
/** Ink that stays readable on a given grey — the grid draws its own values. */
export const ink = (v: number) => (v > 138 ? "#0b1020" : "#e9edf7");

// ---------------------------------------------------------------------------
// Shapes, in cell units.

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

// ---------------------------------------------------------------------------
// The photo-like bird.
//
// ponytail: a bird built from a few shapes and sampled, not a decoded photo — a
// real image would need a file + a decoder in the bundle to make this one point.
// A chickadee: its black cap, white cheek and black bib are high-contrast marks
// that still read as "bird" at 40 × 40.
export const BIRD_COLS = 40;

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
export const BIRD_PX = Array.from({ length: BIRD_COLS * BIRD_COLS }, (_, i) => {
  const c = i % BIRD_COLS;
  const r = Math.floor(i / BIRD_COLS);
  let sum = 0;
  for (let sy = 0; sy < SS; sy++)
    for (let sx = 0; sx < SS; sx++) sum += birdTone(c + (sx + 0.5) / SS, r + (sy + 0.5) / SS);
  return clamp255(sum / (SS * SS) + (jitter(i) - 0.5) * 8);
});

// ---------------------------------------------------------------------------
// The pencil bird from the phone-call story.

/** The drawing's side, in sheet units. Every grid size on offer divides it. */
export const SHEET = 48;
export const PAPER = 236;

export type Mark = { tone: number } & (
  | { ellipse: [cx: number, cy: number, rx: number, ry: number, deg: number] }
  | { poly: [number, number][] }
  | { line: [x1: number, y1: number, x2: number, y2: number, w: number] }
);

// Your pencil bird, back to front. One list both draws the picture you see and
// yields the numbers you read out, so the two can never disagree.
export const DRAWING: Mark[] = [
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

export const insideOf = (m: Mark): Shape =>
  "ellipse" in m ? ellipse(...m.ellipse) : "poly" in m ? polygon(m.poly) : stroke(...m.line);
const MARK_INSIDE = DRAWING.map(insideOf);
const sketchTone = (x: number, y: number) => {
  for (let k = DRAWING.length - 1; k >= 0; k--) if (MARK_INSIDE[k](x, y)) return DRAWING[k].tone;
  return PAPER;
};

export const GRID_SIZES = [6, 8, 12, 24, 48];

// What each cell averages to, per grid size — the number you would say for it.
// Samples sit at most half a unit apart, so even a coarse cell sees its edges.
export const CELL_TONES = Object.fromEntries(
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

/** The pencil drawing itself, in sheet units. */
export function Drawing({ marks = DRAWING }: { marks?: Mark[] }) {
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
