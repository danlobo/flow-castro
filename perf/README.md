# Performance harness

Drives the real library in real Chrome (DevTools Protocol), not jsdom.

```bash
npm run perf                            # 100, 250, 500 and 1000 nodes
node perf/run.mjs --nodes 1000          # a single size
node perf/run.mjs --nodes 1000 --headful
node perf/run.mjs --out /tmp/base.json  # save a baseline to compare against
node perf/run.mjs --only-check          # correctness probe only, no measurements
```

Opening the built page with `?auto=<n>` (after any run, from `perf/.build/`)
mounts that many nodes on load, for eyeballing the editor instead of measuring it.

What it does, per graph size: bundles `harness.jsx` with esbuild (production
React + the `react-dom/profiling` build, so `<Profiler>` still reports commit
times without dev-mode overhead), serves it on localhost, opens it in Chrome and
runs the scenarios in `harness.jsx`:

| scenario           | what it exercises                                        |
| ------------------ | -------------------------------------------------------- |
| `idle`             | baseline — work done while the user does nothing          |
| `rubberBandSelect` | left-drag over the canvas, one `Screen` re-render / move  |
| `pan`              | middle-drag through react-zoom-pan-pinch                  |
| `zoom`             | 40 wheel steps out and back in                            |
| `dragNode`         | dragging one node (state update per throttled move)       |
| `selectAllAndDrag` | Ctrl+A then a drag — every node moves                     |

Before the scenarios run, a correctness probe checks that the editor still
*works*: that a drag moves the node it grabbed and only that one, that a
right-click opens the node menu, and that typing into a port writes the value
back. A handler wired up wrong is also very fast, so speed alone proves nothing.
It runs before the scenarios on purpose — afterwards the editor carries their
state (a Ctrl+A selection, a panned viewport) and the assertions no longer hold.
`--only-check` runs just the probe, skipping the measurements.

Numbers reported: frame timings from a rAF recorder (fps, avg/p95/max, janked
frames), React commit count and `actualDuration`/`baseDuration` from the
Profiler, renderer cost from CDP `Performance.getMetrics` (script, style recalc,
layout), long tasks, DOM size and JS heap. Raw output lands in `perf/results/`.

Chrome runs headless with `--disable-gpu`, so these are main-thread numbers:
compositing is software and the absolute fps is pessimistic, but the React and
script costs — the part this library controls — are the point.

`actualDuration ≈ baseDuration` in a scenario means memoization bought nothing
there: the whole tree re-rendered.

This box is noisy — mount time alone swings ±15% between identical runs, and the
scenarios that dispatch one event per frame do less work when frames are slow,
so their commit count (and with it the fps) drifts. Compare **medians of three
runs**, and lean on **ms per commit** rather than fps whenever the commit counts
differ between the two sides.
