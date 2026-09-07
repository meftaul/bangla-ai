"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Sketch } from "./sketch";

export type SlideLife = {
  /** The slide just became the current one — re-measure and start any demo. */
  show?: () => void;
  /** The slide is no longer current — stop endless loops and timers. */
  hide?: () => void;
  /** Deck rescaled. Re-measure only; must NOT restart a demo mid-run. */
  relayout?: () => void;
};

// Reveal's lifecycle, observed instead of subscribed to.
//
// The standalone deck registered every slide against the Reveal instance
// (`Reveal.on('slidechanged')`). Components can't reach that instance — Deck owns
// it — so each slide derives its own state from the class reveal writes on the
// <section>, the same trick `ContextWindow` uses. That keeps a slide identical in
// practice, presenter and viewer modes, and working in a plain page too.
export function useSlideLifecycle(sectionRef: RefObject<HTMLElement | null>, life: SlideLife) {
  // Callbacks are re-created every render; the observers below are installed once,
  // so they read the newest ones through a ref. Updated in an effect, never during
  // render — writing a ref while rendering is not safe under concurrent React.
  const latest = useRef(life);
  useEffect(() => {
    latest.current = life;
  });

  useEffect(() => {
    const section = sectionRef.current?.closest("section");
    if (!section) return;

    let shown = false;
    let raf = 0;

    const show = () => {
      if (shown) return;
      shown = true;
      // Two frames: let reveal finish the transition so getBoundingClientRect
      // returns the slide's real on-screen size before any canvas measures it.
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => latest.current.show?.());
      });
    };
    const hide = () => {
      if (!shown) return;
      shown = false;
      cancelAnimationFrame(raf);
      latest.current.hide?.();
    };
    const sync = () => (section.classList.contains("present") ? show() : hide());

    const mo = new MutationObserver(sync);
    mo.observe(section, { attributes: true, attributeFilter: ["class"] });
    sync(); // the deck may already be sitting on this slide

    // reveal rescales the deck with a CSS transform, which ResizeObserver never
    // reports (it watches layout boxes). Canvases must therefore re-measure on the
    // signal reveal itself reacts to. relayout(), not show() — going fullscreen or
    // opening the notes window must not restart a demo the speaker is halfway through.
    const onResize = () => {
      if (shown) (latest.current.relayout ?? latest.current.show)?.();
    };
    window.addEventListener("resize", onResize);

    return () => {
      mo.disconnect();
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      hide();
    };
  }, [sectionRef]);
}

// Own one canvas sketch for the lifetime of the component.
//
// React 19 StrictMode double-invokes effects in dev, so the instance is destroyed
// and rebuilt — every Sketch subclass therefore implements destroy(). The factory
// is read through a ref, so an inline arrow in the caller costs nothing.
export function useSketch<T extends Sketch>(
  hostRef: RefObject<HTMLElement | null>,
  create: (host: HTMLElement) => T,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  // Captured on first render only: the sketch is built once, so a later factory
  // identity is irrelevant and re-running would destroy live demo state.
  const factory = useRef(create);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const sketch = factory.current(host);
    ref.current = sketch;
    return () => {
      sketch.destroy();
      ref.current = null;
    };
  }, [hostRef]);

  return ref;
}
