import React from "react";
import Node from "../Node.jsx";
import Comment from "../Comment.jsx";
import { ConnectorCurve } from "../ConnectorCurve.jsx";
import { i } from "../util/i18n.js";

/**
 * Componente responsável por renderizar os nós e suas conexões
 */
const NodeRenderer = ({
  nodes,
  nodeTypes,
  portTypes,
  contRect,
  position,
  scale,
  selectedNodes,
  setSelectedNodes,
  handleValueChange,
  setStateAndNotify,
  setState,
  snapToGrid,
  gridSize,
  canMove,
  onConnect,
  handleContextMenu,
  cloneNode,
  removeNodes,
  removeConnectionFromOutput,
  addWaypoint,
  removeWaypoint,
  updateWaypointPosition,
  i18n,
  debugMode,
}) => {
  return (
    <>
      {nodes.map((node) => {
        const nodeDef = nodeTypes?.[node.type];

        if (!nodeDef) {
          console.warn(`Node type ${node.type} not found`);
          return null;
        }

        if (node.type === "comment") {
          return (
            <Comment
              key={`comment_${node.id}`}
              text={node.text || ""}
              id={node.id}
              position={node.position}
              selected={selectedNodes.includes(node.id)}
              onSelect={(e, nodeId) => {
                // Se estiver segurando ctrl, adiciona à seleção
                if (e.ctrlKey) {
                  const _selectedNodes = [...selectedNodes];
                  if (_selectedNodes.includes(nodeId)) {
                    _selectedNodes.splice(_selectedNodes.indexOf(nodeId), 1);
                  } else {
                    _selectedNodes.push(nodeId);
                  }
                  setSelectedNodes(_selectedNodes);
                } else {
                  setSelectedNodes([nodeId]);
                }
              }}
              onTextChange={(text) => {
                setStateAndNotify((prev) => {
                  const _nodes = { ...prev.nodes };
                  _nodes[node.id] = {
                    ..._nodes[node.id],
                    text,
                  };
                  return {
                    ...prev,
                    nodes: _nodes,
                  };
                });
              }}
              onMove={(position) => {
                const pos = { ...position };

                const _selectedNodes = [...selectedNodes];
                if (!_selectedNodes.includes(node.id))
                  _selectedNodes.length = 0;
                setSelectedNodes(_selectedNodes);

                setStateAndNotify((prev) => ({
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
                      };
                    } else if (_selectedNodes.includes(n.id)) {
                      acc[n.id] = {
                        ...n,
                        position: {
                          x: n.position.x + delta.x,
                          y: n.position.y + delta.y,
                        },
                      };
                    } else {
                      acc[n.id] = n;
                    }
                    return acc;
                  }, {}),
                }));
              }}
              onMoveEnd={(position) => {
                const pos = { ...position };

                const _selectedNodes = selectedNodes;
                if (!_selectedNodes.includes(node.id))
                  _selectedNodes.length = 0;
                setSelectedNodes(_selectedNodes);

                setStateAndNotify((prev) => ({
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
                      };
                    } else if (_selectedNodes.includes(n.id)) {
                      acc[n.id] = {
                        ...n,
                        position: {
                          x: n.position.x + delta.x,
                          y: n.position.y + delta.y,
                        },
                      };
                    } else {
                      acc[n.id] = n;
                    }
                    return acc;
                  }, {}),
                }));
              }}
              onContextMenu={(e) =>
                handleContextMenu(e, [
                  {
                    label: i(
                      i18n,
                      "contextMenu.cloneThisComment",
                      {},
                      "Clone this comment"
                    ),
                    onClick: () => {
                      cloneNode(node.id);
                    },
                  },
                  {
                    label: i(
                      i18n,
                      "contextMenu.removeThisComment",
                      {},
                      "Remove this comment"
                    ),
                    style: { color: "red" },
                    onClick: () => {
                      removeNodes([node.id]);
                    },
                  },
                  selectedNodes?.length > 0
                    ? {
                        label: i(
                          i18n,
                          "contextMenu.removeSelectedNodes",
                          {},
                          "Remove selected nodes"
                        ),
                        style: { color: "red" },
                        onClick: () => {
                          removeNodes(selectedNodes);
                        },
                      }
                    : null,
                ])
              }
            />
          );
        }

        return (
          <React.Fragment key={`node_fragment_${node.id}`}>
            <Node
              id={`node_${node.id}`}
              name={node.name}
              portTypes={portTypes}
              nodeType={nodeTypes?.[node.type]}
              debugMode={debugMode}
              value={node}
              isSelected={selectedNodes.includes(node.id)}
              onValueChange={(v) => {
                handleValueChange(node.id, { ...v.values });
              }}
              onChangePosition={(position) => {
                const pos = { ...position };

                const _selectedNodes = selectedNodes;
                if (!_selectedNodes.includes(node.id))
                  _selectedNodes.length = 0;
                setSelectedNodes(_selectedNodes);

                setState((prev) => ({
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
                      };
                    } else if (_selectedNodes.includes(n.id)) {
                      acc[n.id] = {
                        ...n,
                        position: {
                          x: n.position.x + delta.x,
                          y: n.position.y + delta.y,
                        },
                      };
                    } else {
                      acc[n.id] = n;
                    }
                    return acc;
                  }, {}),
                }));
              }}
              onDragEnd={(position) => {
                const pos = { ...position };

                const _selectedNodes = selectedNodes;
                if (!_selectedNodes.includes(node.id))
                  _selectedNodes.length = 0;
                setSelectedNodes(_selectedNodes);

                setStateAndNotify((prev) => ({
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
                      };
                    } else if (_selectedNodes.includes(n.id)) {
                      acc[n.id] = {
                        ...n,
                        position: {
                          x: n.position.x + delta.x,
                          y: n.position.y + delta.y,
                        },
                      };
                    } else {
                      acc[n.id] = n;
                    }
                    return acc;
                  }, {}),
                }));
              }}
              containerRef={{
                current: document.getElementById("screen-container"),
              }}
              canMove={canMove}
              onConnect={onConnect}
              onContextMenu={(e) =>
                handleContextMenu(e, [
                  !nodeDef.root
                    ? {
                        label: i(
                          i18n,
                          "contextMenu.cloneThisNode",
                          {},
                          "Clone this node"
                        ),
                        onClick: () => {
                          cloneNode(node.id);
                        },
                      }
                    : null,
                  !nodeDef.root
                    ? {
                        label: i(
                          i18n,
                          "contextMenu.removeThisNode",
                          {},
                          "Remove this node"
                        ),
                        style: { color: "red" },
                        onClick: () => {
                          removeNodes([node.id]);
                        },
                      }
                    : null,
                  selectedNodes?.length > 0
                    ? {
                        label: i(
                          i18n,
                          "contextMenu.removeSelectedNodes",
                          {},
                          "Remove selected nodes"
                        ),
                        style: { color: "red" },
                        onClick: () => {
                          removeNodes(selectedNodes);
                        },
                      }
                    : null,
                ])
              }
              onResize={(size) => {
                // O objetivo aqui é disparar a renderização das conexões.
                setState((prev) => ({
                  ...prev,
                  nodes: {
                    ...prev.nodes,
                    [node.id]: {
                      ...prev.nodes[node.id],
                      size,
                      connections: {
                        ...prev.nodes[node.id].connections,
                        outputs: [
                          ...(prev.nodes[node.id].connections?.outputs ?? []),
                        ],
                      },
                    },
                  },
                }));
              }}
            />
            {/* Renderizar conexões */}
            {node.connections?.outputs?.map((connection, index) => {
              const srcNode = node.id;
              const srcPort = connection.name;
              const dstNode = connection.node;
              const dstPort = connection.port;
              const connType = connection.type;
              const waypoints = connection.waypoints || [];

              const srcBox = document.getElementById(`card-${srcNode}`);
              const dstBox = document.getElementById(`card-${dstNode}`);

              const srcElem = document.getElementById(
                `card-${srcNode}-output-${srcPort}`
              );
              const dstElem = document.getElementById(
                `card-${dstNode}-input-${dstPort}`
              );

              if (!srcElem || !dstElem || !contRect || !srcBox || !dstBox) {
                return null;
              }

              const srcRect = srcElem.getBoundingClientRect();
              const dstRect = dstElem.getBoundingClientRect();

              const srcBoxRect = srcBox.getBoundingClientRect();
              const dstBoxRect = dstBox.getBoundingClientRect();

              const srcPos = {
                x:
                  (srcRect.x - position.x - contRect.left + srcRect.width / 2) /
                  scale,
                y:
                  (srcRect.y - position.y - contRect.top + srcRect.height / 2) /
                  scale,
              };

              const dstPos = {
                x:
                  (dstRect.x - position.x - contRect.left + dstRect.width / 2) /
                  scale,
                y:
                  (dstRect.y - position.y - contRect.top + dstRect.height / 2) /
                  scale,
              };

              const box1 = {
                x: (srcBoxRect.x - position.x - contRect.left) / scale,
                y: (srcBoxRect.y - position.y - contRect.top) / scale,
                w: srcBoxRect.width,
                h: srcBoxRect.height,
              };

              const box2 = {
                x: (dstBoxRect.x - position.x - contRect.left) / scale,
                y: (dstBoxRect.y - position.y - contRect.top) / scale,
                w: dstBoxRect.width,
                h: dstBoxRect.height,
              };

              return (
                <ConnectorCurve
                  key={`connector-${srcNode}-${srcPort}-${dstNode}-${dstPort}`}
                  type={portTypes[connType]}
                  src={srcPos}
                  dst={dstPos}
                  scale={scale}
                  n1Box={box1}
                  n2Box={box2}
                  index={index}
                  waypoints={waypoints}
                  onUpdateWaypoint={(waypointIndex, newPosition) =>
                    updateWaypointPosition(
                      srcNode,
                      srcPort,
                      dstNode,
                      dstPort,
                      waypointIndex,
                      newPosition
                    )
                  }
                  onWaypointContextMenu={(e, waypointIndex) =>
                    handleContextMenu(
                      e,
                      [
                        canMove
                          ? {
                              label: i(
                                i18n,
                                "contextMenu.removeWaypoint",
                                {},
                                "Remove waypoint"
                              ),
                              style: { color: "red" },
                              onClick: () => {
                                removeWaypoint(
                                  srcNode,
                                  srcPort,
                                  dstNode,
                                  dstPort,
                                  waypointIndex
                                );
                              },
                            }
                          : null,
                      ].filter(Boolean)
                    )
                  }
                  onContextMenu={(e) =>
                    handleContextMenu(
                      e,
                      [
                        canMove
                          ? {
                              label: i(
                                i18n,
                                "contextMenu.addWaypoint",
                                {},
                                "Add waypoint"
                              ),
                              onClick: () => {
                                const pointerX =
                                  (e.clientX - contRect.left - position.x) /
                                  scale;
                                const pointerY =
                                  (e.clientY - contRect.top - position.y) /
                                  scale;

                                addWaypoint(
                                  srcNode,
                                  srcPort,
                                  dstNode,
                                  dstPort,
                                  { x: pointerX, y: pointerY }
                                );
                              },
                            }
                          : null,
                        canMove
                          ? {
                              label: i(
                                i18n,
                                "contextMenu.removeThisConnection",
                                {},
                                "Remove this connection"
                              ),
                              style: { color: "red" },
                              onClick: () => {
                                removeConnectionFromOutput(
                                  srcNode,
                                  srcPort,
                                  dstNode,
                                  dstPort
                                );
                              },
                            }
                          : null,
                      ].filter(Boolean)
                    )
                  }
                />
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default NodeRenderer;
