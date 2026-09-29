"use client";

import Link from "next/link";
import { useState, type Ref } from "react";

import { bn } from "@/components/interactive/figure-kit";
import type { Stop } from "@/content/rail";
import { CLASS_LABEL, classOf, useRail } from "@/lib/rail";

import { Hawker } from "./hawker";
import { Board, Ticket } from "./parts";
import { SoundToggle } from "./sound-toggle";

/**
 * A journey's ending when it is a station: the board drops in, a hawker comes
 * to the window with one question about the ride (only the first time here),
 * then the station hands over its tool, and the ticket for the next ride prints out of the
 * counter, its class set by how this ride went. What the reader found on the
 * way follows, as on the plain ending. Focused on arrival.
 */
export function Arrival({
  ref,
  stop,
  next,
  checks,
  found,
  onAgain,
}: {
  ref: Ref<HTMLDivElement>;
  stop: Stop;
  /** the next published station: where the ticket runs to (none at the end of the network) */
  next: Stop | undefined;
  /** this ride's checks: how many, and how many passed on the first try */
  checks: { total: number; first: number };
  found: string[];
  onAgain: () => void;
}) {
  const rail = useRail();
  const score = checks.total ? checks.first / checks.total : null;
  const cls = classOf(score);
  const Icon = stop.tool.icon;
  const lineEnd = stop.n === stop.line.stations.length;
  // The hawker comes by once per station: on a later arrival he has been answered already.
  const [asking, setAsking] = useState(() => !(stop.slug in rail.hawker));
  const star = rail.hawker[stop.slug] === true;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      aria-labelledby="rail-arrival"
      className="relative flex min-h-full flex-col items-center gap-6 overflow-hidden px-4 pt-6 pb-10 outline-none sm:px-8"
    >
      {/* the platform's yellow edge line, at the foot of the screen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2 opacity-80"
        style={{ background: "repeating-linear-gradient(90deg,#f3c623 0 26px,#141414 26px 34px)" }}
      />

      {/* the platform board hangs from the roof on two rods, and swings to rest */}
      <div className="rail-drop -mt-6 grid justify-items-center">
        <div className="rail-swing grid justify-items-center">
          <div aria-hidden="true" className="h-8 w-3/5 border-x-[3px] border-muted/60" />
          <Board stop={stop} size="lg" sub={`${stop.code} · ${stop.line.train.en.toUpperCase()}`} />
        </div>
      </div>
      <div id="rail-arrival" className="sr-only">
        {stop.bn} স্টেশনে পৌঁছে গেছেন।
      </div>

      {asking ? <Hawker stop={stop} onDone={() => setAsking(false)} /> : null}

      <div className={`${asking ? "hidden" : "grid"} w-full max-w-3xl items-center gap-6 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]`}>
        <div className="rail-pop surface-card grid gap-2.5 p-4">
          <div className="text-[0.7rem] font-semibold tracking-[0.12em] text-muted uppercase">স্টেশনের উপহার</div>
          <div className="grid size-20 place-items-center rounded-2xl bg-accent/10 text-accent-text">
            <Icon size={48} weight="duotone" />
          </div>
          <div className="text-xl leading-tight font-bold">{stop.tool.name}</div>
          <div className="text-sm leading-snug text-muted">{stop.tool.does}</div>
          <div className="text-xs text-muted">
            {lineEnd ? (
              <>এই লাইনের শেষ যন্ত্র। এবার route map-এ গিয়ে {stop.line.machine.name} বানান।</>
            ) : (
              <>ট্রাংকে রাখা হলো। লাইনের শেষে এটা দিয়ে {stop.line.machine.name} বানাবেন।</>
            )}
          </div>
        </div>

        {next ? (
          <div className="grid justify-items-center gap-2">
            <div className="text-[0.7rem] font-semibold tracking-[0.12em] text-muted uppercase">টিকেট ঘর · পরের যাত্রার টিকেট</div>
            <div aria-hidden="true" className="h-3 w-full max-w-[35rem] rounded-full bg-foreground/80" />
            <div className="-mt-4 w-full max-w-[35rem] overflow-hidden px-1 pb-3">
              <div className="rail-print">
                <Ticket from={stop} to={next} cls={cls} on={rail.arrived[stop.slug]?.on ?? new Date().toISOString()} seat={rail.seat} star={star} />
              </div>
            </div>
            <div className="text-center text-sm text-muted">
              {checks.total ? (
                <>
                  টিকেট চেক {bn(checks.total)}টা, প্রথম চেষ্টায় পার {bn(checks.first)}টা।{" "}
                  <b className="font-semibold text-foreground">{CLASS_LABEL[cls].bn}</b> ক্লাসে যাবেন।
                  {cls !== "snigdha" ? " সব প্রথম চেষ্টায় পার হলে স্নিগ্ধা।" : ""}
                </>
              ) : (
                <>এই যাত্রায় টিকেট চেক ছিল না।</>
              )}
              {next.line !== stop.line ? (
                <>
                  {" "}
                  এখানে ট্রেন বদল: পরের ট্রেন <span className="font-semibold text-foreground">{next.line.train.bn}</span>।
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted">এটাই শেষ স্টেশন। পুরো লাইন ঘুরে এলেন।</div>
        )}
      </div>

      {found.length && !asking ? (
        <div className="w-full max-w-xl">
          <div className="text-sm font-semibold text-muted">পথে যা যা খুঁজে পেলেন</div>
          <ol className="mt-2 flex list-none flex-col gap-2 p-0">
            {found.map((n, i) => (
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

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
        <Link href="/dashboard/courses/math_for_ai" style={{ color: "inherit" }} className="text-muted underline-offset-2 hover:underline">
          Route map দেখুন
        </Link>
        <button type="button" onClick={onAgain} className="cursor-pointer text-muted underline-offset-2 hover:underline">
          <span aria-hidden="true">↺</span> আবার Start থেকে
        </button>
        <SoundToggle />
      </div>
    </div>
  );
}
