/**
 * Synthetic flow generator for the performance harness.
 *
 * Builds a grid of `count` nodes chained left-to-right inside each row, with
 * the last node of a row wired to the first of the next one, so the graph is a
 * single long snake: every node has one input and one output busy, and a slice
 * of the connections carries a waypoint.
 */
export function generateFlow({
  count = 1000,
  cols = 20,
  spacingX = 560,
  spacingY = 320,
  waypointEvery = 7,
  /** false builds the same 1000 nodes with no edges at all, to separate the
   *  cost of the node layer from the cost of the connector layer. */
  connect = true,
} = {}) {
  const nodes = {};
  const ids = [];

  for (let i = 0; i < count; i++) {
    const id = `n${i}`;
    ids.push(id);

    const col = i % cols;
    const row = Math.floor(i / cols);

    nodes[id] = {
      id,
      name: `String ${i}`,
      type: "string",
      position: { x: col * spacingX, y: row * spacingY },
      values: { string: `value ${i}` },
      size: { width: 450, height: 148.4375 },
      connections: { inputs: [], outputs: [] },
    };
  }

  let connections = 0;
  let waypoints = 0;

  const link = (srcId, dstId) => {
    const src = nodes[srcId];
    const dst = nodes[dstId];
    if (!src || !dst) return;

    const conn = { name: "string", node: dst.id, port: "string", type: "string" };

    if (waypointEvery && connections % waypointEvery === 0) {
      conn.waypoints = [
        { x: src.position.x + 505, y: src.position.y + (dst.position.y > src.position.y ? 220 : 40) },
      ];
      waypoints++;
    }

    src.connections.outputs.push(conn);
    dst.connections.inputs.push({ name: "string", node: src.id, port: "string", type: "string" });
    connections++;
  };

  if (connect) {
    for (let i = 0; i < count - 1; i++) {
      link(ids[i], ids[i + 1]);
    }
  }

  return { state: { nodes }, stats: { nodes: count, connections, waypoints } };
}
