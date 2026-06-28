// Self-check for the pure status join + course visibility rule.
// Run: npx tsx src/lib/articles.test.ts
import assert from "node:assert/strict";
import { isItemVisible, mergeStatus } from "./articles";

const disk = [
  { slug: "intro", title: "Intro", description: "", type: "slides" as const },
  { slug: "lesson-2", title: "Lesson 2", description: "", type: "article" as const },
];

const merged = mergeStatus(disk, [{ slug: "intro", status: "published" }]);

// row present → its status; no row → draft
assert.equal(merged.find((a) => a.slug === "intro")?.status, "published");
assert.equal(merged.find((a) => a.slug === "lesson-2")?.status, "draft");
assert.equal(merged.length, 2);

// Course visibility (status filtered separately — this is only the course gate).
const published = new Set(["c1"]);
assert.equal(isItemVisible([], published), true); // standalone → visible
assert.equal(isItemVisible(["c1"], published), true); // in a published course
assert.equal(isItemVisible(["c2"], published), false); // only in a draft course
assert.equal(isItemVisible(["c2", "c1"], published), true); // multi: one published is enough

console.log("ok");
