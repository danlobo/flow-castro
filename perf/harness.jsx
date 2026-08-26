import React, { Profiler } from "react";
import { createRoot } from "react-dom/profiling";
import NodeContainer from "../src/NodeContainer.jsx";
import { ThemeProvider } from "../src/ThemeProvider.jsx";
import { nodeTypes, portTypes } from "./nodeDefs.jsx";
import { generateFlow } from "./generateFlow.js";

/* ------------------------------------------------------------------ *
 * React profiler accumulator (react-dom/profiling keeps onRender alive
 * in a production build, so the numbers are not dev-mode inflated).
 * ------------------------------------------------------------------ */
const profile = { commits: 0, actual: 0, base: 0 };

function onRender(id, phase, actualDuration, baseDuration) {
  profile.commits += 1;
  profile.actual += actualDuration;
  profile.base += baseDuration;
}

const resetProfile = () => {
  profile.commits = 0;
  profile.actual = 0;
  profile.base = 0;
};

/* ------------------------------------------------------------------ *
 * Long tasks
 * ------------------------------------------------------------------ */
let longTasks = [];
try {
  new PerformanceObserver((list) => {
    longTasks.push(...list.getEntries().map((e) => e.duration));
  }).observe({ entryTypes: ["longtask"] });
} catch (_) {
  /* longtask unsupported */
}

/* ------------------------------------------------------------------ *
 * Timing helpers
 * ------------------------------------------------------------------ */
const nextFrame = () => new Promise((r) => requestAnimationFrame(r));
const afterPaint = async () => {
  await nextFrame();
  await nextFrame();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pct = (sorted, p) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0;

function summarize(frames, elapsed) {
  const sorted = [...frames].sort((a, b) => a - b);
  const sum = frames.reduce((a, b) => a + b, 0);
  return {
    frames: frames.length,
    fps: elapsed > 0 ? +((frames.length / elapsed) * 1000).toFixed(1) : 0,
    avgFrameMs: frames.length ? +(sum / frames.length).toFixed(2) : 0,
    p50FrameMs: +pct(sorted, 0.5).toFixed(2),
    p95FrameMs: +pct(sorted, 0.95).toFixed(2),
    maxFrameMs: frames.length ? +Math.max(...frames).toFixed(2) : 0,
    /** Frames that missed the 60fps budget. */
    jankFrames: frames.filter((f) => f > 16.7 * 1.5).length,
  };
}

function recorder() {
  const frames = [];
  let last = performance.now();
  let running = true;
  const tick = (t) => {
    if (!running) return;
    frames.push(t - last);
    last = t;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const start = performance.now();
  return {
    stop() {
      running = false;
      // The first delta measures the gap to the recorder start, not a frame
      // produced under load, so it is dropped.
      return { frames: frames.slice(1), elapsed: performance.now() - start };
    },
  };
}

/* ------------------------------------------------------------------ *
 * Input synthesis
 * ------------------------------------------------------------------ */
function mouse(target, type, x, y, init = {}) {
  target.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: 1,
      ...init,
    }),
  );
}

async function dragPath(downTarget, from, to, steps, init = {}) {
  mouse(downTarget, "mousedown", from.x, from.y, init);
  await nextFrame();
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    mouse(document, "mousemove", x, y, init);
    await nextFrame();
  }
  mouse(document, "mouseup", to.x, to.y, { ...init, buttons: 0 });
  await afterPaint();
  // Under load the commit that lands the final position can still be queued,
  // so anything reading the DOM back has to let it settle first.
  await sleep(250);
  await afterPaint();
}

/* ------------------------------------------------------------------ *
 * App
 * ------------------------------------------------------------------ */
function App({ state }) {
  return (
    <ThemeProvider theme="light">
      <NodeContainer
        initialState={state}
        nodeTypes={nodeTypes}
        portTypes={portTypes}
        onChangeState={() => {}}
        debugMode={false}
        viewMode="select"
      />
    </ThemeProvider>
  );
}

const domStats = () => ({
  elements: document.getElementsByTagName("*").length,
  nodeCards: document.querySelectorAll('[id^="card-"]').length,
  svgPaths: document.querySelectorAll("path").length,
  heapMB: performance.memory
    ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1)
    : null,
});

const wrapperEl = () =>
  document.querySelector(".react-transform-wrapper") ||
  document.getElementById("root").firstElementChild;

/* ------------------------------------------------------------------ *
 * Scenarios
 * ------------------------------------------------------------------ */
const scenarios = {
  /** Baseline: nothing happening. Anything above ~0ms/frame here is the
   *  library burning main thread while the user is idle. */
  async idle() {
    const rec = recorder();
    await sleep(1500);
    const { frames, elapsed } = rec.stop();
    return summarize(frames, elapsed);
  },

  /** Rubber-band selection over the canvas: the heaviest React path, since
   *  every throttled mousemove re-renders Screen with all its children. */
  async rubberBandSelect() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const rec = recorder();
    await dragPath(
      wrapperEl(),
      { x: w * 0.15, y: h * 0.15 },
      { x: w * 0.85, y: h * 0.85 },
      60,
      { button: 0, buttons: 1 },
    );
    const { frames, elapsed } = rec.stop();
    return summarize(frames, elapsed);
  },

  /** Middle-button pan through react-zoom-pan-pinch. */
  async pan() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const rec = recorder();
    await dragPath(
      wrapperEl(),
      { x: w * 0.5, y: h * 0.5 },
      { x: w * 0.1, y: h * 0.9 },
      60,
      { button: 1, buttons: 4 },
    );
    const { frames, elapsed } = rec.stop();
    return summarize(frames, elapsed);
  },

  /** Wheel zoom out and back in. */
  async zoom() {
    const el = wrapperEl();
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const rec = recorder();
    for (const delta of [...Array(20).fill(120), ...Array(20).fill(-120)]) {
      el.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          deltaY: delta,
          deltaMode: 0,
        }),
      );
      await nextFrame();
    }
    const { frames, elapsed } = rec.stop();
    return summarize(frames, elapsed);
  },

  /** Dragging a single node: state update per throttled move, so every node
   *  and connector re-renders unless they are memoized. */
  async dragNode() {
    const cards = document.querySelectorAll('[id^="card-"]');
    if (!cards.length) return { skipped: "no node rendered" };

    // A node near the middle of the viewport, so the drag stays on screen.
    let target = cards[0];
    for (const c of cards) {
      const r = c.getBoundingClientRect();
      if (r.top > 0 && r.left > 0 && r.bottom < window.innerHeight && r.right < window.innerWidth) {
        target = c;
        break;
      }
    }
    const r = target.getBoundingClientRect();
    const from = { x: r.left + r.width / 2, y: r.top + 12 };
    const before = target.style.transform;
    const rec = recorder();
    await dragPath(target, from, { x: from.x + 260, y: from.y + 180 }, 60, {
      button: 0,
      buttons: 1,
    });
    const { frames, elapsed } = rec.stop();
    // A handler wired up wrong is also very fast, so every drag reports
    // whether the node it grabbed actually moved.
    return { ...summarize(frames, elapsed), moved: target.style.transform !== before };
  },

  /** Ctrl+A then a drag: worst case, every node moves at once. */
  async selectAllAndDrag() {
    const screen = document.getElementById("root").querySelector("[tabindex]") || document.body;
    screen.focus?.();
    screen.dispatchEvent(
      new KeyboardEvent("keydown", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }),
    );
    await afterPaint();
    return scenarios.dragNode();
  },
};


/* ------------------------------------------------------------------ *
 * Correctness probe - the scenarios above only prove the editor is
 * fast, not that it still works.
 * ------------------------------------------------------------------ */
async function check() {
  const out = {};

  const card = document.querySelector('[id^="card-"]');
  const r = card.getBoundingClientRect();

  // 1. a drag moves the node it grabbed, and only that one
  const others = Array.from(document.querySelectorAll('[id^="card-"]')).slice(1, 6);
  const othersBefore = others.map((c) => c.style.transform);
  const before = card.style.transform;
  await dragPath(
    card,
    { x: r.left + r.width / 2, y: r.top + 12 },
    { x: r.left + r.width / 2 + 120, y: r.top + 12 + 90 },
    12,
    { button: 0, buttons: 1 },
  );
  out.dragMovesNode = card.style.transform !== before;
  out.dragMovesOnlyThatNode = others.every((c, i) => c.style.transform === othersBefore[i]);

  // 2. right-clicking a node opens its menu
  card.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: r.left + 40,
      clientY: r.top + 40,
      button: 2,
    }),
  );
  await afterPaint();
  const menu = document.querySelector("ul");
  out.contextMenuOpens = Boolean(menu && menu.children.length);
  out.contextMenuItems = menu ? menu.textContent.slice(0, 120) : null;
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  await afterPaint();

  // 3. typing into a port writes the value back into the node
  const ta = document.querySelector("textarea");
  if (ta) {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    ).set;
    setter.call(ta, "perf-probe");
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await afterPaint();
    out.portValueWrites = document.querySelector("textarea").value === "perf-probe";
  } else {
    out.portValueWrites = null;
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * Public API driven by the CDP runner
 * ------------------------------------------------------------------ */
let root = null;

window.__perf = {
  scenarios: Object.keys(scenarios),

  async mount(count, options = {}) {
    const { state, stats } = generateFlow({ count, ...options });
    resetProfile();
    longTasks = [];

    const t0 = performance.now();
    root = createRoot(document.getElementById("root"));
    root.render(
      <Profiler id="flow" onRender={onRender}>
        <App state={state} />
      </Profiler>,
    );
    await afterPaint();
    const paintedMs = performance.now() - t0;

    // Let effects (port measuring, connector positioning) settle.
    await sleep(500);
    const settledMs = performance.now() - t0;

    return {
      graph: stats,
      mountToPaintMs: +paintedMs.toFixed(1),
      mountSettledMs: +settledMs.toFixed(1),
      react: {
        commits: profile.commits,
        actualMs: +profile.actual.toFixed(1),
        baseMs: +profile.base.toFixed(1),
      },
      longTasks: longTasks.length,
      longTaskMs: +longTasks.reduce((a, b) => a + b, 0).toFixed(1),
      dom: domStats(),
    };
  },

  check: check,

  async run(name) {
    resetProfile();
    longTasks = [];
    await sleep(200);
    const result = await scenarios[name]();
    return {
      ...result,
      react: {
        commits: profile.commits,
        actualMs: +profile.actual.toFixed(1),
        baseMs: +profile.base.toFixed(1),
      },
      longTasks: longTasks.length,
      longTaskMs: +longTasks.reduce((a, b) => a + b, 0).toFixed(1),
      heapMB: performance.memory
        ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1)
        : null,
    };
  },
};

window.__perfReady = true;

// `?auto=<n>` mounts on load, for eyeballing the editor instead of measuring it.
const auto = new URLSearchParams(location.search).get("auto");
if (auto) window.__perf.mount(parseInt(auto, 10) || 100);
