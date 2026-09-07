"use client";

import { Fragment, useEffect, useRef, useState } from "react";

import { fmt, ID, matEq, type Mat } from "../lib/math";
import { Plane } from "../lib/plane";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Eyebrow, Mat2, Notes, Panel, Stage } from "../ui";

const NAMES = ["a", "b", "c", "d"];
/** The matrix the slide drifts into on arrival, so the first thing seen is motion. */
const OPENING: Mat = [1.2, 0.9, -0.5, 1.1];

// The intellectual core of the deck. The Plane is the single source of truth for
// the matrix — sliders write into it, and its per-frame callback writes back out,
// so a dragged slider and an animated transition update the readouts identically.
export default function ColumnsSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [M, setM] = useState<Mat>(ID);

  const plane = useSketch(stage, (host) => {
    const p = new Plane(host, { range: 4.6, square: true });
    p.onFrame = (m) => setM((prev) => (matEq(prev, m) ? prev : m.slice()));
    return p;
  });

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const setAt = (k: number, v: number) => {
    const next = M.slice();
    next[k] = v;
    plane.current?.setMatrix(next, { animate: false });
  };

  useSlideLifecycle(sec, {
    show: () => {
      stop();
      plane.current?.resize();
      plane.current?.setMatrix(ID, { animate: false });
      timer.current = setTimeout(() => plane.current?.setMatrix(OPENING, { dur: 1400 }), 600);
    },
    relayout: () => plane.current?.resize(),
    hide: stop,
  });

  return (
    <section data-id="columns" ref={sec}>
      <div className="wrap">
        <div className="cols narrow">
          <div className="stack">
            <Eyebrow>How to read a matrix</Eyebrow>
            <h2>
              The columns tell you
              <br />
              everything.
            </h2>
            <p className="lead">
              Track just two arrows: <span className="ci">î = (1,0)</span> and{" "}
              <span className="cj">ĵ = (0,1)</span>. Wherever <em>they</em> land is literally the
              columns of the matrix.
            </p>
            <Panel tight>
              <div className="sliders">
                {NAMES.map((name, k) => (
                  <Fragment key={name}>
                    <label htmlFor={`col-${name}`}>{name}</label>
                    <input
                      id={`col-${name}`}
                      type="range"
                      min={-2.5}
                      max={2.5}
                      step={0.05}
                      value={M[k]}
                      onChange={(e) => setAt(k, parseFloat(e.target.value))}
                    />
                    <span className="val">{fmt(M[k])}</span>
                  </Fragment>
                ))}
              </div>
            </Panel>
            <div className="row" style={{ gap: "1.2rem" }}>
              <Mat2 M={M} size="lg" />
              <div className="readout">
                <div>
                  <span className="ci">î</span> → <b>({fmt(M[0])}, {fmt(M[2])})</b>
                </div>
                <div>
                  <span className="cj">ĵ</span> → <b>({fmt(M[1])}, {fmt(M[3])})</b>
                </div>
              </div>
            </div>
          </div>
          <Stage ref={stage} />
        </div>
      </div>
      <Notes>
        ★ THE INTELLECTUAL CORE. Drag the sliders live, then stop and say why it’s profound: “Look
        what just happened. I told you where TWO ARROWS go — and the fate of every point in the
        infinite plane was decided. A transformation is honestly an infinite object; it has to say
        where every one of infinitely many points goes. Linearity compresses that into four numbers.
        That compression is the only reason a transformation can live inside a computer, and the
        only reason it can be learned.” Punchline: you never memorise matrix multiplication — you
        READ THE COLUMNS AS LANDING SPOTS. Then connect it now, don’t wait: “a weight in a neural
        network is one coordinate of one landing spot.”
      </Notes>
    </section>
  );
}
