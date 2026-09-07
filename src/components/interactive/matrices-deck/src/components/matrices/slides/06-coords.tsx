"use client";

import { useRef, useState, type ReactNode } from "react";

import { COL, clamp, rgba } from "../lib/math";
import { Space3D } from "../lib/space-3d";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Btn, Btns, Eyebrow, Notes, Panel, Stage } from "../ui";

// Two overlapping clouds in 3D, separated only along the depth axis. Module-level
// and deterministic, so the same arrangement renders on every mount.
const PTS = (() => {
  let s = 424242;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const out: { p: number[]; c: number }[] = [];
  for (let c = 0; c < 2; c++)
    for (let i = 0; i < 85; i++)
      out.push({
        p: [(rnd() - 0.5) * 3.8, (rnd() - 0.5) * 2.3, (c ? -1.15 : 1.15) + (rnd() - 0.5) * 0.45],
        c,
      });
  return out;
})();

/** The 12 edges of the box that frames the clouds. */
const BOX = (() => {
  const h = [2.1, 1.35, 1.7];
  const e: number[][][] = [];
  const pt = (n: number) => [0, 1, 2].map((d) => ((n >> d) & 1 ? h[d] : -h[d]));
  for (let a = 0; a < 8; a++)
    for (let b = a + 1; b < 8; b++) {
      let diff = 0;
      for (let d = 0; d < 3; d++) if (((a >> d) & 1) !== ((b >> d) & 1)) diff++;
      if (diff === 1) e.push([pt(a), pt(b)]);
    }
  return e;
})();

const MIXED = "hopelessly mixed";

export default function CoordsSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<"front" | "side">("front");
  const [note, setNote] = useState<ReactNode>(MIXED);

  const space = useSketch(stage, (host) => {
    const draw = (sp: Space3D, c: CanvasRenderingContext2D) => {
      // yaw is tweened by the buttons rather than spun by the clock.
      sp.yaw = sp.state.yaw || 0;
      for (const [a, b] of BOX) sp.poly([a, b], "rgba(150,170,215,.14)", 1);
      PTS.map((o) => [sp.Pr(o.p[0], o.p[1], o.p[2]), o.c] as const)
        .sort((m, n) => m[0][2] - n[0][2])
        .forEach(([q, cls]) => sp.dot(q[0], q[1], 3.9, rgba(cls ? COL.j : COL.i, 0.92)));
      // Once you've walked far enough round, the straight cut becomes possible.
      const t = clamp(((sp.state.yaw || 0) / (Math.PI / 2) - 0.55) / 0.45, 0, 1);
      if (t > 0.01) {
        c.strokeStyle = rgba(COL.a, 0.85 * t);
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(sp.cx, sp.h * 0.06);
        c.lineTo(sp.cx, sp.h * 0.94);
        c.stroke();
      }
    };
    const sp = new Space3D(host, draw, { range: 3.5, pitch: 0.1, dist: 26, fov: 1.0, spin: 0, yaw: 0 });
    sp.state.yaw = 0;
    sp.spinning = false;
    return sp;
  });

  const click = (key: "front" | "side") => {
    setSel(key);
    const side = key === "side";
    space.current?.tween("yaw", side ? Math.PI / 2 : 0, 2000);
    setNote(
      side ? (
        <>
          <span style={{ color: "var(--mi)" }}>two groups</span> — one straight cut
        </>
      ) : (
        MIXED
      ),
    );
  };

  useSlideLifecycle(sec, {
    show: () => {
      const sp = space.current;
      if (!sp) return;
      sp.resize();
      sp.stop();
      sp.reset({ yaw: 0 });
      setNote(MIXED);
      setSel("front");
      sp.draw();
    },
    relayout: () => space.current?.resize(),
  });

  return (
    <section data-id="coords" ref={sec}>
      <div className="wrap">
        <div className="cols narrow">
          <div className="stack">
            <Eyebrow>Another word for it</Eyebrow>
            <h2>
              The data isn’t wrong.
              <br />
              The <span className="ca">coordinates</span> are.
            </h2>
            <p className="lead">
              Two clusters, hopelessly mixed. Nothing about them changes here — we only walk around
              and look from somewhere else.
            </p>
            <Btns>
              <Btn on={sel === "front"} onClick={() => click("front")}>
                where we stand
              </Btn>
              <Btn on={sel === "side"} onClick={() => click("side")}>
                walk around
              </Btn>
            </Btns>
            <Panel tight>
              <div className="readout">{note}</div>
            </Panel>
            <p className="note fragment grow-in" style={{ maxWidth: "17em" }}>
              And <em>this</em> move — turn, then flatten — is exactly what a{" "}
              <span className="k">matrix</span> does. Which is where the rest of the talk goes.
            </p>
          </div>
          <Stage ref={stage} badge="same data · new view" />
        </div>
      </div>
      <Notes>
        The sculpture analogy: two objects look overlapped and inseparable from where you’re
        standing; take three steps to the side and they’re clearly apart. You changed nothing about
        the objects — you applied a rotation to your viewpoint. A transformation IS a change of
        coordinates, and learning is the search for coordinates in which the problem is easy. Unlike
        the spiral, this one needs no bending at all — rotate and project, both linear. So: what
        exactly is a transformation? Next.
      </Notes>
    </section>
  );
}
