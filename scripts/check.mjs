#!/usr/bin/env node
// One command before calling a change done:
//
//   npm run check             tsc, ESLint on the files git sees as changed, and
//                             an MDX compile of every article
//   npm run check -- --all    ESLint over the whole project instead (slow)
//
// The MDX compile uses the same remark/rehype plugins as next.config, so a
// lesson that fails here would fail in the app too — without a dev server or
// a login to open it.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@mdx-js/mdx";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

const all = process.argv.includes("--all");
const bin = (name) => join("node_modules", ".bin", name);
const run = (label, cmd, args) => {
  console.log(`▸ ${label}`);
  return spawnSync(cmd, args, { stdio: "inherit" }).status === 0;
};
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const results = [["types", run("tsc", bin("tsc"), ["--noEmit", "-p", "."])]];

let files = ["."];
if (!all) {
  const status = spawnSync("git", ["status", "--porcelain", "-uall"], { encoding: "utf8" }).stdout;
  files = status
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).split(" -> ").pop())
    .filter((f) => /\.(tsx?|mjs|js)$/.test(f) && existsSync(f));
}
if (files.length) results.push(["lint", run(`eslint: ${all ? "whole project" : `${files.length} changed file(s)`}`, bin("eslint"), files)]);
else console.log("▸ eslint: no changed files");

const mdx = walk("src/content").filter((f) => f.endsWith(".mdx"));
let bad = 0;
for (const f of mdx) {
  try {
    await compile(readFileSync(f, "utf8"), { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] });
  } catch (e) {
    bad++;
    console.log(`✗ ${f}: ${e.message}`);
  }
}
console.log(`▸ mdx: ${mdx.length - bad}/${mdx.length} compile`);
results.push(["mdx", bad === 0]);

const failed = results.filter(([, ok]) => !ok).map(([name]) => name);
console.log(failed.length ? `✗ check failed: ${failed.join(", ")}` : "✓ check passed");
process.exit(failed.length ? 1 : 0);
