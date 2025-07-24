import { useCallback } from "react";
import { nanoid } from "nanoid";

/**
 * Custom hook to manage clipboard operations
 * @param {Object} options - Configuration options
 * @param {Object} options.state - Current flow state
 * @param {Function} options.setStateAndNotify - Function to update state
 * @param {Function} options.setSelectedNodes - Function to update selected nodes
 * @param {Function} options.setSelectedWaypoints - Function to update selected waypoints
 * @param {Object} options.nodeTypes - Available node types
 * @param {Object} options.position - Current screen position
 * @param {number} options.scale - Current screen scale
 * @param {Object} options.pointerPosition - Current pointer position
 * @param {Object} options.screenRef - Reference to screen element
 * @returns {Object} Functions for clipboard operations
 */
export function useClipboard({
  state,
  setStateAndNotify,
  setSelectedNodes,
  setSelectedWaypoints,
  nodeTypes,
  position,
  scale,
  pointerPosition,
  screenRef,
}) {
  /**
   * Copy selected nodes to clipboard
   * @param {Array} selectedNodes - IDs of selected nodes
   */
  const copyNodesToClipboard = useCallback(
    (selectedNodes) => {
      if (!selectedNodes?.length) {
        console.warn("[useClipboard] No nodes selected to copy");
        return;
      }

      const _selectedNodes = {};
      for (const nodeId of selectedNodes) {
        if (!state.nodes[nodeId]) {
          console.warn(
            `[useClipboard] Node with id ${nodeId} not found in state`
          );
          continue;
        }
        _selectedNodes[nodeId] = state.nodes[nodeId];
      }

      if (Object.keys(_selectedNodes).length === 0) {
        console.warn("[useClipboard] Could not find any nodes to copy");
        return;
      }

      const data = JSON.stringify(_selectedNodes);
      navigator.clipboard
        .writeText(data)
        .catch((err) =>
          console.error("[useClipboard] Error copying data:", err)
        );
    },
    [state?.nodes]
  );

  /**
   * Paste nodes from clipboard to the editor
   * @param {Object} currentPointer - Current pointer position (optional)
   */
  const pasteNodesFromClipboard = useCallback(
    (currentPointer = null) => {
      if (!screenRef?.current) {
        console.error("[useClipboard] screenRef not available");
        return;
      }

      // Use the provided position or the stored position
      // If a pointer was provided, use it; otherwise, get the current mouse position
      const currentPointerPosition =
        currentPointer ||
        (() => {
          // Get the most current mouse position
          return window.mousePosition || pointerPosition;
        })();

      navigator.clipboard
        .readText()
        .then((data) => {
          try {
            if (!data) {
              console.warn("[useClipboard] Empty clipboard");
              return;
            }

            const _nodes = JSON.parse(data);

            // Validate nodes
            const jsonNodes = Object.values(_nodes).filter(
              (node) => !node.root
            );

            if (jsonNodes.length === 0) {
              console.warn("[useClipboard] No valid nodes to paste");
              return;
            }

            let valid = true;
            let invalidReason = "";

            for (const node of jsonNodes) {
              if (!nodeTypes[node.type]) {
                valid = false;
                invalidReason = `Invalid node type: ${node.type}`;
                break;
              }

              if (!node.position) {
                valid = false;
                invalidReason = `Node without position: ${node.id}`;
                break;
              }

              // Check if the connections property exists and has inputs and outputs subproperties
              // Some nodes may not have the connections property defined
              if (!node.connections) {
                // If connections doesn't exist, create an empty default structure
                node.connections = {
                  inputs: [],
                  outputs: [],
                };
              } else if (
                node.connections.inputs === undefined ||
                node.connections.outputs === undefined
              ) {
                // If connections exists but inputs or outputs are missing, complete the structure
                if (node.connections.inputs === undefined) {
                  node.connections.inputs = [];
                }
                if (node.connections.outputs === undefined) {
                  node.connections.outputs = [];
                }
              }
            }

            if (!valid) {
              console.error(`[useClipboard] Invalid data: ${invalidReason}`);
              return;
            }

            // Find node with minimum X position
            const nodeWithMinX = jsonNodes.reduce((acc, node) => {
              if (
                node.position.x < (acc?.position?.x ?? Number.POSITIVE_INFINITY)
              )
                return node;
              return acc;
            }, null);

            if (!nodeWithMinX) {
              console.error(
                "[useClipboard] Could not find reference node for positioning"
              );
              return;
            }

            const delta = {
              x: nodeWithMinX.position.x,
              y: nodeWithMinX.position.y,
            };

            if (!screenRef.current) {
              console.error("[useClipboard] screenRef.current not available");
              return;
            }

            const rect = screenRef.current.getBoundingClientRect();

            if (!rect) {
              console.error("[useClipboard] Could not get element rectangle");
              return;
            }

            const { x, y } = rect;

            const pos = {
              x: (currentPointerPosition.x - x - position.x) / scale,
              y: (currentPointerPosition.y - y - position.y) / scale,
            };

            const idsDict = {};

            const nodes = jsonNodes.map((node) => {
              const oldId = node.id;
              const newId = nanoid();

              idsDict[oldId] = newId;

              const newPosition = {
                x: node.position.x - delta.x + pos.x,
                y: node.position.y - delta.y + pos.y,
              };

              return {
                ...node,
                id: newId,
                position: newPosition,
                connections: {
                  inputs: node.connections?.inputs?.filter((conn) =>
                    jsonNodes.find((it) => it.id === conn.node)
                  ),
                  outputs: node.connections?.outputs?.filter((conn) =>
                    jsonNodes.find((it) => it.id === conn.node)
                  ),
                },
              };
            });

            for (const node of nodes) {
              if (node.connections?.inputs) {
                for (const conn of node.connections.inputs) {
                  conn.node = idsDict[conn.node];
                }
              }
              if (node.connections?.outputs) {
                for (const conn of node.connections.outputs) {
                  conn.node = idsDict[conn.node];

                  // Adjust waypoint coordinates
                  if (conn.waypoints && conn.waypoints.length > 0) {
                    conn.waypoints = conn.waypoints.map((waypoint) => ({
                      x: waypoint.x - delta.x + pos.x,
                      y: waypoint.y - delta.y + pos.y,
                    }));
                  }
                }
              }
            }

            // Collect information about new waypoints for selection
            const newWaypoints = [];
            for (const node of nodes) {
              if (node.connections?.outputs) {
                for (const conn of node.connections.outputs) {
                  if (conn.waypoints && conn.waypoints.length > 0) {
                    conn.waypoints.forEach((waypoint, waypointIndex) => {
                      newWaypoints.push({
                        srcNode: node.id,
                        srcPort: conn.name,
                        dstNode: conn.node,
                        dstPort: conn.port,
                        waypointIndex: waypointIndex,
                      });
                    });
                  }
                }
              }
            }

            setStateAndNotify((prev) => {
              const newNodes = {
                ...prev.nodes,
                ...nodes.reduce((acc, node) => {
                  acc[node.id] = node;
                  return acc;
                }, {}),
              };

              return {
                ...prev,
                nodes: newNodes,
              };
            });

            const newNodeIds = nodes.map((n) => n.id);

            if (setSelectedNodes) {
              setSelectedNodes(newNodeIds);
            }

            if (setSelectedWaypoints) {
              setSelectedWaypoints(newWaypoints);
            }
          } catch (err) {
            console.error(
              "[useClipboard] Error processing clipboard data:",
              err
            );
          }
        })
        .catch((err) => {
          console.error("[useClipboard] Error reading from clipboard:", err);
        });
    },
    [
      state,
      setStateAndNotify,
      setSelectedNodes,
      setSelectedWaypoints,
      nodeTypes,
      position,
      scale,
      // We removed pointerPosition from dependencies since we now use window.mousePosition
      // to access the most current value
      screenRef,
    ]
  );

  return {
    copyNodesToClipboard,
    pasteNodesFromClipboard,
  };
}
