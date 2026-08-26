#!/usr/bin/env node
/**
 * flow-castro performance harness.
 *
 * Bundles perf/harness.jsx with esbuild (production React + the react-dom
 * profiling build), serves it over localhost, drives it in real Chrome through
 * the DevTools Protocol and reports, per graph size:
 *
 *   - mount cost (time to first paint of the whole flow, React commit time)
 *   - per-interaction frame timings (idle, rubber-band select, pan, zoom,
 *     node drag, select-all + drag)
 *   - renderer-side cost from CDP metrics: script, style recalc, layout
 *   - DOM size and JS heap
 *
 * Usage: node perf/run.mjs [--nodes 100,500,1000] [--headful] [--out file.json]
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import WebSocket from "ws";

const here = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(here, ".build");

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);

const SIZES = arg("nodes", "100,250,500,1000").split(",").map((n) => parseInt(n, 10));
const HEADFUL = flag("headful");
const MOUNT_OPTS = flag("no-connections") ? { connect: false } : {};
const OUT = arg("out", path.join(here, "results", `perf-${Date.now()}.json`));
const CHROME =
  process.env.CHROME_PATH ||
  ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((p) =>
    existsSync(p),
  );

const SCENARIOS = ["idle", "rubberBandSelect", "pan", "zoom", "dragNode", "selectAllAndDrag"];

/* ---------------------------------------------------------------- build */
async function build() {
  await rm(buildDir, { recursive: true, force: true });
  await mkdir(buildDir, { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(here, "harness.jsx")],
    bundle: true,
    minify: true,
    format: "iife",
    target: "chrome120",
    outfile: path.join(buildDir, "bundle.js"),
    define: { "process.env.NODE_ENV": '"production"' },
    loader: { ".js": "jsx", ".jsx": "jsx" },
    logLevel: "warning",
  });
  await writeFile(
    path.join(buildDir, "index.html"),
    await readFile(path.join(here, "index.html"), "utf8"),
  );
}

/* --------------------------------------------------------------- server */
function serve(dir) {
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
  const server = createServer(async (req, res) => {
    const name = (req.url || "/").split("?")[0];
    const file = path.join(dir, name === "/" ? "index.html" : name);
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": types[path.extname(file)] || "text/plain" });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

/* ------------------------------------------------------------------ cdp */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw);
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async eval(expression, awaitPromise = true) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise,
      returnByValue: true,
      timeout: 120000,
    });
    if (r.exceptionDetails) {
      throw new Error(
        r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails),
      );
    }
    return r.result.value;
  }
  async metrics() {
    const { metrics } = await this.send("Performance.getMetrics");
    return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      /* chrome still starting */
    }
    await wait(200);
  }
  throw new Error(`chrome devtools endpoint unreachable: ${url}`);
}

async function launchChrome(url, port) {
  const userDataDir = path.join(buildDir, `profile-${port}`);
  const args = [
    HEADFUL ? "--headless=false" : "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--hide-scrollbars",
    "--window-size=1600,1000",
    "--force-device-scale-factor=1",
    "--enable-precise-memory-info",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-extensions",
    "--no-first-run",
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${port}`,
    url,
  ].filter((a) => a !== "--headless=false");

  const proc = spawn(CHROME, args, { stdio: ["ignore", "ignore", "pipe"] });
  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const page = (await (async () => {
    let list = targets;
    for (let i = 0; i < 60; i++) {
      const hit = list.find((t) => t.type === "page" && t.url.includes("index.html"));
      if (hit) return hit;
      await wait(200);
      list = await fetchJson(`http://127.0.0.1:${port}/json/list`);
    }
    throw new Error("harness page target never appeared");
  })())
  const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
  await new Promise((res, rej) => {
    ws.once("open", res);
    ws.once("error", rej);
  });
  return { proc, cdp: new Cdp(ws), ws };
}

/* ------------------------------------------------------------------ run */
const delta = (before, after) => ({
  taskMs: +((after.TaskDuration - before.TaskDuration) * 1000).toFixed(1),
  scriptMs: +((after.ScriptDuration - before.ScriptDuration) * 1000).toFixed(1),
  styleMs: +((after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000).toFixed(1),
  layoutMs: +((after.LayoutDuration - before.LayoutDuration) * 1000).toFixed(1),
  styleRecalcs: after.RecalcStyleCount - before.RecalcStyleCount,
  layouts: after.LayoutCount - before.LayoutCount,
  domNodes: after.Nodes,
  heapMB: +(after.JSHeapUsedSize / 1048576).toFixed(1),
});

async function runSize(count, port, baseUrl) {
  const { proc, cdp, ws } = await launchChrome(`${baseUrl}/index.html?n=${count}`, port);
  try {
    await cdp.send("Runtime.enable");
    await cdp.send("Performance.enable");

    for (let i = 0; i < 100; i++) {
      if (await cdp.eval("!!window.__perfReady", false)) break;
      await wait(200);
    }

    const m0 = await cdp.metrics();
    const mount = await cdp.eval(
      `window.__perf.mount(${count}, ${JSON.stringify(MOUNT_OPTS)})`,
    );
    const m1 = await cdp.metrics();
    mount.renderer = delta(m0, m1);

    // Runs before the scenarios: afterwards the editor carries their state
    // (a Ctrl+A selection, a panned viewport) and the assertions no longer hold.
    const checks = await cdp.eval("window.__perf.check()");

    const scenarios = {};
    for (const name of (flag("only-check") ? [] : SCENARIOS)) {
      const a = await cdp.metrics();
      scenarios[name] = await cdp.eval(`window.__perf.run(${JSON.stringify(name)})`);
      scenarios[name].renderer = delta(a, await cdp.metrics());
    }
    return { count, mount, scenarios, checks };
  } finally {
    ws.close();
    proc.kill("SIGKILL");
    await wait(300);
  }
}

/* --------------------------------------------------------------- report */
const pad = (v, w) => String(v).padStart(w);
const padr = (v, w) => String(v).padEnd(w);

function report(runs) {
  console.log("\n=== CORRECTNESS ===");
  for (const r of runs) {
    const c = r.checks || {};
    const flags = Object.entries(c)
      .filter(([k]) => k !== "contextMenuItems" && k !== "connectorsRedrawn" && k !== "connectorStartsAtPortPx" && k !== "connectorStartsAtPortMidDragPx" && k !== "connectorLagWhileMovingPx")
      .map(([k, v]) => `${v === true ? "ok" : v === null ? "n/a" : "FAIL"} ${k}`);
    const moved = Object.entries(r.scenarios)
      .filter(([, s]) => "moved" in s)
      .map(([k, s]) => `${s.moved ? "ok" : "FAIL"} ${k}.moved`);
    console.log(padr(r.count, 7) + [...flags, ...moved].join("  ·  ") + `  ·  gap ${c.connectorStartsAtPortPx}px · pausa ${c.connectorStartsAtPortMidDragPx}px · em movimento ${c.connectorLagWhileMovingPx}px`);
  }

  console.log("\n=== MOUNT ===");
  console.log(
    padr("nodes", 7) + pad("paint ms", 10) + pad("settled ms", 12) + pad("react ms", 10) +
      pad("commits", 9) + pad("script ms", 11) + pad("style ms", 10) + pad("layout ms", 11) +
      pad("dom nodes", 11) + pad("heap MB", 9),
  );
  for (const r of runs) {
    console.log(
      padr(r.count, 7) + pad(r.mount.mountToPaintMs, 10) + pad(r.mount.mountSettledMs, 12) +
        pad(r.mount.react.actualMs, 10) + pad(r.mount.react.commits, 9) +
        pad(r.mount.renderer.scriptMs, 11) + pad(r.mount.renderer.styleMs, 10) +
        pad(r.mount.renderer.layoutMs, 11) + pad(r.mount.renderer.domNodes, 11) +
        pad(r.mount.renderer.heapMB, 9),
    );
  }

  for (const name of SCENARIOS) {
    console.log(`\n=== ${name} ===`);
    console.log(
      padr("nodes", 7) + pad("fps", 7) + pad("avg ms", 9) + pad("p95 ms", 9) + pad("max ms", 9) +
        pad("jank", 6) + pad("react ms", 10) + pad("commits", 9) + pad("script ms", 11) +
        pad("style ms", 10) + pad("layout ms", 11) + pad("longtasks", 11),
    );
    for (const r of runs) {
      const s = r.scenarios[name];
      if (!s || s.skipped) {
        console.log(padr(r.count, 7) + "  skipped: " + (s?.skipped ?? "n/a"));
        continue;
      }
      console.log(
        padr(r.count, 7) + pad(s.fps, 7) + pad(s.avgFrameMs, 9) + pad(s.p95FrameMs, 9) +
          pad(s.maxFrameMs, 9) + pad(s.jankFrames, 6) + pad(s.react.actualMs, 10) +
          pad(s.react.commits, 9) + pad(s.renderer.scriptMs, 11) + pad(s.renderer.styleMs, 10) +
          pad(s.renderer.layoutMs, 11) + pad(`${s.longTasks}/${s.longTaskMs}ms`, 11),
      );
    }
  }
}

/* --------------------------------------------------------------- driver */
(async () => {
  if (!CHROME) throw new Error("no chrome binary found; set CHROME_PATH");
  console.log(`chrome: ${CHROME}\nsizes:  ${SIZES.join(", ")}\nbuilding harness...`);
  await build();
  const { server, port: httpPort } = await serve(buildDir);
  const baseUrl = `http://127.0.0.1:${httpPort}`;

  const runs = [];
  let debugPort = 9333;
  for (const count of SIZES) {
    process.stdout.write(`running ${count} nodes... `);
    const t = Date.now();
    runs.push(await runSize(count, debugPort++, baseUrl));
    console.log(`done in ${((Date.now() - t) / 1000).toFixed(1)}s`);
  }

  server.close();
  report(runs);

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    JSON.stringify({ when: new Date().toISOString(), chrome: CHROME, runs }, null, 2),
  );
  console.log(`\njson: ${OUT}`);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
