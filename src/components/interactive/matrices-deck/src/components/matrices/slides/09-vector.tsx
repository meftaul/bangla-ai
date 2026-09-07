"use client";

import { useRef } from "react";

import { COL, ID } from "../lib/math";
import { Plane } from "../lib/plane";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Eyebrow, Mat, Notes, Stage } from "../ui";

export default function VectorSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const plane = useSketch(
    stage,
    (host) =>
      new Plane(host, {
        range: 4.2,
        ghost: false,
        basis: true,
        labels: true,
        vecs: [{ v: [3, 2], color: COL.v, label: "(3, 2)" }],
        pts: [{ v: [3, 2], r: 5, color: COL.v }],
      }),
  );

  useSlideLifecycle(sec, {
    show: () => {
      plane.current?.resize();
      plane.current?.setMatrix(ID, { animate: false });
    },
  });

  return (
    <section data-id="vector" ref={sec}>
      <div className="wrap">
        <div className="cols r">
          <div className="stack">
            <Eyebrow>Step 3 · Bigger inputs</Eyebrow>
            <h2>Real data isn’t one number.</h2>
            <p className="lead">
              A price, a pixel, a word, a customer — none of them fit on a line. They need{" "}
              <span className="k">several numbers at once</span>.
            </p>
            <p className="lead fragment grow-in">
              That list of numbers is a <span className="cv">vector</span>. And a vector is three
              things at the same time:
            </p>
            <ul className="fragment grow-in" style={{ fontSize: ".72em" }}>
              <li>
                a <span className="k">list</span> &nbsp;
                <Mat cols={1} size="sm">
                  <span>3</span>
                  <span>2</span>
                </Mat>
              </li>
              <li>
                a <span className="k">point</span> in space
              </li>
              <li>
                an <span className="k">arrow</span> from the origin
              </li>
            </ul>
          </div>
          <Stage ref={stage} badge="ℝ²" />
        </div>
      </div>
      <Notes>
        “A price fits on a line. A customer doesn’t. A photo doesn’t.” The “three things at once”
        framing is doing real work — the list view is how you store it, the arrow view is how you
        reason about it. Land the scale line, it always gets a reaction: a 28×28 image is 784
        numbers, so it is a single POINT in 784-dimensional space. Every photo you’ve ever taken is
        one dot in an unimaginably large room — and deep learning is the study of how those dots are
        arranged, and how to rearrange them.
      </Notes>
    </section>
  );
}
