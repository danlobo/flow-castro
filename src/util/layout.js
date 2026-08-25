/**
 * Layered (Sugiyama) auto-layout for flow-castro graphs.
 *
 * No external dependencies. The phases are the classic ones:
 *   1. cycle breaking (DFS)   - back edges (loops) are reversed for layering
 *   2. layer assignment       - longest path from the sources + a pull-right pass
 *   3. dummy vertices         - edges spanning more than one layer get split
 *   4. crossing minimization  - median heuristic with down/up sweeps
 *   5. coordinate assignment  - priority method, dummies pinned so that long
 *                               edges come out straight
 *
 * The graph is read straight from the editor state:
 *   state.nodes[id].connections.outputs = [{ name, node, port }]
 * where `name` is the source port and `node` / `port` identify the target.
 */

const DEFAULT_OPTIONS = {
  /** Horizontal gap between two layers (columns). */
  layerSpacing: 120,
  /** Vertical gap between two nodes of the same layer. */
  nodeSpacing: 60,
  /** Vertical gap between two disconnected components. */
  componentSpacing: 120,
  /** Used when a node was never rendered and has no `size`. */
  defaultNodeWidth: 300,
  defaultNodeHeight: 150,
  /** Sweeps of the crossing minimization / coordinate refinement. */
  iterations: 8,
  /**
   * What gets lined up when a node meets its neighbours: "top" and "center"
   * line the node boxes up, "port" lines the connectors up. See alignAnchor.
   */
  alignment: "top",
  /** Round the resulting positions to a grid. 0 disables it. */
  gridSize: 0,
  /** Only lay out these node ids (e.g. the current selection). */
  only: null,
  /** Anchor the result's top-left corner here. Defaults to the original one. */
  origin: null,
  /** Write bend points into connection.waypoints. */
  emitWaypoints: true,
  /**
   * Measured port offsets, so that edges line up with the actual ports instead
   * of the node center:
   *   { [nodeId]: { outputs: { [port]: dy }, inputs: { [port]: dy } } }
   * `dy` is the distance from the node's top edge, in flow units.
   */
  portOffsets: null,
};

const DUMMY_PRIORITY = Number.MAX_SAFE_INTEGER;
const STRAIGHT_TOLERANCE = 8;
// ASCII unit separator: cannot show up in a node id or a port name.
const EDGE_KEY_SEPARATOR = "\u001f";

/**
 * Lays the flow out and returns a new state. The input is never mutated.
 * @param {Object} state - Flow state ({ nodes: { [id]: node } })
 * @param {Object} [options] - See DEFAULT_OPTIONS
 * @returns {Object} A new state with updated positions (and waypoints)
 */
export function layoutFlow(state, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const allNodes = state?.nodes ?? {};

  const requested =
    opts.only && opts.only.length ? opts.only : Object.keys(allNodes);
  const ids = requested.filter((id) => allNodes[id]);

  if (ids.length < 2) return state;

  const edges = collectEdges(allNodes, new Set(ids));
  const components = weakComponents(ids, edges).filter(
    (component) => component.edges.length > 0,
  );

  if (!components.length) return state;

  const placements = new Map();
  const bends = new Map();

  let cursorY = 0;
  let bounds = null;

  for (const component of components) {
    const result = layoutComponent(component, allNodes, opts);
    const offsetY = cursorY - result.bounds.minY;

    for (const [id, pos] of result.positions) {
      placements.set(id, { x: pos.x, y: pos.y + offsetY });
    }
    for (const [key, points] of result.bends) {
      bends.set(
        key,
        points.map((point) => ({ x: point.x, y: point.y + offsetY })),
      );
    }

    const box = {
      minX: result.bounds.minX,
      minY: result.bounds.minY + offsetY,
      maxX: result.bounds.maxX,
      maxY: result.bounds.maxY + offsetY,
    };
    bounds = bounds ? mergeBounds(bounds, box) : box;

    cursorY = box.maxY + opts.componentSpacing;
  }

  const anchor = opts.origin ?? originalTopLeft(allNodes, placements);
  const dx = anchor.x - bounds.minX;
  const dy = anchor.y - bounds.minY;

  const snap = (value) =>
    opts.gridSize > 0
      ? Math.round(value / opts.gridSize) * opts.gridSize
      : Math.round(value);

  const nodes = { ...allNodes };

  for (const [id, pos] of placements) {
    nodes[id] = {
      ...nodes[id],
      position: { x: snap(pos.x + dx), y: snap(pos.y + dy) },
    };
  }

  if (opts.emitWaypoints) {
    for (const id of placements.keys()) {
      const outputs = nodes[id].connections?.outputs;
      if (!outputs?.length) continue;

      nodes[id] = {
        ...nodes[id],
        connections: {
          ...nodes[id].connections,
          outputs: outputs.map((conn) => {
            const key = edgeKey(id, conn.name, conn.node, conn.port);
            if (!bends.has(key)) return conn;

            const points = bends.get(key);

            if (!points.length) {
              const { waypoints, ...rest } = conn;
              return rest;
            }

            return {
              ...conn,
              waypoints: points.map((point) => ({
                x: snap(point.x + dx),
                y: snap(point.y + dy),
              })),
            };
          }),
        },
      };
    }
  }

  return { ...state, nodes };
}

/* -------------------------------------------------------------------------
 * Graph extraction
 * ---------------------------------------------------------------------- */

function edgeKey(from, fromPort, to, toPort) {
  return [from, fromPort, to, toPort].join(EDGE_KEY_SEPARATOR);
}

function collectEdges(nodes, inScope) {
  const edges = [];
  const seen = new Set();

  for (const id of inScope) {
    for (const conn of nodes[id]?.connections?.outputs ?? []) {
      if (!conn?.node || !inScope.has(conn.node)) continue;
      if (conn.node === id) continue; // self loop: nothing to route

      const key = edgeKey(id, conn.name, conn.node, conn.port);
      if (seen.has(key)) continue;
      seen.add(key);

      edges.push({
        key,
        from: id,
        to: conn.node,
        origFrom: id,
        origTo: conn.node,
        fromPort: conn.name,
        toPort: conn.port,
        reversed: false,
      });
    }
  }

  return edges;
}

function weakComponents(ids, edges) {
  const parent = new Map(ids.map((id) => [id, id]));

  const find = (id) => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root);
    while (parent.get(id) !== root) {
      const next = parent.get(id);
      parent.set(id, root);
      id = next;
    }
    return root;
  };

  for (const edge of edges) {
    const left = find(edge.from);
    const right = find(edge.to);
    if (left !== right) parent.set(left, right);
  }

  const groups = new Map();

  for (const id of ids) {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, { ids: [], edges: [] });
    groups.get(root).ids.push(id);
  }
  for (const edge of edges) groups.get(find(edge.from)).edges.push(edge);

  return [...groups.values()];
}

/* -------------------------------------------------------------------------
 * Phase 1 - cycle breaking (DFS)
 * ---------------------------------------------------------------------- */

function breakCycles(ids, edges, nodes) {
  const outgoing = new Map(ids.map((id) => [id, []]));
  for (const edge of edges) outgoing.get(edge.from).push(edge);

  const indegree = new Map(ids.map((id) => [id, 0]));
  for (const edge of edges) indegree.set(edge.to, indegree.get(edge.to) + 1);

  // Starting from the natural entry points makes the edge that gets reversed
  // the one that also reads as "going back" on screen.
  const roots = ids
    .filter((id) => indegree.get(id) === 0 || nodes[id]?.root)
    .sort((a, b) => (nodes[b]?.root ? 1 : 0) - (nodes[a]?.root ? 1 : 0));

  const UNVISITED = 0;
  const ON_STACK = 1;
  const DONE = 2;
  const mark = new Map(ids.map((id) => [id, UNVISITED]));

  const visit = (start) => {
    const stack = [{ id: start, cursor: 0 }];
    mark.set(start, ON_STACK);

    while (stack.length) {
      const frame = stack[stack.length - 1];
      const edgesOut = outgoing.get(frame.id);

      if (frame.cursor >= edgesOut.length) {
        mark.set(frame.id, DONE);
        stack.pop();
        continue;
      }

      const edge = edgesOut[frame.cursor++];
      const status = mark.get(edge.to);

      if (status === ON_STACK) {
        edge.reversed = true;
        const target = edge.to;
        edge.to = edge.from;
        edge.from = target;
      } else if (status === UNVISITED) {
        mark.set(edge.to, ON_STACK);
        stack.push({ id: edge.to, cursor: 0 });
      }
    }
  };

  for (const id of roots) if (mark.get(id) === UNVISITED) visit(id);
  for (const id of ids) if (mark.get(id) === UNVISITED) visit(id);

  // Reversing a two-node cycle can collapse an edge onto itself.
  return edges.filter((edge) => edge.from !== edge.to);
}

/* -------------------------------------------------------------------------
 * Phase 2 - layer assignment
 * ---------------------------------------------------------------------- */

function assignLayers(ids, edges, nodes) {
  const succ = new Map(ids.map((id) => [id, []]));
  const pred = new Map(ids.map((id) => [id, []]));

  for (const edge of edges) {
    succ.get(edge.from).push(edge.to);
    pred.get(edge.to).push(edge.from);
  }

  const order = topologicalOrder(ids, succ, pred);
  const layer = new Map(ids.map((id) => [id, 0]));

  for (const id of order) {
    for (const next of succ.get(id)) {
      layer.set(next, Math.max(layer.get(next), layer.get(id) + 1));
    }
  }

  // Longest path alone leaves a node glued to the left edge when its only
  // consumer sits deep in the flow, dragging a long edge across the diagram.
  // Slide each node to the side that shortens the total edge length: moving it
  // right by d costs d * (indegree - outdegree), so it only pays off when the
  // node has more outputs than inputs (and vice-versa for the left). Nodes with
  // balanced degrees stay put, which is what keeps siblings in one column.
  for (let round = 0; round < ids.length; round++) {
    let moved = false;

    for (const id of order) {
      if (nodes[id]?.root) continue; // entry points belong on the left

      const nexts = succ.get(id);
      const prevs = pred.get(id);
      const current = layer.get(id);

      if (nexts.length > prevs.length && nexts.length) {
        const limit = Math.min(...nexts.map((next) => layer.get(next))) - 1;
        if (limit > current) {
          layer.set(id, limit);
          moved = true;
        }
      } else if (prevs.length > nexts.length && prevs.length) {
        const limit = Math.max(...prevs.map((prev) => layer.get(prev))) + 1;
        if (limit < current) {
          layer.set(id, limit);
          moved = true;
        }
      }
    }

    if (!moved) break;
  }

  return normalizeLayers(ids, layer);
}

/** Drops the layers that ended up empty so there are no blank columns. */
function normalizeLayers(ids, layer) {
  const used = [...new Set(ids.map((id) => layer.get(id)))].sort(
    (a, b) => a - b,
  );
  const remap = new Map(used.map((value, index) => [value, index]));

  return new Map(ids.map((id) => [id, remap.get(layer.get(id))]));
}

function topologicalOrder(ids, succ, pred) {
  const remaining = new Map(ids.map((id) => [id, pred.get(id).length]));
  const queue = ids.filter((id) => remaining.get(id) === 0);
  const order = [];

  while (queue.length) {
    const id = queue.shift();
    order.push(id);

    for (const next of succ.get(id)) {
      remaining.set(next, remaining.get(next) - 1);
      if (remaining.get(next) === 0) queue.push(next);
    }
  }

  // Defensive: cycle breaking should have made this unreachable.
  if (order.length < ids.length) {
    const placed = new Set(order);
    for (const id of ids) if (!placed.has(id)) order.push(id);
  }

  return order;
}

/* -------------------------------------------------------------------------
 * Phase 3 - dummy vertices
 * ---------------------------------------------------------------------- */

function buildLayers(ids, edges, layerOf, nodes, opts) {
  const layers = [];
  const vertexOf = new Map();

  const put = (vertex) => {
    while (layers.length <= vertex.layer) layers.push([]);
    vertex.order = layers[vertex.layer].length;
    layers[vertex.layer].push(vertex);
    return vertex;
  };

  for (const id of ids) {
    const node = nodes[id];
    vertexOf.set(
      id,
      put({
        id,
        dummy: false,
        layer: layerOf.get(id),
        w: node?.size?.width ?? opts.defaultNodeWidth,
        h: node?.size?.height ?? opts.defaultNodeHeight,
        x: 0,
        y: 0,
      }),
    );
  }

  const links = [];

  for (const edge of edges) {
    // Back edges get their own lane below the diagram (see routeBackEdge), so
    // they take no room in the layers and don't skew the median heuristic.
    if (edge.reversed) {
      edge.chain = null;
      continue;
    }

    const start = vertexOf.get(edge.from);
    const end = vertexOf.get(edge.to);
    const chain = [start];

    for (let l = start.layer + 1; l < end.layer; l++) {
      chain.push(
        put({ id: null, dummy: true, layer: l, w: 0, h: 0, x: 0, y: 0 }),
      );
    }
    chain.push(end);

    edge.chain = chain;

    for (let i = 0; i < chain.length - 1; i++) {
      links.push({
        u: chain[i],
        v: chain[i + 1],
        edge,
        first: i === 0,
        last: i === chain.length - 2,
      });
    }
  }

  return { layers, links, vertexOf };
}

/* -------------------------------------------------------------------------
 * Phase 4 - crossing minimization (median heuristic)
 * ---------------------------------------------------------------------- */

/**
 * Visual rank of each output port, so that the edges leaving a node keep the
 * same top-to-bottom order as its ports. This is what stops option 3 of a menu
 * from being routed above option 1.
 */
function buildPortRanks(ids, nodes, opts) {
  const ranks = new Map();

  for (const id of ids) {
    const measured = opts.portOffsets?.[id]?.outputs;
    const names = measured
      ? Object.keys(measured).sort((a, b) => measured[a] - measured[b])
      : (nodes[id]?.connections?.outputs ?? []).map((conn) => conn.name);

    const unique = [...new Set(names)];
    if (unique.length < 2) continue;

    ranks.set(id, {
      count: unique.length,
      index: new Map(unique.map((name, i) => [name, i])),
    });
  }

  return ranks;
}

/** Offset in (-0.5, 0.5) that separates the children of a same parent. */
function portFraction(link, portRanks) {
  if (!link.first || link.u.dummy) return 0;
  if (link.u.id !== link.edge.origFrom) return 0; // reversed edge

  const ranks = portRanks.get(link.u.id);
  if (!ranks) return 0;

  const rank = ranks.index.get(link.edge.fromPort);
  if (rank == null) return 0;

  return (rank + 1) / (ranks.count + 1) - 0.5;
}

function minimizeCrossings(layers, links, portRanks, iterations) {
  const incoming = groupBy(links, (link) => link.v);
  const outgoing = groupBy(links, (link) => link.u);

  const reindex = (layer) => layer.forEach((vertex, i) => (vertex.order = i));

  const sweep = (down) => {
    const range = down
      ? [...layers.keys()].slice(1)
      : [...layers.keys()].slice(0, -1).reverse();

    for (const index of range) {
      const layer = layers[index];
      const medians = new Map();

      for (const vertex of layer) {
        const related = (down ? incoming : outgoing).get(vertex) ?? [];

        // The port fraction only makes sense going down: two children of the
        // same parent share its order and need the ports to break the tie.
        const values = related.map((link) =>
          down ? link.u.order + portFraction(link, portRanks) : link.v.order,
        );

        medians.set(vertex, median(values));
      }

      const sorted = layer
        .filter((vertex) => medians.get(vertex) != null)
        .sort((a, b) => medians.get(a) - medians.get(b) || a.order - b.order);

      // Vertices with no neighbour on the reference layer keep their slot.
      let cursor = 0;
      const next = layer.map((vertex) =>
        medians.get(vertex) == null ? vertex : sorted[cursor++],
      );

      layers[index] = next;
      reindex(next);
    }
  };

  layers.forEach(reindex);

  const score = () =>
    countCrossings(links) + countPortInversions(links, portRanks);

  let best = layers.map((layer) => [...layer]);
  let bestScore = score();

  for (let i = 0; i < iterations && bestScore > 0; i++) {
    // Ends on a down sweep, the one that enforces the port order.
    sweep(i % 2 === 1);

    const current = score();
    if (current < bestScore) {
      bestScore = current;
      best = layers.map((layer) => [...layer]);
    }
  }

  for (let i = 0; i < layers.length; i++) layers[i] = best[i];
  layers.forEach(reindex);
}

function countCrossings(links) {
  const byLayer = groupBy(links, (link) => link.u.layer);
  let total = 0;

  for (const group of byLayer.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if ((a.u.order - b.u.order) * (a.v.order - b.v.order) < 0) total++;
      }
    }
  }

  return total;
}

/** Children of a same node listed in a different order than its ports. */
function countPortInversions(links, portRanks) {
  const byParent = groupBy(links, (link) =>
    link.first && !link.u.dummy ? link.u : null,
  );
  byParent.delete(null);

  let total = 0;

  for (const [parent, group] of byParent) {
    const ranks = portRanks.get(parent.id);
    if (!ranks) continue;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = ranks.index.get(group[i].edge.fromPort);
        const b = ranks.index.get(group[j].edge.fromPort);
        if (a == null || b == null || a === b) continue;

        if ((a - b) * (group[i].v.order - group[j].v.order) < 0) total++;
      }
    }
  }

  return total;
}

/* -------------------------------------------------------------------------
 * Phase 5 - coordinate assignment (priority method)
 * ---------------------------------------------------------------------- */

function assignCoordinates(layers, links, opts) {
  const incoming = groupBy(links, (link) => link.v);
  const outgoing = groupBy(links, (link) => link.u);

  // Initial stacking, centered, respecting the order found in phase 4.
  for (const layer of layers) {
    let cursor = 0;
    for (const vertex of layer) {
      vertex.y = cursor + vertex.h / 2;
      cursor += vertex.h + opts.nodeSpacing;
    }

    const shift = (cursor - opts.nodeSpacing) / 2;
    for (const vertex of layer) vertex.y -= shift;
  }

  const pass = (down) => {
    const range = down
      ? [...layers.keys()].slice(1)
      : [...layers.keys()].slice(0, -1).reverse();

    for (const index of range) {
      const layer = layers[index];

      const priorities = layer.map((vertex) => {
        if (vertex.dummy) return DUMMY_PRIORITY;
        return ((down ? incoming : outgoing).get(vertex) ?? []).length;
      });

      const targets = layer.map((vertex) => {
        const related = (down ? incoming : outgoing).get(vertex) ?? [];
        if (!related.length) return null;

        // Move to where the neighbours are, corrected by where this vertex is
        // measured from - see alignAnchor for what "where" means here.
        const neighbours = related.map((link) =>
          linkAnchor(link, down ? "u" : "v", opts),
        );
        const own = related.map((link) =>
          linkAnchor(link, down ? "v" : "u", opts),
        );

        return median(neighbours) - (median(own) - vertex.y);
      });

      const order = [...layer.keys()]
        .filter((i) => targets[i] != null)
        .sort((a, b) => priorities[b] - priorities[a]);

      for (const i of order) {
        const delta = targets[i] - layer[i].y;
        if (Math.abs(delta) < 0.5) continue;
        moveVertex(layer, priorities, i, delta, opts.nodeSpacing);
      }
    }
  };

  // Down and up sweeps can settle into a two-cycle, so the result would depend
  // on which one happened to run last. Keep the best one instead.
  let best = snapshot(layers);
  let bestScore = straightness(links, opts);

  for (let i = 0; i < opts.iterations; i++) {
    pass(i % 2 === 0);

    const score = straightness(links, opts);
    if (score < bestScore) {
      bestScore = score;
      best = snapshot(layers);
    }
  }

  restore(layers, best);
}

/**
 * How far the two ends of each edge are from lining up. Segments of a long
 * edge count double, so keeping those straight wins over nudging a node.
 * Scored with the same anchors the passes aim at, otherwise picking the best
 * snapshot would fight the chosen alignment.
 */
function straightness(links, opts) {
  let total = 0;

  for (const link of links) {
    const weight = link.u.dummy || link.v.dummy ? 2 : 1;
    const from = linkAnchor(link, "u", opts);
    const to = linkAnchor(link, "v", opts);

    total += Math.abs(from - to) * weight;
  }

  return total;
}

function snapshot(layers) {
  return layers.map((layer) => layer.map((vertex) => vertex.y));
}

function restore(layers, values) {
  layers.forEach((layer, index) =>
    layer.forEach((vertex, i) => (vertex.y = values[index][i])),
  );
}

/**
 * What a vertex is measured from when it lines up with its neighbours.
 *
 * "port" lines the connectors up, which makes the edge perfectly horizontal -
 * but two nodes of different heights then have their boxes staggered by
 * dy_out(source) - dy_in(target). With cards this tall it is the row of headers
 * that reads as the structure, and a sloping bezier barely reads at all, so
 * "top" lines the boxes up instead and lets the edge slope.
 */
function alignAnchor(vertex, edge, mode, portOffsets) {
  if (vertex.dummy) return vertex.y;

  switch (mode) {
    case "port":
      return portAnchor(vertex, edge, portOffsets);
    case "center":
      return vertex.y;
    default:
      return vertex.y - vertex.h / 2;
  }
}

/**
 * Anchor of one end of a link. A dummy is a point on the edge itself, so a
 * segment touching one always follows the ports, whatever the nodes align on -
 * otherwise the bend points of a long edge would miss the ports they join.
 */
function linkAnchor(link, end, opts) {
  const mode = link.u.dummy || link.v.dummy ? "port" : opts.alignment;
  const vertex = end === "u" ? link.u : link.v;

  return alignAnchor(vertex, link.edge, mode, opts.portOffsets);
}

/**
 * Absolute y of the port that `edge` uses on `vertex`. Falls back to the
 * vertex center when there is no measurement for it.
 */
function portAnchor(vertex, edge, portOffsets) {
  if (vertex.dummy || !portOffsets) return vertex.y;

  const bucket = portOffsets[vertex.id];
  const dy =
    vertex.id === edge.origFrom
      ? bucket?.outputs?.[edge.fromPort]
      : bucket?.inputs?.[edge.toPort];

  return dy == null ? vertex.y : vertex.y - vertex.h / 2 + dy;
}

/**
 * Moves layer[i] by `delta`, pushing lower priority neighbours out of the way
 * and stopping at the higher priority ones. Returns how much it really moved.
 */
function moveVertex(layer, priorities, i, delta, gap) {
  const vertex = layer[i];

  if (delta > 0 && i + 1 < layer.length) {
    const next = layer[i + 1];
    const slack = Math.max(
      0,
      next.y - next.h / 2 - (vertex.y + vertex.h / 2) - gap,
    );

    if (delta > slack) {
      if (priorities[i + 1] > priorities[i]) {
        delta = slack;
      } else {
        const moved = moveVertex(layer, priorities, i + 1, delta - slack, gap);
        delta = Math.min(delta, slack + moved);
      }
    }
  } else if (delta < 0 && i - 1 >= 0) {
    const prev = layer[i - 1];
    const slack = Math.max(
      0,
      vertex.y - vertex.h / 2 - (prev.y + prev.h / 2) - gap,
    );

    if (-delta > slack) {
      if (priorities[i - 1] > priorities[i]) {
        delta = -slack;
      } else {
        const moved = moveVertex(layer, priorities, i - 1, delta + slack, gap);
        delta = Math.max(delta, -slack + moved);
      }
    }
  }

  vertex.y += delta;
  return delta;
}

/* -------------------------------------------------------------------------
 * Assembly
 * ---------------------------------------------------------------------- */

function layoutComponent(component, nodes, opts) {
  const { ids } = component;
  const edges = breakCycles(ids, component.edges, nodes);
  const layerOf = assignLayers(ids, edges, nodes);
  const { layers, links, vertexOf } = buildLayers(
    ids,
    edges,
    layerOf,
    nodes,
    opts,
  );

  const portRanks = buildPortRanks(ids, nodes, opts);
  minimizeCrossings(layers, links, portRanks, opts.iterations);
  assignCoordinates(layers, links, opts);

  // Layer index -> x. A column is as wide as its widest node.
  let cursorX = 0;
  for (const layer of layers) {
    const width = Math.max(0, ...layer.map((vertex) => vertex.w));

    for (const vertex of layer) {
      vertex.x = vertex.dummy ? cursorX + width / 2 : cursorX;
      vertex.columnLeft = cursorX;
      vertex.columnRight = cursorX + width;
    }

    cursorX += width + opts.layerSpacing;
  }

  const positions = new Map();
  let bounds = null;

  for (const layer of layers) {
    for (const vertex of layer) {
      if (vertex.dummy) continue;

      const pos = { x: vertex.x, y: vertex.y - vertex.h / 2 };
      positions.set(vertex.id, pos);

      bounds = mergeBounds(bounds, {
        minX: pos.x,
        minY: pos.y,
        maxX: pos.x + vertex.w,
        maxY: pos.y + vertex.h,
      });
    }
  }

  bounds = bounds ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  if (!opts.emitWaypoints) return { positions, bends: new Map(), bounds };

  const bends = collectBends(edges, vertexOf, opts);
  const lanes = routeBackEdges(edges, vertexOf, opts, bounds.maxY);

  for (const [key, points] of lanes) {
    bends.set(key, points);
    for (const point of points) {
      bounds = mergeBounds(bounds, {
        minX: point.x,
        minY: point.y,
        maxX: point.x,
        maxY: point.y,
      });
    }
  }

  return { positions, bends, bounds };
}

/**
 * Routes every back edge through its own horizontal lane under the diagram.
 * Threading them between the columns would drag the line back over the nodes
 * they come from; a lane keeps a loop readable and never collides.
 */
function routeBackEdges(edges, vertexOf, opts, contentBottom) {
  const lanes = new Map();

  const backEdges = edges
    .filter((edge) => edge.reversed)
    .map((edge) => ({
      edge,
      source: vertexOf.get(edge.origFrom),
      target: vertexOf.get(edge.origTo),
    }))
    .filter(({ source, target }) => source && target);

  // Widest loop on the lowest lane, so nested loops nest instead of crossing.
  backEdges.sort((a, b) => b.source.x - b.target.x - (a.source.x - a.target.x));

  backEdges.forEach(({ edge, source, target }, index) => {
    const laneY = contentBottom + opts.nodeSpacing * (index + 1);
    const detour = opts.layerSpacing / 2;

    lanes.set(edge.key, [
      { x: source.x + source.w + detour, y: laneY },
      { x: target.x - detour, y: laneY },
    ]);
  });

  return lanes;
}

/**
 * Turns each dummy chain into bend points, dropping the ones a straight line
 * already covers so we don't litter the flow with useless waypoints.
 */
function collectBends(edges, vertexOf, opts) {
  const bends = new Map();

  for (const edge of edges) {
    const inner = (edge.chain ?? []).slice(1, -1);

    // Set either way: a stale manual waypoint would fight the new layout.
    if (!inner.length) {
      bends.set(edge.key, []);
      continue;
    }

    const source = vertexOf.get(edge.origFrom);
    const target = vertexOf.get(edge.origTo);

    const start = {
      x: source.x + source.w,
      y: portAnchor(source, edge, opts.portOffsets),
    };
    const end = {
      x: target.x,
      y: portAnchor(target, edge, opts.portOffsets),
    };

    // Two bend points per dummy, one on each side of the column it crosses,
    // both at the lane height. A single point in the middle of the column
    // would force one of the two segments to climb while flying over the
    // nodes; with these the climbing happens in the gaps and the edge is flat
    // for the whole passage.
    const detour = opts.layerSpacing / 2;
    const points = dropRepeats(
      inner.flatMap((vertex) => [
        { x: vertex.columnLeft - detour, y: vertex.y },
        { x: vertex.columnRight + detour, y: vertex.y },
      ]),
    );

    const straight = points.every(
      (point) =>
        Math.abs(point.y - interpolateY(start, end, point.x)) <
        STRAIGHT_TOLERANCE,
    );

    bends.set(edge.key, straight ? [] : points);
  }

  return bends;
}

/**
 * Drops points that repeat the previous one. Two dummies in a row share the gap
 * between their columns, so they would each contribute the very same point.
 */
function dropRepeats(points) {
  return points.filter((point, index) => {
    const previous = points[index - 1];

    return (
      !previous ||
      Math.abs(previous.x - point.x) > 1 ||
      Math.abs(previous.y - point.y) > 1
    );
  });
}

function interpolateY(a, b, x) {
  if (b.x === a.x) return (a.y + b.y) / 2;
  return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
}

/* -------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------- */

function groupBy(items, keyOf) {
  const groups = new Map();

  for (const item of items) {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  return groups;
}

function median(values) {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function mergeBounds(a, b) {
  if (!a) return b;

  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function originalTopLeft(nodes, placements) {
  let minX = Infinity;
  let minY = Infinity;

  for (const id of placements.keys()) {
    const pos = nodes[id]?.position;
    if (!pos) continue;
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
  }

  return {
    x: Number.isFinite(minX) ? minX : 0,
    y: Number.isFinite(minY) ? minY : 0,
  };
}

export default layoutFlow;
