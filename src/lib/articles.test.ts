// Self-check for the pure status join. Run: npx tsx src/lib/articles.test.ts
import assert from "node:assert/strict";
import { mergeStatus } from "./articles";

const disk = [
  { slug: "intro", title: "Intro", description: "" },
  { slug: "lesson-2", title: "Lesson 2", description: "" },
];

const merged = mergeStatus(disk, [{ slug: "intro", status: "published" }]);

// row present → its status; no row → draft
assert.equal(merged.find((a) => a.slug === "intro")?.status, "published");
assert.equal(merged.find((a) => a.slug === "lesson-2")?.status, "draft");
assert.equal(merged.length, 2);

console.log("ok");
