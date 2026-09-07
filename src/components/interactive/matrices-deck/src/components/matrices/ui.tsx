import type { CSSProperties, ReactNode, Ref } from "react";

import { fmt } from "./lib/math";

// The deck's shared vocabulary, extracted from the repeated markup in the
// original single-file deck. Styling lives in <DeckStyles /> (deck-styles.tsx),
// scoped under `.reveal` exactly like the other slide decks in this app.

/** Small uppercase mono kicker above a headline. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/** Speaker notes. Needs reveal's Notes plugin to be visible (press S). */
export function Notes({ children }: { children: ReactNode }) {
  return <aside className="notes">{children}</aside>;
}

export function Btns({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="btns" style={style}>
      {children}
    </div>
  );
}

/** A demo control. `on` is the selected state, not a disabled/loading state. */
export function Btn({
  on = false,
  onClick,
  children,
}: {
  on?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={on ? "btn on" : "btn"} onClick={onClick}>
      {children}
    </button>
  );
}

/**
 * A canvas host. `shape` picks the aspect ratio; `bare` drops the frame for
 * diagrams that shouldn't look like a panel. The ref is where a Sketch mounts.
 */
export function Stage({
  ref,
  shape = "sq",
  badge,
  tone,
  className = "",
  style,
}: {
  ref?: Ref<HTMLDivElement>;
  shape?: "sq" | "wide" | "h4" | "bare";
  badge?: ReactNode;
  tone?: "ok" | "no";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div ref={ref} className={`stage ${shape} ${className}`.trim()} style={style}>
      {badge != null && <span className={tone ? `badge ${tone}` : "badge"}>{badge}</span>}
    </div>
  );
}

export function Panel({
  children,
  tight = false,
  className = "",
  style,
}: {
  children: ReactNode;
  tight?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`panel${tight ? " tight" : ""} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

/**
 * Bracketed matrix / column-vector notation. `cols` drives the CSS grid, so a
 * 2×2 is `cols={2}` with four children and a column vector is `cols={1}`.
 * Colour a cell by its column with `col1` / `col2` / `col3`.
 */
export function Mat({
  cols,
  size,
  children,
  className = "",
  style,
}: {
  cols: number;
  size?: "sm" | "lg";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`mat${size ? ` ${size}` : ""} ${className}`.trim()} style={style}>
      <span className="g" style={{ "--c": cols } as CSSProperties}>
        {children}
      </span>
    </span>
  );
}

/** The 2×2 matrix readout used by the columns / playground / determinant slides. */
export function Mat2({ M, size }: { M: number[]; size?: "sm" | "lg" }) {
  return (
    <Mat cols={2} size={size}>
      <span className="col1">{fmt(M[0])}</span>
      <span className="col2">{fmt(M[1])}</span>
      <span className="col1">{fmt(M[2])}</span>
      <span className="col2">{fmt(M[3])}</span>
    </Mat>
  );
}

/** The token-in / box / token-out conveyor used by the two "machine" slides. */
export function Machine({
  input,
  output,
  children,
  height,
  boxWidth,
}: {
  input: ReactNode;
  output: ReactNode;
  children: ReactNode;
  /** CSS length — use cqw so the diagram tracks the deck canvas (see DeckStyles). */
  height?: string;
  boxWidth?: string;
}) {
  return (
    <div className="machine" style={height ? { height } : undefined}>
      <div className="rail" />
      <div className="tok in">{input}</div>
      <div className="mach-box" style={boxWidth ? { width: boxWidth } : undefined}>
        <small>the rule</small>
        {children}
      </div>
      <div className="tok out">{output}</div>
    </div>
  );
}
