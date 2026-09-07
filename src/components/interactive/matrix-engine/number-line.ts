import { clamp, ease, fmt, lerp } from "./math";
import { Sketch } from "./sketch";

// Points on ℝ moving under f — the "a function moves every point at once" slide.
// Travel arcs fade in during the motion so the eye follows where each point went.
export class NumberLine extends Sketch {
  src = [-3, -2, -1, 0, 1, 2, 3];
  cur = this.src.slice();
  prev = this.src.slice();
  target = this.src.slice();
  anim: { t0: number; dur: number } | null = null;
  trail = 0;
  range = 5;
  px = 1;
  cx = 0;
  cy = 0;

  constructor(host: HTMLElement) {
    super(host);
    this.onResize();
    this.draw();
  }

  onResize() {
    this.range = 5;
    this.px = (this.w * 0.88) / (2 * this.range);
    this.cx = this.w / 2;
    this.cy = this.h * 0.66;
  }

  X(v: number) {
    return this.cx + v * this.px;
  }

  apply(f: (x: number) => number, dur = 950) {
    this.prev = this.cur.slice();
    this.target = this.src.map(f);
    this.anim = { t0: performance.now(), dur };
    this.kick();
  }

  step(now: number) {
    if (!this.anim) return false;
    const p = clamp((now - this.anim.t0) / this.anim.dur, 0, 1);
    const e = ease(p);
    this.cur = this.prev.map((v, k) => lerp(v, this.target[k], e));
    this.trail = Math.sin(p * Math.PI);
    if (p >= 1) {
      this.anim = null;
      this.trail = 0;
      return false;
    }
    return true;
  }

  draw() {
    const c = this.ctx;
    if (!this.w) return;
    c.clearRect(0, 0, this.w, this.h);
    const y = this.cy;

    // axis + ticks
    c.strokeStyle = "rgba(160,185,235,.28)";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(this.X(-this.range), y);
    c.lineTo(this.X(this.range), y);
    c.stroke();
    for (let k = -this.range; k <= this.range; k++) {
      const x = this.X(k);
      c.strokeStyle = `rgba(160,185,235,${k === 0 ? 0.55 : 0.22})`;
      c.lineWidth = k === 0 ? 1.6 : 1;
      c.beginPath();
      c.moveTo(x, y - 7);
      c.lineTo(x, y + 7);
      c.stroke();
      c.font = "400 13px 'JetBrains Mono', monospace";
      c.fillStyle = "rgba(140,150,175,.75)";
      c.textAlign = "center";
      c.textBaseline = "top";
      c.fillText(String(k), x, y + 14);
    }

    // travel arcs
    if (this.trail > 0.01) {
      c.lineWidth = 1.6;
      for (let k = 0; k < this.src.length; k++) {
        const x0 = this.X(this.src[k]);
        const x1 = this.X(this.cur[k]);
        if (Math.abs(x1 - x0) < 2) continue;
        c.strokeStyle = `rgba(129,140,248,${0.45 * this.trail})`;
        c.beginPath();
        c.moveTo(x0, y - 10);
        c.quadraticCurveTo((x0 + x1) / 2, y - 62 - Math.abs(x1 - x0) * 0.09, x1, y - 10);
        c.stroke();
      }
    }

    // ghosts of the original positions
    for (const v of this.src) this.dot(this.X(v), y, 3.5, "rgba(150,170,215,.28)");

    // live points, teal -> indigo -> pink across the line
    for (let k = 0; k < this.cur.length; k++) {
      const x = this.X(this.cur[k]);
      const hue = k / (this.cur.length - 1);
      const col =
        hue < 0.5
          ? `rgb(${Math.round(lerp(45, 129, hue * 2))},${Math.round(lerp(212, 140, hue * 2))},${Math.round(lerp(191, 248, hue * 2))})`
          : `rgb(${Math.round(lerp(129, 244, (hue - 0.5) * 2))},${Math.round(lerp(140, 114, (hue - 0.5) * 2))},${Math.round(lerp(248, 182, (hue - 0.5) * 2))})`;
      c.shadowColor = col;
      c.shadowBlur = 12;
      this.dot(x, y, 7, col);
      c.shadowBlur = 0;
      c.font = "600 13px 'JetBrains Mono', monospace";
      c.fillStyle = col;
      c.textAlign = "center";
      c.textBaseline = "bottom";
      c.fillText(fmt(this.cur[k], Math.abs(this.cur[k] % 1) > 0.001 ? 1 : 0), x, y - 16);
    }
  }
}
