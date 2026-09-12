"use client";

import { useRef, useState } from "react";

import { Btn, Head, useInView } from "./figure-kit";
import "./pixel-figures.css";
import "./feature-figures.css";

// Figures for the second half of "AI-এর গণিত ১" — the part where the subject
// stops being images and becomes vectors: a thing turns into an ordered list of
// numbers, and that list is all the machine ever gets.
//
// pixel-figures.tsx covers the first half; these share its shell and stylesheet.
// Same rule as there: SVG/DOM rather than canvas, and English copy inside the
// panels while the prose around them stays Bangla.

// ---------------------------------------------------------------------------
// 8 · Order matters. The article asks the reader outright what (78, 180) would
//     mean instead of (180, 78) and then leaves it hanging — so the figure
//     answers it by moving the dot and letting the absurdity be visible.

type Student = { id: string; name: string; v: [number, number, number, number] };

/** height cm, weight kg, shoe size, age — the article's four features. */
const STUDENTS: Student[] = [
  { id: "nasib", name: "Nasib", v: [180, 78, 43, 18] },
  { id: "samin", name: "Samin", v: [170, 60, 41, 17] },
  { id: "shom", name: "Shom", v: [175, 75, 42, 19] },
];

const S_FEATURES = ["height (cm)", "weight (kg)", "shoe size", "age (years)"];

const W = 420;
const H = 262;
const PAD = { l: 44, r: 18, t: 18, b: 34 };
// Both axes cover the same 50–200 range on purpose: only then is the swap a
// visible reflection rather than a point wandering off the chart.
const LO = 50;
const HI = 200;
const sx = (n: number) => PAD.l + ((n - LO) / (HI - LO)) * (W - PAD.l - PAD.r);
const sy = (n: number) => H - PAD.b - ((n - LO) / (HI - LO)) * (H - PAD.t - PAD.b);

export function StudentVectorFigure() {
  const box = useRef<HTMLElement>(null);
  const [pick, setPick] = useState("nasib");
  const [swapped, setSwapped] = useState(false);
  const [dims, setDims] = useState<2 | 4>(2);
  useInView(box, {});

  const who = STUDENTS.find((s) => s.id === pick) ?? STUDENTS[0];
  /** the vector as written down — swapping the first two is the whole point */
  const read = (s: Student) => {
    const [h, w, shoe, age] = s.v;
    const head = swapped ? [w, h] : [h, w];
    return dims === 2 ? head : [...head, shoe, age];
  };
  const vec = read(who);

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 8" title="A student is an ordered list — and the order is the meaning" />
      <div className="pfig-body pfig-split">
        <div className="mfig-plot">
          <svg viewBox={`0 0 ${W} ${H}`} className="mfig-svg" role="img" aria-label="students placed by height and weight">
            <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} className="mfig-axis" />
            <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} className="mfig-axis" />
            <text x={W - PAD.r} y={H - PAD.b + 22} className="mfig-axlabel" textAnchor="end">
              v₁ = height (cm) →
            </text>
            <text x={PAD.l - 8} y={PAD.t + 6} className="mfig-axlabel" textAnchor="end">
              v₂ = weight (kg) ↑
            </text>

            {STUDENTS.map((s) => {
              const [h, w] = s.v;
              const x = sx(swapped ? w : h);
              const y = sy(swapped ? h : w);
              const on = s.id === pick;
              return (
                <g key={s.id} className="mfig-pt" onClick={() => setPick(s.id)}>
                  {/* where the numbers meant to put them, still marked */}
                  {swapped && on && (
                    <>
                      <circle cx={sx(h)} cy={sy(w)} r={6} className="ffig-ghost" />
                      <line x1={sx(h)} y1={sy(w)} x2={x} y2={y} className="mfig-drop" />
                    </>
                  )}
                  <circle cx={x} cy={y} r={on ? 7 : 5} className={on ? "mfig-dot on" : "mfig-dot"} />
                  <text x={x} y={y - 12} className={on ? "mfig-ptlabel on" : "mfig-ptlabel"}>
                    {s.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Four features and the plot is over — the list is not. */}
          {dims === 4 && (
            <div className="mfig-veil">
              <p>4 numbers for one student.</p>
              <p className="mfig-sub">
                The graph paper ran out of directions. The list did not.
              </p>
            </div>
          )}
        </div>

        <div className="pfig-col">
          <p className="pfig-label">
            <b>{who.name}</b>, written as a vector:
          </p>
          <div className="ffig-vec">
            {vec.map((n, i) => (
              <span key={i} className="ffig-el">
                <b>{n}</b>
                {/* The slot's meaning never moves — that is why swapping the
                    numbers changes what the student is claimed to be. */}
                <u>
                  v{i + 1} · {S_FEATURES[i]}
                </u>
              </span>
            ))}
          </div>
          <p className="pfig-label">
            Dimension: <b>{vec.length}</b> — one for each feature.
          </p>
          <p className={swapped ? "ffig-say bad" : "ffig-say"}>
            {swapped
              ? `Now it reads: height ${who.v[1]} cm, weight ${who.v[0]} kg.`
              : `It reads: height ${who.v[0]} cm, weight ${who.v[1]} kg.`}
          </p>
        </div>
      </div>
      <div className="mfig-controls">
        {STUDENTS.map((s) => (
          <Btn key={s.id} on={s.id === pick} onClick={() => setPick(s.id)}>
            {s.name}
          </Btn>
        ))}
        <Btn on={swapped} onClick={() => setSwapped((s) => !s)}>
          Swap the order
        </Btn>
        <Btn on={dims === 4} onClick={() => setDims((d) => (d === 2 ? 4 : 2))}>
          + shoe size, age
        </Btn>
      </div>
      <figcaption>
        Press <strong>Swap the order</strong>. The same two numbers now say this person is{" "}
        <strong>78 cm tall and weighs 180 kg</strong> — the hollow circle shows where they should have been.
        Nothing was added, nothing removed. Only the order changed, and the meaning changed with it. That is why a
        vector is an <em>ordered</em> list. Add two more features — the picture gives up at 3 dimensions, but the
        list carries on just fine. That is how a whole photo can become a single vector of 36 million features.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 9 · An email has no numbers in it anywhere, so the reader gets to watch four
//     get made. Both columns of the article's table are measured live from text
//     you can edit — type FREE a few times and the vector moves under your hand.

// Both emails are written so the live measures land on the article's table:
// spam (6, 14, 0.31, 1), normal (0, 1, 0.02, 0). Rewording either one moves
// its capitals share, so re-check it against the table after any edit.
const SPAM_MAIL = `Subject: CONGRATULATIONS!!! You Have WON

DEAR LUCKY WINNER,

Your EMAIL has been SELECTED today. CLAIM your FREE iPHONE NOW,
100% free, delivery free, and a free gift card for the first 50
people. DO NOT WAIT, this free offer ends TONIGHT. You pay
nothing, it is ALL FREE.

CLAIM HERE: http://prize-claim.example/a
MIRROR: http://prize-claim.example/b
BACKUP: http://prize-claim.example/c
OR HERE: http://prize-claim.example/d
FAST LINK: http://prize-claim.example/e
GIFT CARD: http://prize-claim.example/f
BONUS: http://prize-claim.example/g
VERIFY: http://prize-claim.example/h
CLAIM AGAIN: http://prize-claim.example/i
LAST CHANCE: http://prize-claim.example/j
UNSUBSCRIBE: http://prize-claim.example/k
TERMS: http://prize-claim.example/l
SUPPORT: http://prize-claim.example/m
MORE: http://prize-claim.example/n`;

const NORMAL_MAIL = `Subject: Tomorrow's class

Nasib,

Tomorrow's class will be in room 204, same time as before; the
projector in our old room is still broken and nobody has come to
fix it, so we are borrowing the big room upstairs until the end of
the month, and this week's practice sheet is on the class page, here:
http://university.example/sheet-3

Bring last week's notes, and if you get a chance before the
morning, remind the rest of the group about the reading.

Thanks,
Samin`;

type Mail = "spam" | "normal";

const countFree = (t: string) => (t.match(/\bfree\b/gi) ?? []).length;
const countLinks = (t: string) => (t.match(/https?:\/\/|www\./gi) ?? []).length;
/** share of the letters that are capitals — the machine's stand-in for shouting */
const capsShare = (t: string) => {
  const letters = t.match(/[A-Za-z]/g) ?? [];
  if (!letters.length) return 0;
  return letters.filter((c) => c >= "A" && c <= "Z").length / letters.length;
};

const ROWS = [
  { label: "how many times “free” appears", key: "free" },
  { label: "how many links", key: "links" },
  { label: "share of letters in CAPITALS", key: "caps" },
  { label: "sent between 3 and 5 am", key: "night" },
] as const;

export function EmailVectorFigure() {
  const box = useRef<HTMLElement>(null);
  const [which, setWhich] = useState<Mail>("spam");
  const [text, setText] = useState({ spam: SPAM_MAIL, normal: NORMAL_MAIL });
  // Time-of-day is metadata, not text — it cannot be measured out of the body,
  // so it gets a switch. Not every feature comes from the same place.
  const [night, setNight] = useState({ spam: true, normal: false });

  useInView(box, {});

  // Cheap enough to redo on every keystroke — four regexes over a few hundred
  // characters — and both columns stay live, which is the point of the figure.
  const measure = (m: Mail) => ({
    free: countFree(text[m]),
    links: countLinks(text[m]),
    caps: capsShare(text[m]),
    night: night[m] ? 1 : 0,
  });
  const vals = { spam: measure("spam"), normal: measure("normal") };

  const show = (m: Mail, key: (typeof ROWS)[number]["key"]) =>
    key === "caps" ? vals[m].caps.toFixed(2) : String(vals[m][key]);
  const vector = (m: Mail) =>
    `(${vals[m].free}, ${vals[m].links}, ${vals[m].caps.toFixed(2)}, ${vals[m].night})`;

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 9" title="An email has no numbers in it. Measure it, and it does." />
      <div className="pfig-body pfig-split wide">
        <div className="pfig-col">
          <p className="pfig-label">
            The {which === "spam" ? "spam" : "normal"} email — <b>edit it</b> and watch the numbers move:
          </p>
          <textarea
            className="ffig-mail"
            value={text[which]}
            spellCheck={false}
            aria-label={`${which === "spam" ? "spam" : "normal"} email body`}
            onChange={(e) => setText((t) => ({ ...t, [which]: e.target.value }))}
          />
          <label className="ffig-switch">
            <input
              type="checkbox"
              checked={night[which]}
              onChange={(e) => setNight((n) => ({ ...n, [which]: e.target.checked }))}
            />
            sent between 3 and 5 am
          </label>
        </div>

        <div className="pfig-col">
          <table className="ffig-table">
            <thead>
              <tr>
                <th>What we measure</th>
                <th className={which === "spam" ? "on" : ""}>Spam</th>
                <th className={which === "normal" ? "on" : ""}>Normal</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.key}>
                  <td>
                    <span className="ffig-vn">v{i + 1}</span> {r.label}
                  </td>
                  <td className={which === "spam" ? "num on" : "num"}>{show("spam", r.key)}</td>
                  <td className={which === "normal" ? "num on" : "num"}>{show("normal", r.key)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pfig-mono">
            Spam = <b>{vector("spam")}</b>
            <br />
            Normal = <b>{vector("normal")}</b>
          </p>
        </div>
      </div>
      <div className="mfig-controls">
        <Btn on={which === "spam"} onClick={() => setWhich("spam")}>
          Spam email
        </Btn>
        <Btn on={which === "normal"} onClick={() => setWhich("normal")}>
          Normal email
        </Btn>
        <Btn
          on={false}
          onClick={() => {
            setText({ spam: SPAM_MAIL, normal: NORMAL_MAIL });
            setNight({ spam: true, normal: false });
          }}
        >
          Reset
        </Btn>
        <span className="mfig-read">4 features → a 4-dimensional vector</span>
      </div>
      <figcaption>
        Type <strong>free</strong> into the normal email a few times, or paste in a link — its vector starts
        drifting towards spam. Now notice what did not happen. Nobody told the machine what “free” means, or what
        spam is. Four things were just <strong>counted</strong>, and a whole letter became four numbers. That is the
        whole trick — measuring, not understanding.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 10 · The closer: the article's own arrow diagram, made clickable. Deliberately
//      stops at the *question* arithmetic can now be asked — inventing an answer
//      would claim more than this article has earned.

type Thing = {
  id: string;
  icon: string;
  name: string;
  what: string;
  features: [string, string][];
  more?: string;
  ask: string;
};

const THINGS: Thing[] = [
  {
    id: "student",
    icon: "🧑‍🎓",
    name: "A student",
    what: "Nasib, from the classroom above",
    features: [["height", "180"], ["weight", "78"], ["shoe", "43"], ["age", "18"]],
    ask: "Which students are most alike?",
  },
  {
    id: "photo",
    icon: "🖼️",
    name: "A photo",
    what: "3000 × 4000 pixels, in color",
    features: [["px 1", "10"], ["px 2", "20"], ["px 3", "15"], ["px 4", "25"]],
    more: "…36 million features in all",
    ask: "Is there a bird in this photo?",
  },
  {
    id: "email",
    icon: "✉️",
    name: "An email",
    what: "the spam email from Figure 9",
    features: [["free", "6"], ["links", "14"], ["caps", "0.31"], ["3–5 am", "1"]],
    ask: "Is this spam?",
  },
  {
    id: "movie",
    icon: "🎬",
    name: "A movie",
    what: "Toy Story, scored from 0 to 5",
    features: [["drama", "2"], ["comedy", "5"]],
    ask: "Who else would enjoy this movie?",
  },
  {
    id: "patient",
    icon: "🩺",
    name: "A patient",
    what: "one visit to the doctor",
    features: [["age", "42"], ["bp", "142"], ["sugar", "180"], ["bmi", "27.4"]],
    ask: "Is this person at risk?",
  },
];

export function RepresentationFigure() {
  const box = useRef<HTMLElement>(null);
  const [pick, setPick] = useState("patient");
  useInView(box, {});

  const t = THINGS.find((x) => x.id === pick) ?? THINGS[0];

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 10" title="Wherever machine learning is used, the path is the same" />
      <div className="pfig-body">
        <div className="ffig-flow">
          <div className="ffig-card">
            <span className="ffig-icon">{t.icon}</span>
            <b>{t.name}</b>
            <small>{t.what}</small>
          </div>

          <div className="ffig-arrow">
            <span>representation</span>
          </div>

          <div className="ffig-card mid">
            <div className="ffig-vec tight">
              {t.features.map(([name, v]) => (
                <span key={name} className="ffig-el">
                  <b>{v}</b>
                  <u>{name}</u>
                </span>
              ))}
            </div>
            <small>{t.more ?? "an ordered list of numbers"}</small>
          </div>

          <div className="ffig-arrow">
            <span>arithmetic</span>
          </div>

          <div className="ffig-card">
            <span className="ffig-icon">?</span>
            <b>{t.ask}</b>
            <small>now a question about numbers</small>
          </div>
        </div>
      </div>
      <div className="mfig-controls">
        {THINGS.map((x) => (
          <Btn key={x.id} on={x.id === pick} onClick={() => setPick(x.id)}>
            {x.icon} {x.name}
          </Btn>
        ))}
      </div>
      <figcaption>
        A patient, a photo, an email, a movie — press them one at a time. The box on the left changes every time,
        and so does the one on the right. But <strong>the middle box never changes shape</strong> — an ordered list
        of numbers, that is all. That first arrow is called <strong>representation</strong>. It is the only road
        from the world into the machine; there is no other. Everything else in this series happens inside that
        middle box.
      </figcaption>
    </figure>
  );
}
