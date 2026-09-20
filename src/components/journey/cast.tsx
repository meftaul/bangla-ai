"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { GROW_WIDE, POP, SceneControls, type SceneState } from "./kit";

// The recurring cast and their world, for story scenes: small animated
// pictures that act out what a step's setup words describe (the finalists
// walking up, সোম on the roof, মামা at the video shop). A story scene sits
// among the setup paragraphs, marked `story` in the MDX so the Journey takes it
// for words and not for the widget:
//
//   <FinalistsArrive story />
//
// A scene is a painted picture, so everything on the Stage is fixed ink, the
// same in light and dark. Build one on useScene: each beat mounts or moves
// someone, and CSS transitions do the in-between. People are drawn around their
// feet, about 62 units tall on a 320 × 180 stage.

// ---------------------------------------------------------------------------
// The cast. মামী (ফাহিমের মামার স্ত্রী) came in with Article 4's হাট.

export type Who = "fahim" | "samin" | "som" | "nasib" | "ammu" | "apa" | "mama" | "rina" | "karim" | "mami";

type Look = { name: string; shirt: string; pants: string; skin: string; hair: string };
export const CAST: Record<Who, Look> = {
  fahim: { name: "ফাহিম", shirt: "#2563eb", pants: "#1e293b", skin: "#e0ac7e", hair: "#1f1a17" },
  samin: { name: "সামিন", shirt: "#0d9488", pants: "#334155", skin: "#c68e5f", hair: "#111827" },
  som: { name: "সোম", shirt: "#d97706", pants: "#3f3f46", skin: "#e8b88f", hair: "#2b211c" },
  nasib: { name: "নাসিব", shirt: "#dc2626", pants: "#1f2937", skin: "#d49a6a", hair: "#1c1917" },
  ammu: { name: "আম্মু", shirt: "#7c3aed", pants: "#7c3aed", skin: "#e0ac7e", hair: "#1c1917" },
  apa: { name: "ডাক্তার আপা", shirt: "#f8fafc", pants: "#0f766e", skin: "#d8a47a", hair: "#1c1917" },
  mama: { name: "মামা", shirt: "#65a30d", pants: "#44403c", skin: "#c68e5f", hair: "#3f3f46" },
  rina: { name: "রিনা", shirt: "#db2777", pants: "#334155", skin: "#e8b88f", hair: "#1c1917" },
  karim: { name: "করিম", shirt: "#0891b2", pants: "#292524", skin: "#c68e5f", hair: "#1c1917" },
  mami: { name: "মামী", shirt: "#9d174d", pants: "#9d174d", skin: "#d8a47a", hair: "#1c1917" },
};

const INK = "#0f1b2d";

/** Whether the reader asked for less motion; loops (walking legs, a bob) stay still then. */
function useCalm() {
  const [calm, setCalm] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser's motion setting, which the server render cannot see
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return calm;
}

/**
 * SVG's own animation (no CSS keyframes), run for `ms` each time `run` changes
 * while `on`: a walker's legs swing while they glide to a new spot and stop when
 * they get there, even if the scene stays on that beat (stepping by hand).
 */
export function Loop({ on, run, ms, type, values, dur }: { on: boolean; run: string; ms: number; type: "rotate" | "translate"; values: string; dur: number }) {
  const ref = useRef<SVGAnimateTransformElement>(null);
  useEffect(() => {
    if (on) ref.current?.beginElement();
  }, [on, run]);
  if (!on) return null;
  return <animateTransform ref={ref} attributeName="transform" type={type} values={values} dur={`${dur}s`} begin="indefinite" repeatCount={Math.max(1, Math.round(ms / 1000 / dur))} />;
}

/** A leg or arm that swings about its top while its owner is on the move. */
function Swing({ on, run, ms, deg, px, py, children }: { on: boolean; run: string; ms: number; deg: number; px: number; py: number; children: ReactNode }) {
  return (
    <g>
      <Loop on={on} run={run} ms={ms} type="rotate" values={`${deg} ${px} ${py};${-deg} ${px} ${py};${deg} ${px} ${py}`} dur={0.5} />
      {children}
    </g>
  );
}

export type Mood = "plain" | "happy" | "puzzled" | "smug" | "sad" | "shout";

/**
 * One of the cast, standing with their feet at (x, y). Change x or y and they
 * glide there over `ms` (set `walking` meanwhile, and the legs swing). `facing`
 * −1 turns them to the left. `arm`: "wave" raises the right arm, "hold" holds
 * something up in front (put a Card at their hands, about (x + 10, y − 44)),
 * "point" points ahead.
 */
export function Person({
  who,
  x,
  y,
  facing = 1,
  walking = false,
  mood = "plain",
  arm = "down",
  scale = 1,
  ms = 1200,
  label = false,
}: {
  who: Who;
  x: number;
  y: number;
  facing?: 1 | -1;
  walking?: boolean;
  mood?: Mood;
  arm?: "down" | "wave" | "hold" | "point";
  scale?: number;
  ms?: number;
  /** their name under their feet */
  label?: boolean;
}) {
  const c = CAST[who];
  const calm = useCalm();
  const move = walking && !calm;
  const run = `${x},${y}`;
  const dress = who === "ammu" || who === "mami";
  const coat = who === "apa";
  const eyeY = -51;
  const mouth =
    mood === "happy" || mood === "smug"
      ? "M-3 -45.5q3 3 6 0"
      : mood === "sad"
        ? "M-3 -44q3 -2.5 6 0"
        : mood === "puzzled"
          ? "M-3 -45l6 -1"
          : mood === "shout"
            ? ""
            : "M-2.5 -45h5";
  const armR =
    arm === "wave" ? "M8 -38l9 -14" : arm === "hold" ? "M8 -37l9 -6" : arm === "point" ? "M8 -37l13 -3" : "M8 -38l3 14";

  return (
    <g
      style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }}
      className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none"
    >
      <g transform={`scale(${facing * scale} ${scale})`}>
        {/* a step's bob while walking */}
        <g>
          <Loop on={move} run={run} ms={ms} type="translate" values="0 0;0 -1.5;0 0" dur={0.25} />
          {/* legs */}
          {!dress && (
            <>
              <Swing on={move} run={run} ms={ms} deg={20} px={-3.5} py={-22}>
                <path d="M-3.5 -22V-1" strokeWidth={5} strokeLinecap="round" stroke={c.pants} />
              </Swing>
              <Swing on={move} run={run} ms={ms} deg={-20} px={3.5} py={-22}>
                <path d="M3.5 -22V-1" strokeWidth={5} strokeLinecap="round" stroke={c.pants} />
              </Swing>
            </>
          )}
          {dress && <path d="M-9 -38L-13 -1H13L9 -38Z" fill={c.shirt} />}
          {/* body */}
          <rect x={-9} y={-40} width={18} height={coat ? 24 : 20} rx={5} fill={c.shirt} stroke={coat ? "#94a3b8" : "none"} strokeWidth={1} />
          {coat && <path d="M-4 -40q4 10 8 0" strokeWidth={1.4} fill="none" stroke="#0f766e" />}
          {/* arms */}
          <Swing on={move && arm === "down"} run={run} ms={ms} deg={-18} px={-8} py={-38}>
            <path d="M-8 -38l-3 14" strokeWidth={4} strokeLinecap="round" stroke={c.skin} />
          </Swing>
          <Swing on={move && arm === "down"} run={run} ms={ms} deg={18} px={8} py={-38}>
            <path d={armR} strokeWidth={4} strokeLinecap="round" stroke={c.skin} />
          </Swing>
          {/* head */}
          <circle cy={-51} r={9} fill={c.skin} />
          {/* hair, and each one's mark */}
          {who === "ammu" || who === "mami" ? (
            <path d="M-11 -48q0 -15 11 -15t11 15q-1 -9 -11 -10t-11 10Z" fill={who === "mami" ? "#f9a8d4" : "#a78bfa"} />
          ) : who === "rina" ? (
            <path d="M-9.5 -52q0 -10 9.5 -10t9.5 10q-5 -5 -9.5 -5t-9.5 5ZM-9.5 -52q-3 8 1 12M9.5 -52q3 8 -1 12" fill={c.hair} stroke={c.hair} strokeWidth={2} />
          ) : who === "samin" ? (
            <path d="M-9.5 -52q-1 -11 9.5 -11t9.5 11q-2 -3 -4 -4q-1 2 -3 1q-2 2 -4 0q-2 2 -4 0q-2 1 -4 2Z" fill={c.hair} />
          ) : (
            <path d="M-9.5 -52q0 -11 9.5 -11t9.5 11q-6 -6 -19 0Z" fill={c.hair} />
          )}
          {who === "nasib" && <path d="M-10 -57q10 -9 20 0ZM8 -57h7" stroke="#b91c1c" strokeWidth={2.4} fill="#dc2626" strokeLinecap="round" />}
          {who === "som" && (
            <g fill="none" stroke={INK} strokeWidth={1}>
              <circle cx={-3.4} cy={eyeY} r={2.6} />
              <circle cx={3.4} cy={eyeY} r={2.6} />
              <path d={`M-0.8 ${eyeY}h1.6`} />
            </g>
          )}
          {who === "mama" && <path d="M-4 -47.5q4 -2.5 8 0q-4 1.5 -8 0Z" fill="#3f3f46" />}
          {who === "apa" && <path d="M-6 -40q-2 10 3 13M6 -40q2 10 -3 13" fill="none" stroke="#334155" strokeWidth={1.2} />}
          {/* face */}
          <circle cx={-3.4} cy={eyeY} r={1.2} fill={INK} />
          <circle cx={3.4} cy={eyeY} r={1.2} fill={INK} />
          {mood === "puzzled" && <path d="M1 -56l4 -1.5" stroke={INK} strokeWidth={1} />}
          {mood === "shout" ? <ellipse cy={-45} rx={2.2} ry={2.6} fill={INK} /> : <path d={mouth} fill="none" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />}
        </g>
      </g>
      {label && (
        <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
          {c.name}
        </text>
      )}
    </g>
  );
}

/** Shiku, the class robot, feet at (x, y), on the stage's scale. */
export function Robot({ x, y, ms = 1200, walking = false }: { x: number; y: number; ms?: number; walking?: boolean }) {
  const calm = useCalm();
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      <g>
        <Loop on={walking && !calm} run={`${x},${y}`} ms={ms} type="translate" values="0 0;0 -2;0 0" dur={0.3} />
        <path d="M0 -30V-37" strokeWidth={1.6} stroke="#7c3aed" />
        <circle cy={-38.5} r={2.4} fill="#7c3aed" />
        <rect x={-13} y={-30} width={26} height={24} rx={6} fill="#7c3aed" />
        <circle cx={-5} cy={-20} r={2.8} fill="white" />
        <circle cx={5} cy={-20} r={2.8} fill="white" />
        <rect x={-9} y={-6} width={5} height={6} rx={1.5} fill="#5b21b6" />
        <rect x={4} y={-6} width={5} height={6} rx={1.5} fill="#5b21b6" />
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Things in the scene.

/**
 * A speech bubble whose tail points down at (x, y), usually just above a
 * head (person's y − 66). Lines are short spoken Bangla; `lines` wraps by hand.
 * `side` shifts the bubble so it stays on the stage near an edge.
 */
export function Bubble({ x, y, lines, side = "mid", tone = "plain" }: { x: number; y: number; lines: string[]; side?: "left" | "mid" | "right"; tone?: "plain" | "think" }) {
  const w = Math.max(...lines.map((l) => l.length)) * 4.9 + 16;
  const h = lines.length * 11 + 9;
  const bx = side === "left" ? x - w + 14 : side === "right" ? x - 14 : x - w / 2;
  const by = y - h - 7;
  return (
    <g className={POP}>
      <rect x={bx} y={by} width={w} height={h} rx={8} fill="white" stroke={INK} strokeOpacity={0.35} strokeDasharray={tone === "think" ? "3 2" : undefined} />
      {tone === "think" ? (
        <>
          <circle cx={x} cy={y - 3} r={2.2} fill="white" stroke={INK} strokeOpacity={0.35} />
          <circle cx={x + 2} cy={y + 2} r={1.3} fill="white" stroke={INK} strokeOpacity={0.35} />
        </>
      ) : (
        <path d={`M${x - 5} ${by + h - 0.5}L${x} ${y}L${x + 5} ${by + h - 0.5}`} fill="white" stroke={INK} strokeOpacity={0.35} strokeLinejoin="round" />
      )}
      {tone !== "think" && <path d={`M${x - 4.4} ${by + h - 0.8}H${x + 4.4}`} stroke="white" strokeWidth={1.6} />}
      {lines.map((l, i) => (
        <text key={i} x={bx + w / 2} y={by + 13 + i * 11} textAnchor="middle" fontSize={9} fontWeight={600} fill={INK}>
          {l}
        </text>
      ))}
    </g>
  );
}

/** A clue card, centred at (x, y): a tuple in Latin digits, or "?" for a lost one. */
export function Card({ x, y, text, tone = "teal", w }: { x: number; y: number; text: string; tone?: "teal" | "coral" | "amber" | "blue"; w?: number }) {
  const ink = { teal: "#0f766e", coral: "#be123c", amber: "#b45309", blue: "#1d4ed8" }[tone];
  const width = w ?? text.length * 5.6 + 12;
  return (
    <g className={POP}>
      <rect x={x - width / 2} y={y - 9} width={width} height={18} rx={3} fill="white" stroke={ink} strokeWidth={1.4} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill={ink}>
        {text}
      </text>
    </g>
  );
}

/** The fair's gate, feet at (x, y): two posts and a banner. */
export function Gate({ x, y, text = "Gate" }: { x: number; y: number; text?: string }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 22} y={y - 70} width={5} height={70} fill="#92400e" />
      <rect x={x + 17} y={y - 70} width={5} height={70} fill="#92400e" />
      <rect x={x - 26} y={y - 80} width={52} height={15} rx={3} fill="#f59e0b" />
      <text x={x} y={y - 69} textAnchor="middle" fontSize={9} fontWeight={800} fill={INK}>
        {text}
      </text>
    </g>
  );
}

/** A market stall, feet at (x, y), with a striped awning and a sign. */
export function Stall({ x, y, sign, color = "#ef4444", w = 64 }: { x: number; y: number; sign?: string; color?: string; w?: number }) {
  const stripes = Array.from({ length: Math.round(w / 12) }, (_, i) => i);
  return (
    <g className="pointer-events-none">
      <rect x={x - w / 2 + 3} y={y - 50} width={3} height={50} fill="#78350f" />
      <rect x={x + w / 2 - 6} y={y - 50} width={3} height={50} fill="#78350f" />
      <rect x={x - w / 2} y={y - 22} width={w} height={22} fill="#b45309" />
      <rect x={x - w / 2} y={y - 24} width={w} height={4} fill="#92400e" />
      <path d={`M${x - w / 2 - 4} ${y - 50}L${x - w / 2 + 2} ${y - 64}H${x + w / 2 - 2}L${x + w / 2 + 4} ${y - 50}Z`} fill="white" />
      {stripes.map((i) => (
        <path key={i} d={`M${x - w / 2 - 4 + (i * (w + 8)) / stripes.length} ${y - 50}l${3} -14h${(w + 8) / stripes.length / 2}l-3 14Z`} fill={color} />
      ))}
      {sign && (
        <text x={x} y={y - 8} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#fef3c7">
          {sign}
        </text>
      )}
    </g>
  );
}

/** A tree, trunk at (x, y). */
export function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g className="pointer-events-none" transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-3} y={-26} width={6} height={26} fill="#78350f" />
      <circle cy={-38} r={16} fill="#16a34a" />
      <circle cx={-10} cy={-30} r={10} fill="#22c55e" />
      <circle cx={10} cy={-31} r={11} fill="#15803d" />
    </g>
  );
}

/** A building, its bottom-left at (x, y); `roof` draws a railing on top. */
export function Building({ x, y, w, h, color = "#e7d7c1", roof = false, label }: { x: number; y: number; w: number; h: number; color?: string; roof?: boolean; label?: string }) {
  const rows = Math.max(1, Math.floor((h - 12) / 22));
  const cols = Math.max(1, Math.floor((w - 8) / 20));
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y - h} width={w} height={h} fill={color} stroke="#a8a29e" strokeWidth={1} />
      {Array.from({ length: rows * cols }, (_, i) => (
        <rect key={i} x={x + 8 + (i % cols) * ((w - 16) / cols) + 2} y={y - h + 10 + Math.floor(i / cols) * 22} width={8} height={10} fill="#93c5fd" stroke="#64748b" strokeWidth={0.6} />
      ))}
      {roof && <path d={`M${x} ${y - h - 6}H${x + w}M${x + 2} ${y - h}V${y - h - 6}M${x + w - 2} ${y - h}V${y - h - 6}M${x + w / 2} ${y - h}V${y - h - 6}`} stroke="#57534e" strokeWidth={1.4} />}
      {label && (
        <text x={x + w / 2} y={y - 4} textAnchor="middle" fontSize={8} fontWeight={700} fill="#44403c">
          {label}
        </text>
      )}
    </g>
  );
}

/** A treasure chest, bottom-centre at (x, y); `open` lifts the lid. */
export function Chest({ x, y, open = false }: { x: number; y: number; open?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 11} y={y - 13} width={22} height={13} rx={2} fill="#b45309" />
      <path d={open ? `M${x - 11} ${y - 13}l3 -10h22l-3 10Z` : `M${x - 11} ${y - 13}q11 -11 22 0Z`} fill="#d97706" />
      <rect x={x - 2} y={y - 10} width={4} height={5} rx={1} fill="#fde68a" />
      {open && <circle cx={x} cy={y - 16} r={4} fill="#fde047" className={POP} />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// The stage.

export type Backdrop = "field" | "fair" | "night" | "room" | "street" | "evening";

const SKY: Record<Backdrop, [string, string, string]> = {
  // sky top, sky bottom, ground
  field: ["#bfe3ff", "#eaf6ff", "#86c06c"],
  fair: ["#ffd9a8", "#fff3e0", "#d6b98c"],
  night: ["#0f172a", "#1e293b", "#1f2d1f"],
  room: ["#f5efe6", "#f5efe6", "#c8a27a"],
  street: ["#cfe8ff", "#f0f7ff", "#9ca3af"],
  evening: ["#fdba74", "#fde68a", "#a3b18a"],
};

/**
 * The painted stage a story scene plays on: 320 × 180 units, sky and ground
 * (the horizon at `ground`), rounded, full width. Children draw on top.
 */
export function Stage({ backdrop = "field", ground = 150, label, children }: { backdrop?: Backdrop; ground?: number; label: string; children: ReactNode }) {
  // The backdrop is in the id too: `npm run shot` renders each scene on its own, so
  // useId repeats across one page, and a shared id would paint every sky alike.
  const id = `${useId()}${backdrop}`;
  const [top, bottom, earth] = SKY[backdrop];
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label={label} className="block h-auto w-full select-none" style={{ fontFamily: "inherit" }}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width={320} height={180} fill={`url(#${id}sky)`} />
      {backdrop === "night" &&
        [
          [30, 20],
          [80, 45],
          [140, 15],
          [210, 35],
          [270, 22],
          [300, 60],
          [60, 75],
        ].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={1} fill="white" opacity={0.8} />)}
      {(backdrop === "field" || backdrop === "street") && (
        <g fill="white" opacity={0.9}>
          <ellipse cx={60} cy={30} rx={20} ry={7} />
          <ellipse cx={75} cy={26} rx={14} ry={7} />
          <ellipse cx={250} cy={40} rx={18} ry={6} />
        </g>
      )}
      {backdrop === "fair" &&
        Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${i * 40} 18l20 10l20 -10`} fill="none" stroke="#fb923c" strokeWidth={1} />
        ))}
      {backdrop === "fair" &&
        Array.from({ length: 16 }, (_, i) => <path key={`f${i}`} d={`M${i * 20 + 4} 22l6 9l6 -9Z`} fill={["#ef4444", "#22c55e", "#3b82f6", "#eab308"][i % 4]} />)}
      <rect y={ground} width={320} height={180 - ground} fill={earth} />
      {children}
    </svg>
  );
}

/**
 * The frame for a story scene: the stage edge to edge, rounded, and under it
 * the controls to watch it all or step through it. The frame widens on bigger
 * screens (GROW_WIDE) and the stage, an SVG, grows with it; the controls don't. No caption: the words
 * around it tell the story, the picture acts it out.
 */
export function StoryFrame({ scene, children }: { scene: SceneState; children: ReactNode }) {
  return (
    <div className={`mx-auto my-4 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/10 ${GROW_WIDE}`}>
      {children}
      <div className="border-t border-border bg-surface px-2 py-2">
        <SceneControls scene={scene} />
      </div>
    </div>
  );
}
