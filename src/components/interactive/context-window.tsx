"use client";

import { useEffect, useRef } from "react";

export type CtxOp =
  | { op: "add"; t: "sys" | "md" | "skill" | "user" | "tool"; x: string; n: number }
  | { op: "clear" };

type CtxBlock = Extract<CtxOp, { op: "add" }>;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// An animated context-window visualizer for slide decks. Same fragment contract as
// Terminal: steps[0] plays when its slide becomes current, steps[n] when the nth
// fragment reveals — steps.length must equal the slide's fragment count + 1. Each
// step is a list of ops: `add` slides a labeled block into the window (n = percent
// of the window, summed into the meter), `clear` wipes every block — re-add in the
// same step whatever survives (system prompt, CLAUDE.md, skills). Derives all state
// from reveal's own class flips via a MutationObserver, so it behaves identically
// in practice, presenter, and viewer modes. Visual classes (.cw, .cwb-*, .cwmeter…)
// are styled by the article's deck CSS.
// ponytail: n is authored as % of the window; add real token math if a deck needs it.
export default function ContextWindow({ title, steps }: { title: string; steps: CtxOp[][] }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    const meter = meterRef.current;
    const pct = pctRef.current;
    const fill = meter?.firstElementChild as HTMLElement | null;
    const section = body?.closest("section");
    if (!body || !meter || !pct || !fill || !section) return;

    // Generation counter cancels in-flight animation on any state change (and on the
    // StrictMode double-mount — fresh observer per effect run, per repo convention).
    let gen = 0;
    let shown = -2; // steps rendered so far; -1 = slide not current (cleared)

    // Blocks after folding steps 0..upto (clear empties, add pushes).
    const apply = (upto: number) => {
      const blocks: CtxBlock[] = [];
      for (let i = 0; i <= upto && i < steps.length; i++)
        for (const o of steps[i]) {
          if (o.op === "clear") blocks.length = 0;
          else blocks.push(o);
        }
      return blocks;
    };
    const addBlock = (b: CtxBlock, animate: boolean) => {
      const row = document.createElement("div");
      row.className = `cwb cwb-${b.t}${animate ? " cwb-in" : ""}`;
      const lb = document.createElement("span");
      lb.className = "lb";
      lb.textContent = b.x;
      const sz = document.createElement("span");
      sz.className = "sz";
      sz.textContent = `${b.n}%`;
      row.append(lb, sz);
      body.append(row);
    };
    const setMeter = (blocks: CtxBlock[]) => {
      const total = Math.min(blocks.reduce((s, b) => s + b.n, 0), 100);
      fill.style.width = `${total}%`;
      pct.textContent = `${total}%`;
      meter.classList.toggle("hot", total > 85);
    };

    // Steps 0..upto, no animation (already-revealed state after a jump or rewind).
    const renderInstant = (upto: number) => {
      const blocks = apply(upto);
      body.replaceChildren();
      for (const b of blocks) addBlock(b, false);
      setMeter(blocks);
    };

    const animateStep = async (idx: number) => {
      const my = ++gen;
      renderInstant(idx - 1);
      const blocks = apply(idx - 1);
      for (const o of steps[idx]) {
        if (my !== gen) return;
        if (o.op === "clear") {
          for (const el of Array.from(body.children)) el.classList.add("cwb-out");
          await wait(320);
          if (my !== gen) return;
          body.replaceChildren();
          blocks.length = 0;
        } else {
          addBlock(o, true);
          blocks.push(o);
        }
        setMeter(blocks);
        await wait(280);
      }
    };

    const sync = () => {
      const target = section.classList.contains("present")
        ? Math.min(section.querySelectorAll(".fragment.visible").length, steps.length - 1)
        : -1;
      if (target === shown) return;
      const prev = shown;
      shown = target;
      if (target < 0) {
        gen++;
        body.replaceChildren(); // reset off-slide so re-entry replays
        setMeter([]);
      } else if (target < prev) {
        gen++;
        renderInstant(target); // fragment stepped back — no re-animation
      } else {
        animateStep(target);
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(section, { attributes: true, attributeFilter: ["class"], subtree: true });
    sync();
    return () => {
      gen++;
      observer.disconnect();
    };
    // Deck children render once (see deck.tsx); steps/title are static per slide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="cw">
      <div className="tbar">
        <span className="dot r" />
        <span className="dot y" />
        <span className="dot g" />
        <span className="ttl">{title}</span>
      </div>
      <div className="cwbody" ref={bodyRef} />
      <div className="cwfoot">
        <div className="cwmeter" ref={meterRef}>
          <i />
        </div>
        <span className="cwpct" ref={pctRef}>
          0%
        </span>
      </div>
    </div>
  );
}
