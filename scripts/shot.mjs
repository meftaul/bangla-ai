#!/usr/bin/env node
// Screenshots of journey screens, one PNG per named state, with no dev server
// and no login:
//
//   npm run shot -- surprise-journey                  every screen that has fixtures, every state
//   npm run shot -- surprise-journey DiceMany         every state of one screen
//   npm run shot -- surprise-journey DiceMany:hundred CoinArrows:same
//   npm run shot -- dimension-journey TilePour        no fixtures yet: its starting state
//   npm run shot -- surprise-journey --list           the screens and their states
//   flags: --dark  --width=440
//
// States come from the file's `export const fixtures` ({ Screen: { state: seed } }),
// keyed by the names its useSeed() calls use (journey/kit.tsx). Pipeline:
// Tailwind compiles globals.css; jiti loads the real component file (TS, JSX,
// the @/ alias); react-dom/server renders every state; headless Chrome, driven
// over the DevTools protocol with reduced motion on (so entrance animations
// are already finished), photographs each one.
// Output: .shots/<file>/<Screen>--<state>.png

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { homedir, tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Node 20 keeps its WebSocket client behind a flag.
if (typeof WebSocket === "undefined") {
  const r = spawnSync(process.execPath, ["--experimental-websocket", ...process.argv.slice(1)], { stdio: "inherit" });
  process.exit(r.status ?? 1);
}

const ROOT = process.cwd();
const args = process.argv.slice(2);
const dark = args.includes("--dark");
const listOnly = args.includes("--list");
const width = Number(args.find((a) => a.startsWith("--width="))?.split("=")[1] ?? 440);
const [fileArg, ...picks] = args.filter((a) => !a.startsWith("--"));

if (!fileArg) {
  console.log("usage: npm run shot -- <component-file> [Screen[:state] ...] [--dark] [--width=440] [--list]");
  process.exit(1);
}
const file = [fileArg, `src/components/interactive/${fileArg}.tsx`, `src/components/journey/${fileArg}.tsx`].map((p) => resolve(ROOT, p)).find(existsSync);
if (!file) {
  console.error(`✗ no such component file: ${fileArg}`);
  process.exit(1);
}

// ---- load and render ------------------------------------------------------

// Stylesheets imported by components mean nothing on the server.
register(
  "data:text/javascript," +
    encodeURIComponent("export async function load(url, ctx, next) { return url.endsWith('.css') ? { format: 'module', source: '', shortCircuit: true } : next(url, ctx); }"),
);
const { createJiti } = await import("jiti");
const jiti = createJiti(pathToFileURL(join(ROOT, "package.json")).href, { jsx: { runtime: "automatic" }, alias: { "@/": join(ROOT, "src") + "/" } });
const { createElement: h } = await jiti.import("react");
const { renderToStaticMarkup } = await jiti.import("react-dom/server");
const { SeedProvider } = await jiti.import("@/components/journey/kit");
const mod = await jiti.import(file);
const fixtures = mod.fixtures ?? {};
const screens = Object.keys(mod).filter((k) => /^[A-Z]/.test(k) && typeof mod[k] === "function");

if (listOnly) {
  for (const s of screens) console.log(`${s}${fixtures[s] ? `: ${Object.keys(fixtures[s]).join(", ")}` : "  (no fixtures)"}`);
  process.exit(0);
}

const wanted = picks.length ? picks : screens.filter((s) => fixtures[s]);
if (!wanted.length) {
  console.error(`✗ ${basename(file)} exports no fixtures; name the screens to shoot: ${screens.join(", ")}`);
  process.exit(1);
}
const jobs = wanted.flatMap((pick) => {
  const [name, state] = pick.split(":");
  if (!screens.includes(name)) {
    console.error(`✗ ${name} is not a screen in ${basename(file)}`);
    process.exit(1);
  }
  const states = fixtures[name] ?? { start: {} };
  if (state && !states[state]) {
    console.error(`✗ ${name} has no state "${state}" (has: ${Object.keys(states).join(", ")})`);
    process.exit(1);
  }
  return (state ? [state] : Object.keys(states)).map((s) => ({ id: `${name}--${s}`, name, seed: states[s] }));
});

const quiet = console.error;
console.error = (...a) => (String(a[0]).includes("useLayoutEffect") ? undefined : quiet(...a));
const failures = [];
const sections = jobs.map((j) => {
  try {
    return `<section data-shot="${j.id}">${renderToStaticMarkup(h(SeedProvider, { value: j.seed }, h(mod[j.name])))}</section>`;
  } catch (e) {
    failures.push(`${j.id}: ${e.message}`);
    return "";
  }
});
console.error = quiet;

// ---- page ----------------------------------------------------------------

const outDir = join(ROOT, ".shots", basename(file, ".tsx"));
mkdirSync(outDir, { recursive: true });
const postcss = (await import("postcss")).default;
const tailwind = (await import("@tailwindcss/postcss")).default;
const cssFrom = join(ROOT, "src/app/globals.css");
const css = await postcss([tailwind({ base: ROOT })]).process(readFileSync(cssFrom, "utf8"), { from: cssFrom });
writeFileSync(join(outDir, "app.css"), css.css);
const html = join(outDir, "index.html");
writeFileSync(
  html,
  `<!doctype html><html lang="bn" data-theme="${dark ? "dark" : "light"}"><head><meta charset="utf-8"><link rel="stylesheet" href="app.css">
<style>body{margin:0;padding:8px 12px;width:${width}px;background:var(--background,#fff);color:var(--foreground,#111)} section{padding:10px 0 18px}</style>
</head><body class="article">${sections.join("\n")}</body></html>`,
);

// ---- photograph ------------------------------------------------------------

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  for (const c of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    const r = spawnSync("which", [c], { encoding: "utf8" });
    if (r.status === 0) return r.stdout.trim();
  }
  const cache = join(homedir(), ".cache/ms-playwright");
  for (const d of existsSync(cache) ? readdirSync(cache) : []) {
    const p = join(cache, d, "chrome-linux/chrome");
    if (d.startsWith("chromium") && existsSync(p)) return p;
  }
  throw new Error("no Chrome found; set CHROME=/path/to/chrome");
}

/** a minimal DevTools-protocol client over one WebSocket */
function connect(url) {
  return new Promise((resolveConn, rejectConn) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    const waiters = [];
    let id = 0;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.rej(new Error(msg.error.message));
        else p.res(msg.result);
      } else if (msg.method) {
        const i = waiters.findIndex((w) => w.method === msg.method);
        if (i >= 0) waiters.splice(i, 1)[0].res(msg.params);
      }
    };
    ws.onerror = () => rejectConn(new Error(`cannot connect to ${url}`));
    ws.onopen = () =>
      resolveConn({
        send: (method, params = {}) =>
          new Promise((res, rej) => {
            pending.set(++id, { res, rej });
            ws.send(JSON.stringify({ id, method, params }));
          }),
        once: (method) => new Promise((res) => waiters.push({ method, res })),
        close: () => ws.close(),
      });
  });
}

const profile = mkdtempSync(join(tmpdir(), "shot-"));
const chrome = spawn(findChrome(), ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], {
  stdio: ["ignore", "ignore", "pipe"],
});
try {
  const browserWs = await new Promise((res, rej) => {
    let log = "";
    chrome.stderr.on("data", (d) => {
      log += d;
      const m = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) res(m[1]);
    });
    chrome.on("exit", (code) => rej(new Error(`chrome exited (${code})\n${log}`)));
    setTimeout(() => rej(new Error("chrome did not start in 20 s")), 20000);
  });
  const port = new URL(browserWs).port;
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const cdp = await connect(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: width + 24, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-color-scheme", value: dark ? "dark" : "light" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: pathToFileURL(html).href });
  await loaded;
  await cdp.send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => new Promise(r => setTimeout(r, 150)))", awaitPromise: true });
  const { result } = await cdp.send("Runtime.evaluate", {
    expression: `JSON.stringify([...document.querySelectorAll("section[data-shot]")].map(s => { const r = s.getBoundingClientRect(); return { id: s.dataset.shot, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }))`,
    returnByValue: true,
  });
  // A section taller than the window captured blank, even with captureBeyondViewport:
  // make the window as tall as the page before photographing.
  const rects = JSON.parse(result.value);
  const pageH = Math.ceil(Math.max(900, ...rects.map((r) => r.y + r.h)) + 20);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: width + 24, height: pageH, deviceScaleFactor: 1, mobile: false });
  for (const r of rects) {
    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "png",
      clip: { x: r.x, y: r.y, width: r.w, height: Math.ceil(r.h), scale: 1 },
      captureBeyondViewport: true,
    });
    const out = join(outDir, `${r.id}${dark ? "--dark" : ""}.png`);
    writeFileSync(out, Buffer.from(data, "base64"));
    console.log(`✓ ${out.slice(ROOT.length + 1)}  (${Math.round(r.w)}×${Math.ceil(r.h)})`);
  }
  cdp.close();
} finally {
  const exited = new Promise((r) => (chrome.exitCode !== null ? r() : chrome.once("exit", r)));
  chrome.kill();
  await Promise.race([exited, new Promise((r) => setTimeout(r, 3000))]);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    // Chrome can still hold a file in its throwaway profile; the OS clears tmp.
  }
}

for (const f of failures) console.error(`✗ render failed: ${f}`);
process.exit(failures.length ? 1 : 0);
