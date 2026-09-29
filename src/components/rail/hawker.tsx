"use client";

import { useState } from "react";

import type { Recall, Stop } from "@/content/rail";
import { recordHawker } from "@/lib/rail";

// The hawker at the platform. Before the station hands over its tool, a
// cha-wala (or a jhalmuri, badam or shosha seller: they take turns by station)
// comes to the window with one question about the ride just done. Right on the
// first try earns a star punched into the next ticket. A wrong pick is marked
// and he lets you pick again; nothing is held back, and he can be waved off.

type Seller = { who: string; call: string; item: "kettle" | "cone" | "nuts" | "basket" };
const SELLERS: Seller[] = [
  { who: "চা-ওয়ালা", call: "চা, চা গরম!", item: "kettle" },
  { who: "ঝালমুড়ি-ওয়ালা", call: "ঝালমুড়ি, ঝাল ঝাল মুড়ি!", item: "cone" },
  { who: "বাদাম-ওয়ালা", call: "বাদাম, বুট বাদাম!", item: "nuts" },
  { who: "শসা-ওয়ালা", call: "শসা, লবণ দেওয়া শসা!", item: "basket" },
];

/**
 * The station's own question, or else: which of three ideas came from this
 * station. The other two are the ideas of other stations on the same line, so
 * every option is true somewhere and only the ride just done tells them apart.
 */
export function recallFor(stop: Stop): Recall {
  if (stop.recall) return stop.recall;
  const line = stop.line.stations;
  const at = stop.n - 1;
  // Two other stations, the same ones every time: one near, one further along the line.
  const others = [line[(at + 2) % line.length], line[(at + Math.ceil(line.length / 2)) % line.length]].filter(
    (s, i, all) => s.slug !== stop.slug && all.findIndex((x) => x.slug === s.slug) === i,
  );
  const pool = [stop.tool.does, ...others.map((s) => s.tool.does)];
  // Rotate so the right one isn't always first.
  const shift = stop.index % pool.length;
  const options = [...pool.slice(shift), ...pool.slice(0, shift)];
  return { q: `${stop.bn} থেকে কি শিখলেন?`, options, answer: options.indexOf(stop.tool.does) };
}

export function Hawker({ stop, onDone }: { stop: Stop; onDone: () => void }) {
  const seller = SELLERS[stop.index % SELLERS.length];
  const { q, options, answer } = recallFor(stop);
  const [wrong, setWrong] = useState<number[]>([]);
  const [won, setWon] = useState(false);
  const first = won && wrong.length === 0;

  const pick = (i: number) => {
    if (won || wrong.includes(i)) return;
    if (i !== answer) {
      if (!wrong.length) recordHawker(stop.slug, false);
      setWrong((w) => [...w, i]);
      return;
    }
    if (!wrong.length) recordHawker(stop.slug, true);
    setWon(true);
  };

  const say = !won
    ? wrong.length
      ? "হলো না মামা। আরেকবার ভাবেন।"
      : `মামা, ${seller.item === "kettle" ? "এক কাপ চা" : "এক ঠোঙা"} নেবেন? আগে একটা কথা বলেন তো।`
    : first
      ? "একবারেই! নেন, আপনার টিকেটে একটা তারা। ট্রেন ছাড়ার আগে খেয়ে নেন।"
      : "এবার ঠিক। যান, টিকেট নিয়ে নেন।";

  return (
    <div className="rail-pop grid w-full max-w-2xl gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
      <Seller item={seller.item} happy={won} />
      <div className="grid gap-3">
        <div className="surface-card rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="text-[0.7rem] font-semibold tracking-[0.12em] text-muted uppercase">
            {seller.who} · <span className="font-bangla normal-case tracking-normal">{seller.call}</span>
          </div>
          <div key={say} className="mt-1 leading-snug transition duration-300 starting:opacity-0">
            {say}
          </div>
          <div className="mt-2 text-lg leading-snug font-semibold text-balance">{q}</div>
        </div>
        <div className="grid gap-2">
          {options.map((opt, i) => {
            const isWrong = wrong.includes(i);
            const isRight = won && i === answer;
            return (
              <button
                key={i}
                type="button"
                disabled={won || isWrong}
                onClick={() => pick(i)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left text-[0.95rem] leading-snug transition-[color,background-color,border-color,opacity] disabled:cursor-default ${
                  isRight
                    ? "win-pop border-accent bg-accent text-accent-foreground"
                    : isWrong
                      ? "nudge border-danger/50 bg-danger/5 text-danger"
                      : won
                        ? "border-border opacity-50"
                        : "border-border hover:border-accent hover:bg-accent/5"
                }`}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md border border-current/30 text-xs font-semibold">
                  {isRight ? "✓" : isWrong ? "✕" : String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {won ? (
            <button type="button" onClick={onDone} className="btn-primary">
              টিকেট নিন <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button type="button" onClick={onDone} className="cursor-pointer text-sm text-muted underline-offset-2 hover:underline">
              এখন না, টিকেট নিন
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** The seller at the window: fatua and gamcha, and what he sells in his hands. */
function Seller({ item, happy }: { item: Seller["item"]; happy: boolean }) {
  return (
    <svg viewBox="0 0 90 110" className="mx-auto h-40 w-32 shrink-0 sm:mx-0" aria-hidden="true">
      {/* the train window he leans in at */}
      <rect x="2" y="2" width="86" height="106" rx="10" className="fill-none stroke-muted/50" strokeWidth="3" />
      <path d="M2 74 H88" className="stroke-muted/50" strokeWidth="3" />
      {/* body: a light fatua with a checked gamcha over the shoulder */}
      <path d="M18 108 V80 q0-14 27-16 q27 2 27 16 V108z" fill="#e8dcc0" stroke="#8a7a5a" strokeWidth="1" />
      <path d="M26 66 l12 42 h8 l-10-44z" fill="#b7473a" />
      <path d="M28 70 l10 34 M32 68 l9 32" stroke="#f0c9a0" strokeWidth="1" />
      {/* head */}
      <rect x="40" y="52" width="10" height="10" fill="#a86f45" />
      <ellipse cx="45" cy="42" rx="12" ry="13" fill="#b67a4f" />
      <path d="M33 38 q12-16 24 0 q-2-8 -12-9 q-10 1 -12 9z" fill="#1f1812" />
      <circle cx="40.5" cy="42" r="1.4" fill="#1f1812" />
      <circle cx="49.5" cy="42" r="1.4" fill="#1f1812" />
      <path d={happy ? "M39 48 q6 5 12 0" : "M40 49 q5 2.5 10 0"} fill="none" stroke="#5a3620" strokeWidth="1.4" strokeLinecap="round" />
      {/* what he sells */}
      {item === "kettle" ? (
        <g>
          <path d="M60 84 q0-12 12-12 q12 0 12 12 v8 H60z" fill="#b8bec6" stroke="#6d7680" strokeWidth="1" />
          <path d="M84 80 q6 -2 6 -8" fill="none" stroke="#6d7680" strokeWidth="2.5" />
          <path d="M64 72 q8 -10 16 0" fill="none" stroke="#6d7680" strokeWidth="2" />
          <rect x="10" y="84" width="10" height="9" rx="2" fill="#f4f4f0" stroke="#8a7a5a" strokeWidth="0.8" />
          <path d="M12 80 q2-4 0-7 M16 80 q2-4 0-7" fill="none" className="stroke-muted" strokeWidth="1" />
        </g>
      ) : item === "basket" ? (
        <g>
          <path d="M56 86 h30 l-4 14 h-22z" fill="#b08447" stroke="#6b4e24" strokeWidth="1" />
          <path d="M58 86 q14-12 26 0" fill="none" stroke="#6b4e24" strokeWidth="1.5" />
          <rect x="62" y="80" width="18" height="6" rx="3" fill="#4f8a3a" transform="rotate(-12 71 83)" />
        </g>
      ) : (
        <g>
          <path d="M62 78 l20 0 l-10 24z" fill={item === "cone" ? "#e9d8a6" : "#d7c49a"} stroke="#8a7a5a" strokeWidth="1" />
          <path d="M63 78 q9 -8 18 0" fill={item === "cone" ? "#c9772c" : "#8a5a2b"} />
        </g>
      )}
    </svg>
  );
}
