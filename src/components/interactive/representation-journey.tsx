"use client";

import { useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Speech, predictLook, primaryBtn, quietBtn, useCountUp, usePlay, useTween } from "@/components/journey/kit";
import { NORMAL_MAIL, SPAM_MAIL, capsShare, countFree, countLinks } from "./email-data";
import { bn } from "./figure-kit";

// Screens for "Math for AI 1.5 — Representation", told as a Journey.
//
// Ammu has won an iPhone, again. The reader sorts her inbox by eye in seconds,
// then tries to explain "spam" to a machine in words and gets ??? back. So
// they stop explaining and start counting: "free", links, capitals, the hour
// it was sent. Samin's ordinary mail gets the same four measures, and the two
// vectors sit side by side. Then the spam mail's words get shuffled into
// nonsense and the vector does not move: the machine measures, it does not
// read. Scores carry it past things with nothing to count (a movie's laughs
// and tears, the khichuri Shom's vector could not hold in 1.4), six things
// pass through the same middle box, and only then the name, representation,
// and the catch that the numbers have to be chosen well.
//
// The emails are the very ones the main lesson's Figure 9 measures
// (email-data.ts), so the numbers here always agree with the table there.
// Tailwind only, on the site's theme tokens; SVG/DOM rather than canvas, so
// the Bangla labels shape.

const two = (x: number) => x.toFixed(2);

// ---------------------------------------------------------------------------
// Chrome.

function AmmuSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="আম্মু" initial="আ" tint="blue" {...props} />;
}

function DoctorSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="ডাক্তার আপা" initial="ডা" tint="teal" {...props} />;
}

/** The machine: a slot on top, a little screen, three lights that blink while it works. */
function Machine({ busy = false, children }: { busy?: boolean; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xs rounded-2xl border-2 border-foreground/15 bg-foreground/5 p-3">
      <div className="mx-auto mb-2 h-1.5 w-20 rounded-full bg-foreground/25" />
      {/* A screen is dark in both themes, so its ink is fixed. */}
      <div
        className="grid min-h-16 place-items-center rounded-lg px-3 py-2 text-center font-mono text-base leading-snug"
        style={{ backgroundColor: "#0f172a", color: "#a7f3d0" }}
      >
        {children}
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <i
            key={i}
            className={`size-2 rounded-full ${busy ? "animate-pulse bg-cat-amber" : "bg-foreground/25"}`}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * A vector written out: each number in its own box, and under the box what
 * that box means. A box re-pops whenever its number changes.
 */
function Vec({
  v,
  names,
  lead,
  box,
}: {
  v: (number | string)[];
  names?: ReactNode[];
  lead?: ReactNode;
  /** border/background classes per box */
  box?: (i: number) => string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-y-2 font-mono text-lg">
      {lead ? <span className="mr-1.5 border-2 border-transparent py-0.5 font-semibold">{lead}</span> : null}
      {v.map((x, i) => (
        <span key={i} className="flex flex-col items-center">
          <span className="flex items-center">
            {i === 0 && <span className="px-0.5 text-muted">(</span>}
            <b
              key={String(x)}
              className={`${POP} inline-block min-w-[2.6ch] rounded-lg border-2 px-2 py-0.5 text-center font-semibold tabular-nums transition-colors ${
                box?.(i) ?? "border-border"
              }`}
            >
              {x}
            </b>
            <span className="px-0.5 text-muted">{i === v.length - 1 ? ")" : ","}</span>
          </span>
          {names ? (
            <span className="mt-1 max-w-[5.5rem] px-1 text-center font-sans text-xs leading-tight text-muted">{names[i] || " "}</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · Ammu's inbox. Six mails drop in; sort them by eye.

type Letter = { from: string; initial: string; subject: string; peek: string; time: string; spam: boolean };

const INBOX: Letter[] = [
  { from: "Prize Center", initial: "P", subject: "CONGRATULATIONS!!! You Have WON", peek: "DEAR LUCKY WINNER, your EMAIL has been SELECTED…", time: "3:47 AM", spam: true },
  { from: "মামা", initial: "মা", subject: "শুক্রবার বিয়ের দাওয়াত", peek: "আপা, দুলাভাই আর বাচ্চাদের নিয়ে অবশ্যই আসবেন…", time: "10:12 AM", spam: false },
  { from: "Bank Alert", initial: "B", subject: "URGENT: Your account will be CLOSED", peek: "VERIFY NOW or lose ALL your money: http://…", time: "4:05 AM", spam: true },
  { from: "Reunion", initial: "R", subject: "Reunion-এর ছবিগুলো", peek: "সবার ছবি এক folder-এ রেখে দিলাম, link নিচে…", time: "8:30 PM", spam: false },
  { from: "Courier", initial: "C", subject: "Your parcel is WAITING — pay 50 tk", peek: "FREE delivery if you pay in 1 hour: http://…", time: "3:15 AM", spam: true },
  { from: "বিদ্যুৎ অফিস", initial: "বি", subject: "August মাসের বিল", peek: "এই মাসের বিল 1,240 টাকা, শেষ তারিখ ২০ তারিখ।", time: "11:00 AM", spam: false },
];

const SORT_BTN =
  "h-9 cursor-pointer rounded-full border-2 border-border px-3.5 text-sm font-semibold transition-colors";

function Envelope({ l, children }: { l: Letter; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground/10 text-xs font-bold">
        {l.initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 text-sm">
          <b className="truncate font-semibold">{l.from}</b>
          <span className="ml-auto shrink-0 font-mono text-xs text-muted">{l.time}</span>
        </div>
        <div className="truncate text-[0.95rem] font-medium">{l.subject}</div>
        <div className="truncate text-sm text-muted">{l.peek}</div>
        {children}
      </div>
    </div>
  );
}

function Bin({ title, tone, items }: { title: string; tone: "coral" | "teal"; items: number[] }) {
  return (
    <div
      className={`min-h-20 rounded-xl border-2 border-dashed px-2.5 py-2 ${
        tone === "coral" ? "border-cat-coral/40 bg-cat-coral/5" : "border-cat-teal/40 bg-cat-teal/5"
      }`}
    >
      <div className={`mb-1.5 text-sm font-semibold ${tone === "coral" ? "text-cat-coral" : "text-cat-teal"}`}>
        {title} · {bn(items.length)}
      </div>
      <div className="grid gap-1">
        {items.map((i) => (
          <div key={i} className={`${POP} truncate rounded-md bg-surface px-2 py-1 text-xs`}>
            {INBOX[i].subject}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SortInbox() {
  const pass = useGate();
  const came = useCountUp(INBOX.length, 420);
  const [spamBin, setSpamBin] = useState<number[]>([]);
  const [okBin, setOkBin] = useState<number[]>([]);
  const [miss, setMiss] = useState<{ i: number; n: number } | null>(null);
  const sorted = spamBin.length + okBin.length;
  const waiting = INBOX.map((_, i) => i).filter((i) => i < came && !spamBin.includes(i) && !okBin.includes(i));

  const mark = (i: number, spam: boolean) => {
    if (INBOX[i].spam !== spam) {
      setMiss({ i, n: (miss?.n ?? 0) + 1 });
      return;
    }
    setMiss(null);
    const s = spam ? [...spamBin, i] : spamBin;
    const o = spam ? okBin : [...okBin, i];
    setSpamBin(s);
    setOkBin(o);
    if (s.length + o.length === INBOX.length) pass("ছয়টাই ঠিক জায়গায়। আপনার চোখে এক সেকেন্ডও লাগলো না।");
  };

  return (
    <>
      <div className="mx-auto mt-5 max-w-md">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted">
          আম্মুর inbox
          <span className="ml-auto">{bn(waiting.length)}টা বাকি</span>
        </div>
        <div className="grid min-h-24 gap-2">
          {waiting.map((i) => (
            <div key={i} className="transition duration-500 ease-out motion-reduce:transition-none starting:-translate-y-3 starting:opacity-0">
              <Envelope l={INBOX[i]}>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => mark(i, true)} className={`${SORT_BTN} hover:border-cat-coral hover:text-cat-coral`}>
                    Spam
                  </button>
                  <button type="button" onClick={() => mark(i, false)} className={`${SORT_BTN} hover:border-cat-teal hover:text-cat-teal`}>
                    ঠিক আছে
                  </button>
                </div>
              </Envelope>
              {miss?.i === i && (
                <Nope key={miss.n}>
                  {INBOX[i].spam
                    ? "উঁহু, আরেকবার দেখুন। রাত তিনটায় কে এভাবে চিৎকার করে mail লেখে?"
                    : "উঁহু, এটা তো চেনা মানুষের সাধারণ mail।"}
                </Nope>
              )}
            </div>
          ))}
          {waiting.length === 0 && came === INBOX.length && (
            <div className={`${FADE} rounded-xl border border-dashed border-border py-6 text-center text-muted`}>Inbox গোছানো শেষ।</div>
          )}
        </div>
      </div>
      <div className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-2.5">
        <Bin title="Spam folder" tone="coral" items={spamBin} />
        <Bin title="Inbox" tone="teal" items={okBin} />
      </div>
      <Task done={sorted === INBOX.length}>
        আম্মুর mail-গুলো বাছাই করুন, কোনটা spam আর কোনটা ঠিক আছে ({bn(sorted)}/{bn(INBOX.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Explain "spam" to the machine in words. Every word comes back as ???.

const TRIES = [
  { say: "যে mail লোভ দেখায়, সেটাই spam", word: "লোভ" },
  { say: "যে mail পড়লে সন্দেহ হয়", word: "সন্দেহ" },
  { say: "অচেনা লোকের চালাকি", word: "চালাকি" },
];

export function TellMachine() {
  const pass = useGate();
  const [tried, setTried] = useState<number[]>([]);
  const [now, setNow] = useState<number | null>(null);
  const chew = usePlay(750); // k 0–1: reading, 2: the verdict
  const busy = chew.running;
  const all = tried.length === TRIES.length;

  const feed = (j: number) => {
    if (busy || tried.includes(j)) return;
    setNow(j);
    chew.play(2, () => {
      const t = [...tried, j];
      setTried(t);
      if (t.length === TRIES.length) pass("মুখের কথা দিয়ে কোনোভাবেই বোঝানো গেল না।");
    });
  };

  const screen =
    now === null ? (
      <span className="animate-pulse">_</span>
    ) : busy ? (
      <span className="animate-pulse">পড়ছি…</span>
    ) : all ? (
      <span key="all" className={`${FADE} text-sm`}>
        শুধু সংখ্যা দিন
        <br />0 1 2 3 …
      </span>
    ) : (
      <span key={now} className="nudge inline-block" style={{ color: "#fca5a5" }}>
        “{TRIES[now].word}” = ???
      </span>
    );

  return (
    <>
      <div className="relative mt-4 pt-12">
        {/* the words, sliding down into the slot */}
        {busy && chew.k === 0 && now !== null && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
            <span className="translate-y-10 rounded-full bg-cat-blue px-3.5 py-1.5 text-sm font-semibold text-white opacity-0 transition duration-700 ease-in motion-reduce:transition-none starting:translate-y-0 starting:opacity-100">
              “{TRIES[now].say}”
            </span>
          </div>
        )}
        <Machine busy={busy}>{screen}</Machine>
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {TRIES.map((t, j) => {
          const used = tried.includes(j);
          return (
            <button
              key={t.word}
              type="button"
              disabled={busy || used}
              onClick={() => feed(j)}
              className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-[opacity,border-color] disabled:cursor-default ${
                used ? "border-dashed border-border line-through opacity-50" : "border-border hover:border-cat-blue/60"
              }`}
            >
              “{t.say}”
            </button>
          );
        })}
      </div>
      <Task done={all}>
        তিনভাবেই machine-কে spam বোঝানোর চেষ্টা করুন ({bn(tried.length)}/{bn(TRIES.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Stop explaining, start counting. Four measures of the spam mail, each
//     one lighting up what it counts.

type Clue = "free" | "links" | "caps" | "time";
type Mail = { from: string; time: string; head: string; links: string[] };

const PATTERN = { free: /\bfree\b/gi, links: /https?:\/\/\S+/g, caps: /[A-Z]/g };
const HI = {
  free: "rounded-sm bg-cat-amber/30 font-bold ring-2 ring-cat-amber",
  links: "rounded-sm bg-cat-blue/15 text-cat-blue underline",
  caps: "font-bold text-cat-coral",
};
const hits = (s: string, clue: Clue | null) => (clue && clue !== "time" ? (s.match(PATTERN[clue]) ?? []).length : 0);

/** The link lines get their own little grid, so the spam mail fits on one screen. */
function splitAtLinks(t: string) {
  const lines = t.split("\n");
  const at = lines.findIndex((l) => /https?:\/\//.test(l));
  return { head: lines.slice(0, at).join("\n").trimEnd(), links: lines.slice(at) };
}

const SPAM: Mail = { from: "Prize Center", time: "3:47 AM", ...splitAtLinks(SPAM_MAIL) };
// Samin's one link sits mid-sentence, so that mail stays whole.
const NORMAL: Mail = { from: "Samin", time: "9:20 PM", head: NORMAL_MAIL, links: [] };

const measure = (t: string, night: boolean) => [countFree(t), countLinks(t), capsShare(t), night ? 1 : 0];
const SPAM_V = measure(SPAM_MAIL, true);
const NORMAL_V = measure(NORMAL_MAIL, false);

const CLUES: { key: Clue; ask: string; name: string }[] = [
  { key: "free", ask: "“free” গুনুন", name: "“free” কতবার" },
  { key: "links", ask: "link গুনুন", name: "link কয়টা" },
  { key: "caps", ask: "CAPITAL মাপুন", name: "কত ভাগ CAPITAL" },
  { key: "time", ask: "সময়টা দেখুন", name: "রাত ৩টা–৫টার মধ্যে?" },
];
const SUB = ["₁", "₂", "₃", "₄"];
const shown = (j: number, x: number) => (j === 2 ? two(x) : String(x));

/** Text with the first `upto` matches of one clue lit, counting on from `from`. */
function Lit({ text, clue, from = 0, upto }: { text: string; clue: Clue | null; from?: number; upto: number }) {
  if (!clue || clue === "time") return <>{text}</>;
  const out: ReactNode[] = [];
  let last = 0;
  let n = from;
  for (const m of text.matchAll(PATTERN[clue])) {
    const i = m.index ?? 0;
    out.push(text.slice(last, i));
    out.push(
      <span key={i} className={n < upto ? `${HI[clue]} transition-colors duration-300` : undefined}>
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
    n++;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

function MailCard({ mail, clue, upto }: { mail: Mail; clue: Clue | null; upto: number }) {
  const first = hits(mail.head, clue);
  const from = mail.links.map((_, j) => first + mail.links.slice(0, j).reduce((s, l) => s + hits(l, clue), 0));
  return (
    <div className="mx-auto mt-5 max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm">
        <span className="text-muted">From</span>
        <b className="font-semibold">{mail.from}</b>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 font-mono text-xs transition-colors duration-300 ${
            clue === "time" ? "win-pop bg-cat-violet text-white" : "text-muted"
          }`}
        >
          {mail.time}
        </span>
      </div>
      <div className="px-3 py-2.5 font-mono text-[0.72rem] leading-relaxed break-words whitespace-pre-wrap sm:text-xs">
        <Lit text={mail.head} clue={clue} upto={upto} />
        {mail.links.length > 0 && (
          <div className="mt-2 grid gap-x-4 sm:grid-cols-2">
            {mail.links.map((line, j) => (
              <div key={j} className="truncate">
                <Lit text={line} clue={clue} from={from[j]} upto={upto} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** 3:47 at night: the hands sweep round, and the 3–5 slice lights up. */
function Clock() {
  const [h, m] = useTween([(3 + 47 / 60) * 30, 47 * 6], 1200, [0, 0]);
  const p = (deg: number, r: number) => `${50 + r * Math.sin((deg * Math.PI) / 180)} ${50 - r * Math.cos((deg * Math.PI) / 180)}`;
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label="the clock at 3:47, inside the 3 to 5 slice" className="mx-auto mt-3 block size-32">
      <circle cx={50} cy={50} r={44} strokeWidth={2} className="fill-surface stroke-border" />
      <path d={`M 50 50 L ${p(90, 40)} A 40 40 0 0 1 ${p(150, 40)} Z`} className={`${FADE} fill-cat-violet/25`} />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M ${p(i * 30, 41)} L ${p(i * 30, i % 3 === 0 ? 35 : 38)}`} strokeWidth={1.5} className="stroke-muted" />
      ))}
      <line x1={50} y1={50} x2={50} y2={29} strokeWidth={3.5} strokeLinecap="round" transform={`rotate(${h} 50 50)`} className="stroke-foreground" />
      <line x1={50} y1={50} x2={50} y2={16} strokeWidth={2} strokeLinecap="round" transform={`rotate(${m} 50 50)`} className="stroke-cat-violet" />
      <circle cx={50} cy={50} r={2.5} className="fill-foreground" />
    </svg>
  );
}

function ClueRows({ value, active }: { value: (j: number) => string; active: Clue | null }) {
  return (
    <div className="mx-auto mt-4 grid max-w-md gap-1.5">
      {CLUES.map((c, j) => (
        <div
          key={c.key}
          className={`flex items-center gap-3 rounded-lg border px-3 py-1.5 transition-colors ${
            active === c.key ? "border-cat-blue bg-cat-blue/5" : "border-border"
          }`}
        >
          <span className="font-mono text-xs text-muted">v{SUB[j]}</span>
          <span className="text-[0.95rem]">{c.name}</span>
          <b key={value(j)} className={`${POP} ml-auto inline-block font-mono tabular-nums`}>
            {value(j)}
          </b>
        </div>
      ))}
    </div>
  );
}

export function CountClues() {
  const pass = useGate();
  const [clue, setClue] = useState<Clue | null>(null);
  const [got, setGot] = useState<Clue[]>([]);
  const run = usePlay(230);
  // Capitals come in all at once; the bar does the counting.
  const [caps] = useTween([got.includes("caps") || clue === "caps" ? SPAM_V[2] : 0], 1200);
  const upto = clue === "caps" || !run.running ? Infinity : run.k;

  const take = (c: Clue) => {
    if (run.running) return;
    setClue(c);
    if (got.includes(c)) return;
    const steps = c === "free" ? SPAM_V[0] : c === "links" ? SPAM_V[1] : 5;
    run.play(steps, () => {
      const g = [...got, c];
      setGot(g);
      if (g.length === CLUES.length) pass("চারটা মাপ, চারটা সংখ্যা। Mail-টার মানে একবারও লাগলো না।");
    });
  };

  const value = (j: number) => {
    const c = CLUES[j].key;
    if (got.includes(c)) return shown(j, SPAM_V[j]);
    if (c !== clue || !run.running) return "?";
    return c === "caps" ? two(caps) : c === "time" ? "…" : String(run.k);
  };

  return (
    <>
      <MailCard mail={SPAM} clue={clue} upto={upto} />
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {CLUES.map((c) => (
          <button
            key={c.key}
            type="button"
            disabled={run.running}
            onClick={() => take(c.key)}
            className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors disabled:cursor-default ${
              clue === c.key ? "border-cat-blue bg-cat-blue text-white" : got.includes(c.key) ? "border-accent/50 text-accent-text" : "border-border hover:border-cat-blue/60"
            }`}
          >
            {got.includes(c.key) ? "✓ " : ""}
            {c.ask}
          </button>
        ))}
      </div>
      {clue === "caps" && (
        <div className={`${FADE} mx-auto mt-4 max-w-md`}>
          <div className="h-3 overflow-hidden rounded-full bg-foreground/5">
            <div className="h-full rounded-full bg-cat-coral" style={{ width: `${caps * 100}%` }} />
          </div>
          <div className="mt-1 text-center text-sm text-muted">
            একশোটা letter-এর মধ্যে প্রায় {bn(Math.round(caps * 100))}টা CAPITAL
          </div>
        </div>
      )}
      {clue === "time" && (
        <div className={FADE}>
          <Clock />
          <div className="mt-1 text-center text-sm text-muted">রাত ৩টা থেকে ৫টার মধ্যে? হ্যাঁ, তাই 1। না হলে 0।</div>
        </div>
      )}
      <ClueRows value={value} active={clue} />
      <Task done={got.length === CLUES.length}>
        চারটা জিনিসই মেপে ফেলুন ({bn(got.length)}/{bn(CLUES.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The same four measures for Samin's ordinary mail, bar beside bar.

function Bar({ pct, tone, label }: { pct: number; tone: "coral" | "teal"; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-foreground/5">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${tone === "coral" ? "bg-cat-coral" : "bg-cat-teal"}`}
          style={{ width: `${pct > 0 ? Math.max(pct * 100, 3) : 0}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-sm tabular-nums">{label}</span>
    </div>
  );
}

export function MeasureNormal() {
  const pass = useGate();
  const run = usePlay(750);
  const k = run.k; // measures taken
  const started = run.running || k > 0;
  const done = k === CLUES.length;
  const clue = run.running ? CLUES[k].key : null;
  const [grow] = useTween([1], 900, [0]);

  return (
    <>
      <MailCard mail={NORMAL} clue={clue} upto={Infinity} />
      {!started && (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={() => run.play(CLUES.length, () => pass("দুইটা mail, একই চারটা ঘর, একদম আলাদা সংখ্যা।"))} className={primaryBtn}>
            একই চারটা মাপ নিন
          </button>
        </div>
      )}
      <div className="mx-auto mt-5 max-w-md">
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <i className="size-3 rounded-full bg-cat-coral" /> আম্মুর spam mail
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-3 rounded-full bg-cat-teal" /> সামিনের mail
          </span>
        </div>
        <div className="grid gap-3">
          {CLUES.map((c, j) => {
            const max = Math.max(SPAM_V[j], NORMAL_V[j]) || 1;
            return (
              <div key={c.key} className={`rounded-lg px-2 py-1 transition-colors ${clue === c.key ? "bg-cat-blue/5" : ""}`}>
                <div className="mb-1 text-sm">
                  <span className="font-mono text-xs text-muted">v{SUB[j]}</span> {c.name}
                </div>
                <Bar pct={(SPAM_V[j] / max) * grow} tone="coral" label={shown(j, SPAM_V[j])} />
                <div className="mt-1">
                  <Bar pct={j < k ? NORMAL_V[j] / max : 0} tone="teal" label={j < k ? shown(j, NORMAL_V[j]) : "?"} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {done && (
        <div className={`${FADE} mt-6 grid gap-3`}>
          <Vec v={SPAM_V.map((x, j) => shown(j, x))} lead="Spam =" box={() => "border-cat-coral/60"} />
          <Vec v={NORMAL_V.map((x, j) => shown(j, x))} lead="Normal =" box={() => "border-cat-teal/60"} />
        </div>
      )}
      <Task done={done}>সামিনের mail-টারও একই চারটা মাপ নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Predict, then watch: shuffle the spam mail's words into nonsense. The
//     measures do not move, because the machine never read it in the first place.

const WORDS = SPAM.head.split(/\s+/).filter(Boolean);
const SHUFFLE_ASK = [
  "বদলে যাবে, কারণ লেখাটার এখন কোনো মানেই নাই",
  "হুবহু একই থাকবে",
  "Machine ধরে ফেলবে যে এটা আজগুবি লেখা",
];
const SHUFFLE_RIGHT = 1;

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function ShuffleTrap() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const [words, setWords] = useState(WORDS);
  const [round, setRound] = useState(0);
  const reveal = usePlay(1500);
  const over = guess !== null && reveal.k === 1;
  // Measured live from what is on screen, never assumed.
  const now = measure(`${words.join(" ")}\n${SPAM.links.join("\n")}`, true).map((x, j) => shown(j, x));
  const before = SPAM_V.map((x, j) => shown(j, x));

  const mix = () => {
    setWords(shuffle(WORDS));
    setRound((r) => r + 1);
  };
  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    mix();
    reveal.play(1, () =>
      pass(i === SHUFFLE_RIGHT ? "ঠিক ধরেছেন! একই চারটা সংখ্যা। Machine মানে পড়ে না, মাপে।" : "একই চারটা সংখ্যা। Machine মানে পড়ে না, মাপে।"),
    );
  };

  return (
    <>
      <div className="mx-auto mt-5 max-w-xl rounded-xl border border-border bg-surface px-3 py-2.5">
        <div className="mb-1.5 text-sm font-medium text-muted">{round === 0 ? "আম্মুর mail" : "এলোমেলো mail"}</div>
        <div className="font-mono text-[0.72rem] leading-relaxed sm:text-xs">
          {words.map((w, i) => (
            <span key={`${round}-${i}`} className={`${POP} mr-[0.6ch] inline-block`} style={{ transitionDelay: `${Math.min(i * 10, 500)}ms` }}>
              <Lit text={w} clue="free" upto={Infinity} />
            </span>
          ))}
        </div>
        <div className="mt-2 inline-flex rounded-full bg-cat-blue/10 px-2.5 py-0.5 font-mono text-xs text-cat-blue">
          + {bn(SPAM.links.length)}টা link, যেমন ছিল
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <Vec v={before} lead="আগে =" />
        {over && <Vec v={now} lead="এখন =" box={(j) => (now[j] === before[j] ? "border-accent bg-accent/10" : "border-danger")} />}
      </div>

      {over && (
        <>
          <AmmuSays>এটা আবার কী লিখেছে? একটা বাক্যেরও তো মাথামুণ্ডু নাই!</AmmuSays>
          <div className="mt-4">
            <Machine>
              <span key={round} className={`${FADE} text-sm`}>
                দুইটা mail-ই
                <br />
                {`(${now.join(", ")})`}
              </span>
            </Machine>
          </div>
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={mix} className={quietBtn}>
              আবার এলোমেলো করুন
            </button>
          </div>
        </>
      )}

      <div className="mt-5 text-sm font-medium text-muted">শব্দগুলো এলোমেলো করলে vector-এর কী হবে?</div>
      <div className="mt-2 grid gap-2">
        {SHUFFLE_ASK.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, SHUFFLE_RIGHT)} disabled={guess !== null} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={over}>আগে guess করুন। তারপর দেখা যাক machine কী পেলো।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Movies: nothing to count, so score them. Two masks read the two numbers
//     back as a mood — match each pair to its film, then score your own.

const MOVIES = [
  { name: "Toy Story", v: [2, 5] },
  { name: "The Shawshank Redemption", v: [5, 1] },
];
/** Shawshank's numbers first, so the order gives nothing away. */
const CARDS = [1, 0];

function Mask({ x, kind, level }: { x: number; kind: "drama" | "comedy"; level: number }) {
  const s = Math.max(0, Math.min(1, level / 5));
  const bend = 2 + 14 * s;
  const mouth = kind === "comedy" ? `M ${x - 12} 58 Q ${x} ${58 + bend} ${x + 12} 58` : `M ${x - 12} 66 Q ${x} ${66 - bend} ${x + 12} 66`;
  return (
    <g>
      <path
        d={`M ${x - 26} 22 Q ${x} 12 ${x + 26} 22 Q ${x + 30} 58 ${x} 84 Q ${x - 30} 58 ${x - 26} 22 Z`}
        className={kind === "comedy" ? "fill-cat-amber" : "fill-cat-blue"}
        style={{ opacity: 0.2 + 0.8 * s }}
      />
      <ellipse cx={x - 10} cy={40} rx={5} ry={kind === "comedy" ? 3 : 4} className="fill-foreground/75" />
      <ellipse cx={x + 10} cy={40} rx={5} ry={kind === "comedy" ? 3 : 4} className="fill-foreground/75" />
      <path d={mouth} strokeWidth={3.5} strokeLinecap="round" className="fill-none stroke-foreground/75" />
      {kind === "drama" && s >= 0.8 && <path d={`M ${x + 11} 47 q 3.5 6 0 9 q -3.5 -3 0 -9 Z`} className={`${POP} fill-cat-teal`} />}
      <text x={x} y={100} textAnchor="middle" fontSize={11} className="fill-muted">
        {kind}
      </text>
    </g>
  );
}

function Masks({ drama, comedy }: { drama: number; comedy: number }) {
  return (
    <svg viewBox="0 0 200 106" role="img" aria-label={`drama ${Math.round(drama)}, comedy ${Math.round(comedy)}`} className="mx-auto block h-auto w-full max-w-[12rem]">
      <Mask x={55} kind="drama" level={drama} />
      <Mask x={145} kind="comedy" level={comedy} />
    </svg>
  );
}

export function MovieMatch() {
  const pass = useGate();
  const [won, setWon] = useState<number[]>([]);
  const [miss, setMiss] = useState<{ card: number; n: number } | null>(null);
  const [mine, setMine] = useState([3, 3]);
  const [d, c] = useTween(mine, 300);
  const both = won.length === CARDS.length;

  const pick = (card: number, movie: number) => {
    if (won.includes(card)) return;
    if (CARDS[card] !== movie) {
      setMiss({ card, n: (miss?.n ?? 0) + 1 });
      return;
    }
    const w = [...won, card];
    setWon(w);
    setMiss(null);
    if (w.length === CARDS.length) pass("দুইটা সংখ্যা দেখেই সিনেমার মেজাজ ধরে ফেললেন।");
  };

  return (
    <>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {CARDS.map((m, card) => {
          const mv = MOVIES[m];
          const ok = won.includes(card);
          return (
            <div key={card} className={`rounded-xl border-2 p-3 transition-colors ${ok ? "win-pop border-accent bg-accent/5" : "border-border"}`}>
              <Masks drama={mv.v[0]} comedy={mv.v[1]} />
              <div className="mt-2">
                <Vec v={mv.v} names={["drama", "comedy"]} />
              </div>
              <div className="mt-3 text-center text-sm font-medium">{ok ? <b className="text-base">{mv.name}</b> : "কোন সিনেমা?"}</div>
              {!ok && (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {MOVIES.map((o, movie) => (
                    <button
                      key={o.name}
                      type="button"
                      onClick={() => pick(card, movie)}
                      className="cursor-pointer rounded-full border-2 border-border px-3 py-1 text-sm font-semibold transition-colors hover:border-cat-blue/60"
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              )}
              {miss?.card === card && (
                <Nope key={miss.n}>
                  {m === 1
                    ? "উঁহু। Comedy মাত্র 1, মানে হাসার সুযোগ প্রায় নাই। Toy Story তে এমন হয়?"
                    : "উঁহু। Comedy 5, মানে পুরো সময় হাসাবে। Shawshank দেখে কেউ এত হাসে?"}
                </Nope>
              )}
            </div>
          );
        })}
      </div>
      {both && (
        <div className={`${FADE} mt-6 rounded-xl border border-dashed border-border p-4 delay-300`}>
          <div className="text-center text-sm font-medium text-muted">এবার আপনার প্রিয় কোনো সিনেমাকে score দিন</div>
          <Masks drama={d} comedy={c} />
          <div className="mt-2">
            <Vec v={mine} names={["drama", "comedy"]} />
          </div>
          <div className="mx-auto mt-4 grid max-w-xs gap-3">
            {["drama", "comedy"].map((name, j) => (
              <label key={name} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-sm font-medium">{name}</span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={mine[j]}
                  aria-label={name}
                  onChange={(e) => setMine(mine.map((o, i) => (i === j ? Number(e.target.value) : o)))}
                  className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
                />
                <span className="w-4 shrink-0 text-right font-mono text-sm">{mine[j]}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <Task done={both}>কোন vector-টা কোন সিনেমার, মিলিয়ে দিন ({bn(won.length)}/{bn(CARDS.length)})</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The khichuri Shom's vector could not hold in 1.4. Score its taste, and
//     it finally goes in.

const TASTE = [
  { name: "ঝাল", on: "border-cat-coral bg-cat-coral text-white", dot: "border-cat-coral bg-cat-coral" },
  { name: "মিষ্টি", on: "border-cat-amber bg-cat-amber text-white", dot: "border-cat-amber bg-cat-amber" },
  { name: "টক", on: "border-cat-teal bg-cat-teal text-white", dot: "border-cat-teal bg-cat-teal" },
];
const DISHES = [
  { name: "ফুচকা", v: [4, 1, 5] },
  { name: "রসগোল্লা", v: [0, 5, 0] },
];
const SHOM_V = [175, 75, 42, 19];
const SHOM_NAMES = ["height", "weight", "জুতার size", "বয়স"];

function Pips({ n, dot }: { n: number; dot: string }) {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} className={`size-2.5 rounded-full border ${i < n ? dot : "border-border"}`} />
      ))}
    </span>
  );
}

/** A bowl of khichuri that reddens as the chilli goes up. */
function Bowl({ hot }: { hot: number }) {
  const s = hot / 5;
  return (
    <svg viewBox="0 0 120 84" aria-hidden="true" className="mx-auto block h-auto w-full max-w-[9rem]">
      {[42, 60, 78].map((x, i) => (
        <path
          key={x}
          d={`M ${x} 30 q -5 -6 0 -12 q 5 -6 0 -12`}
          strokeWidth={2}
          strokeLinecap="round"
          className="animate-pulse fill-none stroke-muted/60"
          style={{ animationDelay: `${i * 300}ms` }}
        />
      ))}
      <path d="M 14 42 Q 18 78 60 78 Q 102 78 106 42 Z" className="fill-cat-blue" />
      <ellipse cx={60} cy={42} rx={44} ry={9} className="transition-[fill] duration-500" style={{ fill: `color-mix(in srgb, #d9532b ${s * 100}%, #e7b84a)` }} />
      <ellipse cx={60} cy={42} rx={46} ry={10} strokeWidth={3} className="fill-none stroke-cat-blue" />
    </svg>
  );
}

export function KhichuriVector() {
  const pass = useGate();
  const [v, setV] = useState<(number | null)[]>([null, null, null]);
  const count = v.filter((x) => x !== null).length;
  const full = count === TASTE.length;

  const set = (j: number, x: number) => {
    const next = v.map((o, i) => (i === j ? x : o));
    setV(next);
    if (next.every((o) => o !== null)) pass(`খিচুড়ি = (${next.join(", ")})। প্রিয় খাবার এবার সংখ্যায়।`);
  };

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {DISHES.map((d) => (
          <div key={d.name} className="rounded-xl border border-border px-3 py-2.5">
            <b className="font-semibold">{d.name}</b>
            <div className="mt-1.5 grid gap-1 text-sm">
              {TASTE.map((t, j) => (
                <div key={t.name} className="flex items-center gap-2">
                  <span className="w-10 text-muted">{t.name}</span>
                  <Pips n={d.v[j]} dot={t.dot} />
                </div>
              ))}
            </div>
            <div className="mt-1.5 font-mono text-sm">({d.v.join(", ")})</div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border-2 border-dashed border-cat-amber/60 bg-cat-amber/5 px-3 py-3">
        <div className="text-center font-semibold">খিচুড়ি</div>
        <Bowl hot={v[0] ?? 0} />
        <div className="mt-2 grid justify-center gap-2">
          {TASTE.map((t, j) => (
            <div key={t.name} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-sm font-medium">{t.name}</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5].map((x) => {
                  const val = v[j];
                  const filled = val !== null && x > 0 && x <= val;
                  return (
                    <button
                      key={x}
                      type="button"
                      aria-pressed={val === x}
                      aria-label={`${t.name} ${x}`}
                      onClick={() => set(j, x)}
                      className={`size-9 cursor-pointer rounded-lg border-2 font-mono text-sm font-semibold transition-colors ${
                        filled ? t.on : val === x ? "border-foreground" : "border-border hover:border-foreground/40"
                      }`}
                    >
                      {x}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Vec v={v.map((x) => (x === null ? "?" : x))} names={TASTE.map((t) => t.name)} lead="খিচুড়ি =" />
        </div>
      </div>

      {full && (
        <div className={`${FADE} mt-5 rounded-xl border border-border px-3 py-3`}>
          <div className="mb-2 text-center text-sm font-medium text-muted">সোমের vector, এবার প্রিয় খাবারসহ</div>
          <Vec
            v={[...SHOM_V, ...(v as number[])]}
            names={[...SHOM_NAMES, ...TASTE.map((t) => t.name)]}
            box={(i) => (i >= SHOM_V.length ? "border-cat-amber bg-cat-amber/10" : "border-border")}
          />
        </div>
      )}
      <Task done={full}>
        খিচুড়ির তিনটা score দিন, আপনার জিভ যা বলে ({bn(count)}/{bn(TASTE.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Six things, one road. Each passes through the same middle box; the
//     first arrow earns its name only once all six have gone through.

type Thing = { icon: string; name: string; what: string; nums: [string, string][]; more?: boolean; ask: string };

const THINGS: Thing[] = [
  { icon: "🧑‍🎓", name: "নাসিব", what: "ক্লাসের একজন student", nums: [["height", "180"], ["weight", "78"], ["জুতা", "43"], ["বয়স", "18"]], ask: "কার সাথে কার মিল বেশি?" },
  { icon: "🖼️", name: "একটা photo", what: "3000 × 4000 pixel", nums: [["px 1", "10"], ["px 2", "20"], ["px 3", "15"], ["px 4", "25"]], more: true, ask: "ছবিতে কি পাখি আছে?" },
  { icon: "✉️", name: "আম্মুর mail", what: "রাত 3:47-এ আসা", nums: [["free", "6"], ["link", "14"], ["caps", "0.31"], ["৩–৫টা", "1"]], ask: "এটা কি spam?" },
  { icon: "🎬", name: "Toy Story", what: "0 থেকে 5 score", nums: [["drama", "2"], ["comedy", "5"]], ask: "আর কার ভালো লাগবে?" },
  { icon: "🍲", name: "খিচুড়ি", what: "সোমের প্রিয় খাবার", nums: [["ঝাল", "3"], ["মিষ্টি", "0"], ["টক", "1"]], ask: "সোমের আর কী ভালো লাগবে?" },
  { icon: "🩺", name: "একজন রোগী", what: "ডাক্তারের চেম্বারে", nums: [["বয়স", "42"], ["bp", "142"], ["sugar", "180"], ["bmi", "27.4"]], ask: "ঝুঁকি আছে কি?" },
];
const tupleOf = (t: Thing) => `(${t.nums.map(([, x]) => x).join(", ")}${t.more ? ", …" : ""})`;

const ENTER = "transition duration-500 ease-out motion-reduce:transition-none starting:translate-y-2 starting:opacity-0";

function Station({ delay, children }: { delay: number; children: ReactNode }) {
  return (
    <div style={{ transitionDelay: `${delay}ms` }} className={`${ENTER} grid min-h-28 place-items-center rounded-xl border border-border bg-surface px-3 py-3 text-center`}>
      {children}
    </div>
  );
}

function Arrow({ label, delay, hot = false }: { label: string; delay: number; hot?: boolean }) {
  return (
    <div style={{ transitionDelay: `${delay}ms` }} className={`${ENTER} flex items-center justify-center gap-1.5 text-xs font-semibold text-muted sm:flex-col`}>
      <span aria-hidden="true" className="text-lg sm:hidden">
        ↓
      </span>
      <span aria-hidden="true" className="hidden text-lg sm:inline">
        →
      </span>
      <span key={label} className={hot ? "win-pop rounded-full bg-accent px-2 py-0.5 text-accent-foreground" : ""}>
        {label}
      </span>
    </div>
  );
}

export function Pipeline() {
  const pass = useGate();
  const [n, setN] = useState(0); // things sent so far
  const lock = usePlay(1600);
  const all = n === THINGS.length;
  const named = all && !lock.running;
  const t = n > 0 ? THINGS[n - 1] : null;

  const send = () => {
    if (lock.running || all) return;
    const next = n + 1;
    setN(next);
    lock.play(1, () => {
      if (next === THINGS.length) pass("ছয়টা আলাদা জিনিস, অথচ মাঝের box-টা প্রতিবার একই রকম।");
    });
  };

  return (
    <>
      <div key={n} className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_1.4fr_auto_1fr] sm:items-stretch">
        <Station delay={0}>
          {t ? (
            <div>
              <div aria-hidden="true" className="text-3xl">
                {t.icon}
              </div>
              <b className="mt-1 block font-semibold">{t.name}</b>
              <span className="text-xs text-muted">{t.what}</span>
            </div>
          ) : (
            <span className="text-muted">দুনিয়ার একটা জিনিস</span>
          )}
        </Station>
        <Arrow label={named ? "representation" : "?"} delay={350} hot={named} />
        <Station delay={500}>
          {t ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              {t.nums.map(([name, x], i) => (
                <span key={name} style={{ transitionDelay: `${650 + i * 140}ms` }} className={`${POP} flex flex-col items-center`}>
                  <b className="rounded-md border-2 border-cat-blue/60 px-1.5 font-mono text-sm font-semibold">{x}</b>
                  <span className="mt-0.5 text-[0.65rem] text-muted">{name}</span>
                </span>
              ))}
              {t.more && <span className="self-start pt-0.5 font-mono text-sm text-muted">…</span>}
            </div>
          ) : (
            <span className="font-mono text-muted">( ?, ?, … )</span>
          )}
        </Station>
        <Arrow label="arithmetic" delay={1000} />
        <Station delay={1200}>{t ? <b className="font-semibold">{t.ask}</b> : <span className="text-muted">একটা প্রশ্ন</span>}</Station>
      </div>

      {!all && (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={send} disabled={lock.running} className={primaryBtn}>
            {n === 0 ? "প্রথমটা পাঠান" : "পরেরটা পাঠান"} ({bn(n)}/{bn(THINGS.length)})
          </button>
        </div>
      )}

      {n > 0 && (
        <div className="mx-auto mt-5 max-w-md">
          <div className="mb-1.5 text-sm font-medium text-muted">মাঝের box-গুলো, পাশাপাশি</div>
          <div className="grid gap-1.5">
            {THINGS.slice(0, n).map((x) => (
              <div key={x.name} className={`${FADE} flex items-center gap-2 rounded-lg border border-border px-3 py-1.5`}>
                <span aria-hidden="true">{x.icon}</span>
                <b className="text-sm font-semibold">{x.name}</b>
                <span className="ml-auto font-mono text-sm">{tupleOf(x)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Task done={all}>
        ছয়টা জিনিসই একে একে পাঠান, আর মাঝের box-টা খেয়াল করুন ({bn(n)}/{bn(THINGS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Representation is a choice. Build the patient's vector for the doctor —
//     being a number is not enough, it has to say something about the question.

const FACTS = [
  { name: "বয়স", value: "42", good: true },
  { name: "জামার রং", value: "নীল", good: false, why: "জামার রং দিয়ে আমি কী করবো? তার ওপর এটা তো সংখ্যাই না।" },
  { name: "blood pressure", value: "142", good: true },
  { name: "Serial নম্বর", value: "17", good: false, why: "সংখ্যা ঠিক আছে, কিন্তু ১৭ নম্বরে আসলো বলে কি ঝুঁকি বাড়ে? এই সংখ্যা রোগীর ব্যাপারে কিছুই বলে না।" },
  { name: "blood sugar", value: "180", good: true },
  { name: "বাসা থেকে দূরত্ব", value: "12 km", good: false, why: "বারো কিলোমিটার দূর থেকে আসলে তো sugar বাড়ে না। এটা বাদ।" },
  { name: "BMI", value: "27.4", good: true },
];
const GOOD = FACTS.filter((f) => f.good).length;

export function PatientPicker() {
  const pass = useGate();
  const [on, setOn] = useState<number[]>([]);
  const [out, setOut] = useState<number[]>([]);
  const [no, setNo] = useState<{ j: number; n: number } | null>(null);
  const done = on.length === GOOD;

  const pick = (j: number) => {
    if (on.includes(j) || done) return;
    if (!FACTS[j].good) {
      setNo({ j, n: (no?.n ?? 0) + 1 });
      if (!out.includes(j)) setOut([...out, j]);
      return;
    }
    const next = [...on, j];
    setOn(next);
    setNo(null);
    if (next.length === GOOD) pass("চারটা কাজের সংখ্যা। Representation-টা আপনি নিজেই বানালেন।");
  };

  return (
    <>
      <div className="mx-auto mt-5 max-w-md rounded-xl border-2 border-dashed border-cat-teal/50 bg-cat-teal/5 px-4 py-3">
        <div className="mb-2 text-center text-sm font-medium text-muted">আজকের রোগীর ব্যাপারে যা জানা আছে</div>
        <div className="flex flex-wrap justify-center gap-2">
          {FACTS.map((f, j) => {
            const picked = on.includes(j);
            const bad = out.includes(j);
            return (
              <button
                key={f.name}
                type="button"
                disabled={picked || done}
                onClick={() => pick(j)}
                className={`cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm transition-colors disabled:cursor-default ${
                  picked
                    ? "border-accent bg-accent text-accent-foreground"
                    : bad
                      ? "border-dashed border-danger/50 text-danger line-through"
                      : "border-border bg-surface hover:border-cat-blue/60"
                }`}
              >
                {f.name} · <b className="font-mono">{f.value}</b>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5">
        {on.length ? (
          <Vec v={on.map((j) => FACTS[j].value)} names={on.map((j) => FACTS[j].name)} lead="রোগী =" box={() => "border-accent bg-accent/10"} />
        ) : (
          <div className="text-center font-mono text-lg text-muted">রোগী = ( )</div>
        )}
      </div>
      {no && FACTS[no.j].why && (
        <DoctorSays key={no.n} tone="bad">
          {FACTS[no.j].why}
        </DoctorSays>
      )}
      {!no && on.length === 0 && <DoctorSays>ডায়াবেটিসের ঝুঁকি বুঝতে আমার কাজে লাগবে এমন সংখ্যাগুলো দিন।</DoctorSays>}
      {done && <DoctorSays tone="good">এই চারটা দিয়েই কাজ চলবে। বাকিগুলো শুধু ভিড় বাড়াতো।</DoctorSays>}
      <Task done={done}>
        রোগীর vector-এ শুধু কাজের সংখ্যাগুলো বসান ({bn(on.length)}/{bn(GOOD)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · Last picture: all six things, one after another, turn into numbers.

function FinaleReel({ onReplay }: { onReplay: () => void }) {
  const k = useCountUp(THINGS.length + 1, 650);
  return (
    <>
      <div className="mx-auto mt-5 grid max-w-md gap-2">
        {THINGS.map((x, i) => (
          <div
            key={x.name}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors duration-500 ${i < k ? "border-accent/40 bg-accent/5" : "border-border"}`}
          >
            <span aria-hidden="true" className="text-xl">
              {x.icon}
            </span>
            <b className="text-sm font-semibold">{x.name}</b>
            <span className="ml-auto font-mono text-sm">
              {i < k ? <span className={`${POP} inline-block`}>{tupleOf(x)}</span> : <span className="text-muted">…</span>}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 min-h-24 text-center">
        {k > THINGS.length && (
          <div className={FADE}>
            <div className="text-xl font-bold">ছয়টা জিনিস, ছয়টা vector</div>
            <div className="text-muted">দুনিয়া থেকে machine-এ ঢোকার রাস্তা একটাই: representation</div>
            <button
              type="button"
              onClick={onReplay}
              className="mt-3 cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              ↺ আবার দেখুন
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function Finale() {
  const [run, setRun] = useState(0);
  return <FinaleReel key={run} onReplay={() => setRun((r) => r + 1)} />;
}
