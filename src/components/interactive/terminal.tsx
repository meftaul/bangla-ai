"use client";

import { useRef } from "react";
import { useFragmentSteps, PanelBar } from "./use-fragment-steps";

export type TermLine = {
  t: "cmd" | "ag" | "out" | "dim" | "ok" | "warn";
  x: string;
};

// An animated fake terminal for slide decks. steps[0] types when its slide becomes
// current; steps[n] types when the slide's nth fragment is revealed — see
// useFragmentSteps for the reveal contract.
// Visual classes (.term, .tl-*, .caret…) are styled by src/app/deck.css.
const ICON: Record<TermLine["t"], string> = {
  cmd: "❯",
  ag: "●",
  out: " ",
  dim: " ",
  ok: "✓",
  warn: "⚠",
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Terminal({ title, steps }: { title: string; steps: TermLine[][] }) {
  const bodyRef = useRef<HTMLDivElement>(null);

  const scroll = () => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  };
  const addLine = (l: TermLine) => {
    const row = document.createElement("div");
    row.className = `tl tl-${l.t}`;
    const pfx = document.createElement("span");
    pfx.className = "pfx";
    pfx.textContent = ICON[l.t];
    const txt = document.createElement("span");
    row.append(pfx, txt);
    bodyRef.current?.append(row);
    return txt;
  };
  const addCaret = () => {
    const c = document.createElement("span");
    c.className = "caret";
    bodyRef.current?.append(c);
  };

  // Steps 0..upto, no animation (already-revealed state after a jump or rewind).
  const renderInstant = (upto: number) => {
    bodyRef.current?.replaceChildren();
    for (let i = 0; i <= upto && i < steps.length; i++)
      for (const l of steps[i]) addLine(l).textContent = l.x;
    addCaret();
    scroll();
  };

  useFragmentSteps(bodyRef, steps.length, {
    reset: () => bodyRef.current?.replaceChildren(),
    jump: renderInstant,
    advance: async (idx, alive) => {
      renderInstant(idx - 1);
      bodyRef.current?.querySelector(".caret")?.remove();
      for (const l of steps[idx]) {
        if (!alive()) return;
        const txt = addLine(l);
        if (l.t === "cmd") {
          for (const ch of l.x) {
            if (!alive()) return;
            txt.textContent += ch;
            scroll();
            await wait(14);
          }
        } else {
          txt.textContent = l.x;
          scroll();
          await wait(140);
        }
      }
      if (!alive()) return;
      addCaret();
      scroll();
    },
  });

  return (
    <div className="term">
      <PanelBar title={title} />
      <div className="tbody" ref={bodyRef} />
    </div>
  );
}
