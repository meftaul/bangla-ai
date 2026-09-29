"use client";

import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { setSoundOn, soundOn } from "./sound";

/** Turns the automatic sounds on or off: the railway's (arrival, the punch) and the story's (journey/sfx.ts). */
export function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved choice lives in localStorage, which the server render cannot see
    setOn(soundOn());
  }, []);
  const Icon = on ? SpeakerHigh : SpeakerSlash;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        setSoundOn(!on);
        setOn(!on);
      }}
      className={`inline-flex cursor-pointer items-center gap-1 text-muted hover:text-foreground ${className}`}
    >
      <Icon size={16} weight="bold" aria-hidden="true" />
      <span>{on ? "শব্দ চালু" : "শব্দ বন্ধ"}</span>
    </button>
  );
}
