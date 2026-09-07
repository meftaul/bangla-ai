"use client";

import { useRef, useState } from "react";

import { NumberLine } from "../lib/number-line";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Btn, Btns, Eyebrow, Notes, Stage } from "../ui";

// Order matters on screen: stretch, squash, flip, then slide — the odd one out.
const FS = [
  { key: "reset", label: "reset", f: (x: number) => x },
  { key: "double", label: "f(x) = 2x", f: (x: number) => 2 * x },
  { key: "half", label: "f(x) = x/2", f: (x: number) => x / 2 },
  { key: "neg", label: "f(x) = −x", f: (x: number) => -x },
  { key: "shift", label: "f(x) = x + 1", f: (x: number) => x + 1 },
] as const;

export default function NumLineSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<string | null>(null);

  const line = useSketch(stage, (host) => new NumberLine(host));

  useSlideLifecycle(sec, { show: () => line.current?.resize() });

  return (
    <section data-id="numline" ref={sec}>
      <div className="wrap">
        <Eyebrow>Step 2 · Watch it move</Eyebrow>
        <h2>A function moves every point at once.</h2>
        <Stage ref={stage} shape="bare" style={{ height: "19.53cqw", margin: ".4rem 0 1rem" }} />
        <div className="row" style={{ justifyContent: "space-between" }}>
          <Btns>
            {FS.map((o) => (
              <Btn
                key={o.key}
                on={sel === o.key}
                onClick={() => {
                  setSel(o.key);
                  line.current?.apply(o.f);
                }}
              >
                {o.label}
              </Btn>
            ))}
          </Btns>
          <p className="note" style={{ margin: 0, maxWidth: "15em" }}>
            Same machine, every point fed through it.{" "}
            <span className="ca">Stretch. Squash. Flip. Slide.</span>
          </p>
        </div>
      </div>
      <Notes>
        Click all four and narrate the VERB, not the formula: 2x stretches, x/2 squashes, −x flips,
        x+1 slides. “One rule, applied to every point simultaneously — that’s the real definition of
        a function. Not a calculator, a deformation of a whole space.” FLAG x+1 deliberately: watch
        the origin slide off zero. “Remember this one, it’s about to be the odd one out.” That’s the
        setup for linearity.
      </Notes>
    </section>
  );
}
