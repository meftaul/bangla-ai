"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentType } from "react";

import { bn } from "@/components/interactive/figure-kit";
import { RAIL, railNet, type Line, type RailNet, type Stop } from "@/content/rail";
import { buildMachine, classOf, finishedBefore, toggleFitted, useRail, type RailState } from "@/lib/rail";

import { Board, Ticket, Train, stampDate } from "./parts";
import { PicturePhone } from "./picture-phone";

// A course on the railway, in place of its list of lessons: one tab per line
// (chapter), the line's stations on a track with the train where the reader
// left off, the tools they have collected, the workbench where the line's tools
// become its machine, and the tickets they were handed on the way.

export type RouteItem = { slug: string; href: string };

const GAP = 136; // px between stations

/** Line id → its machine, working, once built. A line not here shows only its ring of tools. */
const WORKING: Record<string, ComponentType<{ stations: Stop[] }>> = { l1: PicturePhone };
const hydrated = () => true;
const onServer = () => false;
const never = () => () => {};

/**
 * `course` names the railway in RAIL (looked up here: its tools carry icon
 * components, which can't cross from the server page). `items` are the
 * published journeys: only they are stations, and only their tools are in the
 * trunk and on the workbench.
 */
export function RouteMap({ course, items }: { course: string; items: RouteItem[] }) {
  const net = useMemo(() => (RAIL[course] ? railNet(new Set(items.map((it) => it.slug))) : null), [course, items]);
  const rail = useRail();
  // localStorage exists only after hydration; before that everything is unreached.
  const live = useSyncExternalStore(never, hydrated, onServer);
  const reached = (slug: string) => !!rail.arrived[slug] || (live && finishedBefore(slug));

  const bySlug = new Map(items.map((it) => [it.slug, it]));
  const shown = (net?.lines ?? []).map((line) => ({ line, stops: line.stations.map((st) => net!.stopOf(st.slug)!) }));
  const current = shown.find((l) => l.stops.some((st) => !reached(st.slug))) ?? shown.at(-1);
  const [picked, setPicked] = useState<string | null>(null);
  const open = shown.find((l) => l.line.id === picked) ?? current;
  if (!open || !net) return null;

  return (
    // min-w-0 all the way down: the track scrolls inside its card, never the page
    <div className="mt-8 flex min-w-0 flex-col gap-8 [&>*]:min-w-0">
      <div className="surface-card overflow-hidden p-0!">
        <div role="tablist" aria-label="লাইন" className="flex gap-2 overflow-x-auto [contain:inline-size] border-b border-border px-4 py-3">
          {shown.map(({ line, stops }) => {
            const on = line.id === open.line.id;
            const done = stops.every((st) => reached(st.slug));
            return (
              <button
                key={line.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPicked(line.id)}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8rem] font-semibold transition-colors ${
                  on ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted hover:border-accent hover:text-foreground"
                }`}
              >
                <span aria-hidden="true" className={`size-2 rounded-full ${done ? "bg-current" : "border-[1.5px] border-current"}`} />
                Line {line.no} · <span className="font-bangla">{line.train.bn}</span>
              </button>
            );
          })}
        </div>
        <LineView key={open.line.id} line={open.line} stops={open.stops} bySlug={bySlug} rail={rail} reached={reached} />
      </div>
      <Workshop line={open.line} stops={open.stops} rail={rail} reached={reached} />
      <Album stops={open.stops} net={net} rail={rail} reached={reached} />
    </div>
  );
}

function LineView({
  line,
  stops,
  bySlug,
  rail,
  reached,
}: {
  line: Line;
  stops: Stop[];
  bySlug: Map<string, RouteItem>;
  rail: RailState;
  reached: (slug: string) => boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const got = stops.filter((st) => reached(st.slug));
  const upTo = stops.findIndex((st) => !reached(st.slug)); // the next station, -1 = line done
  const scored = got.map((st) => rail.arrived[st.slug]?.score).filter((x): x is number => x != null);
  const first = scored.length ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 100) : null;
  // The train sits between the last station reached and the next one; before the
  // first, at the line's start; with the line done, pulled in past its last station.
  const trainAt = upTo < 0 ? stops.length - 0.5 : upTo - 0.45;
  const x = (i: number) => 70 + GAP * i;

  // Open the map scrolled to the train.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = Math.max(0, x(Math.max(0, trainAt)) - el.clientWidth / 2);
  }, [trainAt]);

  return (
    <div role="tabpanel">
      <div className="flex flex-wrap items-end justify-between gap-4 px-5 pt-5">
        <div>
          <div className="font-board text-3xl leading-none font-extrabold tracking-wide uppercase sm:text-4xl">
            {line.train.en} · Line {line.no}
          </div>
          <div className="mt-1 text-sm text-muted">
            <span className="font-bangla font-semibold text-foreground">{line.train.bn}</span> {line.train.no} · {line.topic}
          </div>
        </div>
        <dl className="flex gap-5 text-xs text-muted">
          <div>
            <dd className="font-board text-2xl leading-none font-extrabold text-foreground tabular-nums">
              {got.length}/{stops.length}
            </dd>
            <dt>stations reached</dt>
          </div>
          <div>
            <dd className="font-board text-2xl leading-none font-extrabold text-foreground tabular-nums">{got.length}</dd>
            <dt>tools in the trunk</dt>
          </div>
          <div>
            <dd className="font-board text-2xl leading-none font-extrabold text-foreground tabular-nums">{first === null ? "—" : `${first}%`}</dd>
            <dt>checks, first try</dt>
          </div>
        </dl>
      </div>

      <div ref={scroller} className="overflow-x-auto [contain:inline-size] pt-6 pb-5">
        <ol className="relative m-0 h-[18.5rem] list-none p-0" style={{ width: x(stops.length - 1) + 150 }}>
          {/* the track: sleepers, two rails, and the rails already ridden in green */}
          <li aria-hidden="true" className="absolute top-[9.2rem] right-0 left-0 h-3.5">
            <div
              className="absolute inset-0 opacity-60"
              style={{ background: "repeating-linear-gradient(90deg,#9b8467 0 5px,transparent 5px 16px)" }}
            />
            <div className="absolute inset-x-0 top-[3px] h-2 border-y-2 border-muted/60" />
            <div className="absolute top-[3px] left-0 h-2 border-y-2 border-accent" style={{ width: x(Math.max(0, trainAt)) }} />
          </li>
          {stops.map((st, i) => {
            const item = bySlug.get(st.slug)!;
            const here = reached(st.slug);
            const next = i === upTo;
            const last = i === stops.length - 1;
            const Icon = st.tool.icon;
            return (
              <li key={st.slug} className="absolute top-0 w-[8.2rem] -translate-x-1/2" style={{ left: x(i) }}>
                <Link
                  href={item.href}
                  style={{ color: "inherit", textDecoration: "none" }}
                  className="group grid justify-items-center rounded-xl pb-1 text-center outline-offset-4"
                  aria-label={`${line.no}.${i + 1} ${st.bn} (${st.en})${here ? ", পৌঁছেছেন" : next ? ", পরের স্টেশন" : ""}`}
                >
                  {/* boards of one or two lines of English all stand on posts of the same height */}
                  <span className="flex h-[4.1rem] items-end transition-transform group-hover:-translate-y-0.5">
                    <Board stop={st} dim={!here && !next} />
                  </span>
                  <span aria-hidden="true" className="h-6 w-[4.6rem] border-x-[3px] border-muted/60" />
                  <span
                    aria-hidden="true"
                    className={`relative z-[2] mt-2.5 size-6 border-4 ${last ? "rotate-45 rounded-[5px]" : "rounded-full"} ${
                      here ? "border-accent bg-accent" : next ? "border-accent bg-surface ring-6 ring-accent/15" : "border-muted/60 bg-surface"
                    }`}
                  />
                  <span className="mt-2 font-ticket text-[0.7rem] font-bold text-muted">
                    {st.code} · {line.no}.{i + 1}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`mt-2 grid size-14 place-items-center rounded-xl border-[1.5px] ${
                      here ? "border-border bg-accent/10 text-accent-text" : "border-dashed border-muted/50 text-muted/70"
                    }`}
                  >
                    <Icon size={30} weight={here ? "duotone" : "regular"} />
                  </span>
                  <span className={`mt-1.5 max-w-[7.5rem] text-xs leading-tight ${here ? "font-semibold" : "text-muted"}`}>
                    {here ? st.tool.name : "Tool waiting"}
                  </span>
                </Link>
              </li>
            );
          })}
          <li aria-hidden="true" className="pointer-events-none absolute top-[7.5rem] w-24 -translate-x-1/2 transition-[left] duration-700" style={{ left: x(Math.max(0, trainAt)) + 12 }}>
            <Train className="w-full" />
          </li>
        </ol>
      </div>
    </div>
  );
}

function Workshop({ line, stops, rail, reached }: { line: Line; stops: Stop[]; rail: RailState; reached: (slug: string) => boolean }) {
  const Working = WORKING[line.id];
  const fitted = rail.fitted[line.id] ?? [];
  const built = rail.built[line.id];
  const have = stops.filter((st) => reached(st.slug));
  const placed = stops.filter((st) => fitted.includes(st.slug) && reached(st.slug));
  const ready = placed.length === stops.length;

  return (
    <section aria-labelledby="rail-workshop" className="flex flex-col gap-3">
      <h2 id="rail-workshop" className="font-board text-2xl font-extrabold tracking-wide uppercase">
        The trunk and the workbench
      </h2>
      <p className="max-w-prose text-sm text-muted">
        Every station on this line gives you a tool. Fit all of them on the workbench and you can build the line&apos;s machine.
      </p>
      <div className="surface-card grid overflow-hidden p-0! md:grid-cols-2">
        {/* the tin trunk: a painted lid, a brass clasp */}
        <div className="flex flex-col gap-0 border-border p-5 max-md:border-b md:border-r">
          <div className="relative h-11 rounded-t-2xl rounded-b-sm bg-linear-to-b from-[#3d6f9a] to-[#2c5577] shadow-[inset_0_-4px_0_rgb(0_0_0/0.18)]">
            <div className="absolute inset-x-5 inset-y-2.5 rounded-md border-2 border-white/25" />
            <div className="absolute inset-x-0 top-3 text-center font-bangla text-[0.8rem] font-bold text-[#f6e7b0]">আমার ট্রাংক</div>
            <div className="absolute top-7 left-1/2 h-6 w-5 -translate-x-1/2 rounded bg-[#c9a24a] shadow-[inset_0_-3px_0_rgb(0_0_0/0.25)]" />
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2.5 rounded-b-xl border-2 border-t-0 border-[#2c5577] bg-background p-3.5 pt-5">
            {stops.map((st) => {
              const Icon = st.tool.icon;
              if (!reached(st.slug))
                return (
                  <div key={st.slug} className="grid justify-items-center gap-1 rounded-xl border-[1.5px] border-dashed border-border p-2 text-center text-[0.7rem] text-muted">
                    <Icon size={26} className="opacity-50" />
                    <span className="font-ticket">{st.code}</span>
                  </div>
                );
              const on = fitted.includes(st.slug);
              return (
                <button
                  key={st.slug}
                  type="button"
                  disabled={!!built}
                  onClick={() => toggleFitted(line.id, st.slug)}
                  aria-pressed={on}
                  title={st.tool.does}
                  className={`grid cursor-pointer justify-items-center gap-1 rounded-xl border-[1.5px] bg-surface p-2 text-center text-[0.72rem] leading-tight font-semibold transition-all hover:border-accent disabled:cursor-default ${
                    on && !built ? "border-border opacity-35" : "border-border"
                  }`}
                >
                  <Icon size={28} weight="duotone" className="text-accent-text" />
                  <span>{st.tool.name}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-muted">
            {have.length ? "একটা tool-এ চাপ দিলে সেটা workbench-এ বসে। আবার চাপ দিলে ফেরত আসে।" : "এই লাইনের প্রথম স্টেশনে পৌঁছালে প্রথম tool পাবেন।"}
          </div>
        </div>

        <div
          className="flex flex-col gap-3.5 p-5"
          style={{
            background:
              "linear-gradient(var(--border) 1px,transparent 1px) 0 0/22px 22px,linear-gradient(90deg,var(--border) 1px,transparent 1px) 0 0/22px 22px,var(--surface)",
          }}
        >
          <div className="text-[0.7rem] font-semibold tracking-[0.12em] text-muted uppercase">
            Workbench · <span className="font-bangla">{stops.at(-1)?.bn}</span>
          </div>
          <div className="font-board text-2xl leading-none font-extrabold uppercase">
            {built ? "Built: " : "Build: "}
            {line.machine.name}
          </div>
          <div className="text-sm text-muted">{line.machine.does}</div>
          {built ? (
            <Machine stops={stops} on={built} />
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2">
                {stops.map((st) => {
                  const on = placed.includes(st);
                  return (
                    <div
                      key={st.slug}
                      className={`grid content-center gap-0.5 rounded-xl border-2 p-2.5 ${
                        on ? "border-accent bg-accent/10" : "border-dashed border-muted/50 bg-surface"
                      }`}
                    >
                      <span className="font-ticket text-[0.65rem] font-bold text-muted">
                        FROM {st.code} · {st.line.no}.{st.n}
                      </span>
                      <span className={`text-sm font-semibold ${on ? "text-accent-text" : ""}`}>{on ? st.tool.name : "—"}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-2.5 min-w-32 flex-1 overflow-hidden rounded-full border border-border bg-background">
                  <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${(placed.length / stops.length) * 100}%` }} />
                </div>
                <span className="font-ticket text-xs text-muted tabular-nums">
                  {placed.length}/{stops.length}
                </span>
                <button type="button" disabled={!ready} onClick={() => buildMachine(line.id)} className="btn-primary disabled:cursor-default disabled:opacity-40">
                  {ready ? "Build it" : have.length < stops.length ? `আরো ${bn(stops.length - have.length)}টা স্টেশন বাকি` : "সব tool বসান"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {built && Working ? <Working stations={stops} /> : null}
    </section>
  );
}

/** A built machine: every tool of the line locked into one ring around its core. */
function Machine({ stops, on }: { stops: Stop[]; on: string }) {
  const n = stops.length;
  return (
    <div className="grid justify-items-center gap-2 py-2">
      <div className="relative size-60 max-w-full">
        <div className="absolute inset-[22%] grid place-items-center rounded-full border-4 border-accent bg-accent/10">
          <Train className="w-3/4" />
        </div>
        <div aria-hidden="true" className="absolute inset-[9%] rounded-full border-2 border-dashed border-accent/40" />
        {stops.map((st, i) => {
          const a = (i / n) * 2 * Math.PI - Math.PI / 2;
          const Icon = st.tool.icon;
          return (
            <span
              key={st.slug}
              title={st.tool.name}
              className="absolute grid size-10 -translate-1/2 place-items-center rounded-lg border-[1.5px] border-accent bg-surface text-accent-text shadow-sm"
              style={{ left: `${50 + 41 * Math.cos(a)}%`, top: `${50 + 41 * Math.sin(a)}%` }}
            >
              <Icon size={22} weight="duotone" />
            </span>
          );
        })}
      </div>
      <div className="font-ticket text-xs text-muted">BUILT {stampDate(on)}</div>
    </div>
  );
}

function Album({ stops, net, rail, reached }: { stops: Stop[]; net: RailNet; rail: RailState; reached: (slug: string) => boolean }) {
  // One ticket per station reached: the one it handed over for the ride after it.
  const tickets = stops.flatMap((st) => {
    const to = net.nextStop(st.slug);
    return reached(st.slug) && to ? [{ from: st, to, arrival: rail.arrived[st.slug] }] : [];
  });
  if (!tickets.length) return null;
  return (
    <section aria-labelledby="rail-album" className="flex flex-col gap-3">
      <h2 id="rail-album" className="font-board text-2xl font-extrabold tracking-wide uppercase">
        Ticket album
      </h2>
      <div className="flex flex-wrap justify-center gap-4 py-2">
        {tickets.map(({ from, to, arrival }, i) => (
          <div key={from.slug} style={{ transform: `rotate(${[-1.5, 1, -0.5, 1.5][i % 4]}deg)` }} className="w-full max-w-[26rem]">
            <Ticket
              small
              from={from}
              to={to}
              cls={classOf(arrival?.score ?? null)}
              on={arrival?.on ?? new Date(0).toISOString()}
              seat={rail.seat}
              punched={reached(to.slug)}
              star={rail.hawker[from.slug] === true}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
