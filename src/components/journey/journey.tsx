"use client";

import Link from "next/link";
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { bn } from "@/components/interactive/figure-kit";
import { GROW_WIDGET } from "@/components/journey/kit";

// A lesson told one screen at a time, Brilliant-style.
//
//   <Journey title="…">
//     <Step> story words + one interactive widget + <Then>explanation</Then> </Step>
//
// The story words may hold a figure that acts the scene out, marked `story` so
// it is taken for words and not for the widget: <FinalistsArrive story />.
//     <Step> … </Step>
//   </Journey>
//
// A screen can hold the reader until they have actually done the thing it asks:
// any component inside it that calls useGate() locks the Continue arrow until it
// calls the returned pass(). Screens with no gate are free to skip. A step the
// reader has already cleared stays cleared when they come back to it.
//
// The Journey is one phone screen tall and never grows (the article page gives
// it the viewport, see dashboard/articles/[...slug]/page.tsx): a top bar with
// progress and the widget's Task, the screen, and a bottom bar with the pass
// note and the Continue arrow. Nothing is trimmed to fit; a step becomes as many
// screens as its words need, in the order a reader meets them:
//
//   story screens   the paragraphs before the widget, only if they don't fit
//                   beside it (the widget keeps the last ones that do);
//   widget screen   the widget, its Task pinned in the top bar; the only screen
//                   that can lock Continue;
//   explanation     the <Then> (or, in older journeys, the words after the
//                   widget), on its own screens once the task is done: Continue
//                   reads "ব্যাখ্যাটা দেখুন", and "← screen-টা আবার দেখুন" goes
//                   back to the widget, which stays mounted with its state.
//
// Breaks are measured on arrival, before paint, between paragraphs: a heading
// stays with what follows it, a display formula with what precedes it. The
// screen still scrolls as a last resort, when one widget alone is taller than
// the phone; content a tap adds below the fold is then scrolled into view.
//
// Progress ({ at, furthest }) is kept per browser in localStorage, so a phone
// reloading the tab in the background does not send the reader to screen 1.
// ponytail: per browser, not per user; move it to Supabase if readers switch devices.
//
// Styling is Tailwind only. Note this renders inside the page's `.article`
// wrapper, whose unlayered `p`/`h1`/`h2` rules beat layered utilities — so the
// chrome here uses divs and spans, not paragraphs and headings.

type GateApi = {
  register: (id: string) => () => void;
  pass: (id: string, note?: ReactNode) => void;
};

const GateCtx = createContext<GateApi | null>(null);

/**
 * Lock the current screen until the reader does something.
 *
 * Returns `pass(note?)`: call it when the task is done. The note shows in the
 * bottom bar above the Continue arrow. Outside a Journey this is a no-op, so
 * the same component still works dropped into a normal article.
 */
export function useGate() {
  const api = useContext(GateCtx);
  const id = useId();
  // Layout effect: the lock must be in place before the first paint, or Continue
  // flashes enabled for a frame on every screen that has a task.
  useLayoutEffect(() => api?.register(id), [api, id]);
  return useCallback((note?: ReactNode) => api?.pass(id, note), [api, id]);
}

/** One step. Purely a marker — Journey decides which of its screens is on stage. */
export function Step({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * What the frame lends a step: the top-bar slot for its Task (null when the
 * widget isn't on stage), and for its <Then> a way to say it exists and the
 * explanation screen to render into (null until that screen shows).
 *
 * <Then> announces itself rather than being picked out of the step's children:
 * the MDX page is a server component, so on the client a child's `type` is a
 * lazy client reference, never `=== Then`.
 */
type StageApi = {
  taskSlot: HTMLElement | null;
  thenSlot: HTMLElement | null;
  announceThen: () => () => void;
};
const StageCtx = createContext<StageApi | null>(null);

const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Journey({ title, children }: { title?: string; children: ReactNode }) {
  // MDX can leave newline strings between the <Step>s; they are not screens.
  const steps = Children.toArray(children).filter((c) => !(typeof c === "string" && !c.trim()));
  const last = steps.length - 1;

  const [at, setAt] = useState(0);
  const [page, setPage] = useState(0);
  const [furthest, setFurthest] = useState(0);
  // Per step, where its story screens break (indices into its main part; the
  // last one starts the widget screen), and where its explanation breaks.
  // Missing = not measured yet: that part renders whole once, to be measured.
  const [storyCuts, setStoryCuts] = useState<Record<number, number[]>>({});
  const [afterCuts, setAfterCuts] = useState<Record<number, number[]>>({});
  const [dir, setDir] = useState<1 | -1>(1);
  const [gates, setGates] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [note, setNote] = useState<ReactNode>(null);
  const [taskSlot, setTaskSlot] = useState<HTMLElement | null>(null);
  const [thenSlot, setThenSlot] = useState<HTMLElement | null>(null);
  const [thens, setThens] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const measured = useRef<HTMLDivElement>(null);
  // The control last tapped: where it sat in the scrolled content, how tall the
  // screen was then, and when.
  const touched = useRef<{ top: number; height: number; t: number } | null>(null);
  const saveKey = useRef<string | null>(null);

  const register = useCallback((id: string) => {
    setGates((g) => [...g, id]);
    return () => setGates((g) => g.filter((x) => x !== id));
  }, []);
  const pass = useCallback((id: string, n?: ReactNode) => {
    setPassed((p) => (p.includes(id) ? p : [...p, id]));
    if (n) setNote(n);
  }, []);
  const gateApi = useMemo(() => ({ register, pass }), [register, pass]);

  const announceThen = useCallback(() => {
    setThens((n) => n + 1);
    return () => setThens((n) => n - 1);
  }, []);

  // This step's screens: story 0…W−1, widget W, explanation W+1…lastPage.
  const { main, after } = splitStep(steps[at]);
  const staged = growWidget(main);
  const cut = storyCuts[at];
  const afterCut = afterCuts[at];
  const W = cut?.length ?? 0;
  const explains = thens > 0 || after.length > 0;
  const lastPage = W + (explains ? 1 + (afterCut?.length ?? 0) : 0);
  // Going back into the previous step lands on its last screen, as far as it is known.
  const pagesOf = (i: number) => (storyCuts[i]?.length ?? 0) + (afterCuts[i] ? 1 + afterCuts[i].length : 0);
  const onWidget = cut === undefined || page === W;

  // Passed ids are kept apart from registered ones, so a gate that re-registers
  // (StrictMode, a re-run effect) cannot re-lock a task already done.
  const cleared = at < furthest || gates.every((g) => passed.includes(g));
  const reachable = (i: number) => i <= Math.max(furthest, cleared ? at + 1 : at);
  const locked = !cleared && onWidget;
  // The Task belongs to the widget: keep it out of the top bar on every other screen.
  const stageApi = useMemo(
    () => ({ taskSlot: onWidget ? taskSlot : null, thenSlot: page > W ? thenSlot : null, announceThen }),
    [onWidget, taskSlot, page, W, thenSlot, announceThen],
  );

  const go = (to: number, toPage = 0) => {
    if (to < 0 || to > last || to === at || !reachable(to)) return;
    setDir(to > at ? 1 : -1);
    setFurthest((f) => Math.max(f, to));
    setAt(to);
    setPage(toPage);
    setPassed([]);
    setNote(null);
  };
  const turn = (p: number) => {
    setDir(p > page ? 1 : -1);
    setPage(p);
  };
  const forward = () => (locked ? undefined : page < lastPage ? turn(page + 1) : go(at + 1));
  const back = () => (page > 0 ? turn(page - 1) : go(at - 1, pagesOf(at - 1)));

  // Every screen starts at its top.
  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [at, page]);

  // Measure what rendered whole (see `measured` below) and fix its breaks, before paint.
  useLayoutEffect(() => {
    const root = scroller.current;
    const box = screen.current;
    const el = measured.current;
    if (!root || !box || !el || !taskSlot) return;
    const style = getComputedStyle(box);
    const room = root.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    if (cut === undefined) {
      // The Task shows on the widget screen only, so story screens also get its room.
      const task = taskSlot.childElementCount ? taskSlot.offsetHeight + 10 : 0;
      setStoryCuts((c) => ({ ...c, [at]: planStory(main, el, room, room + task) }));
    } else if (page > W && afterCut === undefined && el.childElementCount) {
      const lead = el.previousElementSibling as HTMLElement | null; // the "look again" chip
      const first = room - (lead ? lead.offsetHeight + 16 : 0);
      setAfterCuts((c) => ({ ...c, [at]: packBlocks(el, (p) => (p === 0 ? first : room)) }));
    }
  }, [at, page, W, cut, afterCut, main, taskSlot, thens]);
  // An explanation screen shows its own run of the explanation's blocks. They are
  // MDX's elements (some portaled in by <Then>), so they are shown and hidden here.
  useLayoutEffect(() => {
    if (!thenSlot || page <= W || !afterCut) return;
    const k = page - W - 1;
    const from = k ? afterCut[k - 1] : 0;
    const to = afterCut[k] ?? Infinity;
    Array.from(thenSlot.children).forEach((c, i) => ((c as HTMLElement).style.display = i >= from && i < to ? "" : "none"));
  });

  // A turned phone is a different screen: measure again, except the step in hand.
  useEffect(() => {
    let width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      setStoryCuts((c) => ({ [at]: c[at] }) as Record<number, number[]>);
      setAfterCuts((c) => ({ [at]: c[at] }) as Record<number, number[]>);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [at]);

  // Pick up where this browser left off. A layout effect, so the saved screen
  // (not screen 1) is what gets painted first.
  useLayoutEffect(() => {
    const key = `journey:${window.location.pathname}`;
    saveKey.current = key;
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as { at?: number; furthest?: number } | null;
      if (saved && Number.isInteger(saved.furthest) && Number.isInteger(saved.at)) {
        const f = Math.min(Math.max(0, saved.furthest!), last);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring browser storage, which the server render cannot see
        setFurthest(f);
        setAt(Math.min(Math.max(0, saved.at!), f));
      }
    } catch {
      // storage blocked or corrupt: start from screen 1
    }
  }, [last]);
  useEffect(() => {
    if (!saveKey.current) return;
    try {
      localStorage.setItem(saveKey.current, JSON.stringify({ at, furthest }));
    } catch {
      // storage blocked: progress just is not kept
    }
  }, [at, furthest]);

  // A tap that adds something below the fold scrolls it into view, but never so
  // far that the control just tapped leaves the top of the screen. Only when the
  // screen actually grew: a tap that swaps content in place (the next card, a
  // table cell filling) must not move the page under the reader.
  useEffect(() => {
    const root = scroller.current;
    const box = screen.current;
    if (!root || !box) return;
    const mo = new MutationObserver((records) => {
      const hit = touched.current;
      if (!hit || performance.now() - hit.t > 1500 || box.offsetHeight - hit.height < 24) return;
      let bottom = -Infinity;
      for (const r of records)
        for (const n of r.addedNodes) {
          if (!(n instanceof Element)) continue;
          const b = n.getBoundingClientRect();
          if (b.height > 0) bottom = Math.max(bottom, b.bottom);
        }
      const view = root.getBoundingClientRect();
      const hidden = bottom - view.bottom + 16;
      if (!(hidden > 0)) return;
      // A tapped button may unmount itself; its old spot still marks the limit.
      const room = hit.top - root.scrollTop - 12;
      const by = Math.min(hidden, room);
      if (by > 8) root.scrollBy({ top: by, behavior: calm() ? "auto" : "smooth" });
    });
    mo.observe(box, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [at]);

  const touch = (e: { target: EventTarget }) => {
    const root = scroller.current;
    const box = screen.current;
    const t = e.target as Element;
    const el = t.closest?.("button, a, input, label, [role=slider], [role=application], svg") ?? t;
    if (!root || !box || !el.getBoundingClientRect) return;
    const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
    // pointerdown and the click after it are one tap: keep the first spot.
    const prev = touched.current;
    if (prev && performance.now() - prev.t < 700) prev.t = performance.now();
    else touched.current = { top, height: box.offsetHeight, t: performance.now() };
  };

  // → / Enter to continue, ← to go back. A screen that wants the arrow keys for
  // itself (driving the robot) takes them first and calls preventDefault().
  // The listener is installed once and reads the newest actions through a ref.
  const nav = useRef({ forward, back });
  useEffect(() => {
    nav.current = { forward, back };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable], [role=application]")) return;
      if (e.key === "ArrowRight" || (e.key === "Enter" && !t?.closest?.("button, a, [role=button]"))) nav.current.forward();
      else if (e.key === "ArrowLeft") nav.current.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // How much of this step the reader has behind them, for its progress segment.
  const done = Math.min(lastPage + 1, page + (page === W && !cleared ? 0 : 1));
  const shown = (p: number) => (p === page ? enter(dir) : "hidden");
  const bigBtn =
    "inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-all duration-300 motion-reduce:transition-none sm:ml-auto sm:flex-none";
  const goBtn = "bg-accent text-accent-foreground shadow-lg shadow-accent/25 ring-4 ring-accent/20 hover:-translate-y-0.5 active:translate-y-0";

  return (
    <div data-journey className="flex h-full min-h-0 flex-col">
      {/* ---- top bar: close, segmented progress, counter, the widget's task -- */}
      <div className="shrink-0 border-b border-border px-4 pt-2.5 pb-3 sm:px-8 sm:pt-5">
        {title ? (
          <div className="mb-2 hidden truncate text-xs font-semibold tracking-wider text-accent-text uppercase sm:block">{title}</div>
        ) : null}
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/articles"
            aria-label="লাইব্রেরিতে ফিরে যান"
            // .article's unlayered `a` rule (accent, underline) beats utilities; only inline style wins
            style={{ color: "inherit", textDecoration: "none" }}
            className="group/x -ml-1.5 grid size-9 shrink-0 place-items-center rounded-full text-2xl leading-none transition-colors hover:bg-foreground/5"
          >
            <span aria-hidden="true" className="text-muted group-hover/x:text-foreground">×</span>
          </Link>
          <nav aria-label="ধাপগুলো" className="flex flex-1 gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`ধাপ ${bn(i + 1)}`}
                aria-current={i === at ? "step" : undefined}
                disabled={!reachable(i)}
                onClick={() => go(i)}
                className="group flex h-6 min-w-0 flex-1 cursor-pointer items-center disabled:cursor-default"
              >
                <span className={`block h-2 w-full overflow-hidden rounded-full ${i <= furthest ? "bg-accent/25" : "bg-border"}`}>
                  <span
                    className="block h-full rounded-full bg-accent transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: i < at ? "100%" : i === at ? `${(done / (lastPage + 1)) * 100}%` : "0%" }}
                  />
                </span>
              </button>
            ))}
          </nav>
          <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
            {bn(at + 1)}/{bn(steps.length)}
          </span>
        </div>
        <div ref={setTaskSlot} aria-live="polite" className="mt-2.5 empty:hidden" />
      </div>

      {/* ---- the screen -------------------------------------------------------- */}
      <div
        ref={scroller}
        onPointerDownCapture={touch}
        onClickCapture={touch}
        onKeyDownCapture={touch}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <GateCtx.Provider value={gateApi}>
          <StageCtx.Provider value={stageApi}>
            <ClearedCtx.Provider value={cleared}>
              <div ref={screen} key={at} className="flex min-h-full flex-col px-4 pt-5 pb-8 text-[1.07rem] leading-[1.75] sm:px-8 sm:pt-6">
                {cut === undefined ? (
                  // First sight of the step: story and widget whole, to be measured.
                  <div ref={measured} className={`${enter(dir)} ${FIRST}`}>
                    {staged}
                  </div>
                ) : (
                  <>
                    {/* A story screen sits in the middle of the stage, like a page of a book. */}
                    {cut.slice(0, W).map((to, p) => (
                      <div key={`s${p}`} className={`${shown(p)} flex flex-1 flex-col justify-center`}>
                        <div className={`${FIRST} [&>*:last-child]:mb-0!`}>{staged.slice(p ? cut[p - 1] : 0, to)}</div>
                      </div>
                    ))}
                    {/* The widget stays mounted behind every other screen, so it keeps its state. */}
                    <div key="w" className={`${shown(W)} ${FIRST}`}>
                      {staged.slice(W ? cut[W - 1] : 0)}
                    </div>
                    {page > W ? (
                      <div key={`a${page}`} className={enter(dir)}>
                        {page === W + 1 ? (
                          <button
                            type="button"
                            onClick={() => turn(W)}
                            className="mb-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
                          >
                            <span aria-hidden="true">←</span> screen-টা আবার দেখুন
                          </button>
                        ) : null}
                        {/* <Then> portals its blocks in here; older steps' closing words are plain children */}
                        <div
                          ref={(el) => {
                            measured.current = afterCut === undefined ? el : null;
                            setThenSlot(el);
                          }}
                          className={FIRST_SHOWN}
                        >
                          {after}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </ClearedCtx.Provider>
          </StageCtx.Provider>
        </GateCtx.Provider>
        {/* a soft edge that says "more below"; at the very end it only covers the bottom padding */}
        <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -mt-6 h-6 bg-linear-to-t from-surface" />
      </div>

      {/* ---- bottom bar: what they found, back, Continue ------------------- */}
      <div className="shrink-0 border-t border-border bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-4">
        <div aria-live="polite">
          {onWidget && cleared && note ? (
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-accent/10 px-3 py-2 text-sm leading-snug font-medium text-accent-text transition duration-300 motion-reduce:transition-none starting:translate-y-2 starting:opacity-0">
              <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-accent text-xs text-accent-foreground">✓</span>
              <span>{note}</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="আগের পাতা"
            onClick={back}
            disabled={at === 0 && page === 0}
            className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full border border-border text-lg text-muted transition-colors hover:border-accent hover:text-foreground disabled:cursor-default disabled:opacity-30 disabled:hover:border-border"
          >
            <span aria-hidden="true">←</span>
          </button>
          {locked ? (
            <button type="button" disabled title="কাজটা করলেই সামনে যাওয়া যাবে" className={`${bigBtn} cursor-not-allowed bg-border text-muted`}>
              {at < last || page < lastPage ? (
                <>
                  এগিয়ে যান <span aria-hidden="true">→</span>
                </>
              ) : (
                "শেষ ধাপ"
              )}
            </button>
          ) : page === W && explains ? (
            <button type="button" onClick={forward} className={`${bigBtn} ${goBtn}`}>
              ব্যাখ্যাটা দেখুন <span aria-hidden="true">→</span>
            </button>
          ) : at < last || page < lastPage ? (
            <button type="button" onClick={forward} className={`${bigBtn} ${goBtn}`}>
              এগিয়ে যান <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button type="button" onClick={() => go(0)} className={`${bigBtn} border border-border text-foreground hover:border-accent`}>
              <span aria-hidden="true">↺</span> আবার Start থেকে
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** The first block of a screen sits flush with its top. */
const FIRST = "[&>*:first-child]:mt-0!";
/** The same, when earlier blocks are hidden with display:none rather than removed. */
const FIRST_SHOWN = "[&>*:not([style*='display:_none'])]:first-of-type:mt-0!";

/** Slide in from the side we are heading to; shown again, a hidden screen replays it. */
const enter = (dir: number) =>
  `transition duration-500 ease-out motion-reduce:transition-none ${
    dir > 0 ? "starting:translate-x-10 starting:opacity-0" : "starting:-translate-x-10 starting:opacity-0"
  }`;

/** Children of an element, minus MDX's blank-line strings. */
function partsOf(node: ReactNode): ReactNode[] {
  if (!isValidElement(node)) return [node];
  const own = (node as ReactElement<{ children?: ReactNode }>).props.children;
  return Children.toArray(own).filter((c) => !(typeof c === "string" && !c.trim()));
}

/**
 * Plain markdown (a paragraph, a heading, display math) rather than a component;
 * or a figure marked `story` (`<FairGate story />`), which acts out the setup
 * words and flows with them onto the story screens, so it is never the widget.
 */
const isProse = (c: ReactNode) =>
  isValidElement(c) && (typeof c.type === "string" || (c.props as { story?: unknown }).story === true);

/**
 * The step's widget (its first component) wrapped to grow on a bigger screen
 * (GROW_WIDGET); the words and story scenes around it keep their size. One
 * wrapper per widget, so the blocks still line up one-to-one with `main`.
 */
function growWidget(main: ReactNode[]): ReactNode[] {
  const w = main.findIndex((c) => !isProse(c));
  if (w < 0) return main;
  return main.map((c, i) =>
    i === w ? (
      <div key={isValidElement(c) && c.key != null ? `grow${c.key}` : "grow"} className={GROW_WIDGET}>
        {c}
      </div>
    ) : (
      c
    ),
  );
}

/**
 * A step's two halves: `main` (story, widget, and a <Then>, which renders
 * itself on the explanation screen) and `after`: in journeys written before
 * <Then>, the paragraphs after the last component, which are the explanation.
 */
function splitStep(step: ReactNode): { main: ReactNode[]; after: ReactNode[] } {
  const kids = partsOf(step);
  let lastWidget = -1;
  kids.forEach((c, i) => {
    if (!isProse(c)) lastWidget = i;
  });
  if (lastWidget < 0) return { main: kids, after: [] };
  return { main: kids.slice(0, lastWidget + 1), after: kids.slice(lastWidget + 1) };
}

const isHeading = (el: Element) => /^H[1-6]$/.test(el.tagName);
/** A block that is nothing but display math ($$…$$ renders as a paragraph holding one .katex). */
function isFormula(el: Element) {
  const math = el.firstElementChild;
  if (el.childElementCount !== 1 || !math?.classList.contains("katex")) return false;
  return (el.textContent ?? "").trim() === (math.textContent ?? "").trim();
}

/**
 * Break the block children of `el` into screens, greedily: as many blocks per
 * screen as `roomFor(screen)` holds. A heading never ends a screen, a display
 * formula never starts one. Returns the index each later screen starts at.
 */
function packBlocks(el: HTMLElement, roomFor: (screen: number) => number, count = el.children.length, end?: number): number[] {
  const els = Array.from(el.children).slice(0, count) as HTMLElement[];
  if (els.length < 2) return [];
  const top0 = els[0].getBoundingClientRect().top;
  const topOf = (i: number) => (i < els.length ? els[i].getBoundingClientRect().top - top0 : (end ?? el.getBoundingClientRect().bottom - top0));
  const starts: number[] = [];
  let from = 0;
  for (let i = 1; i < els.length; i++) {
    if (topOf(i + 1) - topOf(from) <= roomFor(starts.length)) continue;
    let at = i;
    while (at - 1 > from && (isHeading(els[at - 1]) || isFormula(els[at]))) at--;
    starts.push(at);
    from = at;
  }
  return starts;
}

/**
 * Where a step's story and widget should break into screens, measured from
 * their whole render in `el`. Returns the index each story screen after the
 * first starts at, then the index the widget's screen starts at; [] = one
 * screen. Only the words before the first component move. The widget's screen
 * keeps the longest run of the last paragraphs that fits with it (`room`); the
 * rest fill story screens (`storyRoom`, which has no Task in the top bar).
 */
function planStory(main: ReactNode[], el: HTMLElement, room: number, storyRoom: number): number[] {
  const w = main.findIndex((c) => !isProse(c));
  const els = Array.from(el.children) as HTMLElement[];
  if (!els.length) return [];
  const top0 = els[0].getBoundingClientRect().top;
  const topOf = (i: number) => els[i].getBoundingClientRect().top - top0;
  const end = el.getBoundingClientRect().bottom - top0;
  if (end <= room) return [];
  // Only words (a <Then> draws nothing here): they fill as many screens as they need.
  if (w < 0 || els.length <= w) return packBlocks(el, () => storyRoom);
  if (w === 0) return [];

  // The widget keeps the last paragraphs keep… that still fit beside it.
  let keep = w;
  while (keep > 1 && end - topOf(keep - 1) <= room) keep--;
  while (keep < w && isHeading(els[keep - 1])) keep++; // a heading goes with what follows it
  if (els.slice(0, keep).every(isHeading)) return []; // a screen of headings alone helps no one
  return [...packBlocks(el, () => storyRoom, keep, topOf(keep)), keep];
}

/** Whether the step on stage is done. True outside a Journey, so `Then` still shows in a plain article. */
const ClearedCtx = createContext(true);

/**
 * The words that belong after the task: what the reader just found, told as
 * story. In a Journey they get their own screens once the task is done, so an
 * explanation never gives away the answer before the reader has played. In a
 * plain article they show where they are written.
 */
export function Then({ children }: { children: ReactNode }) {
  const cleared = useContext(ClearedCtx);
  const stage = useContext(StageCtx);
  const announce = stage?.announceThen;
  useLayoutEffect(() => announce?.(), [announce]);
  if (stage) return stage.thenSlot && cleared ? createPortal(children, stage.thenSlot) : null;
  if (!cleared) return null;
  return <div className="mt-6 border-t border-border pt-5">{children}</div>;
}

/**
 * The one thing a screen asks the reader to do, ticked when done. In a Journey
 * it is pinned in the top bar wherever the screen puts it, so the instruction
 * comes before the widget; in a plain article it stays where it is written.
 */
export function Task({ done, children }: { done: boolean; children: ReactNode }) {
  const stage = useContext(StageCtx);
  const card = (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[0.95rem] leading-snug transition-colors duration-300 motion-reduce:transition-none ${
        done ? "border-accent/40 bg-accent/10" : "border-dashed border-muted/40"
      } ${stage ? "py-2 text-sm sm:text-[0.95rem]" : "mt-4"}`}
    >
      <span
        className={`mt-px grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-300 ${
          done ? "bg-accent text-accent-foreground" : "border-2 border-muted/50"
        }`}
        aria-hidden="true"
      >
        {done ? "✓" : ""}
      </span>
      {/* pinned and done, it steps back to one line and gives the screen its room */}
      <span className={stage && done ? "line-clamp-1" : undefined}>{children}</span>
    </div>
  );
  if (!stage) return card;
  // The slot exists from the Journey's first commit; before that there is nowhere to pin it.
  return stage.taskSlot ? createPortal(card, stage.taskSlot) : null;
}

/**
 * A multiple-choice check that lets the reader try again, Brilliant-style: a
 * wrong pick nudges and stays marked, the right one unlocks the screen and
 * reveals `children` (the explanation, a picture) underneath.
 */
export function Check({
  question,
  options,
  answer,
  hint,
  praise = "ঠিক ধরেছেন!",
  children,
}: {
  question: string;
  options: string[];
  answer: number;
  /** shown after the first wrong pick */
  hint?: ReactNode;
  praise?: ReactNode;
  children?: ReactNode;
}) {
  const pass = useGate();
  const [wrong, setWrong] = useState<number[]>([]);
  const [won, setWon] = useState(false);

  const choose = (i: number) => {
    if (won) return;
    if (i === answer) {
      setWon(true);
      pass(praise);
    } else setWrong((w) => (w.includes(i) ? w : [...w, i]));
  };

  return (
    // data-nogrow: a question to read, so it keeps the page's text size on a big screen
    <div className="mt-2" data-nogrow>
      <div className="text-xl leading-snug font-semibold text-balance">{question}</div>
      <div className="mt-5 flex flex-col gap-2.5">
        {options.map((opt, i) => {
          const isWrong = wrong.includes(i);
          const isRight = won && i === answer;
          return (
            <button
              key={i}
              type="button"
              disabled={won || isWrong}
              onClick={() => choose(i)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default ${
                isRight
                  ? "win-pop border-accent bg-accent text-accent-foreground"
                  : isWrong
                    ? "nudge border-danger/50 bg-danger/5 text-danger"
                    : won
                      ? "border-border opacity-50"
                      : "border-border hover:border-accent hover:bg-accent/5"
              }`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-current/30 text-sm font-semibold">
                {isRight ? "✓" : isWrong ? "✕" : String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {!won && wrong.length > 0 && hint ? (
        <div className="mt-3 rounded-xl bg-cat-amber/10 px-3.5 py-2.5 text-[0.95rem] leading-snug transition duration-300 starting:opacity-0">
          <b className="font-semibold">একটা hint:</b> {hint}
        </div>
      ) : null}
      {won && children ? (
        <div className="mt-4 transition duration-500 motion-reduce:transition-none starting:translate-y-3 starting:opacity-0">
          {children}
        </div>
      ) : null}
    </div>
  );
}
