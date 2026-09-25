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
  type Ref,
} from "react";
import { createPortal } from "react-dom";

import { bn } from "@/components/interactive/figure-kit";
import { COURSES } from "@/content/courses";
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
// stays with what follows it, a display formula with what precedes it. A screen
// that grows later (a guess reveals a figure) breaks again into more screens; one
// widget or figure that is too tall alone is zoomed down to fit. The screen
// scrolls only as a last resort, past that zoom's floor; content a tap adds
// below the fold is then scrolled into view.
//
// Progress (the step and screen, how far they got, whether the task in hand is
// done, what they found, whether they finished) is kept per browser in
// localStorage, so a phone reloading the tab in the background puts the reader
// back on the very screen they were on, with Continue as they left it.
// ponytail: per browser, not per user; move it to Supabase if readers switch
// devices, or if the Library should show which journeys are finished.
//
// Continue, when locked, still answers a tap: it says why and shakes the Task.
// A turn moves focus to the new screen and is announced, as is an unlock. After
// the last screen comes an ending: what the reader found, and where to go next.
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
  /** taps on a locked Continue on this screen; the Task shakes on each */
  nudged: number;
};
const StageCtx = createContext<StageApi | null>(null);

/** What a Journey keeps in localStorage, per lesson path. */
type Saved = {
  at?: number;
  furthest?: number;
  page?: number;
  /** the task of step `at` was done */
  cleared?: boolean;
  /** each step's pass note, by step, for the ending's recap */
  found?: Record<number, string>;
  /** on the ending now */
  finished?: boolean;
  /** reached the ending at least once */
  done?: boolean;
};

const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * What a Journey lends the <SideQuest>s inside it: the frame to take over (its
 * root), and a way to say a side quest is on, so the frame behind it goes quiet.
 */
type DetourApi = { host: HTMLElement | null; away: (on: boolean) => void };
const DetourCtx = createContext<DetourApi | null>(null);

export function Journey({
  title,
  detour,
  children,
}: {
  title?: string;
  /** a side quest's own journey, run over its parent's frame; `onExit` goes back to it */
  detour?: { onExit: () => void };
  children: ReactNode;
}) {
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
  // The step whose task was done before a reload (its gates re-register unpassed).
  const [solvedAt, setSolvedAt] = useState(-1);
  const [nudged, setNudged] = useState(0);
  // What each step's pass note said, for the ending's recap (text notes only).
  const [found, setFound] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const [next, setNext] = useState<string | null>(null);
  // Said to a screen reader on a turn.
  const [said, setSaid] = useState("");
  // The frame's root, which a side quest takes over, and whether one is on.
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [away, setAway] = useState(false);
  const detourApi = useMemo(() => ({ host, away: setAway }), [host]);
  const ids = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const measured = useRef<HTMLDivElement>(null);
  const ending = useRef<HTMLDivElement>(null);
  // The control last tapped: where it sat in the scrolled content, how tall the
  // screen was then, and when.
  const touched = useRef<{ top: number; height: number; t: number } | null>(null);
  const saveKey = useRef<string | null>(null);
  // Set by a turn the reader made, so only those move focus (not a restore or a re-split).
  const turned = useRef(false);
  const atNow = useRef(0);
  useEffect(() => {
    atNow.current = at;
  });

  const register = useCallback((id: string) => {
    setGates((g) => [...g, id]);
    return () => setGates((g) => g.filter((x) => x !== id));
  }, []);
  const pass = useCallback((id: string, n?: ReactNode) => {
    setPassed((p) => (p.includes(id) ? p : [...p, id]));
    if (n) setNote(n);
    if (typeof n === "string") setFound((f) => ({ ...f, [atNow.current]: n }));
  }, []);
  const gateApi = useMemo(() => ({ register, pass }), [register, pass]);

  const announceThen = useCallback(() => {
    setThens((n) => n + 1);
    return () => setThens((n) => n - 1);
  }, []);

  // This step's screens: story 0…W−1, widget W, explanation W+1…lastPage.
  const { main, after } = splitStep(steps[at]);
  const staged = growWidget(main);
  const widgetAt = main.findIndex((c) => !isProse(c));
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
  const cleared = at < furthest || at === solvedAt || gates.every((g) => passed.includes(g));
  const reachable = (i: number) => i <= Math.max(furthest, cleared ? at + 1 : at);
  const locked = !cleared && onWidget;
  // The Task belongs to the widget: keep it out of the top bar on every other screen.
  const stageApi = useMemo(
    () => ({ taskSlot: onWidget ? taskSlot : null, thenSlot: page > W ? thenSlot : null, announceThen, nudged }),
    [onWidget, taskSlot, page, W, thenSlot, announceThen, nudged],
  );

  const go = (to: number, toPage = 0) => {
    if (to < 0 || to > last || to === at || !reachable(to)) return;
    setDir(to > at ? 1 : -1);
    setFurthest((f) => Math.max(f, to));
    setAt(to);
    setPage(toPage);
    setPassed([]);
    setNote(null);
    setNudged(0);
    setFinished(false);
    turned.current = true;
    setSaid(`ধাপ ${bn(to + 1)} / ${bn(steps.length)}`);
  };
  const turn = (p: number) => {
    setDir(p > page ? 1 : -1);
    setPage(p);
    setNudged(0);
    turned.current = true;
    setSaid(`ধাপ ${bn(at + 1)}, ${p < W ? "গল্প" : p === W ? "কাজের screen" : "ব্যাখ্যা"}`);
  };
  const finish = () => {
    if (detour) return detour.onExit();
    setDir(1);
    setFinished(true);
    turned.current = true;
    setSaid("Journey শেষ।");
  };
  // A locked Continue is not dead: a tap (or →) says what is missing and shakes the Task.
  const nudge = () => setNudged((n) => n + 1);
  const atEnd = at === last && page === lastPage;
  const forward = () => (finished ? undefined : locked ? nudge() : !atEnd ? (page < lastPage ? turn(page + 1) : go(at + 1)) : finish());
  const back = () => {
    if (!finished) return page > 0 ? turn(page - 1) : go(at - 1, pagesOf(at - 1));
    turned.current = true;
    setFinished(false);
  };

  // A side quest opens with its first screen in focus: the reader has stepped into it.
  const isDetour = !!detour;
  useEffect(() => {
    if (isDetour) screen.current?.focus({ preventScroll: true });
  }, [isDetour]);

  // Every screen starts at its top; one the reader turned to takes the focus, so
  // a screen reader reads on from the new screen, not from the button.
  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    if (!turned.current) return;
    turned.current = false;
    (finished ? ending.current : screen.current)?.focus({ preventScroll: true });
  }, [at, page, finished]);

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

  // A screen is meant to be seen whole, never scrolled: a figure and the control
  // that drives it must be on screen together, or the reader turns a knob and
  // watches nothing. Breaks are planned on arrival, but a screen can grow after
  // (a guess reveals the graph paper, an explanation figure opens up). Then it
  // becomes more screens, as it would have on arrival:
  //   widget screen       the story words kept beside the widget move onto a
  //                       story screen of their own, before it;
  //   explanation screen  the blocks that no longer fit start the next screen.
  // Only what cannot be split, one widget or one figure alone, is zoomed down to
  // fit, as GROW_WIDGET zooms a widget up on a big screen; past FIT_MIN the words
  // get too small to read and the screen scrolls, the last resort. Never while a
  // part is still being measured whole: the breaks are planned at ×1.
  useLayoutEffect(() => {
    const root = scroller.current;
    const box = screen.current;
    if (!root || !box || cut === undefined || (page > W && afterCut === undefined)) return;
    const shown = (Array.from(box.children) as HTMLElement[]).find((c) => getComputedStyle(c).display !== "none");
    // A story screen stretches to the room to centre its words; fit the words.
    const el = (page < W ? shown?.firstElementChild : shown) as HTMLElement | null | undefined;
    if (!el) return;
    const w = widgetAt;
    let z = 1;
    el.style.zoom = "";
    const fit = () => {
      if (!el.getBoundingClientRect().height) return; // no longer on stage: display:none
      const s = getComputedStyle(box);
      const room = root.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom) - 2;
      // Measured at ×1, like the breaks.
      el.style.zoom = "";
      const h = el.getBoundingClientRect().height;
      if (h > room && split(room)) return; // the new breaks re-run this effect
      z = Math.max(FIT_MIN, Math.min(1, room / h));
      el.style.zoom = z === 1 ? "" : String(z);
    };
    const split = (room: number): boolean => {
      if (page < W) {
        // A story screen whose words grew (a font or picture came in late): the
        // blocks that no longer fit start a story screen of their own after it.
        const blocks = Array.from(el.children) as HTMLElement[];
        const limit = el.getBoundingClientRect().top + room;
        let j = blocks.findIndex((b, i) => i > 0 && b.getBoundingClientRect().bottom > limit);
        if (j < 0) return false;
        while (j > 1 && (isHeading(blocks[j - 1]) || isFormula(blocks[j]))) j--;
        const from = page ? cut[page - 1] : 0;
        setStoryCuts((c) => ({ ...c, [at]: [...cut.slice(0, page), from + j, ...cut.slice(page)] }));
        return true;
      }
      if (page === W) {
        const from = W ? cut[W - 1] : 0;
        if (w <= from) return false; // the widget is already alone
        const kept = Array.from(el.children).slice(0, w - from);
        if (kept.every(isHeading)) return false; // a screen of headings alone helps no one
        setStoryCuts((c) => ({ ...c, [at]: [...cut, w] }));
        setPage(W + 1);
        return true;
      }
      if (page > W && thenSlot && afterCut) {
        const k = page - W - 1;
        const blocks = (Array.from(thenSlot.children) as HTMLElement[]).map((b, i) => [b, i] as const).filter(([b]) => b.style.display !== "none");
        if (blocks.length < 2) return false;
        const limit = el.getBoundingClientRect().top + room;
        const over = blocks.findIndex(([b], j) => j > 0 && b.getBoundingClientRect().bottom > limit);
        if (over < 0) return false;
        let j = over;
        while (j > 1 && (isHeading(blocks[j - 1][0]) || isFormula(blocks[j][0]))) j--;
        const next = blocks[j][1];
        setAfterCuts((c) => ({ ...c, [at]: [...afterCut.slice(0, k), next, ...afterCut.slice(k)] }));
        return true;
      }
      return false;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    ro.observe(root);
    return () => {
      ro.disconnect();
      el.style.zoom = "";
    };
  }, [at, page, W, cut, afterCut, widgetAt, thenSlot]);

  // A turned phone, a window made shorter or taller, a web font (Bangla, KaTeX)
  // arriving after a step was measured: the old breaks are stale, so every other
  // step is measured again on arrival. The step in hand keeps its breaks, since
  // measuring whole would remount its widget; the effect above splits or fits
  // its screen if it no longer fits. A few px of height (a phone's toolbar) are
  // not a new screen.
  useEffect(() => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    const stale = () => {
      setStoryCuts((c) => ({ [at]: c[at] }) as Record<number, number[]>);
      setAfterCuts((c) => ({ [at]: c[at] }) as Record<number, number[]>);
    };
    const onResize = () => {
      if (window.innerWidth === width && Math.abs(window.innerHeight - height) < 80) return;
      width = window.innerWidth;
      height = window.innerHeight;
      stale();
    };
    window.addEventListener("resize", onResize);
    document.fonts?.addEventListener("loadingdone", stale);
    return () => {
      window.removeEventListener("resize", onResize);
      document.fonts?.removeEventListener("loadingdone", stale);
    };
  }, [at]);

  // Pick up where this browser left off. A layout effect, so the saved screen
  // (not screen 1) is what gets painted first.
  useLayoutEffect(() => {
    // A side quest starts fresh each time and is not kept: it is a short trip.
    if (detour) return;
    const key = `journey:${window.location.pathname}`;
    saveKey.current = key;
    // The lesson after this one in its course, for the ending. Client-side because
    // the MDX page does not tell the Journey its own slug.
    const slug = decodeURIComponent(window.location.pathname.replace(/^\/dashboard\/articles\//, ""));
    const course = COURSES.find((c) => c.items.includes(slug));
    const after = course?.items[course.items.indexOf(slug) + 1];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the pathname, which the server render cannot see
    setNext(after ? `/dashboard/articles/${after}` : null);
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as Saved | null;
      if (saved && Number.isInteger(saved.furthest) && Number.isInteger(saved.at)) {
        const f = Math.min(Math.max(0, saved.furthest!), last);
        const a = Math.min(Math.max(0, saved.at!), f);
        setFurthest(f);
        setAt(a);
        // The screen within the step; clamped below once the step is measured.
        if (Number.isInteger(saved.page)) setPage(Math.max(0, saved.page!));
        if (saved.cleared) setSolvedAt(a);
        if (saved.found && typeof saved.found === "object") setFound(saved.found);
        if (saved.finished && a === last) setFinished(true);
      }
    } catch {
      // storage blocked or corrupt: start from screen 1
    }
  }, [last, detour]);
  useEffect(() => {
    if (!saveKey.current) return;
    try {
      const done = finished || !!(JSON.parse(localStorage.getItem(saveKey.current) ?? "null") as Saved | null)?.done;
      const saved: Saved = { at, furthest, page, cleared, found, finished, done };
      localStorage.setItem(saveKey.current, JSON.stringify(saved));
    } catch {
      // storage blocked: progress just is not kept
    }
  }, [at, furthest, page, cleared, found, finished]);
  // A restored screen may no longer exist (a different screen size breaks the
  // step differently) or may be past a task that was not done: pull it back.
  useLayoutEffect(() => {
    if (cut === undefined) return;
    const max = !cleared || !explains ? W : afterCut === undefined ? page : lastPage;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a restored page checked against the step's measured screens
    if (page > max) setPage(max);
  }, [cut, afterCut, cleared, explains, page, W, lastPage]);

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

  // The other half: a tap that changes a figure in place adds nothing, so the
  // observer above stays quiet — and on a short screen the reader taps a control
  // and watches nothing happen, because the graph paper it drives is below the
  // fold. Bring that figure into view. Same limit as above: never so far that the
  // control just tapped leaves the screen, since the next tap must stay in reach.
  const showFigure = (el: Element) => {
    const root = scroller.current;
    const box = screen.current;
    if (!root || !box || !box.contains(el)) return;
    // A tap inside the figure needs no help: the reader is already looking at it.
    const figures = Array.from(box.querySelectorAll<SVGSVGElement>("svg[aria-label]")).filter((s) => !s.contains(el) && s.getBoundingClientRect().height > 0);
    if (!figures.length) return;
    const c = el.getBoundingClientRect();
    const near = (s: Element) => {
      const r = s.getBoundingClientRect();
      return Math.abs(r.top + r.height / 2 - (c.top + c.height / 2));
    };
    const f = figures.reduce((a, b) => (near(b) < near(a) ? b : a)).getBoundingClientRect();
    const view = root.getBoundingClientRect();
    const M = 12;
    // A figure taller than the screen shows from its top down, as much as fits.
    const want = Math.min(f.height, view.height - 2 * M);
    let by = 0;
    if (f.top < view.top + M) by = f.top - view.top - M;
    else if (f.top + want > view.bottom - M) by = f.top + want - view.bottom + M;
    if (by > 0) by = Math.min(by, c.top - view.top - 8);
    else if (by < 0) by = Math.max(by, c.bottom - view.bottom + 8);
    if (Math.abs(by) > 8) root.scrollBy({ top: by, behavior: calm() ? "auto" : "smooth" });
  };

  const touch = (e: { target: EventTarget; type: string }) => {
    const root = scroller.current;
    const box = screen.current;
    const t = e.target as Element;
    const control = t.closest?.("button, a, input, label, [role=slider], [role=application], svg") ?? null;
    const el = control ?? t;
    if (!root || !box || !el.getBoundingClientRect) return;
    const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
    // pointerdown and the click after it are one tap: keep the first spot.
    const prev = touched.current;
    if (prev && performance.now() - prev.t < 700) prev.t = performance.now();
    else touched.current = { top, height: box.offsetHeight, t: performance.now() };
    // pointerdown is too early to see what the tap changed; the click after it isn't.
    if (e.type === "pointerdown" || !control) return;
    const was = box.offsetHeight;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        // Content added below the fold is the observer's job, not this one.
        if (!screen.current || screen.current.offsetHeight - was >= 24) return;
        showFigure(control);
      }),
    );
  };

  // → / Enter to continue, ← to go back. A screen that wants the arrow keys for
  // itself (driving the robot) takes them first and calls preventDefault().
  // The listener is installed once and reads the newest actions through a ref.
  // A side quest on top takes the keys; Escape leaves it.
  const nav = useRef({ forward, back, away, exit: detour?.onExit });
  useEffect(() => {
    nav.current = { forward, back, away, exit: detour?.onExit };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (nav.current.away || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === "Escape" && nav.current.exit) return nav.current.exit();
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
    <div ref={setHost} data-journey className="relative flex h-full min-h-0 flex-col">
      <DetourCtx.Provider value={detourApi}>
      {/* ---- top bar: close, segmented progress, counter, the widget's task -- */}
      <div inert={away} className="shrink-0 border-b border-border px-4 pt-2.5 pb-3 sm:px-8 sm:pt-5">
        {detour ? (
          // A side quest says so on every screen, phone included: this is a trip off the road.
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="shrink-0 rounded-md bg-cat-amber/15 px-1.5 py-0.5 font-semibold text-cat-amber">Side quest</span>
            <span className="min-w-0 truncate font-semibold">{title}</span>
          </div>
        ) : title ? (
          <div className="mb-2 hidden truncate text-xs font-semibold tracking-wider text-accent-text uppercase sm:block">{title}</div>
        ) : null}
        <div className="flex items-center gap-2.5">
          {detour ? (
            <button
              type="button"
              onClick={detour.onExit}
              aria-label="মূল journey তে ফিরে যান"
              className="group/x -ml-1.5 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-2xl leading-none transition-colors hover:bg-foreground/5"
            >
              <span aria-hidden="true" className="text-muted group-hover/x:text-foreground">×</span>
            </button>
          ) : (
          <Link
            href="/dashboard/articles"
            aria-label="লাইব্রেরিতে ফিরে যান"
            // .article's unlayered `a` rule (accent, underline) beats utilities; only inline style wins
            style={{ color: "inherit", textDecoration: "none" }}
            className="group/x -ml-1.5 grid size-9 shrink-0 place-items-center rounded-full text-2xl leading-none transition-colors hover:bg-foreground/5"
          >
            <span aria-hidden="true" className="text-muted group-hover/x:text-foreground">×</span>
          </Link>
          )}
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
                <span className={`block h-2 w-full overflow-hidden rounded-full ${i > furthest ? "bg-border" : detour ? "bg-cat-amber/25" : "bg-accent/25"}`}>
                  <span
                    className={`block h-full rounded-full ${detour ? "bg-cat-amber" : "bg-accent"} transition-[width] duration-500 motion-reduce:transition-none`}
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
        <div ref={setTaskSlot} id={`${ids}-task`} aria-live="polite" className="mt-2.5 empty:hidden" />
      </div>

      {/* ---- the screen -------------------------------------------------------- */}
      <div
        ref={scroller}
        inert={away}
        onPointerDownCapture={touch}
        onClickCapture={touch}
        onKeyDownCapture={touch}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <GateCtx.Provider value={gateApi}>
          <StageCtx.Provider value={stageApi}>
            <ClearedCtx.Provider value={cleared}>
              <div
                ref={screen}
                key={at}
                tabIndex={-1}
                aria-label={`ধাপ ${bn(at + 1)} / ${bn(steps.length)}`}
                className={`${finished ? "hidden" : "flex"} min-h-full flex-col px-4 pt-5 pb-8 text-[1.07rem] leading-[1.75] outline-none sm:px-8 sm:pt-6`}
              >
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
        {finished ? <Ending ref={ending} title={title} steps={steps.length} found={found} next={next} onAgain={() => go(0)} /> : null}
        {/* a soft edge that says "more below"; at the very end it only covers the bottom padding */}
        <div aria-hidden="true" className="pointer-events-none sticky bottom-0 -mt-6 h-6 bg-linear-to-t from-surface" />
      </div>

      {/* ---- bottom bar: what they found, back, Continue ------------------- */}
      <div inert={away} className="shrink-0 border-t border-border bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-4">
        {/* a turn, said to a screen reader */}
        <div aria-live="polite" className="sr-only">
          {said}
        </div>
        <div aria-live="polite">
          {locked && nudged ? (
            <div
              key={nudged}
              className="nudge mb-3 flex items-start gap-2 rounded-xl bg-cat-amber/15 px-3 py-2 text-sm leading-snug font-medium motion-reduce:animate-none"
            >
              <span aria-hidden="true" className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-cat-amber text-xs font-bold text-white">
                !
              </span>
              <span>
                {taskSlot?.childElementCount
                  ? "আগে ওপরের কাজটা করে ফেলুন, তারপর সামনে যাওয়া যাবে।"
                  : "আগে এই screen-এর কাজটা করে ফেলুন, তারপর সামনে যাওয়া যাবে।"}
              </span>
            </div>
          ) : null}
          {onWidget && cleared && passed.length ? <span className="sr-only">কাজ শেষ। এখন সামনে যাওয়া যাবে।</span> : null}
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
            disabled={at === 0 && page === 0 && !finished}
            className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full border border-border text-lg text-muted transition-colors hover:border-accent hover:text-foreground disabled:cursor-default disabled:opacity-30 disabled:hover:border-border"
          >
            <span aria-hidden="true">←</span>
          </button>
          {finished ? (
            next ? (
              <Link href={next} style={{ textDecoration: "none" }} className={`${bigBtn} ${goBtn} text-accent-foreground!`}>
                পরের পাঠ <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <Link href="/dashboard/articles" style={{ textDecoration: "none" }} className={`${bigBtn} ${goBtn} text-accent-foreground!`}>
                লাইব্রেরিতে ফিরুন
              </Link>
            )
          ) : locked ? (
            // Not `disabled`: a disabled button swallows the tap and a screen reader
            // may skip it. This one says why it is locked, and on a tap, what to do.
            <button
              type="button"
              aria-disabled="true"
              aria-describedby={`${ids}-task ${ids}-lock`}
              onClick={nudge}
              className={`${bigBtn} cursor-not-allowed bg-border text-muted`}
            >
              {at < last || page < lastPage ? (
                <>
                  এগিয়ে যান <span aria-hidden="true">→</span>
                </>
              ) : (
                "শেষ ধাপ"
              )}
              <span id={`${ids}-lock`} className="sr-only">
                কাজটা শেষ হলে খুলবে।
              </span>
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
            <button type="button" onClick={finish} className={`${bigBtn} ${goBtn}`}>
              {detour ? "মূল journey তে ফিরুন" : "শেষ করুন"} <span aria-hidden="true">✓</span>
            </button>
          )}
        </div>
      </div>
      </DetourCtx.Provider>
    </div>
  );
}

/** The smallest a screen is zoomed to fit (see the fit effect in Journey). */
const FIT_MIN = 0.7;

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

/**
 * After the last screen: the lesson is done, what the reader found on the way
 * (each step's pass note), and where to go next. Focused on arrival.
 */
function Ending({
  ref,
  title,
  steps,
  found,
  next,
  onAgain,
}: {
  ref: Ref<HTMLDivElement>;
  title?: string;
  steps: number;
  found: Record<number, string>;
  next: string | null;
  onAgain: () => void;
}) {
  const notes = Object.keys(found)
    .map(Number)
    .sort((a, b) => a - b)
    .map((i) => found[i]);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      aria-labelledby="journey-ending"
      className="flex min-h-full flex-col items-center px-4 pt-8 pb-8 text-center outline-none sm:px-8 transition duration-500 ease-out motion-reduce:transition-none starting:translate-y-3 starting:opacity-0"
    >
      <div aria-hidden="true" className="win-pop grid size-16 place-items-center rounded-full bg-accent text-3xl text-accent-foreground">
        ✓
      </div>
      <div id="journey-ending" className="mt-4 text-2xl font-bold">
        শেষ!
      </div>
      <div className="mt-1 text-muted">
        {title ? `${title}: ` : ""}
        {bn(steps)}টা ধাপ শেষ করলেন।
      </div>
      {notes.length ? (
        <div className="mt-6 w-full max-w-xl text-left">
          <div className="text-sm font-semibold text-muted">পথে যা যা খুঁজে পেলেন</div>
          <ol className="mt-2 flex list-none flex-col gap-2 p-0">
            {notes.map((n, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl bg-accent/10 px-3 py-2 text-[0.95rem] leading-snug">
                <span aria-hidden="true" className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-accent text-xs text-accent-foreground">
                  ✓
                </span>
                <span>{n}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
        {next ? (
          <Link href="/dashboard/articles" style={{ color: "inherit" }} className="text-muted underline-offset-2 hover:underline">
            লাইব্রেরিতে ফিরুন
          </Link>
        ) : null}
        <button type="button" onClick={onAgain} className="cursor-pointer text-muted underline-offset-2 hover:underline">
          <span aria-hidden="true">↺</span> আবার Start থেকে
        </button>
      </div>
    </div>
  );
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
 * A side quest: a short trip off the lesson's road (a "why" the lesson can
 * skip, a story from the news, a reference table). One line in the
 * explanation; a tap takes the reader into it as a journey of its own, over the
 * lesson's frame: its own progress (amber), its own screens and tasks, × or
 * the last screen's button back to the very screen they left. The lesson
 * behind it stays mounted, with its state.
 *
 *   <SideQuest title="…">words and figures</SideQuest>     one step, paged like story screens
 *   <SideQuest title="…" journey><Step>…</Step>…</SideQuest>  steps, as in a <Journey>
 *
 * Outside a Journey (a plain article) it opens in a sheet over the page.
 */
export function SideQuest({ title, journey = false, children }: { title: string; journey?: boolean; children: ReactNode }) {
  const detour = useContext(DetourCtx);
  const [open, setOpen] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && !detour) sheet.current?.showModal();
  }, [open, detour]);
  const close = () => sheet.current?.close();

  const start = () => {
    setOpen(true);
    detour?.away(true);
  };
  const exit = () => {
    setOpen(false);
    detour?.away(false);
    requestAnimationFrame(() => card.current?.focus({ preventScroll: true }));
  };
  // Every block a screen of its own run of words: a figure here is watched, never the widget.
  const pages = Children.toArray(children)
    .filter((c) => !(typeof c === "string" && !c.trim()))
    .map((c, i) => <div key={i}>{c}</div>);

  return (
    <div className="mt-4" data-nogrow>
      <button
        ref={card}
        type="button"
        onClick={start}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-cat-amber/60 px-3.5 py-2.5 text-left text-[0.95rem] leading-snug transition-colors duration-200 hover:border-cat-amber hover:bg-cat-amber/5 motion-reduce:transition-none"
      >
        <span className="shrink-0 rounded-md bg-cat-amber/15 px-1.5 py-0.5 text-xs font-semibold text-cat-amber">Side quest</span>
        <span className="min-w-0 flex-1">{title}</span>
        <span aria-hidden="true" className="text-muted">
          →
        </span>
      </button>
      {open && detour?.host
        ? createPortal(
            <div role="region" aria-label={`Side quest: ${title}`} className={`absolute inset-0 z-30 flex flex-col bg-background ${enter(1)}`}>
              <Journey title={title} detour={{ onExit: exit }}>
                {journey ? children : <Step>{pages}</Step>}
              </Journey>
            </div>,
            detour.host,
          )
        : null}
      {open && !detour
        ? createPortal(
            <dialog
              ref={sheet}
              aria-label={title}
              onClose={() => setOpen(false)}
              onClick={(e) => e.target === e.currentTarget && close()}
              className="article m-auto max-h-[85svh] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground backdrop:bg-black/40"
            >
              <div className="sticky top-0 flex items-center gap-3 border-b border-border bg-background px-5 py-3">
                <span className="shrink-0 rounded-md bg-cat-amber/15 px-1.5 py-0.5 text-xs font-semibold text-cat-amber">Side quest</span>
                <span className="min-w-0 flex-1 font-semibold">{title}</span>
                <button type="button" onClick={close} aria-label="বন্ধ করুন" className="cursor-pointer rounded-lg px-2 py-1 text-muted hover:bg-foreground/5">
                  ✕
                </button>
              </div>
              <div className="px-5 pb-5">{children}</div>
            </dialog>,
            document.body,
          )
        : null}
    </div>
  );
}

/**
 * The one thing a screen asks the reader to do, ticked when done. In a Journey
 * it is pinned in the top bar wherever the screen puts it, so the instruction
 * comes before the widget; in a plain article it stays where it is written.
 */
export function Task({ done, children }: { done: boolean; children: ReactNode }) {
  const stage = useContext(StageCtx);
  // A tap on a locked Continue shakes the Task and outlines it, to say "this first".
  const nudged = !done && !!stage?.nudged;
  const card = (
    <div
      key={nudged ? stage?.nudged : 0}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[0.95rem] leading-snug transition-colors duration-300 motion-reduce:transition-none ${
        done ? "border-accent/40 bg-accent/10" : nudged ? "nudge border-2 border-cat-amber bg-cat-amber/10 motion-reduce:animate-none" : "border-dashed border-muted/40"
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
  praise,
  children,
}: {
  question: string;
  options: string[];
  answer: number;
  /** shown after the first wrong pick */
  hint?: ReactNode;
  /** the pass note: a one-line eureka, kept for the ending's recap */
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
      // Without a praise of its own, the default is shown but kept out of the ending's
      // recap (only string notes are recorded): "ঠিক ধরেছেন!" is not something found.
      pass(praise ?? <>ঠিক ধরেছেন!</>);
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
