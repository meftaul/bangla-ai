"use client";

import { useRef, useState } from "react";

import { COL, det, fmt, ID, matEq, type Mat } from "../lib/math";
import { Plane } from "../lib/plane";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Btn, Btns, Eyebrow, Notes, Panel, Stage } from "../ui";

const PRESETS: { key: string; label: string; M: Mat }[] = [
  { key: "id", label: "1×", M: ID },
  { key: "two", label: "2×", M: [2, 0, 0, 1] },
  { key: "half", label: "0.5×", M: [1, 0, 0, 0.5] },
  { key: "flip", label: "flipped", M: [1, 0.4, 0, -1] },
  // Singular on purpose: this is the one the rest of the deck keeps referring back to.
  { key: "zero", label: "0×", M: [1, 2, 0.5, 1] },
];

/** The determinant, said in words. */
function describe(d: number) {
  if (Math.abs(d) < 0.02) return { note: "· flattened — a dimension is gone", color: COL.bad };
  if (d < 0) return { note: "· negative: space got flipped over", color: COL.j };
  if (d > 1.02) return { note: "· stretched", color: COL.v };
  if (d < 0.98) return { note: "· compressed", color: COL.v };
  return { note: "· unchanged", color: COL.v };
}

export default function DetSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState("id");
  const [M, setM] = useState<Mat>(ID);

  const plane = useSketch(stage, (host) => {
    const p = new Plane(host, { range: 4.2, square: true });
    p.onFrame = (m) => setM((prev) => (matEq(prev, m) ? prev : m.slice()));
    return p;
  });

  useSlideLifecycle(sec, {
    show: () => {
      plane.current?.resize();
      plane.current?.setMatrix(ID, { animate: false });
      setSel("id");
    },
    relayout: () => plane.current?.resize(),
  });

  const d = det(M);
  const { note, color } = describe(d);

  return (
    <section data-id="det" ref={sec}>
      <div className="wrap">
        <div className="cols narrow">
          <div className="stack">
            <Eyebrow>One number, one meaning</Eyebrow>
            <h2>
              The determinant is just
              <br />
              “how much did area change?”
            </h2>
            <p className="lead">
              Take the unit square. Push it through the machine. Whatever factor its area got
              multiplied by — that’s the determinant.
            </p>
            <Btns>
              {PRESETS.map((p) => (
                <Btn
                  key={p.key}
                  on={sel === p.key}
                  onClick={() => {
                    setSel(p.key);
                    plane.current?.setMatrix(p.M, { dur: 1300 });
                  }}
                >
                  {p.label}
                </Btn>
              ))}
            </Btns>
            <Panel tight>
              <div className="readout" style={{ fontSize: ".68em" }}>
                area = <b style={{ color }}>{fmt(d)}</b> &nbsp;
                <span style={{ color: "var(--mdim)" }}>{note}</span>
              </div>
            </Panel>
            <p className="note fragment grow-in" style={{ maxWidth: "17em" }}>
              <span className="cbad">det = 0</span> means space got flattened — a dimension was
              destroyed and <span className="k">you can never get it back</span>.
            </p>
          </div>
          <Stage ref={stage} />
        </div>
      </div>
      <Notes>
        “For years you computed ad − bc without knowing it meant ‘the area got 3× bigger.’ That’s
        the whole meaning.” Negative = orientation flipped, the square turned inside out. Zero = a
        dimension was destroyed, permanently — information death. That last one is the bridge to the
        dimension-switching section.
      </Notes>
    </section>
  );
}
