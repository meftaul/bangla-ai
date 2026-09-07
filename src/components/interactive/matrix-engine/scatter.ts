import { COL, clamp, ease, lerp, rgba } from "./math";
import { Sketch } from "./sketch";

export type ScatterOpts = {
  range: number;
  layout: "spiral" | "blobs";
  swirl: number;
  n: number;
  grid: boolean;
};

type Tween = { from: number; to: number; dur: number; t0: number; set: (v: number) => void };

// Two labelled classes that can be crumpled / un-crumpled, plus a straight
// decision cut with a live accuracy readout.
//
// The clean layout is generated FIRST (two bars, left and right of the origin)
// and then swirled — rotate every point by swirl·r — to produce the tangled
// version. So un-crumpling is exact, not approximate.
export class Scatter extends Sketch {
  o: ScatterOpts;
  /** 0 = crumpled, 1 = un-crumpled. */
  k: number;
  px = 1;
  cx = 0;
  cy = 0;
  pts: { a: number[]; b: number[]; c: number }[] = [];
  tw: Tween[] = [];
  line = { th: 0, d: 0, on: 0 };
  sweeping = false;
  sw0 = 0;
  best = 0;
  onFrame: ((acc: number, best: number, k: number, on: number) => void) | null = null;

  constructor(host: HTMLElement, opts: Partial<ScatterOpts> = {}) {
    super(host);
    this.o = { range: 3.1, layout: "spiral", swirl: 4.0, n: 110, grid: true, ...opts };
    this.k = this.o.layout === "blobs" ? 1 : 0;
    this.build();
    this.onResize();
    this.draw();
  }

  onResize() {
    if (!this.o) return;
    this.px = Math.min(this.w, this.h) / (2 * this.o.range);
    this.cx = this.w / 2;
    this.cy = this.h / 2;
  }

  private build() {
    // Deterministic LCG so the picture is identical on every run — the speaker
    // rehearses against one arrangement, not a fresh random one each time.
    let s = 987654321;
    const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    this.pts = [];
    for (let c = 0; c < 2; c++)
      for (let i = 0; i < this.o.n; i++) {
        let a: number[];
        if (this.o.layout === "blobs") {
          const R = 0.78 * Math.sqrt(rnd());
          const t = rnd() * Math.PI * 2;
          a = [(c ? -1.3 : 1.3) + R * Math.cos(t), (c ? -0.72 : 0.78) + R * Math.sin(t)];
        } else {
          const r = 0.55 + 2.05 * ((i + 0.5) / this.o.n);
          a = [c ? -r : r, (rnd() - 0.5) * 0.52];
        }
        this.pts.push({ a, b: this.swirl(a, 1), c });
      }
  }

  private swirl(p: number[], sgn: number): number[] {
    if (this.o.layout === "blobs") return [p[0], p[1]];
    const r = Math.hypot(p[0], p[1]);
    // Past the data (r < 2.6) the twist fades out, so the grid bends instead of
    // shredding into a hairball in the corners. Depends only on r, so the map
    // stays exactly invertible.
    const fade = clamp(1 - (r - 2.75) / 2.2, 0, 1);
    const t = Math.atan2(p[1], p[0]) + sgn * this.o.swirl * r * fade;
    return [r * Math.cos(t), r * Math.sin(t)];
  }

  /** Where a raw-frame point sits after the current amount of un-crumpling. */
  private Mp(p: number[]) {
    const q = this.swirl(p, -1);
    return [lerp(p[0], q[0], this.k), lerp(p[1], q[1], this.k)];
  }

  S(x: number, y: number) {
    return [this.cx + x * this.px, this.cy - y * this.px];
  }

  /** Fraction correct if "positive side = class 0"; may be below .5. */
  private raw(th: number, d: number) {
    const cs = Math.cos(th);
    const sn = Math.sin(th);
    let ok = 0;
    for (const p of this.pts) {
      const q = this.Mp(p.b);
      if ((q[0] * cs + q[1] * sn - d > 0 ? 0 : 1) === p.c) ok++;
    }
    return ok / this.pts.length;
  }
  acc() {
    const f = this.raw(this.line.th, this.line.d);
    return Math.max(f, 1 - f);
  }

  /** Best offset for a given angle — the fairest possible straight cut. */
  private bestD(th: number): [number, number] {
    const cs = Math.cos(th);
    const sn = Math.sin(th);
    const pr = this.pts.map((p) => {
      const q = this.Mp(p.b);
      return [q[0] * cs + q[1] * sn, p.c];
    });
    let bd = 0;
    let ba = 0;
    for (let i = 0; i <= 40; i++) {
      const d = -this.o.range + 2 * this.o.range * (i / 40);
      let ok = 0;
      for (const pv of pr) if ((pv[0] - d > 0 ? 0 : 1) === pv[1]) ok++;
      const f = Math.max(ok, pr.length - ok) / pr.length;
      if (f > ba) {
        ba = f;
        bd = d;
      }
    }
    return [bd, ba];
  }

  private tween(from: number, to: number, dur: number, set: (v: number) => void) {
    this.tw.push({ from, to, dur, t0: performance.now(), set });
    this.kick();
  }
  setK(v: number, dur = 1800) {
    this.tween(this.k, v, dur, (x) => (this.k = x));
  }
  setLine(th: number, d: number, dur = 1100) {
    this.sweeping = false;
    this.tween(this.line.th, th, dur, (x) => (this.line.th = x));
    this.tween(this.line.d, d, dur, (x) => (this.line.d = x));
  }
  showLine(on: boolean, dur = 450) {
    this.tween(this.line.on, on ? 1 : 0, dur, (x) => (this.line.on = x));
  }
  sweep(on: boolean) {
    this.sweeping = on;
    if (on) {
      this.sw0 = performance.now();
      this.best = 0;
      this.showLine(true, 300);
    }
    this.kick();
  }
  reset() {
    this.tw = [];
    this.sweeping = false;
    this.best = 0;
    this.k = this.o.layout === "blobs" ? 1 : 0;
    this.line = { th: this.o.layout === "blobs" ? 1.9 : 0, d: 0, on: 0 };
    this.draw();
    this.sync();
  }
  sync() {
    this.onFrame?.(this.acc(), this.best, this.k, this.line.on);
  }

  step(now: number) {
    let more = false;
    this.tw = this.tw.filter((t) => {
      const p = clamp((now - t.t0) / t.dur, 0, 1);
      t.set(lerp(t.from, t.to, ease(p)));
      return p < 1;
    });
    if (this.tw.length) more = true;
    if (this.sweeping) {
      this.line.th = (((now - this.sw0) / 3400) * Math.PI) % Math.PI;
      const bd = this.bestD(this.line.th);
      this.line.d = bd[0];
      this.best = Math.max(this.best, bd[1]);
      more = true;
    }
    this.sync();
    return more;
  }

  draw() {
    const c = this.ctx;
    if (!this.w) return;
    c.clearRect(0, 0, this.w, this.h);

    // The grid, carried along by the same transformation as the data — this is
    // what makes "un-crumpling" read as a motion of space, not of the dots.
    if (this.o.grid) {
      const R = this.o.range * 1.2;
      const SEG = this.k > 0.001 ? 48 : 1;
      c.strokeStyle = "rgba(150,170,215,.13)";
      c.lineWidth = 1;
      for (let ax = 0; ax < 2; ax++)
        for (let g = -6; g <= 6; g++) {
          const i = g * (R / 6);
          c.beginPath();
          for (let s = 0; s <= SEG; s++) {
            const t = -R + 2 * R * (s / SEG);
            const q = this.Mp(ax ? [t, i] : [i, t]);
            const p = this.S(q[0], q[1]);
            if (s) c.lineTo(p[0], p[1]);
            else c.moveTo(p[0], p[1]);
          }
          c.stroke();
        }
    }

    // The decision cut + the two half-planes it claims.
    if (this.line.on > 0.02) {
      const al = this.line.on;
      const th = this.line.th;
      const d = this.line.d;
      const n = [Math.cos(th), Math.sin(th)];
      const dir = [-Math.sin(th), Math.cos(th)];
      const P0 = [n[0] * d, n[1] * d];
      const L = this.o.range * 3;
      const flip = this.raw(th, d) < 0.5;
      const side = (sg: number, col: string) => {
        const q = [
          [P0[0] + dir[0] * L, P0[1] + dir[1] * L],
          [P0[0] - dir[0] * L, P0[1] - dir[1] * L],
          [P0[0] - dir[0] * L + sg * n[0] * L, P0[1] - dir[1] * L + sg * n[1] * L],
          [P0[0] + dir[0] * L + sg * n[0] * L, P0[1] + dir[1] * L + sg * n[1] * L],
        ].map((p) => this.S(p[0], p[1]));
        c.beginPath();
        q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
        c.closePath();
        c.fillStyle = rgba(col, 0.085 * al);
        c.fill();
      };
      side(1, flip ? COL.j : COL.i);
      side(-1, flip ? COL.i : COL.j);
      const A = this.S(P0[0] + dir[0] * L, P0[1] + dir[1] * L);
      const B = this.S(P0[0] - dir[0] * L, P0[1] - dir[1] * L);
      c.strokeStyle = rgba(COL.a, 0.9 * al);
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(A[0], A[1]);
      c.lineTo(B[0], B[1]);
      c.stroke();
    }

    for (const p of this.pts) {
      const q = this.Mp(p.b);
      const s = this.S(q[0], q[1]);
      this.dot(s[0], s[1], 3.6, rgba(p.c ? COL.j : COL.i, 0.92));
    }
  }
}
