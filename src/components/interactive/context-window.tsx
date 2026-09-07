"use client";

import { useRef } from "react";
import { useFragmentSteps, PanelBar } from "./use-fragment-steps";

export type CtxOp =
  | { op: "add"; t: "sys" | "md" | "skill" | "user" | "tool"; x: string; n: number }
  | { op: "clear" };

type CtxBlock = Extract<CtxOp, { op: "add" }>;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// An animated context-window visualizer for slide decks. Same fragment contract as
// Terminal (see useFragmentSteps): steps[0] plays when its slide becomes current,
// steps[n] when the nth fragment reveals. Each step is a list of ops: `add` slides a
// labeled block into the window (n = percent of the window, summed into the meter),
// `clear` wipes every block — re-add in the same step whatever survives (system
// prompt, CLAUDE.md, skills). Visual classes (.cw, .cwb-*, .cwmeter…) are styled by
// src/app/deck.css.
// ponytail: n is authored as % of the window; add real token math if a deck needs it.
export default function ContextWindow({ title, steps }: { title: string; steps: CtxOp[][] }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

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
    bodyRef.current?.append(row);
  };
  const setMeter = (blocks: CtxBlock[]) => {
    const meter = meterRef.current;
    const fill = meter?.firstElementChild as HTMLElement | null;
    if (!meter || !fill || !pctRef.current) return;
    const total = Math.min(
      blocks.reduce((s, b) => s + b.n, 0),
      100,
    );
    fill.style.width = `${total}%`;
    pctRef.current.textContent = `${total}%`;
    meter.classList.toggle("hot", total > 85);
  };

  // Steps 0..upto, no animation (already-revealed state after a jump or rewind).
  const renderInstant = (upto: number) => {
    const blocks = apply(upto);
    bodyRef.current?.replaceChildren();
    for (const b of blocks) addBlock(b, false);
    setMeter(blocks);
  };

  useFragmentSteps(bodyRef, steps.length, {
    reset: () => {
      bodyRef.current?.replaceChildren();
      setMeter([]);
    },
    jump: renderInstant,
    advance: async (idx, alive) => {
      renderInstant(idx - 1);
      const blocks = apply(idx - 1);
      for (const o of steps[idx]) {
        if (!alive()) return;
        if (o.op === "clear") {
          for (const el of Array.from(bodyRef.current?.children ?? []))
            el.classList.add("cwb-out");
          await wait(320);
          if (!alive()) return;
          bodyRef.current?.replaceChildren();
          blocks.length = 0;
        } else {
          addBlock(o, true);
          blocks.push(o);
        }
        setMeter(blocks);
        await wait(280);
      }
    },
  });

  return (
    <div className="cw">
      <PanelBar title={title} />
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
