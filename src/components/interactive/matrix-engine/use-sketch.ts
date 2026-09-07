"use client";

import { useEffect, useRef, type RefObject } from "react";

import type { Sketch } from "./sketch";

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
