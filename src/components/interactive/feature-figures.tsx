"use client";

import { useRef, useState } from "react";

import { Btn, Head, bn, useInView } from "./figure-kit";
import "./pixel-figures.css";
import "./feature-figures.css";

// Figures for the second half of "AI-এর গণিত ১" — the part where the subject
// stops being images and becomes vectors: a thing turns into an ordered list of
// numbers, and that list is all the machine ever gets.
//
// pixel-figures.tsx covers the first half; these share its shell and stylesheet.
// Same rule as there: SVG/DOM rather than canvas, and Bangla copy in the same
// register as the prose — Bangla sentences, technical words left in English.

// ---------------------------------------------------------------------------
// 8 · Order matters. The article asks the reader outright what (78, 180) would
//     mean instead of (180, 78) and then leaves it hanging — so the figure
//     answers it by moving the dot and letting the absurdity be visible.

type Student = { id: string; name: string; v: [number, number, number, number] };

/** height cm, weight kg, shoe size, age — the article's four features. */
const STUDENTS: Student[] = [
  { id: "nasib", name: "নাসিব", v: [180, 78, 43, 18] },
  { id: "samin", name: "সামিন", v: [170, 60, 41, 17] },
  { id: "shom", name: "শোম", v: [175, 75, 42, 19] },
];

const S_FEATURES = ["উচ্চতা (সেমি)", "ওজন (কেজি)", "জুতার মাপ", "বয়স (বছর)"];

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
      <Head n="চিত্র ৮" title="ছাত্র মানে একটা সাজানো লিস্ট — আর সাজানোটাই হলো অর্থ" />
      <div className="pfig-body pfig-split">
        <div className="mfig-plot">
          <svg viewBox={`0 0 ${W} ${H}`} className="mfig-svg" role="img" aria-label="উচ্চতা আর ওজন ধরে ছাত্রদের বসানো হয়েছে">
            <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} className="mfig-axis" />
            <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} className="mfig-axis" />
            <text x={W - PAD.r} y={H - PAD.b + 22} className="mfig-axlabel" textAnchor="end">
              v₁ = উচ্চতা (সেমি) →
            </text>
            <text x={PAD.l - 8} y={PAD.t + 6} className="mfig-axlabel" textAnchor="end">
              v₂ = ওজন (কেজি) ↑
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
              <p>একজন ছাত্রের জন্য ৪টা সংখ্যা।</p>
              <p className="mfig-sub">
                গ্রাফ পেপারের দিক ফুরিয়ে গেছে। লিস্টের ফুরায়নি।
              </p>
            </div>
          )}
        </div>

        <div className="pfig-col">
          <p className="pfig-label">
            <b>{who.name}</b>-কে ভেক্টর হিসেবে লিখলে:
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
            ডাইমেনশন: <b>{bn(vec.length)}</b> — প্রতিটা feature-এর জন্য একটা।
          </p>
          <p className={swapped ? "ffig-say bad" : "ffig-say"}>
            {swapped
              ? `এখন পড়া যাচ্ছে: উচ্চতা ${bn(who.v[1])} সেমি, ওজন ${bn(who.v[0])} কেজি।`
              : `পড়া যাচ্ছে: উচ্চতা ${bn(who.v[0])} সেমি, ওজন ${bn(who.v[1])} কেজি।`}
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
          ক্রমটা উল্টে দিন
        </Btn>
        <Btn on={dims === 4} onClick={() => setDims((d) => (d === 2 ? 4 : 2))}>
          + জুতার মাপ, বয়স
        </Btn>
      </div>
      <figcaption>
        <strong>ক্রমটা উল্টে দিন</strong> চাপুন। ঐ একই দুইটা সংখ্যা এখন বলছে, মানুষটা{" "}
        <strong>৭৮ সেমি লম্বা আর ওজন ১৮০ কেজি</strong> — ফাঁপা বৃত্তটা দেখাচ্ছে তার আসলে কোথায় থাকার কথা
        ছিল। কিছু যোগ হয়নি, কিছু বাদ যায়নি। শুধু ক্রমটা বদলেছে, আর অর্থটাও তার সাথে সাথে বদলে গেছে।
        এই জন্যই ভেক্টর হলো একটা <em>সাজানো</em> লিস্ট। আরও দুইটা feature যোগ করে দিন — ছবিটা ৩
        ডাইমেনশনে গিয়েই মরে যায়, কিন্তু লিস্টটা দিব্যি চলতে থাকে। এভাবেই একটা আস্ত ছবি তিন কোটি ষাট
        লাখ feature-এর একটামাত্র ভেক্টর হয়ে যেতে পারে।
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 9 · An email has no numbers in it anywhere, so the reader gets to watch four
//     get made. Both columns of the article's table are measured live from text
//     you can edit — type FREE a few times and the vector moves under your hand.

const SPAM_MAIL = `Subject: CONGRATULATIONS!!! আপনি জিতে গেছেন

DEAR LUCKY WINNER,

আজকে আপনার EMAIL টা SELECT হয়েছে। এখনই আপনার free iPhone টা CLAIM
করুন — ১০০% free, ডেলিভারি free, আর প্রথম ৫০ জনের জন্য একটা free
গিফট কার্ড। দেরি করবেন না, এই free অফার আজ রাতেই শেষ। কোনো টাকা
লাগবে না, পুরাটাই free.

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

const NORMAL_MAIL = `Subject: কালকের ক্লাস

নাসিব,

কালকের ক্লাসটা room 204-এ হবে, সময় আগের মতোই। আমাদের পুরনো রুমের
projector-টা এখনো নষ্ট, কেউ এসে ঠিক করে যায়নি। তাই মাসের শেষ পর্যন্ত
উপরতলার বড় রুমটা ধার নিচ্ছি। এই সপ্তাহের practice sheet ক্লাস পেজে
তুলে দেওয়া আছে, এখানে:
http://university.example/sheet-3

গত সপ্তাহের নোটগুলো নিয়ে এসো। আর সকালের আগে সুযোগ পেলে group-এর
বাকিদেরও পড়াটার কথা একটু মনে করিয়ে দিও।

ধন্যবাদ,
সামিন`;

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
  { label: "“free” কথাটা কতবার আছে", key: "free" },
  { label: "কয়টা লিঙ্ক", key: "links" },
  { label: "কতটুকু CAPITAL অক্ষরে (ইংরেজি হরফ ধরে)", key: "caps" },
  { label: "রাত ৩টা থেকে ৫টার মধ্যে পাঠানো", key: "night" },
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
      <Head n="চিত্র ৯" title="ইমেইলের ভেতরে কোনো সংখ্যাই নাই। মেপে নিলেই আছে।" />
      <div className="pfig-body pfig-split wide">
        <div className="pfig-col">
          <p className="pfig-label">
            {which === "spam" ? "স্প্যাম" : "সাধারণ"} মেইলটা — <b>এডিট করে দেখুন</b>, সংখ্যাগুলো নড়তে শুরু করবে:
          </p>
          <textarea
            className="ffig-mail"
            value={text[which]}
            spellCheck={false}
            aria-label={`${which === "spam" ? "স্প্যাম" : "সাধারণ"} মেইলের বডি`}
            onChange={(e) => setText((t) => ({ ...t, [which]: e.target.value }))}
          />
          <label className="ffig-switch">
            <input
              type="checkbox"
              checked={night[which]}
              onChange={(e) => setNight((n) => ({ ...n, [which]: e.target.checked }))}
            />
            রাত ৩টা থেকে ৫টার মধ্যে পাঠানো
          </label>
        </div>

        <div className="pfig-col">
          <table className="ffig-table">
            <thead>
              <tr>
                <th>কী মাপছি</th>
                <th className={which === "spam" ? "on" : ""}>স্প্যাম</th>
                <th className={which === "normal" ? "on" : ""}>সাধারণ</th>
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
            স্প্যাম = <b>{vector("spam")}</b>
            <br />
            সাধারণ = <b>{vector("normal")}</b>
          </p>
        </div>
      </div>
      <div className="mfig-controls">
        <Btn on={which === "spam"} onClick={() => setWhich("spam")}>
          স্প্যাম মেইল
        </Btn>
        <Btn on={which === "normal"} onClick={() => setWhich("normal")}>
          সাধারণ মেইল
        </Btn>
        <Btn
          on={false}
          onClick={() => {
            setText({ spam: SPAM_MAIL, normal: NORMAL_MAIL });
            setNight({ spam: true, normal: false });
          }}
        >
          আবার আগের মতো
        </Btn>
        <span className="mfig-read">৪টা feature → ৪ ডাইমেনশনের ভেক্টর</span>
      </div>
      <figcaption>
        সাধারণ মেইলটায় <strong>free</strong> কথাটা কয়েকবার লিখে দিন, কিংবা একটা লিঙ্ক বসিয়ে দিন —
        দেখবেন ওর ভেক্টরটা আস্তে আস্তে স্প্যামের দিকে সরে যাচ্ছে। এখন খেয়াল করুন, কী কিন্তু হয়নি। কেউ
        যন্ত্রটাকে বলে দেয়নি “free” মানে কী, স্প্যাম জিনিসটাই বা কী। চারটা জিনিস শুধু{" "}
        <strong>গোনা</strong> হয়েছে, আর একটা আস্ত চিঠি চারটা সংখ্যা হয়ে গেছে। পুরো কারসাজিটা এইটুকুই —
        মাপা, বোঝা না।
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
    name: "একজন ছাত্র",
    what: "নাসিব, উপরের ক্লাসরুম থেকে",
    features: [["উচ্চতা", "180"], ["ওজন", "78"], ["জুতা", "43"], ["বয়স", "18"]],
    ask: "কোন ছাত্ররা একে অপরের সবচেয়ে কাছাকাছি?",
  },
  {
    id: "photo",
    icon: "🖼️",
    name: "একটা ছবি",
    what: "৩০০০ × ৪০০০ pixel, রঙিন",
    features: [["px 1", "10"], ["px 2", "20"], ["px 3", "15"], ["px 4", "25"]],
    more: "…সব মিলিয়ে তিন কোটি ষাট লাখ feature",
    ask: "এই ছবিতে কি কোনো পাখি আছে?",
  },
  {
    id: "email",
    icon: "✉️",
    name: "একটা ইমেইল",
    what: "চিত্র ৯-এর সেই মেইলটা",
    features: [["free", "6"], ["লিঙ্ক", "14"], ["caps", "0.31"], ["রাত ৩–৫", "1"]],
    ask: "এটা কি স্প্যাম?",
  },
  {
    id: "movie",
    icon: "🎬",
    name: "একটা সিনেমা",
    what: "Toy Story, ০ থেকে ৫-এ নম্বর দেওয়া",
    features: [["ড্রামা", "2"], ["কমেডি", "5"]],
    ask: "আর কার কার এই ছবিটা ভালো লাগবে?",
  },
  {
    id: "patient",
    icon: "🩺",
    name: "একজন রোগী",
    what: "ডাক্তারের চেম্বারে একবার আসা",
    features: [["বয়স", "42"], ["bp", "142"], ["সুগার", "180"], ["bmi", "27.4"]],
    ask: "এই মানুষটার কি ঝুঁকি আছে?",
  },
];

export function RepresentationFigure() {
  const box = useRef<HTMLElement>(null);
  const [pick, setPick] = useState("patient");
  useInView(box, {});

  const t = THINGS.find((x) => x.id === pick) ?? THINGS[0];

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ১০" title="মেশিন লার্নিং যেখানেই কাজে লাগুক, পথটা এই একটাই" />
      <div className="pfig-body">
        <div className="ffig-flow">
          <div className="ffig-card">
            <span className="ffig-icon">{t.icon}</span>
            <b>{t.name}</b>
            <small>{t.what}</small>
          </div>

          <div className="ffig-arrow">
            <span>রিপ্রেজেন্টেশন</span>
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
            <small>{t.more ?? "সংখ্যার একটা সাজানো লিস্ট"}</small>
          </div>

          <div className="ffig-arrow">
            <span>অংক</span>
          </div>

          <div className="ffig-card">
            <span className="ffig-icon">?</span>
            <b>{t.ask}</b>
            <small>এখন এটা সংখ্যার প্রশ্ন</small>
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
        একজন রোগী, একটা ছবি, একটা ইমেইল, একটা সিনেমা — একটা একটা করে চেপে দেখুন। বাঁ পাশের বাক্সটা
        প্রতিবার বদলায়, ডান পাশেরটাও প্রতিবার বদলায়। কিন্তু{" "}
        <strong>মাঝের বাক্সটার চেহারা কখনো বদলায় না</strong> — সংখ্যার একটা সাজানো লিস্ট, ব্যস। ঐ প্রথম
        তীরটার নামই <strong>রিপ্রেজেন্টেশন</strong>। দুনিয়া থেকে যন্ত্রের ভেতরে ঢোকার রাস্তা ঐ একটাই,
        আর কোনো রাস্তা নাই। এই সিরিজের বাকি সবকিছু ঘটবে ঐ মাঝের বাক্সটার ভেতরে।
      </figcaption>
    </figure>
  );
}
