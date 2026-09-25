"use client";

import { FADE, useScene, type Fixtures } from "@/components/journey/kit";
import { StoryFrame } from "@/components/journey/cast";
import { Bee2, Bubble2, Chit, Khata, Fence2, HiveBox2, MustardStage, Person2, Scarecrow2 } from "@/components/journey/cast-v2";

// PROTOTYPE — Calculus for AI 1.1's opening scene (BoxToFence in
// bee-route-journey.tsx) redrawn with cast-v2.tsx, beat for beat, so the two
// styles can be compared side by side. Not used by any lesson.

type XY = [number, number];

export function BoxToFenceV2() {
  const s = useScene(5, [600, 1500, 2200, 2400, 2400]);
  const k = s.k;
  const bee: XY = k === 0 ? [48, 116] : k === 1 ? [112, 90] : k === 2 ? [152, 72] : [340, 8];
  return (
    <StoryFrame scene={s}>
      <MustardStage label="Nana's honey box in a mustard field. A bee flies straight out past a scarecrow, towards a bamboo fence far away.">
        <Fence2 x0={278} x1={314} y={150} />
        <HiveBox2 x={40} y={150} />
        <Scarecrow2 x={152} y={150} />
        {k >= 1 && k <= 2 && <path d="M50 118Q100 96 152 74" stroke="#d97706" strokeWidth={1.2} strokeDasharray="2 3" fill="none" className={FADE} />}
        <g style={{ transform: `translate(${bee[0]}px, ${bee[1]}px)` }} className="transition-transform duration-[1300ms] ease-in-out motion-reduce:transition-none">
          <Bee2 x={0} y={0} s={1.25} />
        </g>
        <Person2 who="nana" x={76} y={151} arm={k === 3 ? "point" : "down"} mood="happy" />
        <Person2 who="samin" x={k >= 2 ? 198 : 380} y={151} facing={-1} walking={k === 2} arm={k === 2 ? "hold" : "down"} mood={k === 2 ? "happy" : "plain"} />
        {k === 2 && (
          <>
            <Chit x={36} y={108} text="(1, 1)" tilt={-5} />
            <Khata x={180} y={113} />
            <Chit x={152} y={80} text="(3, 5)" tilt={4} />
          </>
        )}
        {k === 3 && <Bubble2 x={80} y={90} side="right" lines={["A water dish where", "it crosses the fence!"]} />}
        <Person2 who="nasib" x={k >= 4 ? 248 : 380} y={151} facing={-1} walking={k === 4} mood="smug" arm={k === 4 ? "wave" : "down"} />
        {k === 4 && <Bubble2 x={246} y={90} side="left" lines={["Easy. Row 9!"]} />}
      </MustardStage>
    </StoryFrame>
  );
}

export const fixtures: Fixtures = {
  BoxToFenceV2: { start: { k: 0 }, bee: { k: 1 }, dots: { k: 2 }, nana: { k: 3 }, nasib: { k: 4 } },
};
