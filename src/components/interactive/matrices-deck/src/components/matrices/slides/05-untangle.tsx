"use client";

import { useRef, useState } from "react";

import { COL } from "../lib/math";
import { Scatter } from "../lib/scatter";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Btn, Btns, Eyebrow, Notes, Panel, Stage } from "../ui";

type Key = "reset" | "go" | "cut";

export default function UntangleSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<Key | null>(null);
  const [acc, setAcc] = useState("—");
  const [accColor, setAccColor] = useState<string>(COL.dim);

  const scatter = useSketch(stage, (host) => {
    const sc = new Scatter(host, { layout: "spiral" });
    sc.onFrame = (a, _best, _k, on) => {
      setAcc(on < 0.05 ? "—" : Math.round(a * 100) + "%");
      setAccColor(on < 0.05 ? COL.dim : a > 0.98 ? COL.i : COL.bad);
    };
    return sc;
  });

  const click = (key: Key) => {
    const sc = scatter.current;
    if (!sc) return;
    setSel(key);
    if (key === "reset") sc.reset();
    else if (key === "go") sc.setK(1, 2200);
    else {
      sc.setLine(0, 0, 500);
      sc.showLine(true);
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
    <section data-id="untangle" ref={sec}>
      <div className="wrap">
        <div className="cols narrow">
          <div className="stack">
            <Eyebrow>The whole idea</Eyebrow>
            <h2>
              So don’t cut harder.
              <br />
              <span className="ca">Un-crumple first.</span>
            </h2>
            <p className="lead">
              Move every point until the two groups fall apart on their own. Then the boring straight
              cut works perfectly.
            </p>
            <Btns>
              <Btn on={sel === "reset"} onClick={() => click("reset")}>
                crumpled
              </Btn>
              <Btn on={sel === "go"} onClick={() => click("go")}>
                un-crumple
              </Btn>
              <Btn on={sel === "cut"} onClick={() => click("cut")}>
                now cut
              </Btn>
            </Btns>
            <Panel tight>
              <div className="readout">
                correct &nbsp;<b style={{ color: accColor }}>{acc}</b>
              </div>
            </Panel>
            <p className="note fragment grow-in" style={{ maxWidth: "17em" }}>
              A neural network doesn’t learn the answer. It learns{" "}
              <span className="hl">a view in which the answer is obvious</span>.
            </p>
          </div>
          <Stage ref={stage} badge="watch the grid" />
        </div>
      </div>
      <Notes>
        Hit “un-crumple” and stay silent while it moves. Then: every layer of a network is one
        un-crumpling motion; the last layer is the dumb cut. Deep learning is not clever cutting,
        it’s patient un-crumpling followed by a dumb cut. HONEST FLAG — say it out loud, it pre-empts
        the smartest question in the room: “notice the grid had to BEND to do that. A single matrix
        can never bend it. That tension is exactly why networks are deep, and it’s the last slide of
        this talk.”
      </Notes>
    </section>
  );
}
