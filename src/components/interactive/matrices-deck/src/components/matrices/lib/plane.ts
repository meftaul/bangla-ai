import { COL, clamp, det, ease, ID, lerp, type Mat } from "./math";
import { Sketch } from "./sketch";

export type PlaneOpts = {
  range: number;
  ghost: boolean;
  basis: boolean;
  square: boolean;
  labels: boolean;
  vecs: { v: number[]; color?: string; label?: string }[];
  pts: { v: number[]; r?: number; color?: string }[];
  gridAlpha: number;
  tick: boolean;
};

type MatAnim = { from: Mat; to: Mat; path?: ((e: number, from: Mat, to: Mat) => Mat) | null; t0: number; dur: number };

// A 2D grid deformed by a live matrix (and, for the "not linear" panel, by a
// non-linear warp function). Everything the deck says about columns, determinant
// and rank is drawn by this one class.
export class Plane extends Sketch {
  o: PlaneOpts;
  M: Mat = ID.slice();
  px = 1;
  cx = 0;
  cy = 0;
  anim: MatAnim | null = null;
  loopFn: ((now: number) => Mat) | null = null;
  warp: ((x: number, y: number) => number[]) | null = null;
  warpAmt = 0;
  warpAnim: { from: number; to: number; t0: number; dur: number } | null = null;
  /** Translation applied after the matrix — the bias term. */
  off: number[] = [0, 0];
  offAnim: { from: number[]; to: number[]; t0: number; dur: number } | null = null;
  onFrame: ((M: Mat) => void) | null = null;

  constructor(host: HTMLElement, opts: Partial<PlaneOpts> = {}) {
    super(host);
    this.o = {
      range: 4.6, ghost: true, basis: true, square: false, labels: true,
      vecs: [], pts: [], gridAlpha: 0.3, tick: true,
      ...opts,
    };
    this.onResize();
    this.draw();
  }

  onResize() {
    if (!this.o) return; // super() resizes before opts exist
    this.px = Math.min(this.w, this.h) / (2 * this.o.range);
    this.cx = this.w / 2;
    this.cy = this.h / 2;
  }

  /** world -> screen */
  S(x: number, y: number) {
    return [this.cx + x * this.px, this.cy - y * this.px];
  }
  /** world -> transformed world */
  T(x: number, y: number, M?: Mat) {
    M = M || this.M;
    if (this.warp && this.warpAmt > 0) {
      const w = this.warp(x, y);
      x = lerp(x, w[0], this.warpAmt);
      y = lerp(y, w[1], this.warpAmt);
    }
    return [M[0] * x + M[1] * y + this.off[0], M[2] * x + M[3] * y + this.off[1]];
  }
  /** world -> transformed -> screen */
  P(x: number, y: number) {
    const t = this.T(x, y);
    return this.S(t[0], t[1]);
  }

  setMatrix(M: Mat, opt: { dur?: number; animate?: boolean; path?: MatAnim["path"] } = {}) {
    const dur = opt.dur == null ? 1100 : opt.dur;
    if (opt.animate === false || dur === 0) {
      this.M = M.slice();
      this.draw();
      this.onFrame?.(this.M);
      return;
    }
    this.anim = { from: this.M.slice(), to: M.slice(), path: opt.path || null, t0: performance.now(), dur };
    this.kick();
  }

  setWarp(fn: ((x: number, y: number) => number[]) | null, amt: number, dur = 900) {
    if (fn) this.warp = fn;
    this.warpAnim = { from: this.warpAmt, to: amt, t0: performance.now(), dur };
    this.kick();
  }

  setOff(o: number[], dur = 1000) {
    if (dur === 0) {
      this.off = o.slice();
      this.draw();
      return;
    }
    this.offAnim = { from: this.off.slice(), to: o.slice(), t0: performance.now(), dur };
    this.kick();
  }

  setLoop(fn: (now: number) => Mat) {
    this.loopFn = fn;
    this.kick();
  }
  stopLoop() {
    this.loopFn = null;
  }

  step(now: number) {
    let more = false;
    if (this.anim) {
      const a = this.anim;
      const p = clamp((now - a.t0) / a.dur, 0, 1);
      const e = ease(p);
      this.M = a.path ? a.path(e, a.from, a.to) : a.from.map((v, k) => lerp(v, a.to[k], e));
      if (p < 1) more = true;
      else {
        this.M = a.to.slice();
        this.anim = null;
      }
    }
    if (this.warpAnim) {
      const a = this.warpAnim;
      const p = clamp((now - a.t0) / a.dur, 0, 1);
      this.warpAmt = lerp(a.from, a.to, ease(p));
      if (p < 1) more = true;
      else {
        this.warpAmt = a.to;
        this.warpAnim = null;
      }
    }
    if (this.offAnim) {
      const a = this.offAnim;
      const p = clamp((now - a.t0) / a.dur, 0, 1);
      const e = ease(p);
      this.off = [lerp(a.from[0], a.to[0], e), lerp(a.from[1], a.to[1], e)];
      if (p < 1) more = true;
      else {
        this.off = a.to.slice();
        this.offAnim = null;
      }
    }
    if (this.loopFn) {
      this.M = this.loopFn(now);
      more = true;
    }
    this.onFrame?.(this.M);
    return more;
  }

  private gridLines(color: string, width: number, transform: boolean) {
    const c = this.ctx;
    const N = Math.ceil(this.o.range * 1.7) + 2;
    const seg = this.warp && this.warpAmt > 0 ? 30 : 1;
    c.strokeStyle = color;
    c.lineWidth = width;
    for (let k = -N; k <= N; k++) {
      if (k === 0) continue;
      for (let axis = 0; axis < 2; axis++) {
        c.beginPath();
        for (let s = 0; s <= seg; s++) {
          const t = -N + 2 * N * (s / seg);
          const x = axis === 0 ? k : t;
          const y = axis === 0 ? t : k;
          const p = transform ? this.P(x, y) : this.S(x, y);
          if (s === 0) c.moveTo(p[0], p[1]);
          else c.lineTo(p[0], p[1]);
        }
        c.stroke();
      }
    }
  }

  /** Where the two axes themselves land — î in teal, ĵ in pink. */
  private axisImages() {
    const c = this.ctx;
    const N = Math.ceil(this.o.range * 1.7) + 2;
    const seg = this.warp && this.warpAmt > 0 ? 30 : 1;
    for (const [color, axis] of [[COL.i, 0], [COL.j, 1]] as [string, number][]) {
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.globalAlpha = 0.55;
      c.beginPath();
      for (let s = 0; s <= seg; s++) {
        const t = -N + 2 * N * (s / seg);
        const p = this.P(axis === 0 ? t : 0, axis === 0 ? 0 : t);
        if (s === 0) c.moveTo(p[0], p[1]);
        else c.lineTo(p[0], p[1]);
      }
      c.stroke();
      c.globalAlpha = 1;
    }
  }

  draw() {
    const c = this.ctx;
    if (!this.w) return;
    c.clearRect(0, 0, this.w, this.h);

    if (this.o.ghost) this.gridLines("rgba(150,170,215,.09)", 1, false);
    this.gridLines(`rgba(160,185,235,${this.o.gridAlpha})`, 1.15, true);
    this.axisImages();

    if (this.o.square) {
      const q = ([[0, 0], [1, 0], [1, 1], [0, 1]] as number[][]).map((p) => this.P(p[0], p[1]));
      c.beginPath();
      q.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.closePath();
      const d = det(this.M);
      c.fillStyle = d < 0 ? "rgba(251,113,133,.20)" : "rgba(251,191,36,.20)";
      c.fill();
      c.strokeStyle = d < 0 ? "rgba(251,113,133,.7)" : "rgba(251,191,36,.7)";
      c.lineWidth = 1.6;
      c.stroke();
    }

    for (const p of this.o.pts) {
      const s = this.P(p.v[0], p.v[1]);
      this.dot(s[0], s[1], p.r || 4, p.color || COL.v);
    }
    for (const v of this.o.vecs) {
      const s = this.P(v.v[0], v.v[1]);
      this.arrow(this.P(0, 0), s, v.color || COL.v, 3.2);
      if (v.label) this.label(v.label, s[0] + 10, s[1] - 12, v.color || COL.v, 15);
    }

    if (this.o.basis) {
      const o = this.P(0, 0);
      const pi = this.P(1, 0);
      const pj = this.P(0, 1);
      this.arrow(o, pi, COL.i, 3.4);
      this.arrow(o, pj, COL.j, 3.4);
      if (this.o.labels) {
        this.label("î", pi[0] + 9, pi[1] + 12, COL.i, 16, 700);
        this.label("ĵ", pj[0] + 10, pj[1] - 10, COL.j, 16, 700);
      }
    }
    const org = this.P(0, 0);
    this.dot(org[0], org[1], 3, "rgba(255,255,255,.5)");
  }
}
