"use client";

import { useEffect, useRef, useState } from "react";

import { ID, type Mat } from "../lib/math";
import { Plane } from "../lib/plane";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Btn, Btns, Eyebrow, Notes, Stage } from "../ui";

const W: Mat = [1.15, 0.8, -0.35, 1.05];
const B = [1.5, -1.1];

export default function BiasSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sel, setSel] = useState<"w" | "wb">("w");

  const plane = useSketch(stage, (host) => new Plane(host, { range: 4.6, square: true }));

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  useSlideLifecycle(sec, {
    show: () => {
      const p = plane.current;
      if (!p) return;
      p.resize();
      stop();
      p.setOff([0, 0], 0);
      p.setMatrix(ID, { animate: false });
      setSel("w");
      timer.current = setTimeout(() => p.setMatrix(W, { dur: 1300 }), 500);
    },
    relayout: () => plane.current?.resize(),
    hide: stop,
  });

  return (
    <section data-id="bias" ref={sec}>
      <div className="wrap">
        <div className="cols narrow">
          <div className="stack">
            <Eyebrow>Appendix · if someone asks</Eyebrow>
            <h2>
              “But the origin
              <br />
              can’t move.”
            </h2>
            <p className="lead">
              Correct — and it’s the <span className="mono">f(x) = x + 1</span> case from earlier. A
              pure matrix always pins the origin. Sliding is the one thing it cannot do.
            </p>
            <Btns>
              <Btn
                on={sel === "w"}
                onClick={() => {
                  setSel("w");
                  plane.current?.setOff([0, 0], 1100);
                }}
              >
                W · x
              </Btn>
              <Btn
                on={sel === "wb"}
                onClick={() => {
                  setSel("wb");
                  plane.current?.setOff(B, 1100);
                }}
              >
                W · x + b
              </Btn>
            </Btns>
            <p className="note" style={{ maxWidth: "17em" }}>
              <span className="ca">Matrix</span> = rotate, stretch, shear.{" "}
              <span className="cv">Bias</span> = the slide afterwards. Together they’re called an{" "}
              <span className="k">affine</span> map — and that’s what a real layer is.
            </p>
          </div>
          <Stage ref={stage} />
        </div>
      </div>
      <Notes>
        Every real layer is Wx + b. The matrix does everything except translation; b supplies exactly
        that. Also worth saying: b is learned too, but it’s n numbers against n×m — almost all the
        learning still lives in W.
      </Notes>
    </section>
  );
}
