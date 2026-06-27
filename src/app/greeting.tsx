"use client";

import { useSyncExternalStore } from "react";

// Time-of-day Bangla greeting for the hero eyebrow. Uses the same
// useSyncExternalStore idiom as theme-toggle: server renders the neutral
// greeting, the client swaps to the local hour on hydration — no effect, no
// hydration mismatch.
function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "শুভ সকাল";
  if (hour >= 12 && hour < 16) return "শুভ দুপুর";
  if (hour >= 16 && hour < 19) return "শুভ বিকেল";
  return "শুভ সন্ধ্যা";
}

// ponytail: greeting is computed once at hydration; it won't tick over if the
// page sits open past a boundary. Fine for a landing eyebrow — no subscription.
const noop = () => () => {};

export default function Greeting() {
  const text = useSyncExternalStore(
    noop,
    () => greetingFor(new Date().getHours()),
    () => "শুভেচ্ছা",
  );

  return (
    <span lang="bn" className="font-bangla">
      {text}
    </span>
  );
}
