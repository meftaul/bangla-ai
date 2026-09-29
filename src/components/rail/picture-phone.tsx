"use client";

import { Fragment, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

import { bn } from "@/components/interactive/figure-kit";
import { NORMAL_MAIL, SPAM_MAIL, capsShare, countFree, countLinks } from "@/components/interactive/email-data";
import { pill, useSeed, type Fixtures } from "@/components/journey/kit";
import { sfx } from "@/components/journey/sfx";
import { MATH_RAIL, type Station } from "@/content/rail";

import "./rail.css";

// Line 1's machine, working: the Picture phone. Whatever the reader makes on
// their phone (a drawing, a colour, an email) leaves as a list of numbers, each
// number crosses the wire as eight priced bulbs, and Jobayer's phone in
// Chattogram adds the bulbs back up, rebuilds it, and reads it with one
// multiply-add. Every stage names the Line 1 tool doing that job; a tool whose
// station isn't open just isn't named.
//
// ponytail: the grid is drawn with a pointer only; a keyboard reader can send a
// colour or a mail but not a drawing. Cells as buttons would fix it.

type Mode = "photo" | "colour" | "mail";

const N = 8; // the drawing is N × N
const PAPER = 255;
const BLANK = Array<number>(N * N).fill(PAPER);
const PENS = [
  { v: 0, label: "কালো" },
  { v: 128, label: "ধূসর" },
  { v: PAPER, label: "মুছুন" },
];
/** the bulbs on each pole, left to right, and what each one is worth */
const PRICES = [128, 64, 32, 16, 8, 4, 2, 1];

const gray = (v: number) => `rgb(${v} ${v} ${v})`;
/** (x, y) the graph-paper way: x from the left, y from the bottom, both from 0 */
const address = (i: number) => `(${i % N}, ${N - 1 - Math.floor(i / N)})`;

// ---------------------------------------------------------------------------
// What Jobayer's phone reads out of each kind of message, with one multiply-add.

/** The pictures his phone knows. It multiplies your ink with each one, square by square, and adds. */
const STENCILS: { name: string; rows: string[] }[] = [
  {
    name: "পাখি",
    rows: ["........", ".....##.", "....####", "##.####.", ".######.", "..####..", "...#.#..", "........"],
  },
  {
    name: "নৌকা",
    rows: ["....#...", "....##..", "....###.", "....#...", "########", ".######.", "..####..", "........"],
  },
  {
    name: "ঘর",
    rows: ["...##...", "..####..", ".######.", "########", ".#....#.", ".#.##.#.", ".#.##.#.", ".######."],
  },
  {
    name: "হার্ট",
    rows: ["........", ".##..##.", "########", "########", ".######.", "..####..", "...##...", "........"],
  },
  {
    name: "মাছ",
    rows: ["........", "..###..#", ".#####.#", "########", ".#####.#", "..###..#", "........", "........"],
  },
];
const STENCIL_INK = STENCILS.map((s) =>
  s.rows
    .join("")
    .split("")
    .map((c) => (c === "#" ? 1 : 0)),
);

const inkOf = (v: number) => (PAPER - v) / PAPER;
/** how alike two ink patterns are, 0…1: multiply square by square, add, and scale away how much ink each has */
function likeness(a: number[], b: number[]) {
  let ab = 0;
  let aa = 0;
  let bb = 0;
  a.forEach((x, i) => {
    ab += x * b[i];
    aa += x * x;
    bb += b[i] * b[i];
  });
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
}

/** a colour on a black-and-white screen: how bright our eyes find each lamp */
const GREY_W = [0.3, 0.59, 0.11];

// ponytail: hand-picked weights. A real spam filter learns them; that is Line 2's radio knob.
const CLUES = [
  { name: "“free” কতবার", w: 2 },
  { name: "link কয়টা", w: 1 },
  { name: "কত % CAPITAL", w: 0.1 },
  { name: "রাত ৩টা–৫টায়?", w: 5 },
];
const SPAM_AT = 10;
const MAILS = [
  { label: "Prize Center · 3:47 AM", text: SPAM_MAIL, night: true },
  { label: "সামিন · 9:20 PM", text: NORMAL_MAIL, night: false },
];
const byte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const sieve = (text: string, night: boolean) => [byte(countFree(text)), byte(countLinks(text)), byte(capsShare(text) * 100), night ? 1 : 0];

const dot = (xs: number[], ws: number[]) => xs.reduce((sum, x, i) => sum + x * ws[i], 0);
const round1 = (v: number) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------------------

/** One send: the list that left, the list that arrived, and the bulb the storm flipped in each number (0 = none). */
type Packet = { mode: Mode; sent: number[]; got: number[]; hit: number[] };

const TOOL_OF: Record<string, string> = {
  add: "00_why_math",
  loupe: "01_intro",
  call: "01c_image_numbers",
  lamps: "01d_color_image",
  list: "01e_vector",
  sieve: "01f_representation",
  address: "01a_graph_paper",
  bulbs: "01b_binary",
};

export function PicturePhone({ stations = MATH_RAIL[0].stations }: { stations?: Station[] }) {
  const [mode, setMode] = useSeed<Mode>("mode", "photo");
  const [px, setPx] = useSeed("px", BLANK);
  const [pen, setPen] = useState(0);
  const [rgb, setRgb] = useSeed("rgb", [230, 60, 80]);
  const [mail, setMail] = useSeed("mail", MAILS[0].text);
  const [night, setNight] = useSeed("night", true);
  const [storm, setStorm] = useSeed("storm", false);
  const [packet, setPacket] = useSeed<Packet | null>("packet", null);
  const [k, setK] = useSeed("k", 0); // numbers arrived so far

  const list = mode === "photo" ? px : mode === "colour" ? rgb : sieve(mail, night);
  const n = packet?.sent.length ?? 0;
  const sending = !!packet && k < n;
  const beat = n ? Math.max(70, Math.min(700, 4200 / n)) : 0;

  useEffect(() => {
    if (!packet || k >= n) return;
    const t = setTimeout(() => {
      if (n <= 8) sfx.click();
      if (k + 1 === n) sfx.ring(1);
      setK(k + 1);
    }, beat);
    return () => clearTimeout(t);
  }, [packet, k, n, beat, setK]);

  const send = () => {
    // Each number, in a storm, has one chance in four of a bulb flipped on the way.
    const hit = list.map(() => (storm && Math.random() < 0.25 ? PRICES[Math.floor(Math.random() * 8)] : 0));
    setPacket({
      mode,
      sent: [...list],
      got: list.map((v, i) => v ^ hit[i]),
      hit,
    });
    setK(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? list.length : 0);
  };

  // The left pole shows the number on the wire now; the right one, the last to arrive.
  const leaving = packet ? packet.sent[sending ? k : n - 1] : null;
  const landed = packet && k > 0 ? packet.got[k - 1] : null;
  const small = "px-2.5! py-1! text-xs!";
  return (
    <section aria-labelledby="picture-phone" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 id="picture-phone" className="font-board text-2xl font-extrabold tracking-wide uppercase">
          Picture phone · চালিয়ে দেখুন
        </h2>
        <p className="text-sm text-muted">তারে শুধু বাল্ব জ্বলে আর নেভে। ছবি, রঙ, মেইল, যা-ই পাঠান, যায় সংখ্যা হয়ে।</p>
      </div>

      {/* the whole call in one row on a wide screen, left to right; stacked, top to bottom, on a phone */}
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem_minmax(0,1fr)] md:items-start">
        {/* ---- your phone, and the list it sends ---- */}
        <div className="surface-card flex flex-col gap-2.5 p-4">
          <Head n="১" title="আপনার ফোন">
            <ToolTags stations={stations} keys={mode === "photo" ? ["address", "loupe"] : mode === "colour" ? ["lamps"] : ["sieve"]} />
          </Head>
          <div role="tablist" aria-label="কী পাঠাবেন" className="flex flex-wrap gap-2">
            {(
              [
                ["photo", "ছবি"],
                ["colour", "রঙ"],
                ["mail", "মেইল"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                disabled={sending}
                onClick={() => setMode(m)}
                className={`${pill(mode === m)} ${small}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={`flex flex-col gap-2.5 ${sending ? "pointer-events-none opacity-60" : ""}`}>
            {mode === "photo" && (
              <>
                <Grid px={px} onPaint={(j) => setPx((p) => (p[j] === pen ? p : p.map((v, x) => (x === j ? pen : v))))} />
                <div className="flex flex-wrap justify-center gap-1.5">
                  {PENS.map((p) => (
                    <button
                      key={p.v}
                      type="button"
                      aria-pressed={pen === p.v}
                      onClick={() => setPen(p.v)}
                      className={`${pill(pen === p.v)} ${small}`}
                    >
                      <span
                        aria-hidden="true"
                        className="mr-1 inline-block size-2.5 rounded-full border border-foreground/30 align-[-1px]"
                        style={{ background: gray(p.v) }}
                      />
                      {p.label} · {p.v}
                    </button>
                  ))}
                  <button type="button" aria-label="সব মুছুন" onClick={() => setPx(BLANK)} className={`${pill(false)} ${small}`}>
                    ↺
                  </button>
                </div>
              </>
            )}
            {mode === "colour" && (
              <>
                <div className="mx-auto size-24 rounded-2xl shadow-inner ring-1 ring-foreground/15" style={{ background: `rgb(${rgb.join(" ")})` }} />
                {["লাল", "সবুজ", "নীল"].map((name, j) => (
                  <label key={name} className="grid grid-cols-[2.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-sm">
                    <span className="font-semibold">{name}</span>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={rgb[j]}
                      onChange={(e) => setRgb(rgb.map((v, x) => (x === j ? Number(e.target.value) : v)))}
                      style={{ accentColor: ["#e11d48", "#16a34a", "#2563eb"][j] }}
                    />
                    <span className="text-right font-mono tabular-nums">{rgb[j]}</span>
                  </label>
                ))}
              </>
            )}
            {mode === "mail" && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {MAILS.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      aria-pressed={mail === m.text}
                      onClick={() => {
                        setMail(m.text);
                        setNight(m.night);
                      }}
                      className={`${pill(mail === m.text)} ${small}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={mail}
                  onChange={(e) => setMail(e.target.value)}
                  rows={6}
                  aria-label="মেইলটা"
                  className="w-full resize-y rounded-xl border border-border bg-background p-2 font-mono text-[0.7rem] leading-snug"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={night} onChange={(e) => setNight(e.target.checked)} />
                  রাত ৩টা থেকে ৫টার মধ্যে এসেছে
                </label>
              </>
            )}
          </div>
          <div className="mt-1 flex flex-col gap-2 border-t border-border pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">যা যাবে: {bn(list.length)}টা সংখ্যা</span>
              <ToolTags stations={stations} keys={mode === "photo" ? ["call", "list"] : ["list"]} />
            </div>
            <NumberList mode={mode} list={list} at={packet && packet.mode === mode && sending ? k : -1} />
          </div>
        </div>

        {/* ---- the wire: eight lines, one per bulb ---- */}
        <div className="surface-card flex flex-col gap-3 p-4">
          <Head n="২" title="তার দিয়ে">
            <ToolTags stations={stations} keys={["bulbs"]} />
          </Head>
          <div className="mx-auto grid w-full max-w-60 grid-cols-[1.75rem_auto_minmax(0,1fr)_auto] items-center gap-x-1.5 gap-y-1">
            <span />
            <span className="text-[0.6rem] text-muted">আপনার</span>
            <span />
            <span className="text-right text-[0.6rem] text-muted">জোবায়ের</span>
            {PRICES.map((p) => (
              <Fragment key={p}>
                <span className="text-right font-mono text-[0.65rem] text-muted tabular-nums">{p}</span>
                <Bulb on={leaving !== null && (leaving & p) !== 0} />
                <span aria-hidden="true" className="relative h-3">
                  <span className="absolute inset-x-0 top-1/2 border-t-2 border-muted/50" />
                  {sending && leaving !== null && (leaving & p) !== 0 && (
                    <span
                      key={k}
                      className="rail-wire absolute top-1/2 size-2.5 -translate-1/2 rounded-full bg-[#f3c623] shadow-[0_0_8px_#f3c623]"
                      style={{ animationDuration: `${beat}ms` }}
                    />
                  )}
                </span>
                <Bulb on={landed !== null && (landed & p) !== 0} hit={packet && k > 0 && packet.hit[k - 1] === p} />
              </Fragment>
            ))}
            <span />
            <span className="text-center font-mono text-sm font-bold tabular-nums">{leaving ?? ""}</span>
            <span />
            <span className="text-center font-mono text-sm font-bold tabular-nums">{landed ?? ""}</span>
          </div>
          <div className="min-h-4 text-center font-mono text-[0.7rem] text-muted tabular-nums">{landed === null ? "" : sumOf(landed)}</div>
          <div className="flex flex-col items-stretch gap-2">
            <button type="button" onClick={send} className="btn-primary">
              {packet ? "আবার পাঠান" : "পাঠান"}
            </button>
            {sending && (
              <button type="button" onClick={() => setK(n)} className="btn-secondary border border-border">
                বাকিটা একবারে
              </button>
            )}
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={storm} disabled={sending} onChange={(e) => setStorm(e.target.checked)} className="mt-0.5" />
              <span>লাইনে ঝড় ⚡ মাঝে মাঝে একটা বাল্ব উল্টে যায়</span>
            </label>
            {packet && (
              <span className="text-center font-ticket text-xs text-muted tabular-nums">
                {k}/{n}
              </span>
            )}
          </div>
        </div>

        {/* ---- Jobayer's phone ---- */}
        <div className="surface-card flex flex-col gap-2.5 p-4">
          <Head n="৩" title="জোবায়েরের ফোন · চট্টগ্রাম" />
          {!packet ? (
            <div className="grid min-h-40 flex-1 place-items-center rounded-xl border-2 border-dashed border-border p-6 text-center text-sm text-muted">
              এখনো কিছু আসেনি।
            </div>
          ) : (
            <Arrived packet={packet} k={k} stations={stations} />
          )}
        </div>
      </div>
    </section>
  );
}

/** The Line 1 tools doing a stage's job, named; one whose station isn't open is left out. */
function ToolTags({ stations, keys }: { stations: Station[]; keys: string[] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {keys.flatMap((key) => {
        const st = stations.find((x) => x.slug === `math_for_ai/${TOOL_OF[key]}`);
        if (!st) return [];
        const Icon = st.tool.icon;
        return (
          <span
            key={key}
            title={st.tool.does}
            className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[0.7rem] font-semibold text-accent-text"
          >
            <Icon size={14} weight="duotone" />
            {st.tool.name}
          </span>
        );
      })}
    </span>
  );
}

function Head({ n, title, children }: { n: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <span className="grid size-6 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{n}</span>
      <span className="mr-auto font-semibold">{title}</span>
      {children}
    </div>
  );
}

/** The 8 × 8 sheet. With `onPaint`, press and drag to draw; without, it only shows (cells not yet arrived are hatched). */
function Grid({
  px,
  onPaint,
  arrived = N * N,
  hit,
  at = -1,
}: {
  px: number[];
  onPaint?: (i: number) => void;
  arrived?: number;
  hit?: number[];
  at?: number;
}) {
  const drawing = useRef(false);
  const last = useRef(-1); // the cell just painted, so a drag inside one cell paints it once
  const [hover, setHover] = useState(-1);
  const cell = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const c = Math.floor(((e.clientX - r.left) / r.width) * N);
    const row = Math.floor(((e.clientY - r.top) / r.height) * N);
    return c >= 0 && c < N && row >= 0 && row < N ? row * N + c : -1;
  };
  const paint = (j: number) => {
    if (j < 0 || j === last.current || !onPaint) return;
    last.current = j;
    sfx.pencil(0.12);
    onPaint(j);
  };
  const shown = onPaint ? hover : at;
  return (
    <div className="mx-auto w-full max-w-[12rem]">
      <svg
        viewBox={`0 0 ${N * 10} ${N * 10}`}
        role="img"
        aria-label={onPaint ? "8 by 8 sheet to draw on: press and drag" : "the drawing as it arrives"}
        className={`block w-full overflow-hidden rounded-lg ring-1 ring-foreground/15 ${onPaint ? "cursor-crosshair touch-none" : ""}`}
        onPointerDown={(e) => {
          if (!onPaint) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          last.current = -1;
          paint(cell(e));
        }}
        onPointerMove={(e) => {
          const j = cell(e);
          if (onPaint) setHover(j);
          if (drawing.current) paint(j);
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerCancel={() => (drawing.current = false)}
        onPointerLeave={() => setHover(-1)}
      >
        <defs>
          <pattern id="pp-wait" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="4" className="fill-surface" />
            <line x1="0" y1="0" x2="0" y2="4" strokeWidth="1.2" className="stroke-border" />
          </pattern>
        </defs>
        <g shapeRendering="crispEdges">
          {px.map((v, j) => (
            <rect key={j} x={(j % N) * 10} y={Math.floor(j / N) * 10} width={10} height={10} fill={j < arrived ? gray(v) : "url(#pp-wait)"} />
          ))}
        </g>
        <path
          d={Array.from({ length: N - 1 }, (_, g) => `M${(g + 1) * 10} 0V${N * 10}M0 ${(g + 1) * 10}H${N * 10}`).join("")}
          strokeWidth={0.4}
          className="pointer-events-none fill-none stroke-foreground/15"
        />
        {hit?.map((h, j) =>
          h && j < arrived ? (
            <rect
              key={j}
              x={(j % N) * 10 + 0.8}
              y={Math.floor(j / N) * 10 + 0.8}
              width={8.4}
              height={8.4}
              strokeWidth={1.4}
              className="fill-none stroke-cat-coral"
            />
          ) : null,
        )}
        {shown >= 0 && (
          <rect
            x={(shown % N) * 10}
            y={Math.floor(shown / N) * 10}
            width={10}
            height={10}
            strokeWidth={1.4}
            className="pointer-events-none fill-none stroke-accent"
          />
        )}
      </svg>
      <div className="mt-1 h-4 text-center font-mono text-xs text-muted tabular-nums">
        {shown < 0 ? "" : shown < arrived ? `${address(shown)} · ${px[shown]}` : address(shown)}
      </div>
    </div>
  );
}

function NumberList({ mode, list, at }: { mode: Mode; list: number[]; at: number }) {
  const mark = (j: number) => (j === at ? "rounded bg-accent text-accent-foreground" : at > j ? "text-muted/60" : "");
  if (mode === "photo")
    return (
      <div className="overflow-x-auto font-mono text-[0.66rem] leading-snug whitespace-pre tabular-nums">
        {Array.from({ length: N }, (_, r) => (
          <div key={r}>
            {list.slice(r * N, r * N + N).map((v, c) => (
              <span key={c}>
                <span className={`${mark(r * N + c)} ${v < PAPER ? "font-bold" : ""}`}>{String(v).padStart(3, " ")}</span>
                {c < N - 1 ? ", " : r < N - 1 ? "," : ""}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  const names = mode === "colour" ? ["লাল", "সবুজ", "নীল"] : CLUES.map((c) => c.name);
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((v, j) => (
        <div
          key={j}
          className={`grid min-w-16 justify-items-center rounded-xl border border-border px-2.5 py-1 ${j === at ? "border-accent bg-accent/10" : ""}`}
        >
          <span className="font-mono text-lg font-bold tabular-nums">{v}</span>
          <span className="text-[0.7rem] text-muted">{names[j]}</span>
        </div>
      ))}
    </div>
  );
}

/** One bulb on a pole; the one the storm flipped wears a ring. */
function Bulb({ on, hit = false }: { on: boolean; hit?: boolean | null }) {
  return (
    <span
      className={`size-5 rounded-full border-2 transition-colors duration-150 ${
        on ? "border-[#c9a24a] bg-[#f3c623] shadow-[0_0_8px_#f3c623]" : "border-muted/50 bg-surface"
      } ${hit ? "ring-3 ring-cat-coral" : ""}`}
    />
  );
}

/** a number read off the bulbs, when it takes more than one: 128 + 32 + 4 = 164 */
function sumOf(v: number) {
  const on = PRICES.filter((p) => v & p);
  return on.length > 1 ? `${on.join(" + ")} = ${v}` : "";
}

/** What Jobayer's phone has so far, and, once it's all there, what one multiply-add makes of it. */
function Arrived({ packet, k, stations }: { packet: Packet; k: number; stations: Station[] }) {
  const { mode, got, hit } = packet;
  const done = k >= got.length;
  const flipped = hit.slice(0, k).filter(Boolean).length;

  let body: ReactNode = null;
  let reading: ReactNode = null;
  if (mode === "photo") {
    const ink = got.map(inkOf);
    const scores = STENCILS.map((s, j) => ({
      name: s.name,
      v: likeness(ink, STENCIL_INK[j]),
    })).sort((a, b) => b.v - a.v);
    body = (
      <>
        <ToolTags stations={stations} keys={["address"]} />
        <Grid px={got} arrived={k} hit={hit} at={done ? -1 : k} />
        {!done && <div className="text-center text-xs text-muted">পরের সংখ্যাটা বসবে {address(k)}-এ</div>}
      </>
    );
    reading = ink.some(Boolean) ? (
      <>
        <div className="text-sm">
          ফোনের আন্দাজ: <b>{scores[0].name}</b>
        </div>
        <div className="grid gap-1">
          {scores.map((s) => (
            <div key={s.name} className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2 text-xs">
              <span>{s.name}</span>
              <span className="h-2 overflow-hidden rounded-full bg-foreground/5">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${s.v * 100}%` }} />
              </span>
              <span className="text-right font-mono tabular-nums">{Math.round(s.v * 100)}%</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted">প্রতিটা চেনা ছবির সাথে ঘরে ঘরে গুণ, তারপর যোগ: {bn(N * N)}টা গুণ, একটা ছবির জন্য।</div>
      </>
    ) : (
      <div className="text-sm">ফাঁকা কাগজ এসেছে। আন্দাজ করার মতো কালি নেই।</div>
    );
  } else if (mode === "colour") {
    const c = got.map((v, j) => (j < k ? v : 0));
    const g = Math.round(dot(got, GREY_W));
    body = (
      <>
        <ToolTags stations={stations} keys={["lamps"]} />
        <div className="flex justify-center gap-4">
          <Swatch fill={`rgb(${c.join(" ")})`} label="রঙিন ফোনে" />
          {done && <Swatch fill={gray(g)} label="বাটন ফোনে" />}
        </div>
      </>
    );
    reading = (
      <div className="font-mono text-xs leading-relaxed tabular-nums">
        {got.map((v, j) => `${GREY_W[j].toFixed(2)}×${v}`).join(" + ")} = {g}
        <div className="font-sans text-muted">সাদাকালো পর্দা তিনটা lamp-কে একটা ধূসরে নামায়, একটা গুণ-যোগে।</div>
      </div>
    );
  } else {
    const score = round1(
      dot(
        got,
        CLUES.map((c) => c.w),
      ),
    );
    body = (
      <>
        <ToolTags stations={stations} keys={["sieve"]} />
        <div className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted">
          লেখাটা আসেনি। এসেছে শুধু {bn(got.length)}টা সংখ্যা।
        </div>
        <div className="grid gap-1 text-sm">
          {CLUES.map((cl, j) => (
            <div key={cl.name} className="flex justify-between gap-3">
              <span className="text-muted">{cl.name}</span>
              <span className="font-mono font-bold tabular-nums">{j < k ? got[j] : "…"}</span>
            </div>
          ))}
        </div>
      </>
    );
    reading = (
      <>
        <div className="font-mono text-xs leading-relaxed tabular-nums">
          {got.map((v, j) => `${v}×${CLUES[j].w}`).join(" + ")} = {score}
        </div>
        <div className={`text-sm font-semibold ${score >= SPAM_AT ? "text-cat-coral" : "text-accent-text"}`}>
          {score >= SPAM_AT ? `${score} ≥ ${SPAM_AT}: Spam folder-এ গেল।` : `${score} < ${SPAM_AT}: Inbox-এ বসল।`}
        </div>
      </>
    );
  }

  return (
    <>
      {body}
      {flipped > 0 && <div className="text-xs text-cat-coral">⚡ ঝড়ে {bn(flipped)}টা সংখ্যার একটা করে বাল্ব উল্টে গেছে।</div>}
      {done && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
          <ToolTags stations={stations} keys={["add"]} />
          {reading}
        </div>
      )}
    </>
  );
}

function Swatch({ fill, label }: { fill: string; label: string }) {
  return (
    <div className="grid justify-items-center gap-1">
      <div className="size-20 rounded-2xl shadow-inner ring-1 ring-foreground/15 transition-colors duration-300" style={{ background: fill }} />
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot -- src/components/rail/picture-phone.tsx`.

const BOAT = STENCILS[1].rows
  .join("")
  .split("")
  .map((c) => (c === "#" ? 0 : PAPER));
const HEART = STENCILS[3].rows
  .join("")
  .split("")
  .map((c, j) => (c === "#" ? (j % 3 ? 0 : 128) : PAPER));
const stormy = HEART.map((_, j) => (j % 9 === 4 ? 64 : 0));

export const fixtures: Fixtures = {
  PicturePhone: {
    empty: {},
    boatHalfway: {
      px: BOAT,
      packet: { mode: "photo", sent: BOAT, got: BOAT, hit: BOAT.map(() => 0) },
      k: 29,
    },
    heartStorm: {
      px: HEART,
      storm: true,
      packet: {
        mode: "photo",
        sent: HEART,
        got: HEART.map((v, j) => v ^ stormy[j]),
        hit: stormy,
      },
      k: 64,
    },
    colour: {
      mode: "colour",
      packet: {
        mode: "colour",
        sent: [230, 60, 80],
        got: [230, 60, 80],
        hit: [0, 0, 0],
      },
      k: 3,
    },
    spam: {
      mode: "mail",
      packet: {
        mode: "mail",
        sent: sieve(SPAM_MAIL, true),
        got: sieve(SPAM_MAIL, true),
        hit: [0, 0, 0, 0],
      },
      k: 4,
    },
  },
};
