"use client";

import { useRef, useState } from "react";

import { Scatter } from "../lib/scatter";
import { useSketch, useSlideLifecycle } from "../lib/use-slide";
import { Btn, Btns, Eyebrow, Notes, Panel, Stage } from "../ui";

export default function TangleSlide() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<"sweep" | "stop" | null>(null);
  const [acc, setAcc] = useState("—");
  const [best, setBest] = useState("—");

  const scatter = useSketch(stage, (host) => {
    const sc = new Scatter(host, { layout: "spiral" });
    sc.onFrame = (a, b, _k, on) => {
      setAcc(on < 0.05 ? "—" : Math.round(a * 100) + "%");
      setBest(b ? Math.round(b * 100) + "%" : "—");
    };
    return sc;
  });

  const click = (key: "sweep" | "stop") => {
    setSel(key);
    scatter.current?.sweep(key === "sweep");
  };

  useSlideLifecycle(sec, {
    show: () => {
      scatter.current?.resize();
      scatter.current?.reset();
      setSel(null);
    },
    relayout: () => scatter.current?.resize(),
    // Leaving the slide must not leave a search spinning in the background.
    hide: () => scatter.current?.sweep(false),
  });

  return (
    <section data-id="tangle" ref={sec}>
      <div className="wrap">
        <div className="cols narrow">
          <div className="stack">
            <Eyebrow>The actual problem</Eyebrow>
            <h2>
              Real data arrives
              <br />
              <span className="cbad">crumpled</span>.
            </h2>
            <p className="lead">
              Same two groups. Nothing added, nothing removed — only <em>moved</em>. Now try to
              separate them with a straight cut.
            </p>
            <Btns>
              <Btn on={sel === "sweep"} onClick={() => click("sweep")}>
                try every angle
              </Btn>
              <Btn on={sel === "stop"} onClick={() => click("stop")}>
                stop
              </Btn>
            </Btns>
            <Panel tight>
              <div className="readout">
                this angle &nbsp;<b>{acc}</b>
                <br />
                best so far &nbsp;<b style={{ color: "var(--mbad)" }}>{best}</b>
              </div>
            </Panel>
            <p className="note fragment grow-in" style={{ maxWidth: "17em" }}>
              Every angle. Every position. It never gets near an answer — because{" "}
              <span className="k">no straight cut exists</span>.
            </p>
          </div>
          <Stage ref={stage} badge="the real world" tone="no" />
        </div>
      </div>
      <Notes>
        THE CRUMPLED PAPER. Say it while the sweep runs: draw red dots on the left half of a sheet
        and blue on the right — flat, one cut separates them. Crumple the sheet into a ball and no
        straight cut on earth works. The dots never changed. Only their arrangement. Real data
        arrives crumpled, because it’s stored in whatever coordinates were convenient to RECORD it
        in — pixel #237, database column 4 — never the ones convenient to DECIDE with. Let the “best
        so far” sit at ~63% for a few seconds. Coin flip is 50%.
      </Notes>
    </section>
  );
}
