"use client";

import { useEffect, useRef, type RefObject } from "react";

type Handlers = {
  /** Slide is no longer current — clear, so re-entry replays from the top. */
  reset: () => void;
  /** Render steps 0..upto with no animation (jumped in, or stepped back). */
  jump: (upto: number) => void;
  /** Animate step `idx`. Bail out whenever `alive()` returns false. */
  advance: (idx: number, alive: () => boolean) => void;
};

/**
 * Drives a stepped slide animation off reveal's own class flips (`present` on the
 * section, `visible` on fragments) via a MutationObserver — no coupling to the Reveal
 * instance, so it behaves identically in practice, presenter and viewer modes.
 *
 * step 0 plays when the slide becomes current, step n when the nth fragment reveals,
 * so `stepCount` must equal the slide's fragment count + 1.
 *
 * `advance` is the only animated path and may be async; it is handed an `alive()`
 * guard that goes false as soon as the state changes again (including on the React 19
 * StrictMode double-mount) — check it after every await and bail out.
 */
export function useFragmentSteps(
  ref: RefObject<HTMLElement | null>,
  stepCount: number,
  handlers: Handlers,
) {
  // Deck children render once (see deck.tsx), so the effect below is mount-only; the
  // ref keeps it reading the current closures rather than the first ones. Declared
  // above the observer effect so it has already run by the time sync() first fires.
  const h = useRef(handlers);
  useEffect(() => {
    h.current = handlers;
  });

  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!section) return;

    // Generation counter cancels in-flight animation on any state change.
    let gen = 0;
    let shown = -2; // steps rendered so far; -1 = slide not current (cleared)

    const sync = () => {
      const target = section.classList.contains("present")
        ? Math.min(section.querySelectorAll(".fragment.visible").length, stepCount - 1)
        : -1;
      if (target === shown) return;
      const prev = shown;
      shown = target;
      if (target < 0) {
        gen++;
        h.current.reset();
      } else if (target < prev) {
        gen++;
        h.current.jump(target); // fragment stepped back — no re-animation
      } else {
        const my = ++gen;
        h.current.advance(target, () => my === gen);
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(section, { attributes: true, attributeFilter: ["class"], subtree: true });
    sync();
    return () => {
      gen++;
      observer.disconnect();
    };
    // Mount-only by design: steps are static per slide and the deck renders once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** The title bar shared by Terminal and ContextWindow. */
export function PanelBar({ title }: { title: string }) {
  return (
    <div className="tbar">
      <span className="dot r" />
      <span className="dot y" />
      <span className="dot g" />
      <span className="ttl">{title}</span>
    </div>
  );
}
