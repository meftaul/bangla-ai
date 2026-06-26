// Shared types + pure helpers for live sessions. No Supabase imports here so this
// stays trivially testable and usable on both server and client.

export type ActivityType = "quiz" | "poll" | "dragdrop";

export type ActivityDef = {
  activity_id: string;
  type: ActivityType;
  correct: unknown | null; // null for poll
};

export type ResponseRow = {
  activity_id: string;
  is_correct: boolean | null;
};

export type Score = { correct: number; total: number };

// Unambiguous alphabet (no O/0/I/1) — easier to read off a projector.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(len = 6): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

// Score = correct answers / scorable activities. Polls aren't scorable. An activity
// the student never answered counts against the total (missed), so total comes from
// the session's registered activities, not from the responses.
export function scoreOf(activities: ActivityDef[], responses: ResponseRow[]): Score {
  const scorable = activities.filter((a) => a.type !== "poll");
  const correctByActivity = new Map(responses.map((r) => [r.activity_id, r.is_correct]));
  const correct = scorable.filter((a) => correctByActivity.get(a.activity_id) === true).length;
  return { correct, total: scorable.length };
}

// ponytail: env-guarded assert self-check — run with `SESSION_SELFCHECK=1 npx tsx src/lib/session.ts`.
if (process.env.SESSION_SELFCHECK) {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("scoreOf self-check failed: " + msg);
  };
  const acts: ActivityDef[] = [
    { activity_id: "q1", type: "quiz", correct: 1 },
    { activity_id: "q2", type: "quiz", correct: 0 },
    { activity_id: "p1", type: "poll", correct: null },
    { activity_id: "d1", type: "dragdrop", correct: [0, 1] },
  ];
  // q1 right, q2 wrong, poll ignored, d1 never answered -> 1 / 3
  const s = scoreOf(acts, [
    { activity_id: "q1", is_correct: true },
    { activity_id: "q2", is_correct: false },
    { activity_id: "p1", is_correct: null },
  ]);
  assert(s.correct === 1 && s.total === 3, JSON.stringify(s));
  assert(generateJoinCode().length === 6, "code length");
  console.log("session self-check ok", s);
}
