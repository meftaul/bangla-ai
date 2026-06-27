"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { joinSession } from "../sessions/actions";

const LEN = 6; // join codes are 6 chars (generateJoinCode default)
// Match the code alphabet (no O/0/I/1) so typos can't enter impossible chars.
const ALLOWED = /[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/;

// Segmented join-code entry. Mirrors the assembled code into a hidden field so
// the existing `joinSession` server action runs unchanged.
export default function CodeInput() {
  const [cells, setCells] = useState<string[]>(Array(LEN).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const code = cells.join("");

  const focus = (i: number) => refs.current[Math.min(Math.max(i, 0), LEN - 1)]?.focus();

  const setCell = (i: number, val: string) => {
    setCells((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  };

  const onChange = (i: number, raw: string) => {
    const ch = raw.slice(-1).toUpperCase();
    if (ch && !ALLOWED.test(ch)) return; // ignore disallowed char, keep cell as-is
    setCell(i, ch);
    if (ch && i < LEN - 1) focus(i + 1);
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !cells[i] && i > 0) {
      e.preventDefault();
      setCell(i - 1, "");
      focus(i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight" && i < LEN - 1) {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const chars = e.clipboardData
      .getData("text")
      .toUpperCase()
      .split("")
      .filter((c) => ALLOWED.test(c))
      .slice(0, LEN);
    if (chars.length === 0) return;
    const next = Array(LEN).fill("");
    chars.forEach((c, idx) => (next[idx] = c));
    setCells(next);
    focus(chars.length); // land on the next empty cell (clamped)
  };

  return (
    <form action={joinSession} className="mt-8">
      <input type="hidden" name="code" value={code} />

      <label className="block text-sm font-medium text-foreground" id="join-code-label">
        Join code
      </label>
      <div
        className="mt-2 flex gap-2 sm:gap-2.5"
        role="group"
        aria-labelledby="join-code-label"
      >
        {cells.map((c, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={c}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={1}
            autoFocus={i === 0}
            aria-label={`Code character ${i + 1}`}
            className="field-input h-14 w-full px-0 text-center font-display text-2xl font-bold uppercase sm:h-16 sm:text-3xl"
          />
        ))}
      </div>

      <Submit disabled={code.length < LEN} />
    </form>
  );
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="btn-primary mt-5 w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Joining…" : "Join"}
    </button>
  );
}
