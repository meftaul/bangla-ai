"use client";

import { useRef, useState } from "react";

import { COL, lerp } from "../lib/math";
import { Space3D } from "../lib/space-3d";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Btn, Btns, Eyebrow, Mat, Notes, Stage } from "../ui";

/** The 2×3 matrix printed on the slide — keep the two in sync. */
const B = [
  [1, 0, 0.4],
  [0, 1, 0.3],
];
const R = 1.2;

const PTS: number[][] = [];
for (let x = -1; x <= 1; x++)
  for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) PTS.push([x * R, y * R, z * R]);

// B's null space is spanned by (-.4,-.3,1): two points differing by a multiple of
// it are genuinely indistinguishable after projection. These are that pair.
const HOT = [
  [-0.4, 0.95, -1.3],
  [-1.2, 0.35, 0.7],
];

// Screen convention: X = x, Y = z (UP), Z = y (depth); projecting drops the
// height to zero, so the cloud visibly falls onto the floor.
const D = (p: number[], k: number) => {
  const u = B[0][0] * p[0] + B[0][1] * p[1] + B[0][2] * p[2];
  const v = B[1][0] * p[0] + B[1][1] * p[1] + B[1][2] * p[2];
  return [lerp(p[0], u, k), lerp(p[2], 0, k), lerp(p[1], v, k)];
};

const CUBE = (() => {
  const lo = [-R, -R, -R];
  const hi = [R, R, R];
  const edges: number[][][] = [];
  const pt = (n: number) => [0, 1, 2].map((d) => ((n >> d) & 1 ? hi[d] : lo[d]));
  for (let a = 0; a < 8; a++)
    for (let b = a + 1; b < 8; b++) {
      let diff = 0;
      for (let d = 0; d < 3; d++) if (((a >> d) & 1) !== ((b >> d) & 1)) diff++;
      if (diff === 1) edges.push([pt(a), pt(b)]);
    }
  return edges;
})();

function draw(s: Space3D, c: CanvasRenderingContext2D) {
  const k = s.state.k || 0;
  // The target plane — the floor everything lands on.
  for (let i = -2; i <= 2; i++) {
    const a = `rgba(129,140,248,${0.09 + 0.17 * k})`;
    s.poly([[i, 0, -2], [i, 0, 2]], a, 1);
    s.poly([[-2, 0, i], [2, 0, i]], a, 1);
  }
  for (const [a, b] of CUBE) s.poly([D(a, k), D(b, k)], "rgba(160,185,235,.20)", 1);
  // Points, painted back to front.
  PTS.map((p) => {
    const q = D(p, k);
    return s.Pr(q[0], q[1], q[2]);
  })
    .sort((m, n) => m[2] - n[2])
    .forEach((q) => s.dot(q[0], q[1], 3.6, "rgba(200,215,245,.5)"));
  // The pair that collides.
  const h = HOT.map((p) => {
    const q = D(p, k);
    return s.Pr(q[0], q[1], q[2]);
  });
  if (k < 0.97) s.poly([D(HOT[0], k), D(HOT[1], k)], `rgba(251,191,36,${0.45 * (1 - k)})`, 1.4);
  for (const q of h) {
    c.shadowColor = COL.v;
    c.shadowBlur = 14;
    s.dot(q[0], q[1], 6.5, COL.v);
    c.shadowBlur = 0;
  }
  if (k > 0.8) {
    c.globalAlpha = Math.min(1, (k - 0.8) * 5);
    s.label("two points, one spot", h[0][0] + 14, h[0][1] - 4, COL.v, 13);
    c.globalAlpha = 1;
  }
}

export default function SquashSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<"go" | "reset" | null>(null);

  const space = useSketch(stage, (host) => {
    const sp = new Space3D(host, draw, { range: 3.4, pitch: 0.5 });
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
    <section data-id="squash" ref={sec}>
      <div className="wrap">
        <div className="cols narrow">
          <div className="stack">
            <Eyebrow>2 × 3 &nbsp;·&nbsp; ℝ³ → ℝ²</Eyebrow>
            <h2>Squashing down.</h2>
            <p className="lead">
              Three columns, two numbers each. A whole 3D cloud gets pressed flat onto a plane — like
              a shadow.
            </p>
            <Mat cols={3}>
              <span className="col1">1</span>
              <span className="col2">0</span>
              <span className="col3">.4</span>
              <span className="col1">0</span>
              <span className="col2">1</span>
              <span className="col3">.3</span>
            </Mat>
            <Btns>
              <Btn
                on={sel === "go"}
                onClick={() => {
                  setSel("go");
                  space.current?.tween("k", 1, 1500);
                }}
              >
                project
              </Btn>
              <Btn
                on={sel === "reset"}
                onClick={() => {
                  setSel("reset");
                  space.current?.tween("k", 0, 1500);
                }}
              >
                restore
              </Btn>
            </Btns>
            <p className="note fragment grow-in" style={{ maxWidth: "17em" }}>
              Two <span className="cv">different points</span> can land on the exact same spot.
              That’s <span className="k">information loss</span> — and it’s the same thing{" "}
              <span className="cbad">det = 0</span> was telling us.
            </p>
          </div>
          <Stage ref={stage} badge="ℝ³ → ℝ²" />
        </div>
      </div>
      <Notes>
        Point at the two amber dots merging: “two genuinely different inputs just landed on the same
        spot — that’s information loss, and it’s the same thing det = 0 was telling us.” Then reframe
        loss as the actual GOAL: squeezing 784 pixels into 128 numbers is throwing information away
        on purpose. Keep what matters for the question, discard the rest. Compression toward
        relevance isn’t a side effect of learning — it IS learning.
      </Notes>
    </section>
  );
}
