import { useCallback, useEffect } from "react";
import { useElementSelection } from "./useElementSelection";

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
  useEffect(() => {
    console.log("[useElementMovement] Initialized with state:", state);
  }, [state]);
  const moveHandler = useCallback(
    (node, position, notify) => {
      // Logic to handle moving the element
      const pos = { ...position };

      // Se o nó que está sendo arrastado não estiver na lista de selecionados,
      // consideramos apenas ele como selecionado
      const _selectedNodes = [...selectedNodes];
      if (!_selectedNodes.includes(node.id)) {
        _selectedNodes.length = 0;
        _selectedNodes.push(node.id);
      }
      setSelectedNodes(_selectedNodes);

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
                outputs: n.connections?.outputs?.map((conn) => ({
                  ...conn,
                  waypoints: conn.waypoints?.map((wp, idx) =>
                    isWaypointSelected({
                      srcNode: n.id,
                      srcPort: conn.name,
                      dstNode: conn.node,
                      dstPort: conn.port,
                      waypointIndex: idx,
                    })
                      ? {
                          x: wp.x + delta.x,
                          y: wp.y + delta.y,
                        }
                      : wp
                  ),
                })),
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
                outputs: n.connections?.outputs?.map((conn) => ({
                  ...conn,
                  waypoints: conn.waypoints?.map((wp, idx) =>
                    isWaypointSelected({
                      srcNode: n.id,
                      srcPort: conn.name,
                      dstNode: conn.node,
                      dstPort: conn.port,
                      waypointIndex: idx,
                    })
                      ? {
                          x: wp.x + delta.x,
                          y: wp.y + delta.y,
                        }
                      : wp
                  ),
                })),
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
    ]
  );

  return {
    moveHandler,
  };
}
