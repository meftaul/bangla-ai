"use client";

import { useRef, useState } from "react";

import { COL } from "../lib/math";
import { Space3D } from "../lib/space-3d";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Btn, Btns, Eyebrow, Mat, Notes, Stage } from "../ui";

/** The 3×2 matrix printed on the slide — keep the two in sync. */
const A = [
  [1, 0],
  [0, 1],
  [0.7, -0.5],
];
const E = 0.85;
const N = 2;
const EXT = E * N;
const STEP = 0.45;
const FLOOR = 3.0;

// Screen convention: X = out₁ (right), Y = out₃ (UP), Z = out₂ (depth).
// The third output dimension is the vertical one, so "lifting" is literally upward.
const map = (u: number, v: number, k: number) => [
  A[0][0] * u + A[0][1] * v,
  (A[2][0] * u + A[2][1] * v) * k,
  A[1][0] * u + A[1][1] * v,
];

function draw(s: Space3D) {
  const k = s.state.k || 0; // 0 = flat on the floor, 1 = lifted
  // The floor: where the plane started, kept as a reference.
  for (let n = -3; n <= 3; n++) {
    const i = n * (FLOOR / 3);
    s.poly([[i, 0, -FLOOR], [i, 0, FLOOR]], "rgba(150,170,215,.12)", 1);
    s.poly([[-FLOOR, 0, i], [FLOOR, 0, i]], "rgba(150,170,215,.12)", 1);
  }
  s.poly([[0, -2.6, 0], [0, 2.6, 0]], "rgba(150,170,215,.20)", 1);
  // The sheet as a filled surface, so it reads as one object.
  s.poly(
    [map(-EXT, -EXT, k), map(EXT, -EXT, k), map(EXT, EXT, k), map(-EXT, EXT, k)],
    null,
    0,
    "rgba(129,140,248,.11)",
  );
  for (let n = -N; n <= N; n++) {
    const i = n * E;
    const hot = n === 0;
    const l1: number[][] = [];
    const l2: number[][] = [];
    for (let t = -EXT; t <= EXT + 1e-9; t += STEP) {
      l1.push(map(i, t, k));
      l2.push(map(t, i, k));
    }
    s.poly(l1, hot ? COL.j : "rgba(170,195,240,.34)", hot ? 2.2 : 1.1);
    s.poly(l2, hot ? COL.i : "rgba(170,195,240,.34)", hot ? 2.2 : 1.1);
  }
  // The two columns, as arrows — the whole point of the picture.
  const o = s.Pr(0, 0, 0);
  const c1 = map(1, 0, k);
  const c2 = map(0, 1, k);
  const p1 = s.Pr(c1[0], c1[1], c1[2]);
  const p2 = s.Pr(c2[0], c2[1], c2[2]);
  s.arrow(o, p1, COL.i, 3.2);
  s.arrow(o, p2, COL.j, 3.2);
  s.label("col 1", p1[0] + 9, p1[1] + 8, COL.i, 13);
  s.label("col 2", p2[0] + 9, p2[1] + 8, COL.j, 13);
}

export default function LiftSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<"go" | "flat" | null>(null);

  const space = useSketch(stage, (host) => {
    const sp = new Space3D(host, draw, { range: 4.0, pitch: 0.5 });
    sp.state.k = 0;
    return sp;
  });

  useSlideLifecycle(sec, {
    show: () => {
      const sp = space.current;
      if (!sp) return;
      sp.resize();
      sp.reset({ k: 0 });
      setSel(null);
      sp.start();
    },
    relayout: () => space.current?.resize(),
    hide: () => space.current?.stop(),
  });

  return (
    <section data-id="lift" ref={sec}>
      <div className="wrap">
        <div className="cols narrow">
          <div className="stack">
            <Eyebrow>3 × 2 &nbsp;·&nbsp; ℝ² → ℝ³</Eyebrow>
            <h2>Lifting into more room.</h2>
            <p className="lead">
              Two columns, three numbers each. The flat plane gets carried up into 3D space and
              tilted.
            </p>
            <Mat cols={2}>
              <span className="col1">1</span>
              <span className="col2">0</span>
              <span className="col1">0</span>
              <span className="col2">1</span>
              <span className="col1">.7</span>
              <span className="col2">−.5</span>
            </Mat>
            <Btns>
              <Btn
                on={sel === "go"}
                onClick={() => {
                  setSel("go");
                  space.current?.tween("k", 1, 1400);
                }}
              >
                lift it
              </Btn>
              <Btn
                on={sel === "flat"}
                onClick={() => {
                  setSel("flat");
                  space.current?.tween("k", 0, 1400);
                }}
              >
                flatten
              </Btn>
            </Btns>
            <p className="note fragment grow-in" style={{ maxWidth: "17em" }}>
              But look closely — the result is still a <span className="k">flat sheet</span>. More
              room to move, <span className="hl">no new information</span>. Only 2 dimensions’ worth
              of stuff is in there.
            </p>
          </div>
          <Stage ref={stage} badge="ℝ³" />
        </div>
      </div>
      <Notes>
        Kills a very common misconception. Hit “lift it”, then point at what it still is: “it went up
        into 3D — but look, it’s still a FLAT SHEET. More room to move around in. Zero new
        information. A linear map cannot invent a dimension out of nothing.” Then answer the obvious
        follow-up: so why widen layers at all? Not to add information — to give the NEXT step more
        room to work in. Width is elbow room for the bending to come.
      </Notes>
    </section>
  );
}
