"use client";

import { useRef } from "react";

import { Plane } from "../lib/plane";
import type { Mat } from "../lib/math";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Eyebrow, Notes, Stage } from "../ui";

// A slow, never-repeating wobble of the plane, sitting behind the title at 50%
// opacity. It is the deck's thesis stated before a single word: space, moving.
const WOBBLE = (now: number): Mat => {
  const t = now / 1000;
  return [
    1 + 0.28 * Math.sin(t * 0.31),
    0.38 * Math.sin(t * 0.23 + 1.1),
    0.3 * Math.sin(t * 0.19 + 2.3),
    1 + 0.24 * Math.cos(t * 0.27),
  ];
};

export default function TitleSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const plane = useSketch(stage, (host) => {
    const p = new Plane(host, { range: 7, ghost: false, basis: false, labels: false, gridAlpha: 0.22 });
    p.setLoop(WOBBLE);
    return p;
  });

  useSlideLifecycle(sec, {
    show: () => {
      const p = plane.current;
      if (!p) return;
      p.resize();
      p.setLoop(WOBBLE);
    },
    // The standalone deck let this loop run for the whole talk. Nothing is visible
    // off-slide, so stop it — 23 other slides don't need to share the frame budget.
    hide: () => plane.current?.stopLoop(),
    relayout: () => plane.current?.resize(),
  });

  return (
    <section data-id="title" ref={sec}>
      <Stage ref={stage} shape="bare" className="bgstage" />
      <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
        <Eyebrow>Part I · The Building Block</Eyebrow>
        <h1>
          Matrices are
          <br />
          Transformers.
        </h1>
        <p className="lead" style={{ maxWidth: "26em", marginTop: ".4em" }}>
          The mathematical intuition behind deep learning — starting from the one idea everything
          else is built on: a matrix is a{" "}
          <span className="hl">function that moves space</span>.
        </p>
        <p className="tiny" style={{ marginTop: "2.2em" }}>
          Press <kbd>→</kbd> to begin &nbsp;·&nbsp; <kbd>S</kbd> for speaker notes
        </p>
      </div>
      <Notes>
        Open with: “everyone here has multiplied matrices. Almost nobody was told what one IS. Today
        we fix that — and it turns out to be the single idea deep learning is built on.” Most people
        meet matrices as “a grid of numbers you multiply in a weird way.” That definition explains
        nothing. Today we replace it with a picture.
      </Notes>
    </section>
  );
}
