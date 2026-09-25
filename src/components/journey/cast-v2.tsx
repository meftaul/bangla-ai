"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

import { POP } from "./kit";
import { CAST, Loop, type Mood, type Who } from "./cast";

// PROTOTYPE — a richer drawing style for story scenes, to compare against
// cast.tsx before rolling it out (see cartoon-v2-preview.tsx). Same API shape
// as cast.tsx (feet at (x, y), about 64 units tall, 320 × 180 stage), so a
// scene can switch by changing its imports. What's new:
//   people: shaped bodies with shading and a soft outline, shoes, hands,
//           ears, eyebrows that act, eyes that blink, cheeks, a breathing
//           bob when standing, and a shadow on the ground;
//   costume: Nana's panjabi, checked lungi and gamchha; school shirts with
//           a collar; Nasib's cap;
//   stage:  three depth layers (village tree line, mustard rows, the aal
//           path they stand on, swaying plants in front), a sun with haze,
//           drifting clouds.

const OUTLINE = "#2b1d14";
const LINE = { stroke: OUTLINE, strokeOpacity: 0.5, strokeWidth: 0.7, strokeLinejoin: "round" as const };

function useCalm() {
  const [calm, setCalm] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser's motion setting, which the server render cannot see
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return calm;
}

/** A loop that runs forever (idle motion: breathing, swaying, blinking); off under reduced motion. */
function Idle({ calm, type, values, dur, begin = 0 }: { calm: boolean; type: "rotate" | "translate" | "scale"; values: string; dur: number; begin?: number }) {
  if (calm) return null;
  return <animateTransform attributeName="transform" type={type} values={values} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" additive="sum" />;
}

// ---------------------------------------------------------------------------
// People.

const BLINK_AT: Record<Who, number> = { fahim: 0.3, samin: 1.4, som: 2.1, nasib: 0.9, ammu: 1.8, apa: 2.6, mama: 0.6, rina: 1.1, karim: 2.3, mami: 1.6, nana: 0.1 };

function Eye({ cx, calm, begin }: { cx: number; calm: boolean; begin: number }) {
  return (
    <g transform={`translate(${cx} -51)`}>
      <g>
        {!calm && <animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 0.1;1 1" keyTimes="0;0.94;0.97;1" dur="4.2s" begin={`${begin}s`} repeatCount="indefinite" />}
        <ellipse rx={1.9} ry={2.2} fill="white" />
        <circle cx={0.3} cy={0.3} r={1.25} fill="#1c1410" />
        <circle cx={0.8} cy={-0.3} r={0.4} fill="white" />
      </g>
    </g>
  );
}

const BROWS: Record<Mood, [string, string]> = {
  plain: ["M-5.4 -54.8h3.6", "M1.8 -54.8h3.6"],
  happy: ["M-5.4 -54.6q1.8 -1.4 3.6 0", "M1.8 -54.6q1.8 -1.4 3.6 0"],
  smug: ["M-5.4 -55.4l3.6 0.8", "M1.8 -54.6l3.6 -1.4"],
  puzzled: ["M-5.4 -54.4l3.6 -0.2", "M1.8 -56.2q1.8 -1.2 3.6 0.2"],
  sad: ["M-5.4 -54.4l3.6 -1", "M1.8 -55.4l3.6 1"],
  shout: ["M-5.4 -56l3.6 1", "M1.8 -55l3.6 -1"],
};

function Mouth({ mood }: { mood: Mood }) {
  if (mood === "happy") return <path d="M-3 -46.2q3 3.4 6 0Z" fill="#7f1d1d" stroke="#5b1414" strokeWidth={0.5} />;
  if (mood === "smug") return <path d="M-2.4 -45.6q2.6 1.4 5.2 -1.2" fill="none" stroke="#5b1414" strokeWidth={1.1} strokeLinecap="round" />;
  if (mood === "puzzled") return <path d="M-2.6 -45.4q1.3 -1 2.6 0t2.6 0" fill="none" stroke="#5b1414" strokeWidth={1} strokeLinecap="round" />;
  if (mood === "sad") return <path d="M-2.6 -44.6q2.6 -2 5.2 0" fill="none" stroke="#5b1414" strokeWidth={1.1} strokeLinecap="round" />;
  if (mood === "shout") return <ellipse cy={-45.3} rx={2} ry={2.4} fill="#7f1d1d" />;
  return <path d="M-2 -45.5h4" stroke="#5b1414" strokeWidth={1.1} strokeLinecap="round" />;
}

type Arm = "down" | "wave" | "hold" | "point";
/** shoulder → elbow → hand, for the right arm (the left always hangs down). */
const ARM: Record<Arm, [number, number, number, number]> = {
  down: [10.5, -31, 11, -23.5],
  wave: [15, -45, 16, -54],
  hold: [13, -33, 18, -38],
  point: [16, -39, 23, -40],
};

function Limb({ sx, sy, ex, ey, hx, hy, sleeve, skin, long }: { sx: number; sy: number; ex: number; ey: number; hx: number; hy: number; sleeve: string; skin: string; long: boolean }) {
  return (
    <g>
      <path d={`M${sx} ${sy}L${ex} ${ey}L${hx} ${hy}`} fill="none" stroke={OUTLINE} strokeOpacity={0.45} strokeWidth={5.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${sx} ${sy}L${ex} ${ey}L${hx} ${hy}`} fill="none" stroke={long ? sleeve : skin} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
      {!long && <path d={`M${sx} ${sy}L${(sx + ex) / 2 + (ex - sx) * 0.1} ${(sy + ey) / 2 + (ey - sy) * 0.1}`} stroke={sleeve} strokeWidth={5} strokeLinecap="round" />}
      <circle cx={hx} cy={hy} r={2.3} fill={skin} {...LINE} />
    </g>
  );
}

export function Person2({
  who,
  x,
  y,
  facing = 1,
  walking = false,
  mood = "plain",
  arm = "down",
  ms = 1200,
}: {
  who: Who;
  x: number;
  y: number;
  facing?: 1 | -1;
  walking?: boolean;
  mood?: Mood;
  arm?: Arm;
  ms?: number;
}) {
  const c = CAST[who];
  const calm = useCalm();
  const move = walking && !calm;
  const run = `${x},${y}`;
  const nana = who === "nana";
  const [ex, ey, hx, hy] = ARM[arm];
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {/* the shadow stays on the ground while the body bobs */}
      <ellipse cy={0.5} rx={12} ry={2.6} fill="#1c1410" opacity={0.2} />
      <g transform={`scale(${facing} 1)`}>
        <g>
          {move ? <Loop on={move} run={run} ms={ms} type="translate" values="0 0;0 -1.6;0 0" dur={0.25} /> : <Idle calm={calm} type="translate" values="0 0;0 -0.5;0 0" dur={3.2} begin={BLINK_AT[who]} />}

          {/* legs and feet */}
          {nana ? (
            <>
              <path d="M-7 -2.2q3 -1.6 5 0M2 -2.2q3 -1.6 5 0" stroke={c.skin} strokeWidth={2.6} strokeLinecap="round" />
              <path d="M-9.5 -27L-10.5 -4Q0 -2 10.5 -4L9.5 -27Z" fill={c.pants} {...LINE} />
              <path d="M-7 -26L-7.6 -4M-2 -26.5V-3M3 -26.5V-3M8 -26L8.4 -4M-10 -21H10M-10.2 -14H10.2M-10.4 -8H10.4" stroke="#bef264" strokeOpacity={0.45} strokeWidth={0.8} />
            </>
          ) : (
            <>
              <g>
                <Loop on={move} run={run} ms={ms} type="rotate" values="20 -4 -24;-20 -4 -24;20 -4 -24" dur={0.5} />
                <path d="M-7.4 -24.5L-7 -3.4H-1.6L-1 -24.5Z" fill={c.pants} {...LINE} />
                <ellipse cx={-4.6} cy={-2.2} rx={4.2} ry={2} fill="#3b2a1e" />
              </g>
              <g>
                <Loop on={move} run={run} ms={ms} type="rotate" values="-20 4 -24;20 4 -24;-20 4 -24" dur={0.5} />
                <path d="M1 -24.5L1.6 -3.4H7L7.4 -24.5Z" fill={c.pants} {...LINE} />
                <ellipse cx={4.9} cy={-2.2} rx={4.2} ry={2} fill="#3b2a1e" />
              </g>
            </>
          )}

          {/* the left arm, behind the body */}
          <Limb sx={-8.5} sy={-39} ex={-10.5} ey={-31} hx={-11} hy={-23.5} sleeve={c.shirt} skin={c.skin} long={nana} />

          {/* body: a shirt with shoulders, or Nana's long panjabi */}
          {nana ? (
            <path d="M-3 -42.5Q-9 -41.5 -9.6 -37L-11 -13H11L9.6 -37Q9 -41.5 3 -42.5Z" fill={c.shirt} {...LINE} />
          ) : (
            <path d="M-3 -42.5Q-9 -41.5 -9.4 -37L-9.2 -23.5H9.2L9.4 -37Q9 -41.5 3 -42.5Z" fill={c.shirt} {...LINE} />
          )}
          <path d={nana ? "M3 -42.5Q9 -41.5 9.6 -37L11 -13H4Q6 -28 3 -42.5Z" : "M3 -42.5Q9 -41.5 9.4 -37L9.2 -23.5H4Q6 -33 3 -42.5Z"} fill="#000" opacity={0.1} />
          {nana ? (
            <>
              <path d="M0 -42V-33" stroke="#cbd5e1" strokeWidth={0.8} />
              <circle cy={-39} r={0.6} fill="#94a3b8" />
              <circle cy={-36} r={0.6} fill="#94a3b8" />
              {/* the gamchha over his left shoulder */}
              <path d="M-7.5 -42.5L-3 -43L6.5 -27L3 -25Z" fill="#dc2626" {...LINE} />
              <path d="M-6.2 -41l8.8 14.6M-4.4 -42.4l9 14.8M-6.5 -38.8h4M-4.4 -35.4h4M-2.3 -31.8h4.2" stroke="white" strokeOpacity={0.75} strokeWidth={0.7} />
            </>
          ) : (
            <>
              <path d="M-3.4 -42.4L0 -38.4L3.4 -42.4" fill="none" stroke="white" strokeOpacity={0.8} strokeWidth={1.3} strokeLinejoin="round" />
              <path d="M0 -38.4V-24" stroke="#000" strokeOpacity={0.12} strokeWidth={0.7} />
              <path d="M-9.2 -25.2H9.2" stroke="#000" strokeOpacity={0.35} strokeWidth={1.4} />
            </>
          )}

          {/* neck and head */}
          <rect x={-2.2} y={-45} width={4.4} height={3.5} fill={c.skin} />
          <ellipse cx={-9.4} cy={-50.5} rx={1.6} ry={2.3} fill={c.skin} {...LINE} />
          <ellipse cx={9.4} cy={-50.5} rx={1.6} ry={2.3} fill={c.skin} {...LINE} />
          <circle cy={-51} r={9.6} fill={c.skin} {...LINE} />
          <path d="M4 -58.5q5.5 3 5.3 9.5q-1 6 -5 8.5q3.8 -8 -0.3 -18Z" fill="#000" opacity={0.08} />

          {/* hair, each one's own */}
          {nana ? (
            <path d="M-9.8 -50q-0.8 -6 2.4 -8.4q-0.6 4 1 5.6M9.8 -50q0.8 -6 -2.4 -8.4q0.6 4 -1 5.6" fill={c.hair} stroke={c.hair} strokeWidth={1.8} strokeLinecap="round" />
          ) : who === "samin" ? (
            <path d="M-9.8 -51q-1.4 -12 9.8 -12.2t9.8 12.2q-1.6 -4 -3.6 -5.2q-1 2.4 -3.4 1q-2 2.4 -4.4 0.4q-2.4 2 -4.4 0q-2.2 1.6 -3.8 4Z" fill={c.hair} />
          ) : (
            <path d="M-9.8 -51q0 -12.2 9.8 -12.2t9.8 12.2q-2.2 -5.6 -6.6 -6.6q-6.8 -1.4 -13 6.6Z" fill={c.hair} />
          )}
          {who === "nasib" && (
            <>
              <path d="M-10.2 -56.4q10.2 -10.6 20.4 0Z" fill="#dc2626" {...LINE} />
              <path d="M7 -57.2q6.4 -0.6 9.4 1.4q-4 1.6 -9.4 0.8Z" fill="#b91c1c" {...LINE} />
            </>
          )}

          {/* face */}
          <path d={BROWS[mood][0]} stroke={nana ? "#e5e7eb" : "#1c1410"} strokeWidth={nana ? 1.4 : 1.1} strokeLinecap="round" fill="none" />
          <path d={BROWS[mood][1]} stroke={nana ? "#e5e7eb" : "#1c1410"} strokeWidth={nana ? 1.4 : 1.1} strokeLinecap="round" fill="none" />
          <Eye cx={-3.6} calm={calm} begin={BLINK_AT[who]} />
          <Eye cx={3.6} calm={calm} begin={BLINK_AT[who]} />
          <path d="M0.2 -50.2q1.3 1.8 -0.4 2.4" fill="none" stroke="#000" strokeOpacity={0.3} strokeWidth={0.8} strokeLinecap="round" />
          <ellipse cx={-5.6} cy={-47} rx={1.9} ry={1.1} fill="#f43f5e" opacity={0.22} />
          <ellipse cx={5.6} cy={-47} rx={1.9} ry={1.1} fill="#f43f5e" opacity={0.22} />
          {nana ? (
            <>
              <path d="M-8.2 -48.5q0.6 9 8.2 10.6q7.6 -1.6 8.2 -10.6q-2.6 4.4 -8.2 4.4t-8.2 -4.4Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={0.6} />
              <path d="M-3.8 -46.8q3.8 -2 7.6 0q-3.8 0.8 -7.6 0Z" fill="#e5e7eb" stroke="#cbd5e1" strokeWidth={0.5} />
              <path d={mood === "happy" ? "M-1.8 -45q1.8 1.4 3.6 0" : "M-1.6 -44.8h3.2"} fill="none" stroke="#5b1414" strokeWidth={0.9} strokeLinecap="round" />
            </>
          ) : (
            <Mouth mood={mood} />
          )}

          {/* the right arm, in front */}
          <Limb sx={8.5} sy={-39} ex={ex} ey={ey} hx={hx} hy={hy} sleeve={c.shirt} skin={c.skin} long={nana} />
        </g>
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Things in the scene.

/** A speech bubble with a soft shadow, its tail at (x, y) near a mouth. */
export function Bubble2({ x, y, lines, side = "mid" }: { x: number; y: number; lines: string[]; side?: "left" | "mid" | "right" }) {
  const w = Math.max(...lines.map((l) => l.length)) * 4.9 + 18;
  const h = lines.length * 11 + 10;
  const bx = side === "left" ? x - w + 16 : side === "right" ? x - 16 : x - w / 2;
  const by = y - h - 8;
  const tail = `M${x - 5} ${by + h - 1}Q${x - 1} ${by + h + 4} ${x + 1} ${y}Q${x + 3} ${by + h + 3} ${x + 6} ${by + h - 1}Z`;
  return (
    <g className={POP}>
      <rect x={bx + 1.5} y={by + 2} width={w} height={h} rx={9} fill="#1c1410" opacity={0.15} />
      <path d={tail} fill="white" stroke={OUTLINE} strokeOpacity={0.4} strokeWidth={0.8} />
      <rect x={bx} y={by} width={w} height={h} rx={9} fill="white" stroke={OUTLINE} strokeOpacity={0.4} strokeWidth={0.8} />
      <path d={`M${x - 4.4} ${by + h - 0.6}H${x + 5.4}`} stroke="white" strokeWidth={2} />
      {lines.map((l, i) => (
        <text key={i} x={bx + w / 2} y={by + 14 + i * 11} textAnchor="middle" fontSize={9} fontWeight={700} fill="#1c1410">
          {l}
        </text>
      ))}
    </g>
  );
}

/** A paper chit, a little tilted, with a shadow: Samin's numbers. */
export function Chit({ x, y, text, tilt = -4 }: { x: number; y: number; text: string; tilt?: number }) {
  const w = text.length * 5.6 + 14;
  return (
    <g className={POP}>
      <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
        <rect x={-w / 2 + 1.2} y={-8} width={w} height={18} rx={2} fill="#1c1410" opacity={0.18} />
        <rect x={-w / 2} y={-9.5} width={w} height={18} rx={2} fill="#fffbeb" stroke="#b45309" strokeWidth={1} />
        <path d={`M${-w / 2 + 3} -5.5H${w / 2 - 3}`} stroke="#fca5a5" strokeWidth={0.5} />
        <text y={3.6} textAnchor="middle" fontSize={9.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#92400e">
          {text}
        </text>
      </g>
    </g>
  );
}

/** Samin's khata, open, held at (x, y): a small ruled notebook. */
export function Khata({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-8)`} className="pointer-events-none">
      <rect x={-8} y={-6} width={16} height={11} rx={1} fill="#fffbeb" stroke="#1d4ed8" strokeWidth={0.9} />
      <path d="M0 -6V5M-6.5 -3H-1.5M-6.5 -0.5H-1.5M-6.5 2H-1.5M1.5 -3H6.5M1.5 -0.5H6.5" stroke="#93c5fd" strokeWidth={0.5} />
    </g>
  );
}

/** A honey bee with buzzing wings and a wobble, centred at (x, y). */
export function Bee2({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const calm = useCalm();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <g>
        <Idle calm={calm} type="translate" values="0 0;0 -2.4;0 0.8;0 0" dur={0.7} />
        <ellipse cy={3.4} rx={4} ry={0.9} fill="#000" opacity={0} />
        <g transform="translate(-0.5 -4.4)">
          <g>
            <Idle calm={calm} type="scale" values="1 1;1 0.35;1 1" dur={0.09} />
            <ellipse cx={-1} rx={3.4} ry={2.6} fill="#e0f2fe" stroke="#94a3b8" strokeWidth={0.5} opacity={0.9} />
            <ellipse cx={2.6} cy={-0.2} rx={3} ry={2.2} fill="#e0f2fe" stroke="#94a3b8" strokeWidth={0.5} opacity={0.9} />
          </g>
        </g>
        <ellipse rx={5.4} ry={3.6} fill="#fbbf24" stroke="#78350f" strokeWidth={0.6} />
        <path d="M-2.2 -3.3q-0.8 3.3 0 6.6M1 -3.5q-0.8 3.5 0 7" stroke="#1c1410" strokeWidth={1.4} fill="none" />
        <path d="M-5.4 0l-1.8 0.4" stroke="#1c1410" strokeWidth={0.9} />
        <circle cx={5.3} cy={-0.5} r={2.1} fill="#1c1410" />
        <circle cx={5.9} cy={-1.1} r={0.5} fill="white" />
        <path d="M6.2 -2.4l1.6 -2.4M5.2 -2.6l0.8 -2.6" stroke="#1c1410" strokeWidth={0.5} />
      </g>
    </g>
  );
}

/** Nana's honey box on its bamboo stand, bottom-centre at (x, y), with a bee or two at the door. */
export function HiveBox2({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="pointer-events-none">
      <ellipse cy={0.5} rx={16} ry={2.6} fill="#1c1410" opacity={0.2} />
      <path d="M-10 0v-9M10 0v-9M-11 -5h22" stroke="#a16207" strokeWidth={1.8} strokeLinecap="round" />
      <rect x={-13} y={-25} width={26} height={16} rx={1.2} fill="#d97706" {...LINE} />
      <rect x={-13} y={-25} width={26} height={8} fill="#f59e0b" opacity={0.6} />
      <path d="M-13 -17h26M-6 -25v8M4 -25v8M-2 -17v8M8 -17v8" stroke="#92400e" strokeOpacity={0.5} strokeWidth={0.6} />
      <path d="M-16 -25.5L-13.5 -30H13.5L16 -25.5Z" fill="#78350f" {...LINE} />
      <path d="M-16 -25.5H16" stroke="#451a03" strokeWidth={1} />
      <rect x={-4} y={-12.2} width={8} height={2.2} rx={1} fill="#1c1410" />
      <Bee2 x={9} y={-14} s={0.45} />
    </g>
  );
}

/** A scarecrow the Bengali way: a bamboo cross, an old shirt, and a black clay pot for a head with a face painted in white. */
export function Scarecrow2({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="pointer-events-none">
      <ellipse cy={0.5} rx={9} ry={2} fill="#1c1410" opacity={0.2} />
      <path d="M0 0V-50M-18 -38H18" stroke="#a16207" strokeWidth={2.6} strokeLinecap="round" />
      <path d="M-18 -38l-3 3M-18 -38l-3 -2M-18 -38l-1 4M18 -38l3 3M18 -38l3 -2M18 -38l1 4" stroke="#eab308" strokeWidth={1} />
      <path d="M-9 -41L-16 -37L-15 -34L-8 -36L-8.5 -20H8.5L8 -36L15 -34L16 -37L9 -41Z" fill="#2563eb" {...LINE} />
      <rect x={-5} y={-33} width={5} height={5} fill="#f97316" transform="rotate(8 -2.5 -30.5)" />
      <path d="M-8.5 -21l2 3l2 -3l2 3l2 -3l2 3l2 -3l2 3l2 -3" fill="none" stroke="#eab308" strokeWidth={1} />
      <circle cy={-48} r={7.4} fill="#1f1d1b" {...LINE} />
      <path d="M-4.4 -54.4h8.8" stroke="#44403c" strokeWidth={1.4} />
      <circle cx={-2.6} cy={-49} r={1.3} fill="none" stroke="white" strokeWidth={0.9} />
      <circle cx={2.6} cy={-49} r={1.3} fill="none" stroke="white" strokeWidth={0.9} />
      <path d="M-2.8 -45q2.8 2 5.6 0" fill="none" stroke="white" strokeWidth={0.9} strokeLinecap="round" />
      <path d="M-3 -44.6v1.2M3 -44.6v1.2" stroke="white" strokeWidth={0.6} />
    </g>
  );
}

/** A bamboo fence with nodes and rope ties, posts from x0 to x1, standing on y. */
export function Fence2({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  const posts = Array.from({ length: Math.floor((x1 - x0) / 9) + 1 }, (_, i) => x0 + i * 9);
  return (
    <g className="pointer-events-none">
      <path d={`M${x0 - 4} ${y + 0.5}H${x1 + 4}`} stroke="#1c1410" strokeOpacity={0.2} strokeWidth={3} />
      {posts.map((x, i) => {
        const top = y - 36 - (i % 2) * 3;
        return (
          <g key={x}>
            <path d={`M${x} ${y}V${top}`} stroke="#ca8a04" strokeWidth={3} strokeLinecap="round" />
            <path d={`M${x + 0.8} ${y}V${top}`} stroke="#a16207" strokeWidth={1} />
            <path d={`M${x - 1.5} ${y - 11}h3M${x - 1.5} ${y - 24}h3`} stroke="#854d0e" strokeWidth={0.9} />
          </g>
        );
      })}
      {[27, 14].map((h) => (
        <g key={h}>
          <path d={`M${x0 - 5} ${y - h}H${x1 + 5}`} stroke="#eab308" strokeWidth={2.4} strokeLinecap="round" />
          <path d={`M${x0 - 5} ${y - h + 0.9}H${x1 + 5}`} stroke="#a16207" strokeWidth={0.7} />
          {posts.map((x) => (
            <path key={x} d={`M${x - 1.8} ${y - h - 1.6}l3.6 3.2M${x + 1.8} ${y - h - 1.6}l-3.6 3.2`} stroke="#78350f" strokeWidth={0.6} />
          ))}
        </g>
      ))}
    </g>
  );
}

/** One mustard plant, stem at (x, y), swaying. */
function MustardPlant({ x, y, s, calm, begin }: { x: number; y: number; s: number; calm: boolean; begin: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g>
        <Idle calm={calm} type="rotate" values="-3;3;-3" dur={3.4} begin={begin} />
        <path d="M0 0V-14M0 -8l-4 -3M0 -10l4 -4" stroke="#4d7c0f" strokeWidth={1.1} fill="none" />
        <path d="M0 -4q-5 -1 -6 -5q4 0 6 3Z" fill="#65a30d" />
        {[
          [0, -16],
          [-3, -14],
          [3, -15],
          [-4.6, -11],
          [4.4, -14.8],
          [1.4, -18],
        ].map(([cx, cy]) => (
          <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={1.9} fill="#facc15" stroke="#ca8a04" strokeWidth={0.4} />
        ))}
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// The stage: a mustard field on a winter morning, in three layers.

export function MustardStage({ label, children }: { label: string; children: ReactNode }) {
  const id = useId().replace(/:/g, "");
  const calm = useCalm();
  const rows = [
    [118, 2],
    [121, 2.6],
    [125, 3.4],
    [130, 4.4],
    [136.5, 5.6],
  ];
  const front = Array.from({ length: 22 }, (_, i) => i);
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label={label} className="block h-auto w-full select-none" style={{ fontFamily: "inherit" }}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ecdf2" />
          <stop offset="0.7" stopColor="#dff1fb" />
          <stop offset="1" stopColor="#fdf3d7" />
        </linearGradient>
        <radialGradient id={`${id}sun`}>
          <stop offset="0" stopColor="#fff7d6" stopOpacity={0.95} />
          <stop offset="1" stopColor="#fff7d6" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}aal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b98f" />
          <stop offset="1" stopColor="#b48a5c" />
        </linearGradient>
      </defs>
      <rect width={320} height={180} fill={`url(#${id}sky)`} />
      <circle cx={262} cy={34} r={34} fill={`url(#${id}sun)`} />
      <circle cx={262} cy={34} r={10} fill="#fde68a" />

      {/* clouds, drifting */}
      <g fill="white" opacity={0.85}>
        <Idle calm={calm} type="translate" values="0 0;-18 0;0 0" dur={60} />
        <path d="M40 40q2 -9 12 -8q4 -8 13 -4q8 -3 11 5q7 0 7 7H38q-4 0 2 0Z" />
        <path d="M170 24q2 -7 9 -6q4 -6 10 -3q6 -2 8 4q5 0 5 5h-34q-1 0 2 0Z" opacity={0.8} />
      </g>

      {/* far: the village tree line, a tin-roof house, palms */}
      <path d="M0 116q8 -14 18 -6q6 -12 16 -4q9 -9 18 0q10 -12 20 -2q8 -8 16 0q12 -10 22 0q8 -9 18 -1q10 -12 22 -2q7 -7 16 1q10 -10 20 -1q8 -9 18 0q9 -8 18 0q10 -11 20 -1q8 -8 17 0q9 -8 18 0q7 -5 13 1V120H0Z" fill="#6f9a7a" opacity={0.75} />
      <g opacity={0.8}>
        <rect x={104} y={104} width={20} height={11} fill="#d6b48a" />
        <path d="M101 105l13 -8l13 8Z" fill="#94a3b8" />
        <rect x={111} y={108} width={5} height={7} fill="#78350f" />
        <path d="M232 116V88" stroke="#6b4f33" strokeWidth={1.4} />
        <path d="M232 88q-9 -2 -13 4M232 88q9 -3 13 3M232 88q-3 -7 -9 -8M232 88q4 -7 10 -7M232 88q0 -6 1 -9" stroke="#4d7c4f" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <path d="M60 116V94" stroke="#6b4f33" strokeWidth={1.2} />
        <path d="M60 94q-7 -2 -10 3M60 94q7 -2 10 3M60 94q-2 -6 -7 -6M60 94q3 -6 8 -5" stroke="#4d7c4f" strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>

      {/* middle: mustard rows running to the horizon */}
      <rect y={116} width={320} height={64} fill="#8fb350" />
      {rows.map(([y, h]) => (
        <rect key={y} y={y} width={320} height={h} fill="#facc15" opacity={0.95} />
      ))}
      <rect y={143} width={320} height={4} fill="#fde047" />

      {/* the aal: the raised earth path between fields, where people stand */}
      <path d="M0 146H320V157H0Z" fill={`url(#${id}aal)`} />
      <path d="M0 146H320" stroke="#e8cfa9" strokeWidth={1.2} />

      {children}

      {/* front: mustard plants swaying */}
      {front.map((i) => (
        <MustardPlant key={i} x={i * 15 + (i % 3) * 3 - 4} y={181} s={0.95 + (i % 4) * 0.12} calm={calm} begin={(i % 5) * 0.4} />
      ))}
    </svg>
  );
}
