"use client";

import { useRef, useState } from "react";

import { COL } from "../lib/math";
import { Scatter } from "../lib/scatter";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Btn, Btns, Eyebrow, Notes, Panel, Stage } from "../ui";

// The normal of the line joining the two blobs — the cut a classifier would find.
const GOOD = Math.atan2(1.5, 2.6);

export default function CutSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<"reset" | "cut" | null>(null);
  const [acc, setAcc] = useState("—");
  const [accColor, setAccColor] = useState(COL.dim);

  const scatter = useSketch(stage, (host) => {
    const sc = new Scatter(host, { layout: "blobs", range: 2.9, n: 80 });
    // Runs inside the sketch's rAF. Identical values bail out of re-rendering, so
    // the readout only actually repaints while the accuracy is changing.
    sc.onFrame = (a, _best, _k, on) => {
      setAcc(on < 0.05 ? "—" : Math.round(a * 100) + "%");
      setAccColor(on < 0.05 ? COL.dim : a > 0.98 ? COL.i : COL.v);
    };
    return sc;
  });

  const click = (key: "reset" | "cut") => {
    const sc = scatter.current;
    if (!sc) return;
    setSel(key);
    if (key === "cut") {
      sc.setLine(GOOD, 0, 1500);
      sc.showLine(true);
    } else {
      sc.showLine(false, 300);
      sc.setLine(1.9, 0, 600);
    }
  };

  useSlideLifecycle(sec, {
    show: () => {
      scatter.current?.resize();
      scatter.current?.reset();
      setSel(null);
    },
    relayout: () => scatter.current?.resize(),
  });

  return (
    <section data-id="cut" ref={sec}>
      <div className="wrap">
        <div className="cols narrow">
          <div className="stack">
            <Eyebrow>Start at the end</Eyebrow>
            <h2>
              The last step is a
              <br />
              <span className="ca">straight cut</span>.
            </h2>
            <p className="lead">
              Whatever a classifier is doing, its final move is embarrassingly simple: draw a line,
              and ask <em>which side are you on?</em>
            </p>
            <Btns>
              <Btn on={sel === "reset"} onClick={() => click("reset")}>
                clear
              </Btn>
              <Btn on={sel === "cut"} onClick={() => click("cut")}>
                draw the line
              </Btn>
            </Btns>
            <Panel tight>
              <div className="readout">
                correct &nbsp;<b style={{ color: accColor }}>{acc}</b>
              </div>
            </Panel>
            <p className="note fragment grow-in" style={{ maxWidth: "17em" }}>
              So why does a network need <span className="k">a hundred million numbers</span>{" "}
              sitting in front of <em>this</em>?
            </p>
          </div>
          <Stage ref={stage} badge="data that cooperates" />
        </div>
      </div>
      <Notes>
        Ask the room first: “what does a classifier actually DO at the very last step?” Let them
        answer. Then reveal — it’s one straight cut. The decision is trivial. Which sets up the only
        interesting question in deep learning: why is everything before it so enormous?
      </Notes>
    </section>
  );
}
