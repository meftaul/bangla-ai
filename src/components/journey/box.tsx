"use client";

import { useEffect, useState } from "react";

import { FADE, POP, useSeed, useSeeded } from "./kit";

// The box — the dot product — and the one place it is drawn for the whole app.
//
// Everywhere a lesson shows a dot product, the reader should watch it happen
// rather than read the finished sum: slot 1 pairs with slot 1 and multiplies,
// slot 2 with slot 2, and only then do the products add up. So both pieces
// here play themselves out, beat by beat:
//
//   DotBox  the amber card of rows (4.1's machine, imported by the later 4.x
//           journeys). Give it `k` to drive the beats from a screen; leave `k`
//           off and it runs itself once the reader can see it.
//   BoxRun  the same sum drawn as two lists with the pairing shown, for the
//           places that used to print "w · v = 4 + 3 = 7" as one dead line.
//
// A run starts when the box scrolls into view (a box far down the page would
// otherwise finish before the reader arrived) and restarts whenever the
// numbers change, so a tap-driven screen replays it. Reduced motion and
// `npm run shot` open on the finished state.
//
// Tailwind only, on the site's theme tokens.

/** the box: multiply slot by slot, then add */
export const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
/** a machine number: at most two decimals, lakh-style commas, a real minus */
export const num = (n: number) => {
  const r = Math.round(n * 100) / 100 || 0;
  const s = Math.abs(r).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return r < 0 ? `−${s}` : s;
};
export const tupN = (v: readonly number[]) => `(${v.map(num).join(", ")})`;

/**
 * A list as the reader sees it on screen, where every number says what it
 * counts: hover (or tap) the 2 in (2, 0, 0) and "মাছ" pops up over it. Use
 * this, not a bare tupN, wherever a list of counts is shown in a journey.
 */
export function Tup({ v, of }: { v: readonly number[]; of: readonly string[] }) {
  return (
    <span className="whitespace-nowrap">
      (
      {v.map((n, i) => (
        <span key={i}>
          {i > 0 && ", "}
          <span
            tabIndex={0}
            aria-label={`${num(n)} ${of[i]}`}
            className="group/tup relative cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-2 outline-none hover:text-foreground focus:text-foreground"
          >
            {num(n)}
            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 font-sans text-[0.7rem] whitespace-nowrap text-background opacity-0 transition-opacity group-hover/tup:opacity-100 group-focus/tup:opacity-100 motion-reduce:transition-none">
              {of[i]}
            </span>
          </span>
        </span>
      ))}
      )
    </span>
  );
}
/** a factor on one line: a negative one wears brackets, as the lessons write it */
const par = (n: number) => (n < 0 ? `(${num(n)})` : num(n));

/**
 * Beats 0…steps, played once `el` is on screen, and again from the start
 * whenever `key` changes. The caller holds the element in state and hands it
 * in (`ref={setEl}`), so no ref object crosses the hook's edge and the
 * compiler lint stays happy. A preview or reduced motion starts on the last
 * beat.
 */
function useRun(steps: number, ms: number, key: string, el: HTMLElement | null) {
  const seeded = useSeeded();
  const [k, setK] = useSeed("run", seeded ? steps : 0);
  const [seen, setSeen] = useState(false);

  // Wait until it is worth watching: on screen, and not asked to hold still.
  useEffect(() => {
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setK(steps);
      return;
    }
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setSeen(true), { rootMargin: "-10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [el, steps, setK]);

  // New numbers (the reader moved something): run it again from the start —
  // but only once they settle, or a drag would restart it on every frame and
  // the sum would never land.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setK(0), 350);
    return () => clearTimeout(t);
  }, [key, setK]);

  useEffect(() => {
    if (!seen || k >= steps) return;
    const t = setTimeout(() => setK(k + 1), k === 0 ? Math.max(260, ms - 200) : ms);
    return () => clearTimeout(t);
  }, [seen, k, steps, ms, setK]);

  return k;
}

const WORDS = {
  bn: { build: "box তৈরি", each: "ঘরে ঘরে গুণ", sum: "সব যোগ", lone: "জোড়া নাই" },
  en: { build: "the box, opening", each: "slot by slot", sum: "add them up", lone: "no partner" },
};
export type BoxLang = keyof typeof WORDS;

/**
 * The box, opened: row i pairs slot i of each list and multiplies them; the
 * sum comes once the last row is up. Pass `k` to step it from a screen, or
 * leave it off to let it play itself. A slot with no partner jams the box and
 * no sum appears. `dense` drops the row names for a half-width card.
 */
export function DotBox({
  a,
  b,
  k,
  names,
  unit = "",
  dense = false,
  lang = "bn",
}: {
  a: readonly number[];
  b: readonly number[];
  k?: number;
  names?: readonly string[];
  unit?: string;
  dense?: boolean;
  lang?: BoxLang;
}) {
  const n = Math.max(a.length, b.length);
  const jam = a.length !== b.length;
  const w = WORDS[lang];
  // Driven by the screen, or by itself: one beat per row, then one for the sum.
  const [el, setEl] = useState<HTMLElement | null>(null);
  const run = useRun(n + 1, 620, `${a.join()}|${b.join()}`, el);
  const at = k ?? run;
  const rows = Array.from({ length: Math.min(at, n) }, (_, i) => i);
  return (
    <div
      ref={setEl}
      className={`mx-auto w-full rounded-2xl border-2 border-cat-amber/40 bg-cat-amber/5 font-mono ${
        dense ? "px-2 py-1.5 text-[0.78rem]" : "max-w-xs px-3 py-2 text-sm"
      }`}
    >
      {rows.length === 0 && <div className="py-1 text-center font-sans text-xs text-muted">{w.build}</div>}
      {rows.map((i) => {
        const lone = a[i] === undefined || b[i] === undefined;
        // The row just landed: hold the pair lit for one beat, so the eye
        // catches which two slots went together.
        const fresh = i === at - 1 && at <= n;
        return (
          <div
            key={i}
            className={`${FADE} flex items-baseline justify-between gap-2 rounded-md leading-relaxed transition-colors duration-500 motion-reduce:transition-none ${
              fresh ? "bg-cat-amber/20" : ""
            }`}
          >
            {names && !dense && <span className="font-sans text-xs text-muted">{names[i]}</span>}
            {lone ? (
              <span className="text-danger">
                {num(a[i] ?? b[i])} × ? <span className="font-sans text-xs">{w.lone}</span>
              </span>
            ) : (
              <span className={dense ? "ml-auto" : ""}>
                {num(a[i])} × {num(b[i])} ={" "}
                <b key={`${i}-${a[i]}-${b[i]}`} className={`${POP} inline-block`}>
                  {num(a[i] * b[i])}
                </b>
              </span>
            )}
          </div>
        );
      })}
      {at > n && !jam && (
        <div className={`${FADE} mt-1 flex items-baseline justify-between gap-2 border-t border-cat-amber/40 pt-1 ${dense ? "" : "text-base"}`}>
          <span className="font-sans text-xs text-muted">{w.sum}</span>
          <b key={dot(a, b)} className={`${POP} inline-block`}>
            {num(dot(a, b))}
            {unit}
          </b>
        </div>
      )}
    </div>
  );
}

/** One slot of a list: lit while its turn is running, quiet before and after. */
function Slot({ v, on, done, tone }: { v: number; on: boolean; done: boolean; tone: string }) {
  return (
    <span
      className={`inline-block rounded-md px-1.5 py-0.5 text-center font-mono transition-[background-color,color,scale] duration-300 motion-reduce:transition-none ${
        on ? `scale-110 ${tone} font-bold` : done ? "text-foreground/45" : "text-foreground"
      }`}
    >
      {num(v)}
    </span>
  );
}

/**
 * The box happening, in full: the two lists one above the other, each pair
 * lighting up in turn and dropping its product, then the products adding up
 * to the answer. This is what a lesson shows instead of printing the finished
 * "w · v = 4 + 3 = 7".
 *
 * `aName`/`bName` name the two lists (w and v, the rope and the river); `k` drives
 * the beats from a screen that has its own, and left off it plays itself.
 */
export function BoxRun({
  a,
  b,
  aName = "w",
  bName = "v",
  k,
  unit = "",
  lang = "bn",
  ms = 800,
  dense = false,
  live = false,
  inline = false,
  noSum = false,
  tone = "plain",
}: {
  a: readonly number[];
  b: readonly number[];
  aName?: string;
  bName?: string;
  k?: number;
  unit?: string;
  lang?: BoxLang;
  ms?: number;
  /** half height, for a box that sits in a list of steps rather than on its own */
  dense?: boolean;
  /** a readout the reader is dragging: the pairing stays open and the numbers follow the hand */
  live?: boolean;
  /** one line for a tight spot: the terms land one at a time, then the total */
  inline?: boolean;
  /** stop at the terms: for a card that lands the answer itself, underneath */
  noSum?: boolean;
  tone?: "plain" | "good" | "bad";
}) {
  const n = Math.min(a.length, b.length);
  const w = WORDS[lang];
  const [el, setEl] = useState<HTMLElement | null>(null);
  const run = useRun(n + 1, ms, `${a.join()}|${b.join()}`, el);
  const at = live ? n + 1 : (k ?? run);
  const ring = tone === "good" ? "border-accent bg-accent/10" : tone === "bad" ? "border-danger/50 bg-danger/5" : "border-cat-amber/40 bg-cat-amber/5";
  const total = dot(a.slice(0, n), b.slice(0, n));
  const cols = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };

  // One line: no room for a card, so the multiply-then-add happens term by term
  // along the line itself.
  if (inline)
    return (
      <span ref={setEl} className="font-mono">
        {Array.from({ length: n }, (_, i) => (
          // the line may wrap between terms, never inside one
          <span key={i} className={`whitespace-nowrap ${at > i ? FADE : "opacity-0"}`}>
            {i > 0 ? " + " : ""}
            <span className={at === i + 1 ? "text-cat-amber" : ""}>
              {par(a[i])} × {par(b[i])}
            </span>
          </span>
        ))}
        {at > n && !noSum && (
          <span className={`whitespace-nowrap ${FADE}`}>
            {" = "}
            <b key={total} className={`${POP} inline-block`}>
              {num(total)}
              {unit}
            </b>
          </span>
        )}
      </span>
    );

  return (
    <div
      ref={setEl}
      className={`mx-auto w-full rounded-2xl border-2 ${ring} ${dense ? "max-w-[13rem] px-2 py-1" : "max-w-[17rem] px-3 py-2"}`}
    >
      <div className={`grid grid-cols-[1.4rem_1fr] items-center gap-x-1.5 ${dense ? "text-[0.78rem]" : "text-sm"}`}>
        <span className="font-mono text-xs text-cat-coral">{aName}</span>
        <div className="grid justify-items-center" style={cols}>
          {a.slice(0, n).map((x, i) => (
            <Slot key={i} v={x} on={at === i + 1} done={at > i + 1} tone="bg-cat-coral/25 text-cat-coral" />
          ))}
        </div>
        <span className="font-mono text-xs text-cat-blue">{bName}</span>
        <div className="grid justify-items-center" style={cols}>
          {b.slice(0, n).map((x, i) => (
            <Slot key={i} v={x} on={at === i + 1} done={at > i + 1} tone="bg-cat-blue/25 text-cat-blue" />
          ))}
        </div>
      </div>

      {/* the pair drops into its product */}
      {/* live: no drop row at all — the columns line the pair up and the sum
          line spells the products, so a dragged readout stays one card tall */}
      <div className={`grid grid-cols-[1.4rem_1fr] items-start gap-x-1.5 ${dense ? "" : "mt-1"} ${live ? "hidden" : ""}`}>
        <span className={`font-sans text-[0.62rem] leading-4 text-muted ${dense ? "invisible" : ""}`}>{at <= n ? w.each : w.sum}</span>
        <div className="grid items-start" style={cols}>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="flex flex-col items-center">
              <span
                className={`w-0.5 origin-top rounded-full bg-cat-amber/70 transition-[scale] duration-300 motion-reduce:transition-none ${dense ? "h-1.5" : "h-3"} ${
                  at > i ? "scale-y-100" : "scale-y-0"
                }`}
              />
              {/* live: the sum line below already spells the products, so the
                  tick alone marks the pair and the card stays short */}
              {at > i && !live && (
                <span key={`${a[i]}-${b[i]}`} className={`${POP} inline-block font-mono text-[0.78rem] leading-5 font-bold`}>
                  {num(a[i] * b[i])}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={`mt-1 border-t border-current/15 pt-1 text-center font-mono ${dense ? "text-[0.78rem]" : "text-sm"}`}>
        <span className="text-cat-coral">{aName}</span> · <span className="text-cat-blue">{bName}</span> ={" "}
        {at > n ? (
          <span className={FADE}>
            {a.slice(0, n).map((x, i) => (
              <span key={i}>
                {i > 0 ? " + " : ""}
                {num(x * b[i])}
              </span>
            ))}{" "}
            ={" "}
            <b key={total} className={`${POP} inline-block text-accent-text`}>
              {num(total)}
              {unit}
            </b>
          </span>
        ) : (
          <span className="text-muted">?</span>
        )}
      </div>
    </div>
  );
}
