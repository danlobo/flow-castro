import { useCallback, useEffect, useMemo } from "react";
import { useElementSelection } from "./useElementSelection";
import { throttle } from "../util/throttle";

export function useElementMovement({
  state,
  setState,
  setStateAndNotify,
  gridSize,
  snapToGrid,
  selectedNodes,
  setSelectedNodes,
  selectedWaypoints,
  setSelectedWaypoints,
  isWaypointSelected,
}) {
  const originalMoveHandler = useCallback(
    (node, position, notify) => {
      const pos = { ...position };

      const _selectedNodes = [...selectedNodes];
      if (!_selectedNodes.includes(node.id)) {
        _selectedNodes.length = 0;
        _selectedNodes.push(node.id);

        setSelectedNodes(_selectedNodes);
      }

      const moving = new Set(_selectedNodes);

      /**
       * A waypoint follows the drag when it was picked individually, or when
       * the whole edge is moving - both of its nodes are in the selection. In
       * that case the edge has to travel rigidly with them, otherwise its bend
       * points stay behind and the connection is dragged out of shape.
       */
      const moveWaypoints = (n, delta) =>
        n.connections?.outputs?.map((conn) => {
          if (!conn.waypoints?.length) return conn;

          const wholeEdge = moving.has(n.id) && moving.has(conn.node);

          return {
            ...conn,
            waypoints: conn.waypoints.map((wp, idx) =>
              wholeEdge ||
              isWaypointSelected({
                srcNode: n.id,
                srcPort: conn.name,
                dstNode: conn.node,
                dstPort: conn.port,
                waypointIndex: idx,
              })
                ? { x: wp.x + delta.x, y: wp.y + delta.y }
                : wp,
            ),
          };
        });

      const fn = notify ? setState : setStateAndNotify;
      fn((prev) => ({
        ...prev,
        nodes: Object.values(prev.nodes).reduce((acc, n) => {
          const delta = {
            x: pos.x - prev.nodes[node.id].position.x,
            y: pos.y - prev.nodes[node.id].position.y,
          };

          if (snapToGrid) {
            pos.x = Math.round(pos.x / gridSize) * gridSize;
            pos.y = Math.round(pos.y / gridSize) * gridSize;
            delta.x = pos.x - prev.nodes[node.id].position.x;
            delta.y = pos.y - prev.nodes[node.id].position.y;
          }

          if (n.id === node.id) {
            acc[n.id] = {
              ...n,
              position: pos,
              connections: {
                ...n.connections,
                outputs: moveWaypoints(n, delta),
              },
            };
          } else if (_selectedNodes.includes(n.id)) {
            acc[n.id] = {
              ...n,
              position: {
                x: n.position.x + delta.x,
                y: n.position.y + delta.y,
              },
              connections: {
                ...n.connections,
                outputs: moveWaypoints(n, delta),
              },
            };
          } else {
            acc[n.id] = n;
          }
          return acc;
        }, {}),
      }));
    },
    [
      selectedNodes,
      selectedWaypoints,
      setSelectedNodes,
      setState,
      setStateAndNotify,
      snapToGrid,
      gridSize,
      isWaypointSelected,
    ],
  );

  const throttledMoveHandler = useMemo(
    () =>
      throttle(originalMoveHandler, 16, {
        leading: true,
        trailing: true,
      }),
    [originalMoveHandler],
  );

  const moveHandler = useCallback(
    (node, position, notify) => throttledMoveHandler(node, position, notify),
    [throttledMoveHandler],
  );

  return {
    moveHandler,
  };
}
