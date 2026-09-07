"use client";

import { useRef, useState } from "react";

import { Btn, Head, useInView } from "./figure-kit";
import { COL, fmt, ID, matEq, mul, rot, type Mat } from "./matrices-deck/src/components/matrices/lib/math";
import { Plane } from "./matrices-deck/src/components/matrices/lib/plane";
import { Scatter } from "./matrices-deck/src/components/matrices/lib/scatter";
import { Space3D } from "./matrices-deck/src/components/matrices/lib/space-3d";
import { useSketch } from "./matrices-deck/src/components/matrices/lib/use-slide";

// Interactive figures for src/content/articles/deep-learning/01-intro-to-dl.mdx.
//
// The canvas engines are the deck's (matrices-deck/lib) — unchanged. What is NOT
// reused is the deck's slides/: each of those is a reveal <section> driven by
// useSlideLifecycle, which watches for the `present` class reveal writes and so
// never wakes up on a prose page. These bind to useInView (figure-kit) instead.

// ---------------------------------------------------------------------------
// 1 · The straight cut. Two cooperating blobs, one line, a live accuracy score.

export function CutFigure() {
  const box = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<"clear" | "cut" | null>(null);
  const [acc, setAcc] = useState("—");
  const [color, setColor] = useState(COL.dim);

  const scatter = useSketch(stage, (host) => {
    const sc = new Scatter(host, { layout: "blobs", range: 2.9, n: 80 });
    sc.onFrame = (a, _b, _k, on) => {
      setAcc(on < 0.05 ? "—" : Math.round(a * 100) + "%");
      setColor(on < 0.05 ? COL.dim : a > 0.98 ? COL.i : COL.v);
    };
    return sc;
  });

  const click = (key: "clear" | "cut") => {
    const sc = scatter.current;
    if (!sc) return;
    setSel(key);
    if (key === "cut") {
      sc.setLine(Math.atan2(1.5, 2.6), 0, 1500);
      sc.showLine(true);
    } else {
      sc.showLine(false, 300);
      sc.setLine(1.9, 0, 600);
    }
  };

  useInView(box, { enter: () => scatter.current?.resize() });

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ১" title="শেষ ধাপ — একটা সোজা দাগ" />
      <div className="mfig-stage" ref={stage}>
        <span className="mfig-badge">গোছানো ডাটা</span>
      </div>
      <div className="mfig-controls">
        <Btn on={sel === "clear"} onClick={() => click("clear")}>
          দাগ মুছুন
        </Btn>
        <Btn on={sel === "cut"} onClick={() => click("cut")}>
          দাগ টানুন
        </Btn>
        <span className="mfig-read">
          সঠিক <b style={{ color }}>{acc}</b>
        </span>
      </div>
      <figcaption>
        একপাশে circle, আরেক পাশে square। ক্লাসিফায়ারের <strong>শেষ কাজটা এতটাই সরল</strong> — একটা দাগ
        টেনে জিজ্ঞেস করা, তুমি কোন পাশে?
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 2 · The crumpled page. Sweep every angle; nothing works. (Stops when off-screen.)

export function TangleFigure() {
  const box = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<"sweep" | "stop" | null>(null);
  const [acc, setAcc] = useState("—");
  const [best, setBest] = useState("—");

  const scatter = useSketch(stage, (host) => {
    const sc = new Scatter(host, { layout: "spiral" });
    sc.onFrame = (a, b, _k, on) => {
      setAcc(on < 0.05 ? "—" : Math.round(a * 100) + "%");
      setBest(b ? Math.round(b * 100) + "%" : "—");
    };
    return sc;
  });

  const click = (key: "sweep" | "stop") => {
    setSel(key);
    scatter.current?.sweep(key === "sweep");
  };

  // A sweep that keeps running off-screen would burn a rAF for the whole page.
  useInView(box, {
    enter: () => scatter.current?.resize(),
    leave: () => scatter.current?.sweep(false),
  });

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ২" title="দুমড়ানো কাগজ — কোনো সোজা দাগই কাজ করে না" />
      <div className="mfig-stage" ref={stage}>
        <span className="mfig-badge">রিয়েল ওয়ার্ল্ড ডাটা</span>
      </div>
      <div className="mfig-controls">
        <Btn on={sel === "sweep"} onClick={() => click("sweep")}>
          সব অ্যাঙ্গেল ট্রাই করুন
        </Btn>
        <Btn on={sel === "stop"} onClick={() => click("stop")}>
          থামান
        </Btn>
        <span className="mfig-read">
          এই অ্যাঙ্গেলে <b>{acc}</b> &nbsp;·&nbsp; সেরা <b style={{ color: COL.bad }}>{best}</b>
        </span>
      </div>
      <figcaption>
        একই দুইটা গ্রুপ — কিছু যোগ হয়নি, কিছু বাদ যায়নি, শুধু <strong>জায়গা বদলেছে</strong>। প্রতিটা
        অ্যাঙ্গেল, প্রতিটা পজিশন ঘুরেও দাগটা কাছাকাছি পৌঁছায় না।
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 3 · Un-crumple, then cut. The article's central move.

export function UntangleFigure() {
  const box = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<"reset" | "go" | "cut" | null>(null);
  const [acc, setAcc] = useState("—");
  const [color, setColor] = useState(COL.dim);

  const scatter = useSketch(stage, (host) => {
    const sc = new Scatter(host, { layout: "spiral" });
    sc.onFrame = (a, _b, _k, on) => {
      setAcc(on < 0.05 ? "—" : Math.round(a * 100) + "%");
      setColor(on < 0.05 ? COL.dim : a > 0.98 ? COL.i : COL.bad);
    };
    return sc;
  });

  const click = (key: "reset" | "go" | "cut") => {
    const sc = scatter.current;
    if (!sc) return;
    setSel(key);
    if (key === "reset") sc.reset();
    else if (key === "go") sc.setK(1, 2200);
    else {
      sc.setLine(0, 0, 500);
      sc.showLine(true);
    }
  };

  useInView(box, { enter: () => scatter.current?.resize() });

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ৩" title="ভাজ খুলুন, তারপর দাগ টানুন" />
      <div className="mfig-stage" ref={stage}>
        <span className="mfig-badge">গ্রিডের দিকে খেয়াল করুন</span>
      </div>
      <div className="mfig-controls">
        <Btn on={sel === "reset"} onClick={() => click("reset")}>
          দুমড়ানো
        </Btn>
        <Btn on={sel === "go"} onClick={() => click("go")}>
          ভাজ খুলুন
        </Btn>
        <Btn on={sel === "cut"} onClick={() => click("cut")}>
          এখন দাগ টানুন
        </Btn>
        <span className="mfig-read">
          সঠিক <b style={{ color }}>{acc}</b>
        </span>
      </div>
      <figcaption>
        জোরে কাটার চেষ্টা না করে আগে ভাজ খুলুন — তারপর সেই বোরিং সোজা দাগটাই নিখুঁতভাবে কাজ করে।
        নিউরাল নেটওয়ার্ক উত্তর শেখে না, সে <strong>এমন একটা ভিউ শেখে যেখানে উত্তরটা স্পষ্ট</strong>।
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 4 · New perspective. Same cloud, walked around — "নতুন perspective".

const CLOUD = (() => {
  let s = 424242;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const out: { p: number[]; c: number }[] = [];
  for (let c = 0; c < 2; c++)
    for (let i = 0; i < 85; i++)
      out.push({
        p: [(rnd() - 0.5) * 3.8, (rnd() - 0.5) * 2.3, (c ? -1.15 : 1.15) + (rnd() - 0.5) * 0.45],
        c,
      });
  return out;
})();

export function PerspectiveFigure() {
  const box = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<"front" | "side">("front");

  const space = useSketch(stage, (host) => {
    const sp = new Space3D(
      host,
      (s) => {
        s.yaw = s.state.yaw || 0;
        CLOUD.map((o) => [s.Pr(o.p[0], o.p[1], o.p[2]), o.c] as const)
          .sort((m, n) => m[0][2] - n[0][2])
          .forEach(([q, cls]) => s.dot(q[0], q[1], 3.9, cls ? COL.j : COL.i));
      },
      { range: 3.5, pitch: 0.1, dist: 26, fov: 1.0, spin: 0, yaw: 0 },
    );
    sp.state.yaw = 0;
    sp.stop();
    return sp;
  });

  const click = (key: "front" | "side") => {
    setSel(key);
    space.current?.tween("yaw", key === "side" ? Math.PI / 2 : 0, 2000);
  };

  useInView(box, { enter: () => space.current?.resize() });

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ৪" title="ডাটা ভুল না — কো-অর্ডিনেটটা ভুল" />
      <div className="mfig-stage" ref={stage}>
        <span className="mfig-badge">একই ডাটা · নতুন ভিউ</span>
      </div>
      <div className="mfig-controls">
        <Btn on={sel === "front"} onClick={() => click("front")}>
          যেখানে দাঁড়িয়ে আছি
        </Btn>
        <Btn on={sel === "side"} onClick={() => click("side")}>
          একটু ঘুরে দেখুন
        </Btn>
        <span className="mfig-read">
          {sel === "side" ? (
            <>
              <b style={{ color: COL.i }}>দুইটা গ্রুপ</b> — একটা দাগই যথেষ্ট
            </>
          ) : (
            "সব মিলেমিশে একাকার"
          )}
        </span>
      </div>
      <figcaption>
        ডাটার কিছুই বদলায়নি — আমরা শুধু <strong>অন্য জায়গা থেকে তাকিয়েছি</strong>। এই ঘুরে দাঁড়ানোটাই
        transformation, আর ম্যাট্রিক্স ঠিক এই কাজটাই করে।
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 5 · A matrix moves ALL of space. The deck's allspace + play slides, merged: the
//     presets are the article's "Rotation matrix, Scaling matrix", and the live
//     2x2 readout is what makes them the *same* kind of object.

type Preset = { key: string; label: string; M: Mat; note: string; path?: (e: number, from: Mat) => Mat };

const PRESETS: Preset[] = [
  { key: "id", label: "identity", M: ID, note: "কিছুই নড়ে না" },
  {
    key: "rot",
    label: "rotation ৯০°",
    M: [0, -1, 1, 0],
    note: "ঘোরে, দৈর্ঘ্য একই থাকে",
    // Rotation must travel along the arc, not lerp through a squashed middle.
    path: (e, from) => mul(rot((e * Math.PI) / 2), from),
  },
  { key: "scale", label: "scaling ×১.৮", M: [1.8, 0, 0, 1.8], note: "সবকিছু বড় হয়" },
  { key: "shear", label: "shear", M: [1, 1.1, 0, 1], note: "কাত হয়, ক্ষেত্রফল একই" },
  { key: "collapse", label: "collapse", M: [1, 0.5, 2, 1], note: "পুরো প্লেন একটা লাইন হয়ে যায়" },
];

export function SpaceFigure() {
  const box = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState("id");
  const [M, setM] = useState<Mat>(ID);
  const shown = useRef<Mat>(ID);

  const plane = useSketch(stage, (host) => {
    const p = new Plane(host, { range: 4.6, square: true });
    // Runs inside the sketch's rAF — identical values bail out of re-rendering.
    p.onFrame = (m) => {
      if (matEq(m, shown.current)) return;
      shown.current = m.slice();
      setM(shown.current);
    };
    return p;
  });

  const click = (p: Preset) => {
    setSel(p.key);
    // A path of fewer params is assignable to the engine's (e, from, to) shape.
    plane.current?.setMatrix(p.M, { dur: 1400, path: p.path ?? null });
  };

  useInView(box, { enter: () => plane.current?.resize() });

  const note = PRESETS.find((p) => p.key === sel)?.note ?? "";

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ৮" title="একটা ভেক্টর না — পুরো স্পেস নড়ে" />
      <div className="mfig-stage" ref={stage}>
        <span className="mfig-badge">ফিকে গ্রিড = আগে যেখানে ছিল</span>
      </div>
      <div className="mfig-controls">
        {PRESETS.map((p) => (
          <Btn key={p.key} on={sel === p.key} onClick={() => click(p)}>
            {p.label}
          </Btn>
        ))}
        <span className="mfig-read">
          <span className="mfig-mat">
            <span>{fmt(M[0])}</span>
            <span>{fmt(M[1])}</span>
            <span>{fmt(M[2])}</span>
            <span>{fmt(M[3])}</span>
          </span>
        </span>
      </div>
      <figcaption>
        {note} — কিন্তু লক্ষ্য করুন, প্রতিটাই <strong>একই চারটা সংখ্যা</strong>র খেলা। ওই বিকৃতিটাই
        ম্যাট্রিক্স; সংখ্যা চারটা শুধু তার নাম।
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 6 · 3x2 — carrying the flat plane up into 3D. Screen convention: X = out1
//     (right), Y = out3 (UP), Z = out2 (depth), so "lifting" is literally upward.

const A = [
  [1, 0],
  [0, 1],
  [0.7, -0.5],
];
const E = 0.85;
const EXT = E * 2;
const map = (u: number, v: number, k: number) => [
  A[0][0] * u + A[0][1] * v,
  (A[2][0] * u + A[2][1] * v) * k,
  A[1][0] * u + A[1][1] * v,
];

function drawLift(s: Space3D) {
  const k = s.state.k || 0; // 0 = flat on the floor, 1 = lifted
  for (let n = -3; n <= 3; n++) {
    const i = n * 1.0;
    s.poly([[i, 0, -3], [i, 0, 3]], "rgba(150,170,215,.12)", 1);
    s.poly([[-3, 0, i], [3, 0, i]], "rgba(150,170,215,.12)", 1);
  }
  s.poly(
    [map(-EXT, -EXT, k), map(EXT, -EXT, k), map(EXT, EXT, k), map(-EXT, EXT, k)],
    null,
    0,
    "rgba(129,140,248,.11)",
  );
  for (let n = -2; n <= 2; n++) {
    const i = n * E;
    const hot = n === 0;
    const l1: number[][] = [];
    const l2: number[][] = [];
    for (let t = -EXT; t <= EXT + 1e-9; t += 0.45) {
      l1.push(map(i, t, k));
      l2.push(map(t, i, k));
    }
    s.poly(l1, hot ? COL.j : "rgba(170,195,240,.34)", hot ? 2.2 : 1.1);
    s.poly(l2, hot ? COL.i : "rgba(170,195,240,.34)", hot ? 2.2 : 1.1);
  }
  const o = s.Pr(0, 0, 0);
  const c1 = map(1, 0, k);
  const c2 = map(0, 1, k);
  const p1 = s.Pr(c1[0], c1[1], c1[2]);
  const p2 = s.Pr(c2[0], c2[1], c2[2]);
  s.arrow(o, p1, COL.i, 3.2);
  s.arrow(o, p2, COL.j, 3.2);
  s.label("col 1", p1[0] + 9, p1[1] + 8, COL.i, 13);
  s.label("col 2", p2[0] + 9, p2[1] + 8, COL.j, 13);
}

export function LiftFigure() {
  const box = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<"flat" | "lift">("flat");

  const space = useSketch(stage, (host) => {
    const sp = new Space3D(host, drawLift, { range: 4.0, pitch: 0.5 });
    sp.state.k = 0;
    return sp;
  });

  const click = (key: "flat" | "lift") => {
    setSel(key);
    space.current?.tween("k", key === "lift" ? 1 : 0, 1600);
  };

  // The slow auto-orbit is what sells the third dimension — but only on screen.
  useInView(box, {
    enter: () => {
      space.current?.resize();
      space.current?.start();
    },
    leave: () => space.current?.stop(),
  });

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ৯" title="৩ × ২ ম্যাট্রিক্স — 2D থেকে 3D" />
      <div className="mfig-stage" ref={stage}>
        <span className="mfig-badge">দুইটা কলাম, প্রতিটায় তিনটা সংখ্যা</span>
      </div>
      <div className="mfig-controls">
        <Btn on={sel === "flat"} onClick={() => click("flat")}>
          সমতল
        </Btn>
        <Btn on={sel === "lift"} onClick={() => click("lift")}>
          3D তে তুলুন
        </Btn>
        <span className="mfig-read">ℝ² ──▶ ৩×২ ──▶ ℝ³</span>
      </div>
      <figcaption>
        n কলাম = কয়টা ইনপুট ডিমেনশন, m রো = কয়টা আউটপুট ডিমেনশন। তাই{" "}
        <strong>2D কে 3D তে নিতে লাগে একটা ৩×২ ম্যাট্রিক্স</strong>। খেয়াল করুন — উঠে গেলেও জিনিসটা
        কিন্তু একটা সমতল চাদরই থেকে যায়।
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 7 · The catch. Left panel: what a matrix can do. Right: what it can never do.

const LINEAR: Mat = [1.4, 0.7, -0.35, 1.05];
const WARP = (x: number, y: number) => [
  x + 0.42 * Math.sin(y * 1.15) + 0.12 * x * x * 0.18,
  y + 0.38 * Math.sin(x * 0.95),
];

export function LinearFigure() {
  const box = useRef<HTMLElement>(null);
  const okHost = useRef<HTMLDivElement>(null);
  const noHost = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  const ok = useSketch(okHost, (host) => new Plane(host, { range: 4.2, basis: true, labels: false }));
  const no = useSketch(noHost, (host) => {
    const p = new Plane(host, { range: 4.2, basis: true, labels: false, gridAlpha: 0.3 });
    p.warp = WARP;
    return p;
  });

  const click = (next: boolean) => {
    setOn(next);
    ok.current?.setMatrix(next ? LINEAR : ID, { dur: 1500 });
    no.current?.setWarp(null, next ? 1 : 0, 1500);
  };

  useInView(box, {
    enter: () => {
      ok.current?.resize();
      no.current?.resize();
    },
  });

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ১০" title="ম্যাট্রিক্স সব ট্রান্সফরমেশন পারে না" />
      <div className="mfig-duo">
        <div className="mfig-stage" ref={okHost}>
          <span className="mfig-badge" style={{ color: COL.i }}>
            ✓ লিনিয়ার
          </span>
        </div>
        <div className="mfig-stage" ref={noHost}>
          <span className="mfig-badge" style={{ color: COL.bad }}>
            ✗ নন-লিনিয়ার
          </span>
        </div>
      </div>
      <div className="mfig-controls">
        <Btn on={!on} onClick={() => click(false)}>
          শুরুর অবস্থা
        </Btn>
        <Btn on={on} onClick={() => click(true)}>
          ট্রান্সফর্ম করুন
        </Btn>
        <span className="mfig-read">বামে ম্যাট্রিক্স পারে · ডানে পারে না</span>
      </div>
      <figcaption>
        বামে গ্রিডলাইন <strong>সোজা থাকে, সমান্তরাল থাকে, সমান দূরত্বে থাকে</strong> — origin নড়ে না।
        ডানে গ্রিডটা বেঁকে গেছে, আর দুনিয়ার কোনো ম্যাট্রিক্স ওটা লিখতে পারবে না।
      </figcaption>
    </figure>
  );
}
