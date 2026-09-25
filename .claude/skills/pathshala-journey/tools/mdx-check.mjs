// Compile journeys' MDX the way the app does (remark-math), to catch broken tags,
// bad imports and stray braces before opening the browser. Run from the repo root:
//   node .claude/skills/pathshala-journey/tools/mdx-check.mjs            # every lesson
//   node .claude/skills/pathshala-journey/tools/mdx-check.mjs <file.mdx> # some
// Pair it with `npx tsc --noEmit -p .` and `npx eslint <changed tsx>`.
import { compile } from "@mdx-js/mdx";
import remarkMath from "remark-math";
import fs from "node:fs";
import path from "node:path";

const dir = "src/content/articles/math_for_ai";
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).map((f) => path.join(dir, f));

let bad = 0;
for (const f of files) {
  try {
    await compile(fs.readFileSync(f, "utf8"), { remarkPlugins: [remarkMath] });
  } catch (e) {
    bad++;
    console.log(`FAIL ${f}: ${e.message.split("\n")[0]}`);
  }
}
console.log(bad ? `${bad} of ${files.length} failed` : `all ${files.length} compile`);
process.exit(bad ? 1 : 0);
