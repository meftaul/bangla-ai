"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type Mode = "practice" | "presenter" | "viewer";

type Mine = Record<string, { response: unknown; is_correct: boolean | null }>;
type Counts = Record<string, number>;
type PollCounts = Record<string, Record<number, number>>;

type LiveSession = {
  mode: Mode;
  sessionId: string | null;
  roster: string[]; // emails present (presenter UI)
  answered: Counts; // activity_id -> #responses (presenter UI)
  polls: PollCounts; // activity_id -> pick -> count (poll tally)
  mine: Mine; // this user's locked-in answers
  register: (activityId: string, type: string, correct: unknown) => void;
  submit: (activityId: string, response: { pick?: number; [k: string]: unknown }, isCorrect: boolean | null) => Promise<void>;
};

const noop = async () => {};
const Ctx = createContext<LiveSession>({
  mode: "practice",
  sessionId: null,
  roster: [],
  answered: {},
  polls: {},
  mine: {},
  register: () => {},
  submit: noop,
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

  return {
    mode,
    recorded: ctx.mine[activityId] != null,
    mine: ctx.mine[activityId],
    answeredCount: ctx.answered[activityId] ?? 0,
    polls: ctx.polls[activityId] ?? {},
    submit: (response: { pick?: number; [k: string]: unknown }, isCorrect: boolean | null) =>
      ctx.submit(activityId, response, isCorrect),
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
  const userIdRef = useRef<string | null>(null);
  const ready = useRef(false); // channel joined — gate broadcasts onto the WS, not REST

  const [roster, setRoster] = useState<string[]>([]);
  const [answered, setAnswered] = useState<Counts>({});
  const [polls, setPolls] = useState<PollCounts>({});
  const [mine, setMine] = useState<Mine>({});

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
    const channel = supabase.channel(`session:${sessionId}`);
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

  const register = useMemo(
    () =>
      (activityId: string, type: string, correct: unknown) => {
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
    <Ctx.Provider value={{ mode, sessionId, roster, answered, polls, mine, register, submit }}>
      {children}
    </Ctx.Provider>
  );
}
