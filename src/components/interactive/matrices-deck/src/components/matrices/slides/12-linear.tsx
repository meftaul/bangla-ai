"use client";

import { useEffect, useRef } from "react";

import { ID, type Mat } from "../lib/math";
import { Plane } from "../lib/plane";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Eyebrow, Notes, Stage } from "../ui";

const LINEAR: Mat = [1.4, 0.7, -0.35, 1.05];
// A bend no matrix can express: the whole point of the right-hand panel.
const WARP = (x: number, y: number) => [
  x + 0.42 * Math.sin(y * 1.15) + 0.12 * x * x * 0.18,
  y + 0.38 * Math.sin(x * 0.95),
];

// The only slide that animates on a timer instead of a click: the two panels
// deform and relax together, forever, so the contrast reads without narration.
export default function LinearSlide() {
  const sec = useRef<HTMLElement>(null);
  const okHost = useRef<HTMLDivElement>(null);
  const noHost = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ok = useSketch(okHost, (host) => new Plane(host, { range: 4.2, basis: true, labels: false }));
  const no = useSketch(noHost, (host) => {
    const p = new Plane(host, { range: 4.2, basis: true, labels: false, gridAlpha: 0.3 });
    p.warp = WARP;
    return p;
  });

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => stop, []);

  useSlideLifecycle(sec, {
    show: () => {
      ok.current?.resize();
      no.current?.resize();
      stop();
      const cycle = () => {
        ok.current?.setMatrix(LINEAR, { dur: 1500 });
        no.current?.setWarp(null, 1, 1500);
        timer.current = setTimeout(() => {
          ok.current?.setMatrix(ID, { dur: 1500 });
          no.current?.setWarp(null, 0, 1500);
          timer.current = setTimeout(cycle, 2400);
        }, 2600);
      };
      timer.current = setTimeout(cycle, 500);
    },
    relayout: () => {
      ok.current?.resize();
      no.current?.resize();
    },
    hide: stop,
  });

  return (
    <section data-id="linear" ref={sec}>
      <div className="wrap">
        <Eyebrow>The one restriction</Eyebrow>
        <h2>
          Matrices can’t do <em>every</em> transformation.
        </h2>
        <div className="cols" style={{ marginTop: ".5rem" }}>
          <div>
            <Stage
              ref={okHost}
              shape="h4"
              badge="✓ linear"
              tone="ok"
              style={{ maxWidth: "31.25cqw", margin: "0 auto" }}
            />
            <p className="note" style={{ marginTop: ".5rem" }}>
              Grid lines stay <span className="k">straight</span>, stay{" "}
              <span className="k">parallel</span>, stay <span className="k">evenly spaced</span>. The
              origin doesn’t budge.
            </p>
          </div>
          <div>
            <Stage
              ref={noHost}
              shape="h4"
              badge="✗ not linear"
              tone="no"
              style={{ maxWidth: "31.25cqw", margin: "0 auto" }}
            />
            <p className="note" style={{ marginTop: ".5rem" }}>
              Bend the grid and no matrix on earth can describe it.{" "}
              <span className="cbad">Out of reach.</span>
            </p>
          </div>
        </div>
        <p className="lead fragment grow-in" style={{ maxWidth: "34em", marginTop: ".7rem" }}>
          That restriction is exactly why deep learning needs something extra later — but it’s also
          what makes matrices <span className="hl">so cheap to compute with</span>.
        </p>
      </div>
      <Notes>
        Callback: “that’s why x + 1 was the odd one out.” Then make the trade explicit — this is the
        intellectual core of the WHY-MATRICES argument: “We gave up ‘any transformation you can
        imagine.’ In exchange we got something infinite squeezed into four numbers — which is the
        only reason it can be STORED, LEARNED, and run on a GPU. Every AI chip on earth exists
        because this operation is so restricted. The restriction isn’t a weakness. It’s the whole
        reason this works.” Then plant the seed: real data does need bending — hold that thought,
        it’s the last slide.
      </Notes>
    </section>
  );
}
