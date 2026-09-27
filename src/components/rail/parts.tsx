import "./rail.css";

import type { Stop } from "@/content/rail";
import { CLASS_LABEL, type TicketClass } from "@/lib/rail";

// The railway's small parts, shared by the route map and the journey frame:
// the train, a station's name board, and the counter ticket.

/** Something the train just did: blew exhaust (a check passed, the horn) or lurched (a miss). */
export type TrainFx = { kind: "puff" | "jolt"; n: number } | null;

/**
 * A side-on intercity locomotive with one coach, facing right. Given an `fx`,
 * it plays it once: puffs drift back off the roof, or the whole train lurches
 * like a brake caught. A new `n` replays.
 */
export function Train({ className = "", fx = null }: { className?: string; fx?: TrainFx }) {
  return (
    <svg
      key={fx?.kind === "jolt" ? `j${fx.n}` : undefined}
      viewBox="0 0 120 40"
      aria-hidden="true"
      overflow="visible"
      className={`${className} ${fx?.kind === "jolt" ? "rail-jolt" : ""}`}
    >
      {fx?.kind === "puff" ? (
        <g key={`p${fx.n}`} className="rail-puff fill-muted">
          <circle cx="92" cy="6" r="4" />
          <circle cx="92" cy="6" r="5" />
          <circle cx="92" cy="6" r="6" />
        </g>
      ) : null}
      <rect x="2" y="8" width="70" height="22" rx="4" className="fill-accent" />
      <rect x="2" y="21" width="70" height="3" fill="#f3c623" />
      {[8, 22, 36, 50].map((x) => (
        <rect key={x} x={x} y="12" width="10" height="7" rx="1.5" className="fill-surface" />
      ))}
      <path d="M76 8h28c8 0 14 8 14 16v6H76z" className="fill-accent" />
      <path d="M76 21h42v3H76z" fill="#f3c623" />
      <path d="M104 11c5 1 9 5 10 9h-14v-9z" className="fill-surface" />
      <rect x="110" y="25" width="7" height="4" rx="1" className="fill-danger" />
      <rect x="72" y="16" width="4" height="10" className="fill-muted" />
      <g className="fill-foreground">
        {[14, 58, 86, 108].map((cx) => (
          <circle key={cx} cx={cx} cy="33" r="4" />
        ))}
      </g>
    </svg>
  );
}

/** A station's yellow name board: Bangla on top, English under it. */
export function Board({
  stop,
  size = "sm",
  dim = false,
  sub,
}: {
  stop: Pick<Stop, "bn" | "en">;
  size?: "sm" | "lg";
  dim?: boolean;
  /** a third line in print type, e.g. the code and the train */
  sub?: string;
}) {
  const lg = size === "lg";
  return (
    <div className={`rail-board ${dim ? "dim" : ""} ${lg ? "px-6 pt-2 pb-1.5 sm:px-9" : "px-2 pt-1 pb-0.5"}`}>
      <div className={`rail-board-bn ${lg ? "text-3xl sm:text-4xl" : "text-[0.95rem]"}`}>{stop.bn}</div>
      <div className={`rail-board-en ${lg ? "text-xl sm:text-2xl" : "text-xs"}`}>{stop.en}</div>
      {sub ? <div className="mt-1.5 font-ticket text-xs font-bold opacity-80">{sub}</div> : null}
    </div>
  );
}

/** "26 SEP 26", the way a date stamp prints it. */
export function stampDate(iso: string) {
  const d = new Date(iso);
  const m = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][d.getMonth()];
  return `${String(d.getDate()).padStart(2, "0")} ${m} ${String(d.getFullYear()).slice(2)}`;
}

/**
 * The ticket a station hands you for the next ride: from here, to the next
 * station, on the next station's train. Its class is how the ride here went;
 * the fare is what you learned here, so the ticket doubles as a recap.
 */
export function Ticket({
  from,
  to,
  cls,
  on,
  seat,
  small = false,
  punched = false,
  star = false,
}: {
  from: Stop;
  to: Stop;
  cls: TicketClass;
  /** ISO date of issue */
  on: string;
  seat: { coach: string; no: number } | null;
  small?: boolean;
  /** used: the checker has punched it */
  punched?: boolean;
  /** the hawker's question at `from` was right on the first try: a star punched in the stub */
  star?: boolean;
}) {
  const date = stampDate(on);
  const label = CLASS_LABEL[cls];
  return (
    <div
      className={`rail-ticket ${cls} ${small ? "small" : ""}`}
      role="img"
      aria-label={`টিকেট: ${from.bn} থেকে ${to.bn}, ${to.line.train.bn}, ${label.bn}, সিট ${seat?.no ?? "—"}`}
    >
      <div className="rail-ticket-main">
        <div className="rule flex items-center justify-between gap-2 pb-1.5">
          <div className="flex items-center gap-2">
            <span className="red grid size-7 shrink-0 place-items-center rounded-full border-2 border-current text-sm font-bold bn">প</span>
            <div className="red leading-none">
              <div className="bn text-[0.95rem] font-bold">পাঠশালা রেলওয়ে</div>
              {small ? null : <div className="board-face text-[0.65rem] font-extrabold tracking-[0.2em] uppercase">Pathshala Railway</div>}
            </div>
          </div>
          {small ? null : (
            <div className="text-right text-[0.7rem] leading-tight">
              No.
              <br />
              <b className="blue text-sm tracking-wider">
                PR-{to.line.train.no}-{String(to.index + 1).padStart(4, "0")}
              </b>
            </div>
          )}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <div className="grid min-w-0">
            <span className="label">From</span>
            <span className={`bn truncate font-bold ${small ? "text-base" : "text-xl"}`}>{from.bn}</span>
            <span className="board-face truncate text-xs font-extrabold tracking-widest uppercase">
              {from.en} · {from.code}
            </span>
          </div>
          <div className="blue grid justify-items-center gap-0.5 text-[0.65rem]">
            <svg viewBox="0 0 58 18" className="h-4 w-12" aria-hidden="true">
              <path d="M2 9h50M46 3l7 6-7 6" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            {small ? null : (
              <span className="bn whitespace-nowrap">
                {to.line.train.bn} {to.line.train.no}
              </span>
            )}
          </div>
          <div className="grid min-w-0 text-right">
            <span className="label">To</span>
            <span className={`bn truncate font-bold ${small ? "text-base" : "text-xl"}`}>{to.bn}</span>
            <span className="board-face truncate text-xs font-extrabold tracking-widest uppercase">
              {to.en} · {to.code}
            </span>
          </div>
        </div>
        {small ? null : (
          <>
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-1 text-[0.625rem] tracking-wider uppercase sm:grid-cols-4">
              <div className="grid">
                Journey<b className="text-sm tracking-normal normal-case">{to.line.no}.{to.n}</b>
              </div>
              <div className="grid">
                Date<b className="text-sm tracking-normal whitespace-nowrap">{date}</b>
              </div>
              <div className="grid">
                Coach<b className="bn text-sm tracking-normal">{seat?.coach ?? "—"}</b>
              </div>
              <div className="grid">
                Line<b className="text-sm tracking-normal">{to.line.no}</b>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2.5">
              <div className="max-w-[32ch] text-[0.7rem] leading-snug">
                Fare paid: <b className="blue">{from.tool.name.toLowerCase()}</b>
              </div>
              <div className="rail-stamp shrink-0">
                <span className="bn block text-[0.8rem] leading-none font-bold">শুভ যাত্রা</span>
                <span className="block text-[0.55rem] font-bold tracking-widest">{date}</span>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="rail-ticket-stub">
        <span className="label">Seat</span>
        <span className={`board-face blue leading-[0.9] font-black ${small ? "text-3xl" : "text-5xl"}`}>{seat?.no ?? "—"}</span>
        <span className="bn text-[0.8rem] leading-tight font-bold">{label.bn}</span>
        <div className="bars" />
        {punched ? <span className="rail-punch absolute top-1/2 right-3" /> : null}
        {star ? <span title="হকারের প্রশ্ন, প্রথমবারেই" className="rail-punch rail-star absolute top-3 left-2.5" /> : null}
      </div>
    </div>
  );
}
