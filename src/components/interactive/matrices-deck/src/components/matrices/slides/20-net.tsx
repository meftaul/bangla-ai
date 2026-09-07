"use client";

import { useRef } from "react";

import { COL } from "../lib/math";
import { Sketch } from "../lib/sketch";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Eyebrow, Notes, Stage } from "../ui";

const LAYERS = [
  { n: 12, label: "784", sub: "pixels", color: COL.i },
  { n: 9, label: "128", sub: "hidden", color: COL.a },
  { n: 10, label: "10", sub: "digits", color: COL.j },
];
const WEIGHTS = ["W₁  128×784", "W₂  10×128"];

// The only sketch that is pure decoration: a three-layer MNIST network with a
// signal pulse travelling along the edges. Node counts are illustrative, the
// labels are the real numbers.
class NetSketch extends Sketch {
  t = 0;
  private t0: number | null = null;

  constructor(host: HTMLElement) {
    super(host);
    this.spinning = true;
    this.draw();
  }

  step(now: number) {
    if (this.t0 == null) this.t0 = now;
    this.t = now - this.t0;
    // Honour stop(); the standalone deck's version returned an unconditional true,
    // so this pulse kept running for the whole talk after its slide had gone by.
    return this.spinning !== false;
  }

  draw() {
    const c = this.ctx;
    if (!this.w) return;
    c.clearRect(0, 0, this.w, this.h);
    const padY = 44;
    const H = this.h - padY * 2;
    const xs = LAYERS.map((_, k) => this.w * (0.18 + 0.32 * k));
    const pos = LAYERS.map((L, k) => {
      const gap = H / (L.n - 1);
      return Array.from({ length: L.n }, (_, i) => [xs[k], padY + i * gap]);
    });

    for (let k = 0; k < LAYERS.length - 1; k++) {
      for (const a of pos[k])
        for (const b of pos[k + 1]) {
          const phase = (this.t / 1400 + (a[1] + b[1]) / (this.h * 3)) % 1;
          c.strokeStyle = `rgba(129,140,248,${0.045 + 0.09 * Math.max(0, Math.sin(phase * Math.PI))})`;
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(a[0], a[1]);
          c.lineTo(b[0], b[1]);
          c.stroke();
        }
    }

    LAYERS.forEach((L, k) => {
      pos[k].forEach((p, i) => {
        const pulse = 0.5 + 0.5 * Math.sin(this.t / 620 + i * 0.5 + k * 1.3);
        c.shadowColor = L.color;
        c.shadowBlur = 6 + 8 * pulse;
        this.dot(p[0], p[1], 5, L.color);
        c.shadowBlur = 0;
      });
      c.font = "600 17px 'JetBrains Mono', monospace";
      c.fillStyle = L.color;
      c.textAlign = "center";
      c.textBaseline = "top";
      c.fillText(L.label, xs[k], this.h - 30);
      c.font = "400 12px 'Inter', sans-serif";
      c.fillStyle = "rgba(140,150,175,.8)";
      c.fillText(L.sub, xs[k], this.h - 12);
    });

    for (let k = 0; k < WEIGHTS.length; k++) {
      c.font = "600 14px 'JetBrains Mono', monospace";
      c.fillStyle = "rgba(233,237,247,.9)";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(WEIGHTS[k], (xs[k] + xs[k + 1]) / 2, 18);
    }
  }
}

export default function NetSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const net = useSketch(stage, (host) => new NetSketch(host));

  useSlideLifecycle(sec, {
    show: () => {
      net.current?.resize();
      net.current?.start();
    },
    hide: () => net.current?.stop(),
  });

  return (
    <section data-id="net" ref={sec}>
      <div className="wrap">
        <Eyebrow>Bringing it home</Eyebrow>
        <h2>
          A layer <em>is</em> a matrix.
        </h2>
        <Stage ref={stage} shape="bare" style={{ height: "23.44cqw", margin: ".3rem 0 .6rem" }} />
        <div className="cols" style={{ fontSize: ".68em" }}>
          <ul>
            <li className="fragment grow-in">
              784 pixels → a point in <span className="mono">ℝ⁷⁸⁴</span>.
            </li>
            <li className="fragment grow-in">
              <span className="mono">W₁</span> is <span className="mono">128×784</span> — squash to a
              space where the useful structure is easier to see.
            </li>
          </ul>
          <ul>
            <li className="fragment grow-in">
              <span className="mono">W₂</span> is <span className="mono">10×128</span> — squash
              again, one output dimension per digit.
            </li>
            <li className="fragment grow-in">
              Training tunes <span className="ca">100,000+ numbers</span> — which is just:{" "}
              <span className="k">where should each input direction land?</span>
            </li>
          </ul>
        </div>
        <p className="lead fragment grow-in" style={{ maxWidth: "34em", marginTop: ".8rem" }}>
          And the goal of all that moving? <span className="hl">Un-crumple the paper</span> —
          rearrange the dots until the dumbest possible classifier, a straight cut, gets it right.
        </p>
      </div>
      <Notes>
        ★ THE PAYOFF — cash in every cheque you wrote. Walk the path: 784 pixels are one point in
        R^784; W1 moves it; W2 moves it again; the last step is whichever dimension is biggest — a
        straight cut. Then say the numbers OUT LOUD: W1 has 100,352 weights, W2 has 1,280. “Training
        means finding good values for a hundred thousand numbers — and every one of them is one
        coordinate of one landing spot. Training is a single question asked a hundred thousand times:
        where should this input direction land?” Then close the loop from the start of the talk: and
        the goal of all that moving is to un-crumple the paper until the dumbest possible classifier
        gets the right answer.
      </Notes>
    </section>
  );
}
