"use client";

import { useState } from "react";

// A live password-strength sandbox for a slide. Nothing leaves the browser and
// nothing is registered with the session — there's no answer here to score.
//
// ponytail: rough entropy (charset^length + a common-word check), not zxcvbn.
// This is a teaching prop, not a policy gate. Swap in zxcvbn if it ever guards a
// real password field.

const COMMON = [
  "password", "123456", "qwerty", "letmein", "admin",
  "welcome", "iloveyou", "monkey", "dragon", "abc123",
];

export function human(sec: number): string {
  const u: [number, string][] = [
    [60, "seconds"], [60, "minutes"], [24, "hours"],
    [365, "days"], [100, "years"], [1e9, "centuries"],
  ];
  let v = sec, label = "seconds";
  for (const [div, name] of u) {
    if (v < div) { label = name; break; }
    v /= div;
    label = name;
  }
  if (v > 1e6) return "longer than recorded history";
  return v.toFixed(v < 10 ? 1 : 0) + " " + label;
}

// Offline attacker at 10 billion guesses/sec, halved for the average case.
export function estimate(v: string) {
  let pool = 0;
  if (/[a-z]/.test(v)) pool += 26;
  if (/[A-Z]/.test(v)) pool += 26;
  if (/[0-9]/.test(v)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(v)) pool += 33;
  const weak = COMMON.some((c) => v.toLowerCase().includes(c));
  const bits = weak ? 8 : v.length * Math.log2(pool);
  return { pool, weak, bits, seconds: Math.pow(2, bits - 1) / 1e10, pct: Math.min(100, (bits / 80) * 100) };
}

export default function PasswordMeter() {
  const [value, setValue] = useState("");
  const { pool, weak, bits, seconds, pct } = estimate(value);
  const tone = pct < 35 ? "hot" : pct < 70 ? "warn" : "ok";

  return (
    <div className="pwm">
      <input
        className="pwm-in"
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="type a password-shaped thing…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        // reveal's keyboard handler would otherwise eat arrows/space as navigation.
        onKeyDown={(e) => e.stopPropagation()}
      />
      <div className="pwm-meter">
        <i className={value ? tone : ""} style={{ width: value ? `${pct}%` : 0 }} />
      </div>
      <p className={`pwm-verdict ${value ? tone : "dim"}`}>
        {!value
          ? "waiting…"
          : weak
            ? "in a wordlist — instant"
            : seconds < 60
              ? "cracked in " + human(seconds)
              : "holds for ~" + human(seconds)}
      </p>
      <p className="pwm-detail dim">
        {value && `${value.length} chars · charset ${pool} · ~${bits.toFixed(0)} bits of entropy`}
      </p>
      <p className="pwm-note dim">
        Offline estimate at 10 billion guesses/sec. Don&rsquo;t type a real password — old habits.
      </p>
    </div>
  );
}

// ponytail: env-guarded assert self-check — `PWM_SELFCHECK=1 npx tsx src/components/interactive/password-meter.tsx`.
if (process.env.PWM_SELFCHECK) {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("password-meter self-check failed: " + msg);
  };
  assert(human(3600) === "1.0 hours", human(3600));
  assert(human(1e30) === "longer than recorded history", human(1e30));

  const bad = estimate("password123");
  assert(bad.weak && bad.seconds < 1 && bad.pct < 35, "a wordlist password must read as instant");

  const good = estimate("Tr0ub4dor&3xKcd!");
  assert(!good.weak && good.pool === 95, "full keyboard charset");
  assert(good.seconds > 3.15e9, "16 mixed chars must outlast a century");
  assert(good.pct > 70, "…and land in the green band");

  // Length beats complexity — the whole point of the slide before this one.
  assert(estimate("aaaaaaaaaaaaaaaaaaaa").bits > estimate("aA1!aA1!").bits, "length wins");
  console.log("password-meter self-check ok");
}
