"use client";

import { useRef, useState } from "react";

import { ID, type Mat } from "../lib/math";
import { Plane } from "../lib/plane";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Btn, Btns, Eyebrow, Notes, Stage } from "../ui";

const SHEAR: Mat = [2, 1, 0, 1];

export default function AllSpaceSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<"id" | "shear">("id");

  const plane = useSketch(stage, (host) => new Plane(host, { range: 4.6, square: true }));

  const click = (key: "id" | "shear") => {
    setSel(key);
    plane.current?.setMatrix(key === "id" ? ID : SHEAR, { dur: 1500 });
  };

  useSlideLifecycle(sec, {
    show: () => {
      plane.current?.resize();
      plane.current?.setMatrix(ID, { animate: false });
      setSel("id");
    },
    relayout: () => plane.current?.resize(),
  });

  return (
    <section data-id="allspace" ref={sec}>
      <div className="wrap">
        <div className="cols narrow">
          <div className="stack">
            <Eyebrow>The big idea</Eyebrow>
            <h2>
              It doesn’t move one vector.
              <br />
              It moves <span className="ca">all of space</span>.
            </h2>
            <p className="lead">
              Feed <em>every</em> point of the plane through the machine and the whole grid deforms
              — stretched, tilted, rewoven.
            </p>
            <Btns style={{ marginTop: ".4rem" }}>
              <Btn on={sel === "id"} onClick={() => click("id")}>
                identity
              </Btn>
              <Btn on={sel === "shear"} onClick={() => click("shear")}>
                apply
              </Btn>
            </Btns>
            <p className="note fragment grow-in" style={{ marginTop: ".8rem", maxWidth: "16em" }}>
              The faint grid is where things <em>were</em>.
              <br />
              The bright grid is where they <em>are</em>.
            </p>
          </div>
          <Stage ref={stage} />
        </div>
      </div>
      <Notes>
        ★ PIVOT SLIDE. Click identity, let them see the calm grid. Then click apply and SAY NOTHING
        FOR THREE SECONDS. Then: “that deformation IS the matrix. The four numbers are just its
        name.” Pause again, then tie it back to the crumpled paper: “if a matrix can grab all of
        space and pull it, then it can pull tangled data apart. That is the entire job description of
        a layer.”
      </Notes>
    </section>
  );
}
