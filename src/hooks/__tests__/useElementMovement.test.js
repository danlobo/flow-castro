import { renderHook, act } from "@testing-library/react";
import { useElementMovement } from "../useElementMovement";

const SIZE = { width: 200, height: 100 };

/** a -> b with two bend points, plus c hanging off b. */
function makeState() {
  const node = (id, x) => ({
    id,
    type: "test",
    position: { x, y: 0 },
    size: { ...SIZE },
    connections: { inputs: [], outputs: [] },
  });

  const nodes = { a: node("a", 0), b: node("b", 400), c: node("c", 800) };

  nodes.a.connections.outputs.push({
    name: "o",
    node: "b",
    port: "i",
    waypoints: [
      { x: 250, y: 50 },
      { x: 350, y: 50 },
    ],
  });
  nodes.b.connections.inputs.push({ name: "i", node: "a", port: "o" });

  nodes.b.connections.outputs.push({
    name: "o",
    node: "c",
    port: "i",
    waypoints: [{ x: 650, y: 50 }],
  });
  nodes.c.connections.inputs.push({ name: "i", node: "b", port: "o" });

  return { nodes };
}

/** Drags `node` to `position` with `selected` held, returns the new state. */
function drag({ selected, node, position, waypointSelected = () => false }) {
  let state = makeState();

  const { result } = renderHook(() =>
    useElementMovement({
      state,
      setState: (fn) => (state = fn(state)),
      setStateAndNotify: (fn) => (state = fn(state)),
      gridSize: 20,
      snapToGrid: false,
      selectedNodes: selected,
      setSelectedNodes: () => {},
      selectedWaypoints: [],
      setSelectedWaypoints: () => {},
      isWaypointSelected: waypointSelected,
    }),
  );

  act(() => {
    result.current.moveHandler(state.nodes[node], position, false);
  });

  return state;
}

const wpOf = (state, from, to) =>
  state.nodes[from].connections.outputs.find((conn) => conn.node === to)
    .waypoints;

describe("useElementMovement", () => {
  it("carries the bend points of an edge whose both ends are moving", () => {
    // a and b both selected, so a -> b travels rigidly with them.
    const state = drag({
      selected: ["a", "b"],
      node: "a",
      position: { x: 100, y: 30 },
    });

    expect(state.nodes.a.position).toEqual({ x: 100, y: 30 });
    expect(state.nodes.b.position).toEqual({ x: 500, y: 30 });
    expect(wpOf(state, "a", "b")).toEqual([
      { x: 350, y: 80 },
      { x: 450, y: 80 },
    ]);
  });

  it("leaves the bend points of an edge that only has one end moving", () => {
    // c stays put, so b -> c is stretched and its bend point must not move.
    const state = drag({
      selected: ["a", "b"],
      node: "a",
      position: { x: 100, y: 30 },
    });

    expect(state.nodes.c.position).toEqual({ x: 800, y: 0 });
    expect(wpOf(state, "b", "c")).toEqual([{ x: 650, y: 50 }]);
  });

  it("still carries an individually picked waypoint", () => {
    // Only a moves, so a -> b is stretched, but its first bend point was
    // picked by hand and has to follow anyway.
    const state = drag({
      selected: ["a"],
      node: "a",
      position: { x: 100, y: 30 },
      waypointSelected: ({ srcNode, waypointIndex }) =>
        srcNode === "a" && waypointIndex === 0,
    });

    expect(state.nodes.b.position).toEqual({ x: 400, y: 0 });
    expect(wpOf(state, "a", "b")).toEqual([
      { x: 350, y: 80 },
      { x: 350, y: 50 },
    ]);
  });
});
