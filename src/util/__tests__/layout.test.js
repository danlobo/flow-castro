import { layoutFlow } from "../layout";

const SIZE = { width: 200, height: 100 };

/**
 * Builds a state from a compact edge list: ["a:out->b:in", ...]
 */
function makeState(edgeList, overrides = {}) {
  const nodes = {};

  const ensure = (id) => {
    if (!nodes[id]) {
      nodes[id] = {
        id,
        type: "test",
        position: { x: 0, y: 0 },
        size: { ...SIZE },
        connections: { inputs: [], outputs: [] },
        ...(overrides[id] ?? {}),
      };
    }
    return nodes[id];
  };

  for (const spec of edgeList) {
    const [left, right] = spec.split("->");
    const [from, fromPort] = left.split(":");
    const [to, toPort] = right.split(":");

    ensure(from).connections.outputs.push({
      name: fromPort,
      node: to,
      port: toPort,
    });
    ensure(to).connections.inputs.push({
      name: toPort,
      node: from,
      port: fromPort,
    });
  }

  return { nodes };
}

const xOf = (state, id) => state.nodes[id].position.x;
const yOf = (state, id) => state.nodes[id].position.y;

describe("layoutFlow", () => {
  it("returns the state untouched when there is nothing to lay out", () => {
    const state = { nodes: {} };
    expect(layoutFlow(state)).toBe(state);

    const single = makeState([]);
    single.nodes.a = { id: "a", position: { x: 5, y: 5 }, connections: {} };
    expect(layoutFlow(single)).toBe(single);
  });

  it("leaves disconnected nodes where they are", () => {
    const state = makeState(["a:o->b:i"]);
    state.nodes.loose = {
      id: "loose",
      type: "comment",
      position: { x: 999, y: 888 },
      size: { ...SIZE },
      connections: { inputs: [], outputs: [] },
    };

    const result = layoutFlow(state);

    expect(result.nodes.loose.position).toEqual({ x: 999, y: 888 });
  });

  it("orders a chain into consecutive layers", () => {
    const result = layoutFlow(makeState(["a:o->b:i", "b:o->c:i"]));

    expect(xOf(result, "a")).toBeLessThan(xOf(result, "b"));
    expect(xOf(result, "b")).toBeLessThan(xOf(result, "c"));
  });

  it("keeps a straight chain aligned on the same row", () => {
    const result = layoutFlow(makeState(["a:o->b:i", "b:o->c:i", "c:o->d:i"]));

    expect(yOf(result, "a")).toBe(yOf(result, "b"));
    expect(yOf(result, "b")).toBe(yOf(result, "c"));
    expect(yOf(result, "c")).toBe(yOf(result, "d"));
  });

  it("separates siblings vertically without overlapping", () => {
    const result = layoutFlow(makeState(["a:o1->b:i", "a:o2->c:i"]));

    expect(xOf(result, "b")).toBe(xOf(result, "c"));
    expect(
      Math.abs(yOf(result, "b") - yOf(result, "c")),
    ).toBeGreaterThanOrEqual(SIZE.height);
  });

  it("respects the port order of the parent", () => {
    // The edges are declared out of order on purpose: o1 is added last.
    const state = makeState(["a:o2->b:i", "a:o1->c:i"]);
    const result = layoutFlow(state, {
      portOffsets: { a: { inputs: {}, outputs: { o1: 20, o2: 80 } } },
    });

    // o1 sits above o2 on the node, so c must end up above b.
    expect(yOf(result, "c")).toBeLessThan(yOf(result, "b"));
  });

  it("pulls a node right instead of dragging a long edge", () => {
    // `side` only feeds `d`, which sits three layers deep.
    const result = layoutFlow(
      makeState(["a:o->b:i", "b:o->c:i", "c:o->d:i", "side:o->d:i"]),
    );

    expect(xOf(result, "side")).toBe(xOf(result, "c"));
  });

  it("terminates on a cycle and keeps every node", () => {
    const result = layoutFlow(
      makeState(["a:o->b:i", "b:o->c:i", "c:o->a:i"], {
        a: { root: true },
      }),
    );

    expect(Object.keys(result.nodes).sort()).toEqual(["a", "b", "c"]);
    expect(xOf(result, "a")).toBeLessThan(xOf(result, "b"));
    expect(xOf(result, "b")).toBeLessThan(xOf(result, "c"));
  });

  it("ignores self loops", () => {
    const result = layoutFlow(makeState(["a:o->b:i", "b:o->b:i"]));

    expect(xOf(result, "a")).toBeLessThan(xOf(result, "b"));
  });

  it("anchors the result on the original top-left corner", () => {
    const state = makeState(["a:o->b:i"]);
    state.nodes.a.position = { x: 400, y: 300 };
    state.nodes.b.position = { x: 900, y: 700 };

    const result = layoutFlow(state);
    const minX = Math.min(xOf(result, "a"), xOf(result, "b"));
    const minY = Math.min(yOf(result, "a"), yOf(result, "b"));

    expect(minX).toBe(400);
    expect(minY).toBe(300);
  });

  it("honours an explicit origin", () => {
    const result = layoutFlow(makeState(["a:o->b:i"]), {
      origin: { x: 0, y: 0 },
    });

    expect(Math.min(xOf(result, "a"), xOf(result, "b"))).toBe(0);
    expect(Math.min(yOf(result, "a"), yOf(result, "b"))).toBe(0);
  });

  it("snaps to the grid when asked", () => {
    const result = layoutFlow(makeState(["a:o1->b:i", "a:o2->c:i"]), {
      gridSize: 20,
      origin: { x: 0, y: 0 },
    });

    for (const node of Object.values(result.nodes)) {
      expect(node.position.x % 20).toBe(0);
      expect(node.position.y % 20).toBe(0);
    }
  });

  it("stacks disconnected components instead of overlapping them", () => {
    const state = makeState(["a:o->b:i", "c:o->d:i"]);
    const result = layoutFlow(state, { origin: { x: 0, y: 0 } });

    const first = [yOf(result, "a"), yOf(result, "b")];
    const second = [yOf(result, "c"), yOf(result, "d")];

    expect(Math.max(...first) + SIZE.height).toBeLessThanOrEqual(
      Math.min(...second),
    );
  });

  it("only touches the requested nodes", () => {
    const state = makeState(["a:o->b:i", "c:o->d:i"]);
    state.nodes.c.position = { x: 10, y: 10 };
    state.nodes.d.position = { x: 20, y: 20 };

    const result = layoutFlow(state, { only: ["a", "b"] });

    expect(result.nodes.c.position).toEqual({ x: 10, y: 10 });
    expect(result.nodes.d.position).toEqual({ x: 20, y: 20 });
  });

  it("does not mutate the input state", () => {
    const state = makeState(["a:o->b:i"]);
    const snapshot = JSON.stringify(state);

    layoutFlow(state);

    expect(JSON.stringify(state)).toBe(snapshot);
  });

  describe("waypoints", () => {
    it("adds bend points to an edge that spans several layers", () => {
      // a -> d skips two layers, so it has to be routed around b and c.
      const state = makeState([
        "a:o1->b:i",
        "b:o->c:i",
        "c:o->d:i",
        "a:o2->d:i",
      ]);

      const result = layoutFlow(state);
      const long = result.nodes.a.connections.outputs.find(
        (conn) => conn.node === "d",
      );

      // One point on each side of every column crossed, minus the one the two
      // columns share: the edge is flat for the whole flight over b and c.
      expect(long.waypoints).toHaveLength(3);

      const xs = long.waypoints.map((point) => point.x);
      expect(xs).toEqual([...xs].sort((left, right) => left - right));

      const ys = long.waypoints.map((point) => point.y);
      expect(new Set(ys).size).toBe(1);
    });

    it("keeps the bend points clear of the nodes it flies over", () => {
      const state = makeState([
        "a:o1->b:i",
        "b:o->c:i",
        "c:o->d:i",
        "a:o2->d:i",
      ]);

      const result = layoutFlow(state);
      const long = result.nodes.a.connections.outputs.find(
        (conn) => conn.node === "d",
      );

      for (const point of long.waypoints) {
        for (const id of ["b", "c"]) {
          const node = result.nodes[id];
          const overlaps =
            point.x >= node.position.x &&
            point.x <= node.position.x + node.size.width;

          expect(overlaps).toBe(false);
        }
      }
    });

    it("does not add waypoints to a plain edge", () => {
      const result = layoutFlow(makeState(["a:o->b:i"]));

      expect(result.nodes.a.connections.outputs[0].waypoints).toBeUndefined();
    });

    it("drops stale waypoints from a previous layout", () => {
      const state = makeState(["a:o->b:i"]);
      state.nodes.a.connections.outputs[0].waypoints = [{ x: 1, y: 2 }];

      const result = layoutFlow(state);

      expect(result.nodes.a.connections.outputs[0].waypoints).toBeUndefined();
    });

    it("emits back-edge waypoints in source-to-target order", () => {
      const state = makeState(
        ["a:o->b:i", "b:o->c:i", "c:o->d:i", "d:o->a:i"],
        { a: { root: true } },
      );

      const result = layoutFlow(state);
      const back = result.nodes.d.connections.outputs.find(
        (conn) => conn.node === "a",
      );

      expect(back.waypoints.length).toBeGreaterThan(0);
      // d sits to the right of a, so the path has to walk leftwards.
      const xs = back.waypoints.map((point) => point.x);
      expect(xs).toEqual([...xs].sort((left, right) => right - left));
    });

    it("skips waypoints when emitWaypoints is off", () => {
      const state = makeState([
        "a:o1->b:i",
        "b:o->c:i",
        "c:o->d:i",
        "a:o2->d:i",
      ]);

      const result = layoutFlow(state, { emitWaypoints: false });
      const long = result.nodes.a.connections.outputs.find(
        (conn) => conn.node === "d",
      );

      expect(long.waypoints).toBeUndefined();
    });
  });
  describe("alignment", () => {
    // Two nodes of different heights, ports at different offsets: the three
    // modes only ever disagree in this situation.
    const sizes = {
      a: { size: { width: 200, height: 180 } },
      b: { size: { width: 200, height: 120 } },
    };
    const portOffsets = {
      a: { inputs: {}, outputs: { o: 140 } },
      b: { inputs: { i: 80 }, outputs: {} },
    };

    const build = () => makeState(["a:o->b:i"], sizes);

    it("lines the node tops up by default", () => {
      const result = layoutFlow(build(), { portOffsets });

      expect(yOf(result, "b")).toBe(yOf(result, "a"));
    });

    it("lines the node centers up on center", () => {
      const result = layoutFlow(build(), { portOffsets, alignment: "center" });

      expect(yOf(result, "b") + 60).toBe(yOf(result, "a") + 90);
    });

    it("lines the ports up on port", () => {
      const result = layoutFlow(build(), { portOffsets, alignment: "port" });

      expect(yOf(result, "b") + 80).toBe(yOf(result, "a") + 140);
    });

    it("keeps long edges straight whatever the nodes align on", () => {
      // The bend points of a long edge join ports, so they follow the ports
      // even when the nodes themselves are aligned by their top edge.
      const state = makeState(
        ["a:o1->b:i", "b:o->c:i", "c:o->d:i", "a:o2->d:i"],
        {
          a: { size: { width: 200, height: 300 } },
          d: { size: { width: 200, height: 120 } },
        },
      );

      const result = layoutFlow(state, {
        portOffsets: {
          a: { inputs: {}, outputs: { o1: 60, o2: 240 } },
          d: { inputs: { i: 40 }, outputs: {} },
        },
      });

      const long = result.nodes.a.connections.outputs.find(
        (conn) => conn.node === "d",
      );
      const sourcePort = yOf(result, "a") + 240;
      const targetPort = yOf(result, "d") + 40;

      for (const point of long.waypoints ?? []) {
        expect(point.y).toBeGreaterThanOrEqual(
          Math.min(sourcePort, targetPort) - 8,
        );
        expect(point.y).toBeLessThanOrEqual(
          Math.max(sourcePort, targetPort) + 8,
        );
      }
    });
  });
});
