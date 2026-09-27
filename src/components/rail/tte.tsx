"use client";

import { useEffect, useState } from "react";

// The ticket checker (TTE) on the ride: every task on a railway journey is a
// ticket check, and he comes by to see it. Passed on the first try, he punches
// the ticket. A first miss gets a slow, kind shake of the head and a word to
// try again. Passed after a miss, he lets you ride on but doesn't punch.
// He walks in over the bottom bar on the screen where the check was answered,
// says his line, and walks out; moving to another step sends him off early.

export type TteCall = { kind: "punch" | "miss" | "late"; n: number } | null;

const LINES: Record<NonNullable<TteCall>["kind"], string[]> = {
  punch: ["টিকেট ঠিক আছে। ফুটো করে দিলাম।", "একবারেই! এই নিন, ফুটো।", "প্রথমবারেই ধরেছেন। চেক শেষ।"],
  miss: ["উঁহু, এটা মিলছে না। আরেকবার দেখুন।", "হলো না এবার। একটু ভেবে আবার চেষ্টা করুন।", "এটা না। তাড়া নাই, আবার দেখুন।"],
  late: ["হয়েছে, চলবে। তবে এবার ফুটো হবে না।", "ঠিক আছে এখন। পরের চেকে একবারেই করবেন।", "পার হলেন। পরের বার প্রথমবারেই হবে।"],
};

/** How long he stays: time to watch the punch and read his line twice over. */
const STAY = { punch: 5500, miss: 4500, late: 5000 };

export function Tte({ call }: { call: TteCall }) {
  // The call on show, and whether he is on his way out.
  const [shown, setShown] = useState<TteCall>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // No call (the reader moved to another step): he is gone at once.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new call from the Journey restarts his visit
    if (!call) return setShown(null);
    setShown(call);
    setLeaving(false);
    const out = setTimeout(() => setLeaving(true), STAY[call.kind]);
    const gone = setTimeout(() => setShown(null), STAY[call.kind] + 450);
    return () => {
      clearTimeout(out);
      clearTimeout(gone);
    };
  }, [call]);

  if (!shown) return null;
  const line = LINES[shown.kind][shown.n % LINES[shown.kind].length];
  return (
    <div
      key={shown.n}
      role="status"
      className={`rail-tte pointer-events-none absolute right-2 bottom-2 z-20 flex items-end gap-1.5 sm:right-6 ${leaving ? "leaving" : ""}`}
    >
      <div
        className={`mb-10 max-w-[13.5rem] rounded-2xl rounded-br-sm border px-3 py-2 text-sm leading-snug font-medium shadow-lg ${
          shown.kind === "miss" ? "border-cat-amber/40 bg-surface" : "border-accent/40 bg-surface"
        }`}
      >
        <span className="mb-0.5 block text-[0.65rem] font-semibold tracking-[0.12em] text-muted uppercase">TTE</span>
        {line}
      </div>
      <Checker kind={shown.kind} />
    </div>
  );
}

/**
 * The checker: black coat over a white shirt, a peaked cap with a white band,
 * a moustache, and his clipper in hand, closing on a ticket when he punches.
 */
function Checker({ kind }: { kind: NonNullable<TteCall>["kind"] }) {
  return (
    <svg viewBox="0 0 64 96" className="h-24 w-16 shrink-0 drop-shadow-md" aria-hidden="true">
      {/* body */}
      {/* an edge on the coat, so he stands out on the dark theme too */}
      <path d="M12 96 V62 q0-12 20-14 q20 2 20 14 V96z" fill="#1c1f26" stroke="#5b6472" strokeWidth="1.2" />
      <path d="M26 49 l6 14 l6-14z" fill="#f4f4f0" />
      <path d="M31 52 h2 v14 h-2z" fill="#a8322a" />
      <rect x="40" y="58" width="7" height="4" rx="1" fill="#c9a24a" />
      {/* head: nods on a miss */}
      <g className={kind === "miss" ? "rail-nod" : undefined}>
        <rect x="27" y="40" width="10" height="9" fill="#b67a4f" />
        <ellipse cx="32" cy="31" rx="11" ry="12.5" fill="#c68a5a" />
        <circle cx="28" cy="30" r="1.3" fill="#1c1f26" />
        <circle cx="36" cy="30" r="1.3" fill="#1c1f26" />
        <path d="M26 37 q6-3.5 12 0 q-6 2 -12 0z" fill="#2a1d14" />
        {kind === "miss" ? null : <path d="M29 40.5 q3 2 6 0" fill="none" stroke="#7a4a2c" strokeWidth="1.1" strokeLinecap="round" />}
        {/* cap */}
        <path d="M19 23 q13-12 26 0 v3 H19z" fill="#1c1f26" stroke="#5b6472" strokeWidth="1" />
        <rect x="19" y="22" width="26" height="3" fill="#f4f4f0" />
        <path d="M18 26 h28 q-2 3 -14 3 q-12 0 -14-3z" fill="#0d0f13" />
        <circle cx="32" cy="17.5" r="1.8" fill="#c9a24a" />
      </g>
      {/* arm up, with the clipper and a ticket when he punches */}
      {kind === "miss" ? (
        <path d="M50 64 q8 10 2 26" fill="none" stroke="#1c1f26" strokeWidth="7" strokeLinecap="round" />
      ) : (
        <>
          <path d="M49 63 q10-4 9-18" fill="none" stroke="#1c1f26" strokeWidth="7" strokeLinecap="round" />
          <rect x="47" y="30" width="16" height="11" rx="1.5" fill="#efe2c1" stroke="#3b2b14" strokeWidth="0.8" />
          <path d="M47 33 h16" stroke="#a8322a" strokeWidth="1" />
          {kind === "punch" ? <circle className="rail-hole" cx="57" cy="37" r="1.8" fill="#1c1f26" /> : null}
          <g className={kind === "punch" ? "rail-clip" : undefined}>
            <path d="M54 44 l8-10 M58 46 l7-9" stroke="#8a948d" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </>
      )}
    </svg>
  );
}
