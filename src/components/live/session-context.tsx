"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { tallyResults, type ActivityType } from "@/lib/session";

export type Mode = "practice" | "presenter" | "viewer";

type Mine = Record<string, { response: unknown; is_correct: boolean | null }>;
type Counts = Record<string, number>;
type PollCounts = Record<string, Record<number, number>>;

// Per-activity phase machine: the teacher drives idle -> running -> ended.
// `endsAt` is an absolute epoch-ms instant so any client derives the countdown.
export type Phase = "idle" | "running" | "ended";
type PhaseState = { phase: Phase; endsAt: number | null; results: number[] | null };
type PhaseMap = Record<string, PhaseState>;
const IDLE: PhaseState = { phase: "idle", endsAt: null, results: null };

type LiveSession = {
  mode: Mode;
  sessionId: string | null;
  roster: string[]; // emails present (presenter UI)
  answered: Counts; // activity_id -> #responses (presenter UI)
  polls: PollCounts; // activity_id -> pick -> count (poll tally)
  mine: Mine; // this user's locked-in answers
  phases: PhaseMap; // activity_id -> live phase
  now: number; // epoch ms, ticks each second (drives the countdown)
  register: (activityId: string, type: string, correct: unknown) => void;
  submit: (activityId: string, response: { pick?: number; [k: string]: unknown }, isCorrect: boolean | null) => Promise<void>;
  start: (activityId: string) => void; // presenter: open the activity for 30s
  end: (activityId: string) => void; // presenter: freeze + reveal results
};

const noop = async () => {};
const Ctx = createContext<LiveSession>({
  mode: "practice",
  sessionId: null,
  roster: [],
  answered: {},
  polls: {},
  mine: {},
  phases: {},
  now: 0,
  register: () => {},
  submit: noop,
  start: () => {},
  end: () => {},
});

export function useLiveSession() {
  return useContext(Ctx);
}

// Hook used by every activity. In practice mode (no provider) it returns mode
// "practice" and no-op submit, so components keep their standalone behavior.
export function useLiveActivity(activityId: string, type: string, correct: unknown) {
  const ctx = useContext(Ctx);
  const { mode, register } = ctx;
  const correctRef = useRef(correct);
  useEffect(() => {
    correctRef.current = correct;
  });

  useEffect(() => {
    // Register once per presenter mount — read correct from a ref so a fresh
    // object literal each render doesn't re-fire (and re-upsert) the effect.
    if (mode === "presenter") register(activityId, type, correctRef.current);
  }, [mode, activityId, type, register]);

  const p = ctx.phases[activityId] ?? IDLE;
  return {
    mode,
    recorded: ctx.mine[activityId] != null,
    mine: ctx.mine[activityId],
    answeredCount: ctx.answered[activityId] ?? 0,
    polls: ctx.polls[activityId] ?? {},
    phase: p.phase,
    // Derived from the absolute deadline + the 1s tick, so refresh/late-join resume mid-countdown.
    secondsLeft: p.endsAt ? Math.max(0, Math.ceil((p.endsAt - ctx.now) / 1000)) : 0,
    participantCount: ctx.roster.length, // ponytail: includes the presenter; fine for a playful "joined" count
    results: p.results,
    submit: (response: { pick?: number; [k: string]: unknown }, isCorrect: boolean | null) =>
      ctx.submit(activityId, response, isCorrect),
    start: () => ctx.start(activityId),
    end: () => ctx.end(activityId),
  };
}

export function LiveSessionProvider({
  mode,
  sessionId,
  children,
}: {
  mode: "presenter" | "viewer";
  sessionId: string;
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const navRef = useRef<RealtimeChannel | null>(null); // presenter-only :nav topic, for phase
  const navReady = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const ready = useRef(false); // channel joined — gate broadcasts onto the WS, not REST
  const typesRef = useRef<Record<string, string>>({}); // activity_id -> type, for end()'s tally
  const endingRef = useRef<Set<string>>(new Set()); // end() idempotency (timer + click race)

  const [roster, setRoster] = useState<string[]>([]);
  const [answered, setAnswered] = useState<Counts>({});
  const [polls, setPolls] = useState<PollCounts>({});
  const [mine, setMine] = useState<Mine>({});
  const [phases, setPhases] = useState<PhaseMap>({});
  const [now, setNow] = useState(() => Date.now());
  const phasesRef = useRef<PhaseMap>(phases); // mirror for stable callbacks (end() reads current phase)
  useEffect(() => {
    phasesRef.current = phases;
  }, [phases]);

  const bump = (activityId: string, pick: number | null) => {
    setAnswered((a) => ({ ...a, [activityId]: (a[activityId] ?? 0) + 1 }));
    if (pick != null)
      setPolls((p) => ({
        ...p,
        [activityId]: { ...(p[activityId] ?? {}), [pick]: (p[activityId]?.[pick] ?? 0) + 1 },
      }));
  };

  useEffect(() => {
    let cancelled = false;

    // Default presence key = a unique id per client, so each connection is its own
    // roster entry (we dedupe by email below for the display).
    const channel = supabase.channel(`session:${sessionId}`, { config: { private: true } });
    channelRef.current = channel;

    // Other clients' answers (self: false by default) -> live counts/tally.
    channel.on("broadcast", { event: "answer" }, ({ payload }) => {
      bump(payload.activityId as string, (payload.pick ?? null) as number | null);
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ email: string }>();
      const emails = Object.values(state).flatMap((metas) => metas.map((m) => m.email));
      setRoster(Array.from(new Set(emails)).sort());
    });

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (cancelled) return;
      userIdRef.current = auth.user?.id ?? null;

      // Seed locked-in answers (and, for the admin, everyone's counts: RLS returns
      // all rows to admins, only own rows to students).
      const { data: rows } = await supabase
        .from("responses")
        .select("activity_id, response, is_correct, user_id")
        .eq("session_id", sessionId);
      if (cancelled) return;
      const seedMine: Mine = {};
      const seedAnswered: Counts = {};
      const seedPolls: PollCounts = {};
      for (const r of rows ?? []) {
        seedAnswered[r.activity_id] = (seedAnswered[r.activity_id] ?? 0) + 1;
        const pick = (r.response as { pick?: number })?.pick;
        if (typeof pick === "number") {
          seedPolls[r.activity_id] = seedPolls[r.activity_id] ?? {};
          seedPolls[r.activity_id][pick] = (seedPolls[r.activity_id][pick] ?? 0) + 1;
        }
        if (r.user_id === userIdRef.current)
          seedMine[r.activity_id] = { response: r.response, is_correct: r.is_correct };
      }
      setMine(seedMine);
      setAnswered(seedAnswered);
      setPolls(seedPolls);

      // Seed activity phases so a refresh / late join resumes the live state (the
      // countdown rebuilds from ends_at, an ended chart loads from frozen results).
      const { data: acts } = await supabase
        .from("session_activities")
        .select("activity_id, phase, ends_at, results")
        .eq("session_id", sessionId);
      if (cancelled) return;
      const seedPhases: PhaseMap = {};
      for (const a of acts ?? [])
        seedPhases[a.activity_id] = {
          phase: a.phase as Phase,
          endsAt: a.ends_at ? Date.parse(a.ends_at as string) : null,
          results: (a.results as number[] | null) ?? null,
        };
      setPhases(seedPhases);

      await channel.subscribe(async (status) => {
        ready.current = status === "SUBSCRIBED";
        if (status === "SUBSCRIBED")
          await channel.track({ email: auth.user?.email ?? "anon" });
      });
    })();

    return () => {
      cancelled = true;
      ready.current = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, sessionId]);

  // One ticker drives every countdown (and the presenter's auto-end check below).
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Phase rides its own presenter-only :phase topic. It must NOT share the deck's
  // :nav topic — Supabase Realtime can't join the same topic twice on one socket, and
  // doing so breaks the deck's slide-sync. It also stays off the base topic (which is
  // participant-writable), so a learner can't spoof an "ended" with fake results.
  // Fresh channel per run (StrictMode double-invoke) — mirrors presenter-deck.
  useEffect(() => {
    const nav = supabase.channel(`session:${sessionId}:phase`, { config: { private: true } });
    navRef.current = nav;
    nav.on("broadcast", { event: "phase" }, ({ payload }) => {
      setPhases((m) => ({
        ...m,
        [payload.activityId as string]: {
          phase: payload.phase as Phase,
          endsAt: (payload.endsAt as number | undefined) ?? null,
          results: (payload.results as number[] | undefined) ?? null,
        },
      }));
    });
    nav.subscribe((status) => (navReady.current = status === "SUBSCRIBED"));
    return () => {
      navReady.current = false;
      navRef.current = null;
      supabase.removeChannel(nav);
    };
  }, [supabase, sessionId]);

  const start = useCallback(
    (activityId: string) => {
      const endsAt = Date.now() + 30_000;
      endingRef.current.delete(activityId);
      setPhases((m) => ({ ...m, [activityId]: { phase: "running", endsAt, results: null } }));
      supabase
        .from("session_activities")
        .update({ phase: "running", ends_at: new Date(endsAt).toISOString(), results: null })
        .eq("session_id", sessionId)
        .eq("activity_id", activityId)
        .then(() => {});
      if (navReady.current)
        navRef.current?.send({
          type: "broadcast",
          event: "phase",
          payload: { activityId, phase: "running", endsAt },
        });
    },
    [supabase, sessionId],
  );

  // Freeze results from the responses table (presenter reads all rows via admin RLS),
  // persist + broadcast. Idempotent so timer-expiry and a manual click can't double-write.
  const end = useCallback(
    async (activityId: string) => {
      if (endingRef.current.has(activityId)) return;
      if (phasesRef.current[activityId]?.phase !== "running") return;
      endingRef.current.add(activityId);
      const { data: rows } = await supabase
        .from("responses")
        .select("response, is_correct")
        .eq("session_id", sessionId)
        .eq("activity_id", activityId);
      const type = (typesRef.current[activityId] ?? "quiz") as ActivityType;
      const results = tallyResults(type, rows ?? []);
      setPhases((m) => ({ ...m, [activityId]: { phase: "ended", endsAt: null, results } }));
      await supabase
        .from("session_activities")
        .update({ phase: "ended", results })
        .eq("session_id", sessionId)
        .eq("activity_id", activityId);
      if (navReady.current)
        navRef.current?.send({
          type: "broadcast",
          event: "phase",
          payload: { activityId, phase: "ended", results },
        });
    },
    [supabase, sessionId],
  );

  // Presenter's clock is authoritative: when a running activity passes its deadline, end it.
  useEffect(() => {
    if (mode !== "presenter") return;
    for (const [id, p] of Object.entries(phases))
      if (p.phase === "running" && p.endsAt != null && now >= p.endsAt) end(id);
  }, [now, phases, mode, end]);

  const register = useMemo(
    () =>
      (activityId: string, type: string, correct: unknown) => {
        typesRef.current[activityId] = type; // so end() knows how to tally
        // Presenter deck mounts every section -> every activity self-registers once.
        supabase
          .from("session_activities")
          .upsert(
            { session_id: sessionId, activity_id: activityId, type, correct: correct ?? null },
            { onConflict: "session_id,activity_id" },
          )
          .then(() => {});
      },
    [supabase, sessionId],
  );

  const submit = useMemo(
    () =>
      async (activityId: string, response: { pick?: number; [k: string]: unknown }, isCorrect: boolean | null) => {
        const { error } = await supabase.from("responses").insert({
          session_id: sessionId,
          activity_id: activityId,
          response,
          is_correct: isCorrect,
        });
        if (error) return; // PK conflict (already answered) or RLS — keep prior state
        const pick = typeof response.pick === "number" ? response.pick : null;
        setMine((m) => ({ ...m, [activityId]: { response, is_correct: isCorrect } }));
        bump(activityId, pick); // self: broadcast doesn't echo, so count locally
        if (ready.current)
          channelRef.current?.send({
            type: "broadcast",
            event: "answer",
            payload: { activityId, pick },
          });
      },
    [supabase, sessionId],
  );

  return (
    <Ctx.Provider
      value={{ mode, sessionId, roster, answered, polls, mine, phases, now, register, submit, start, end }}
    >
      {children}
    </Ctx.Provider>
  );
}
