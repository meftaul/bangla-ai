"use client";

import { useSyncExternalStore } from "react";

// What the reader has done on the railway (src/content/rail.ts): the stations
// they reached and how the ride there went, where their tools sit on each
// line's workbench, which machines they built, and their coach and seat.
//
// ponytail: per browser, in localStorage, like the Journey's own progress (see
// components/journey/journey.tsx). Move both to Supabase together if readers
// switch devices.

export type TicketClass = "snigdha" | "shovan-chair" | "shovan";

export type Arrival = {
  /** the share of the ride's checks passed on the first try; null = no checks, or reached before scoring existed */
  score: number | null;
  /** ISO date of the first arrival */
  on: string;
};

export type RailState = {
  seat: { coach: string; no: number } | null;
  arrived: Record<string, Arrival>;
  /** line id → the station slugs whose tools are fitted on its workbench */
  fitted: Record<string, string[]>;
  /** line id → ISO date the machine was built */
  built: Record<string, string>;
  /** station slug → the hawker's question there: true = answered on the first try */
  hawker: Record<string, boolean>;
  /** station slug → how many ticket checks the ride there holds, learned on arrival */
  checks: Record<string, number>;
};

const KEY = "rail:v1";
const EVENT = "rail:change";
const EMPTY: RailState = { seat: null, arrived: {}, fitted: {}, built: {}, hawker: {}, checks: {} };

let cachedRaw: string | null | undefined;
let cached: RailState = EMPTY;

function read(): RailState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // storage blocked: the rail starts empty every visit
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const p = JSON.parse(raw ?? "null") as Partial<RailState> | null;
    cached = { ...EMPTY, ...(p && typeof p === "object" ? p : {}) };
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function write(change: (s: RailState) => RailState) {
  const next = change(read());
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(on: () => void) {
  const storage = (e: StorageEvent) => e.key === KEY && on();
  window.addEventListener(EVENT, on);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(EVENT, on);
    window.removeEventListener("storage", storage);
  };
}

/** The reader's railway, kept in sync across the page and other tabs. Empty on the server. */
export function useRail(): RailState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/**
 * A journey finished before the rail existed still counts as reached: its
 * Journey save says `done`. Read once per render by the route map.
 */
export function finishedBefore(slug: string): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem(`journey:/dashboard/articles/${slug}`) ?? "null") as { done?: boolean } | null;
    return !!saved?.done;
  } catch {
    return false;
  }
}

const COACHES = ["ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ"];

/** Arrive at a station. Keeps the best score of every ride there, and how many checks the ride held. */
export function recordArrival(slug: string, score: number | null, checks: number) {
  write((s) => {
    const before = s.arrived[slug];
    const best = before?.score == null ? score : score == null ? before.score : Math.max(before.score, score);
    return {
      ...s,
      // The reader's seat is theirs for the whole trip, like a regular on a route.
      seat: s.seat ?? { coach: COACHES[Math.floor(Math.random() * COACHES.length)], no: 1 + Math.floor(Math.random() * 60) },
      arrived: { ...s.arrived, [slug]: { score: best, on: before?.on ?? new Date().toISOString() } },
      checks: { ...s.checks, [slug]: checks },
    };
  });
}

/** Put a tool on the line's workbench, or take it back off. */
export function toggleFitted(line: string, slug: string) {
  write((s) => {
    const now = s.fitted[line] ?? [];
    return { ...s, fitted: { ...s.fitted, [line]: now.includes(slug) ? now.filter((x) => x !== slug) : [...now, slug] } };
  });
}

/** The hawker's question at a station, answered: only the first answer counts. */
export function recordHawker(slug: string, first: boolean) {
  write((s) => (slug in s.hawker ? s : { ...s, hawker: { ...s.hawker, [slug]: first } }));
}

export function buildMachine(line: string) {
  write((s) => (s.built[line] ? s : { ...s, built: { ...s.built, [line]: new Date().toISOString() } }));
}

/**
 * The class of the ticket a station hands you, from how the ride there went:
 * every check right on the first try rides স্নিগ্ধা, most of them শোভন চেয়ার,
 * the rest শোভন. Nobody is held back; the class is only a record.
 */
const CHAIR_AT = 0.6;

export function classOf(score: number | null): TicketClass {
  if (score === null) return "shovan-chair";
  if (score >= 1) return "snigdha";
  if (score >= CHAIR_AT) return "shovan-chair";
  return "shovan";
}

export const CLASS_LABEL: Record<TicketClass, { bn: string; en: string }> = {
  snigdha: { bn: "স্নিগ্ধা", en: "Snigdha" },
  "shovan-chair": { bn: "শোভন চেয়ার", en: "Shovan Chair" },
  shovan: { bn: "শোভন", en: "Shovan" },
};

/**
 * The class to aim for during a ride, for the ride line: the best one still in
 * reach, and how many more checks it takes.
 *
 * `first` checks passed on the first try and `missed` checks missed so far;
 * `total` is how many checks the ride holds, known only once the reader has
 * arrived here before (a step's task shows only when the step does).
 *
 * - `need`: `n` more checks passed on the first try reach `cls` (for স্নিগ্ধা,
 *   that is every check left)
 * - `on`: `cls` is in hand so far; with no total, we can't count what's left
 * - `set`: nothing left in the ride can change it
 */
export type Chase = { kind: "need" | "on" | "set"; cls: TicketClass; n: number };

export function chase(first: number, missed: number, total: number | null): Chase {
  const decided = first + missed;
  const left = total === null ? null : Math.max(0, total - decided);
  if (left === 0) return { kind: "set", cls: classOf(total ? first / total : null), n: 0 };
  if (missed === 0) return left === null ? { kind: "on", cls: "snigdha", n: 0 } : { kind: "need", cls: "snigdha", n: left };
  // At least CHAIR_AT of all checks: with the total known, first + n ≥ CHAIR_AT·total;
  // without it, as if the ride ended n checks from now, (first + n) / (decided + n) ≥ CHAIR_AT.
  const n = Math.max(
    0,
    Math.ceil(left === null ? (CHAIR_AT * decided - first) / (1 - CHAIR_AT) - 1e-9 : CHAIR_AT * (total as number) - first - 1e-9),
  );
  if (n === 0) return { kind: "on", cls: "shovan-chair", n: 0 };
  if (left !== null && n > left) return { kind: "set", cls: "shovan", n: 0 };
  return { kind: "need", cls: "shovan-chair", n };
}
