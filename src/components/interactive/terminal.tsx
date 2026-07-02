"use client";

import { useEffect, useRef } from "react";

export type TermLine = {
  t: "cmd" | "ag" | "out" | "dim" | "ok" | "warn";
  x: string;
};

// An animated fake terminal for slide decks. steps[0] types when its slide becomes
// current; steps[n] types when the slide's nth fragment is revealed. It derives all
// of that from reveal's own class flips (`present` on the section, `visible` on
// fragments) via a MutationObserver — no coupling to the Reveal instance, so it
// behaves identically in practice, presenter, and viewer modes.
// Visual classes (.term, .tl-*, .caret…) are styled by the article's deck CSS.
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

  useEffect(() => {
    const body = bodyRef.current;
    const section = body?.closest("section");
    if (!body || !section) return;

    // Generation counter cancels in-flight typing on any state change (and on the
    // StrictMode double-mount — fresh observer per effect run, per repo convention).
    let gen = 0;
    let shown = -2; // steps rendered so far; -1 = slide not current (cleared)

    const scroll = () => (body.scrollTop = body.scrollHeight);
    const addLine = (l: TermLine) => {
      const row = document.createElement("div");
      row.className = `tl tl-${l.t}`;
      const pfx = document.createElement("span");
      pfx.className = "pfx";
      pfx.textContent = ICON[l.t];
      const txt = document.createElement("span");
      row.append(pfx, txt);
      body.append(row);
      return txt;
    };
    const addCaret = () => {
      const c = document.createElement("span");
      c.className = "caret";
      body.append(c);
    };

    // Steps 0..upto, no animation (already-revealed state after a jump or rewind).
    const renderInstant = (upto: number) => {
      body.replaceChildren();
      for (let i = 0; i <= upto && i < steps.length; i++)
        for (const l of steps[i]) addLine(l).textContent = l.x;
      addCaret();
      scroll();
    };

    const typeStep = async (idx: number) => {
      const my = ++gen;
      renderInstant(idx - 1);
      body.querySelector(".caret")?.remove();
      for (const l of steps[idx]) {
        if (my !== gen) return;
        const txt = addLine(l);
        if (l.t === "cmd") {
          for (const ch of l.x) {
            if (my !== gen) return;
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
      if (my === gen) {
        addCaret();
        scroll();
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
      } else if (target < prev) {
        gen++;
        renderInstant(target); // fragment stepped back — no retype
      } else {
        typeStep(target);
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
    <div className="term">
      <div className="tbar">
        <span className="dot r" />
        <span className="dot y" />
        <span className="dot g" />
        <span className="ttl">{title}</span>
      </div>
      <div className="tbody" ref={bodyRef} />
    </div>
  );
}
