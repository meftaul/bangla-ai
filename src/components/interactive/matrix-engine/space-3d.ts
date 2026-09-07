import { clamp, ease, lerp } from "./math";
import { Sketch } from "./sketch";

export type Space3DOpts = {
  yaw: number;
  pitch: number;
  dist: number;
  fov: number;
  spin: number;
  range: number;
};

// A tiny 3D projector with auto-orbit. `drawFn` gets the sketch and its 2D
// context and paints whatever the slide needs; `state` + `tween()` give it
// animatable scalars (e.g. `k`: 0 = flat, 1 = lifted).
export class Space3D extends Sketch {
  o: Space3DOpts;
  drawFn: (s: Space3D, c: CanvasRenderingContext2D) => void;
  yaw: number;
  t = 0;
  state: Record<string, number> = {};
  tweens: { key: string; from: number; to: number; t0: number; dur: number }[] = [];
  last: number | null = null;
  px = 1;
  cx = 0;
  cy = 0;

  constructor(
    host: HTMLElement,
    drawFn: (s: Space3D, c: CanvasRenderingContext2D) => void,
    opts: Partial<Space3DOpts> = {},
  ) {
    super(host);
    this.drawFn = drawFn;
    this.o = { yaw: -0.55, pitch: 0.42, dist: 9, fov: 3.4, spin: 0.00022, range: 4, ...opts };
    this.yaw = this.o.yaw;
    this.onResize();
    this.draw();
  }

  onResize() {
    if (!this.o) return; // super() resizes before opts exist
    this.px = Math.min(this.w, this.h) / (2 * this.o.range);
    this.cx = this.w / 2;
    this.cy = this.h / 2;
  }

  /** Project a world point to [screenX, screenY, depth]. */
  Pr(x: number, y: number, z: number) {
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);
    const X = x * cy + z * sy;
    const Z = -x * sy + z * cy;
    const cp = Math.cos(this.o.pitch);
    const sp = Math.sin(this.o.pitch);
    const Y = y * cp - Z * sp;
    const Z2 = y * sp + Z * cp;
    const k = this.o.fov / Math.max(0.6, ((this.o.dist - Z2) / this.o.dist) * this.o.fov);
    return [this.cx + X * this.px * k, this.cy - Y * this.px * k, Z2];
  }

  tween(key: string, to: number, dur = 1100) {
    const from = this.state[key] == null ? 0 : this.state[key];
    this.tweens.push({ key, from, to, t0: performance.now(), dur });
    this.kick();
  }

  /** Drop every in-flight tween and set state keys outright — used by `show`. */
  reset(state: Record<string, number> = {}) {
    this.tweens = [];
    Object.assign(this.state, state);
  }

  step(now: number) {
    if (this.last == null) this.last = now;
    const dt = Math.min(60, now - this.last);
    this.last = now;
    this.yaw += dt * this.o.spin;
    let more = this.spinning !== false;
    this.tweens = this.tweens.filter((tw) => {
      const p = clamp((now - tw.t0) / tw.dur, 0, 1);
      this.state[tw.key] = lerp(tw.from, tw.to, ease(p));
      return p < 1;
    });
    if (this.tweens.length) more = true;
    return more;
  }

  draw() {
    if (!this.w) return;
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.drawFn(this, this.ctx);
  }

  poly(pts3: number[][], stroke: string | null, width = 1, fill?: string) {
    const c = this.ctx;
    c.beginPath();
    pts3.forEach((p, k) => {
      const s = this.Pr(p[0], p[1], p[2]);
      if (k) c.lineTo(s[0], s[1]);
      else c.moveTo(s[0], s[1]);
    });
    if (fill) {
      c.fillStyle = fill;
      c.closePath();
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.stroke();
    }
  }

  axes(len = 3.2) {
    const c = this.ctx;
    for (const p of [[len, 0, 0], [0, len, 0], [0, 0, len]]) {
      c.strokeStyle = "rgba(150,170,215,.30)";
      c.lineWidth = 1;
      const a = this.Pr(-p[0], -p[1], -p[2]);
      const b = this.Pr(p[0], p[1], p[2]);
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.lineTo(b[0], b[1]);
      c.stroke();
    }
  }
}
