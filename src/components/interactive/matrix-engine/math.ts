// Pure math + color helpers shared by every sketch in the "Matrices are
// Transformers" deck. No DOM, no React — safe to import from anywhere.

/** A 2×2 matrix is `[a,b,c,d]` == `[[a,b],[c,d]]`, so column 1 = (a,c), column 2 = (b,d). */
export type Mat = number[];
/** A screen-space or world-space point, `[x, y]`. */
export type Pt = [number, number];

export const ID: Mat = [1, 0, 0, 1];

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const rot = (t: number): Mat => [Math.cos(t), -Math.sin(t), Math.sin(t), Math.cos(t)];

export const mul = (M: Mat, N: Mat): Mat => [
  M[0] * N[0] + M[1] * N[2], M[0] * N[1] + M[1] * N[3],
  M[2] * N[0] + M[3] * N[2], M[2] * N[1] + M[3] * N[3],
];

export const det = (M: Mat) => M[0] * M[3] - M[1] * M[2];

/** Element-wise equality — lets a slide's onFrame bail out of an identical setState. */
export const matEq = (a: Mat, b: Mat) => a.length === b.length && a.every((v, k) => v === b[k]);

/** Fixed-decimal format that never renders "-0.00". */
export const fmt = (n: number, d = 2) => {
  const s = n.toFixed(d);
  return s === "-" + (0).toFixed(d) ? (0).toFixed(d) : s;
};

/** '#2dd4bf' + alpha -> 'rgba(45,212,191,a)' */
export const rgba = (hex: string, a: number) => {
  const h = String(hex).replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// The original deck read these off CSS custom properties at boot, which forced a
// second `loadColors()` after reveal initialised (the first ran too early). Canvas
// code needs them synchronously on every frame, so they live here as the single
// source of truth. `<DeckStyles />` mirrors them as --m* custom properties for the
// HTML side — keep the two in sync.
export const COL: Record<"i" | "j" | "v" | "a" | "dim" | "bad", string> = {
  i: "#2dd4bf",   // î / class A
  j: "#f472b6",   // ĵ / class B
  v: "#fbbf24",   // vectors, highlighted points
  a: "#818cf8",   // accent
  dim: "#8d97ae", // secondary text
  bad: "#fb7185", // failure / collapse
};
