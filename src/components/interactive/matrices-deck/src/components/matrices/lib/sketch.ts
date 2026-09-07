import { clamp } from "./math";

// Canvas base class — owns sizing, DPR and the animation loop. Subclasses
// implement `step()` (advance state, return true to keep animating) and `draw()`.
//
// Ported from the standalone deck with two changes for React:
//   1. `destroy()` — React 19 StrictMode double-invokes effects in dev, so every
//      sketch must be tearable-down (matches the repo's reveal/Excalidraw pattern).
//   2. The device-pixel-ratio boost used to read `Reveal.getScale()` off a global.
//      We derive the same number from the element itself: reveal scales `.slides`
//      with a CSS transform, so getBoundingClientRect (visual px) divided by
//      offsetWidth (layout px) *is* the scale.
export class Sketch {
  host: HTMLElement;
  cv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w = 0;
  h = 0;
  raf: number | null = null;
  /** Endless-loop flag, driven by start()/stop() — read by subclasses in step(). */
  spinning?: boolean;
  protected _ready = false;
  private _dead = false;
  private _ro: ResizeObserver | null = null;

  constructor(host: HTMLElement) {
    this.host = host;
    this.cv = document.createElement("canvas");
    host.appendChild(this.cv);
    this.ctx = this.cv.getContext("2d")!;
    this.resize();
    this._ready = true; // subclass fields don't exist during the first resize()
    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(host);
    }
  }

  resize() {
    if (this._dead) return;
    const r = this.host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // reveal's deck scale, without needing the Reveal instance (see class note).
    const scale = this.host.offsetWidth ? r.width / this.host.offsetWidth : 1;
    const dpr = clamp((window.devicePixelRatio || 1) * Math.max(scale, 1), 1, 3);
    this.w = r.width;
    this.h = r.height;
    this.cv.width = Math.round(r.width * dpr);
    this.cv.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this._ready) return; // the constructor finishes the first paint itself
    this.onResize();
    this.draw();
  }

  kick() {
    if (this._dead || this.raf) return;
    this.raf = requestAnimationFrame((t) => this._frame(t));
  }

  private _frame(now: number) {
    this.raf = null;
    if (this._dead) return;
    const more = this.step(now);
    this.draw();
    if (more) this.kick();
  }

  /**
   * Resume an endless loop. Slides call this from `show` rather than assigning
   * `spinning`: the sketch is owned by a ref from useSketch(), and React's
   * immutability lint (rightly) forbids writing fields through a hook's value.
   */
  start() {
    this.spinning = true;
    this.kick();
  }

  /** Pause an endless loop without tearing the sketch down. */
  stop() {
    this.spinning = false;
  }

  destroy() {
    this._dead = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this._ro?.disconnect();
    this.cv.remove();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  step(now: number): boolean {
    return false;
  }
  onResize() {}
  draw() {}

  // ---- shared drawing primitives -------------------------------------------
  arrow(p0: number[], p1: number[], color: string, w = 3.2) {
    const c = this.ctx;
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy);
    if (len < 1.5) return;
    const ux = dx / len;
    const uy = dy / len;
    const head = Math.min(15, len * 0.4);
    c.strokeStyle = color;
    c.lineWidth = w;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(p0[0], p0[1]);
    c.lineTo(p1[0] - ux * head * 0.85, p1[1] - uy * head * 0.85);
    c.stroke();
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(p1[0], p1[1]);
    c.lineTo(p1[0] - ux * head - uy * head * 0.45, p1[1] - uy * head + ux * head * 0.45);
    c.lineTo(p1[0] - ux * head + uy * head * 0.45, p1[1] - uy * head - ux * head * 0.45);
    c.closePath();
    c.fill();
  }

  label(text: string, x: number, y: number, color: string, size = 15, weight = 600) {
    const c = this.ctx;
    c.font = `${weight} ${size}px 'JetBrains Mono', monospace`;
    c.fillStyle = color;
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }

  dot(x: number, y: number, r: number, color: string) {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
}
