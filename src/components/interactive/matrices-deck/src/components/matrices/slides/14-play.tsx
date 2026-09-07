"use client";

import { useRef, useState } from "react";

import { ID, matEq, mul, rot, type Mat } from "../lib/math";
import { Plane } from "../lib/plane";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Btn, Btns, Eyebrow, Mat2, Notes, Panel, Stage } from "../ui";

type Preset = {
  key: string;
  label: string;
  M: Mat;
  name: string;
  desc: string;
  /** Rotation must travel along the arc, not lerp through a squashed middle. */
  path?: (e: number, from: Mat) => Mat;
};

const PRESETS: Preset[] = [
  { key: "id", label: "identity", M: ID, name: "identity", desc: "nothing moves" },
  {
    key: "rot",
    label: "rotate 90°",
    M: [0, -1, 1, 0],
    name: "rotation",
    desc: "turn, keep all lengths",
    path: (e, from) => mul(rot((e * Math.PI) / 2), from),
  },
  { key: "scale", label: "scale ×1.8", M: [1.8, 0, 0, 1.8], name: "scaling", desc: "everything gets bigger" },
  { key: "shear", label: "shear", M: [1, 1.1, 0, 1], name: "shear", desc: "slide, tilt, keep area" },
  { key: "flip", label: "reflect", M: [1, 0, 0, -1], name: "reflection", desc: "mirror — orientation flips" },
  { key: "squash", label: "collapse", M: [1, 0.5, 2, 1], name: "collapse", desc: "the plane becomes a line" },
];

export default function PlaySlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState("id");
  const [M, setM] = useState<Mat>(ID);

  const plane = useSketch(stage, (host) => {
    const p = new Plane(host, { range: 4.6, square: true });
    p.onFrame = (m) => setM((prev) => (matEq(prev, m) ? prev : m.slice()));
    return p;
  });

  const click = (preset: Preset) => {
    const p = plane.current;
    if (!p) return;
    setSel(preset.key);
    if (preset.path) {
      // Compose onto the live matrix so repeated clicks keep turning.
      p.setMatrix(mul(rot(Math.PI / 2), p.M), { dur: 1300, animate: true, path: preset.path });
    } else {
      p.setMatrix(preset.M, { dur: 1300 });
    }
  };

  useSlideLifecycle(sec, {
    show: () => {
      plane.current?.resize();
      plane.current?.setMatrix(ID, { animate: false });
      setSel("id");
    },
    relayout: () => plane.current?.resize(),
  });

  const current = PRESETS.find((p) => p.key === sel) ?? PRESETS[0];

  return (
    <section data-id="play" ref={sec}>
      <div className="wrap">
        <div className="cols narrow">
          <div className="stack">
            <Eyebrow>Vocabulary</Eyebrow>
            <h2>
              Every matrix has a
              <br />
              personality.
            </h2>
            <p className="lead">Four numbers, wildly different behaviours. Click through them.</p>
            <Btns>
              {PRESETS.map((p) => (
                <Btn key={p.key} on={sel === p.key} onClick={() => click(p)}>
                  {p.label}
                </Btn>
              ))}
            </Btns>
            <Panel tight className="row" style={{ gap: "1rem", justifyContent: "space-between" }}>
              <Mat2 M={M} />
              <div className="readout">
                <div style={{ color: "var(--mink)", fontWeight: 600 }}>{current.name}</div>
                <div>{current.desc}</div>
              </div>
            </Panel>
          </div>
          <Stage ref={stage} />
        </div>
      </div>
      <Notes>
        Fast and playful — this is vocabulary, not depth. Land “collapse” LAST and stop: “look what
        just died. Two dimensions went in, one came out. Everything on this line came from many
        different starting points, and there is no way back. Remember this picture — you’re about to
        see it twice more wearing different clothes.”
      </Notes>
    </section>
  );
}
