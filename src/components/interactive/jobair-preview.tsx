"use client";

import { useScene, type Fixtures } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame, Tree } from "@/components/journey/cast";

// PROTOTYPE — জোবায়ের, the newest of the cast, drawn from a photo: he walks
// in, waves, smiles, and meets ফাহিম. Not used by any lesson; it is here so the
// new character can be looked at (npm run shot -- jobair-preview).

export function JobairMeet() {
  const s = useScene(4, [600, 1600, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="জোবায়ের, in glasses and a navy shirt, walks up to ফাহিম, waves and says hello.">
        <Tree x={36} y={150} />
        <Tree x={292} y={150} s={0.8} />
        <Person who="fahim" x={100} y={150} mood={k >= 3 ? "happy" : "plain"} label />
        <Person
          who="jobair"
          x={k >= 1 ? 180 : 360}
          y={150}
          facing={-1}
          walking={k === 1}
          ms={1500}
          mood={k >= 2 ? "happy" : "plain"}
          arm={k === 2 ? "wave" : k === 4 ? "point" : "down"}
          label
        />
        {k === 2 && <Bubble x={180} y={84} side="left" lines={["আসসালামু আলাইকুম.", "আমি জোবায়ের."]} />}
        {k === 3 && <Bubble x={100} y={84} side="right" lines={["ওয়ালাইকুম আসসালাম!"]} />}
        {k === 4 && <Bubble x={180} y={84} side="left" lines={["চলো, শুরু করি."]} />}
      </Stage>
    </StoryFrame>
  );
}

export const fixtures: Fixtures = {
  JobairMeet: { start: { k: 0 }, walk: { k: 1 }, wave: { k: 2 }, reply: { k: 3 }, point: { k: 4 } },
};
