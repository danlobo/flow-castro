import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Node from "./Node.jsx";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useDragContext } from "./DragContext.jsx";
import { useScreenContext } from "./ScreenContext.jsx";
import { ConnectorCurve, ConnectorCurveForward } from "./ConnectorCurve.jsx";
import { ContextMenu } from "./ContextMenu.jsx";
import css from "./Screen.module.css";
import { useDebounceCallback } from "./hooks/useDebounceCallback";

import nodeCss from "./Node.module.css";
import nodePortCss from "./NodePort.module.css";
import commentCss from "./Comment.module.css";
import { useTheme } from "./ThemeProvider.jsx";

import { i } from "./util/i18n.js";
import Comment from "./Comment.jsx";

const defaultI18n = {
  "contextMenu.search": "Search",
  "contextMenu.add": "Add {nodeType}",
  "contextMenu.removeThisNode": "Remove this node",
  "contextMenu.removeSelectedNodes": "Remove selected nodes",
  "contextMenu.cloneThisNode": "Clone this node",
  "contextMenu.removeThisConnection": "Remove this connection",
  "contextMenu.addWaypoint": "Add waypoint",
  "contextMenu.removeWaypoint": "Remove waypoint",
};

import { useElementSelection } from "./hooks/useElementSelection";
import { useClipboard } from "./hooks/useClipboard";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useNodeOperations } from "./hooks/useNodeOperations";

import {
  ToolbarVertical,
  ToolbarHorizontal,
  StatusPanel,
  SelectionArea,
} from "./components";
import { useElementMovement } from "./hooks/useElementMovement.js";
import { throttle } from "./util/throttle";

function Screen({
  portTypes,
  nodeTypes,
  onChangeState,
  initialState,
  i18n = defaultI18n,
  debugMode,
}) {
  const internalCommentType = {
    label: i(i18n, "contextMenu.comment.label", {}, "Comment"),
    type: "comment",
    inputs: () => [],
    outputs: () => [],
  };

  if (nodeTypes) {
    nodeTypes.comment = internalCommentType;
  }

  const { currentTheme } = useTheme();

  const PORT_SIZE = 20;

  const style = {
    "--port-size": `${PORT_SIZE}px`,
    "--color-primary": currentTheme.colors?.primary,
    "--color-secondary": currentTheme.colors?.secondary,
    "--color-bg": currentTheme.colors?.background,
    "--color-text": currentTheme.colors?.text,
    "--color-hover": currentTheme.colors?.hover,
    "--color-selection-border": currentTheme.colors?.selectionBorder,
    "--roundness": currentTheme.roundness,
  };

  const { dragInfo } = useDragContext();
  const { position, setPosition, scale, setScale } = useScreenContext();

  const [dstDragPosition, setDstDragPosition] = useState({ x: 0, y: 0 });
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
  const [isInFadeout, setIsInFadeout] = useState(false);
  const [lastConnectionSuccessful, setLastConnectionSuccessful] =
    useState(false);

  const [state, setState] = useState(initialState);
  const [shouldNotify, setShouldNotify] = useState(false);

  const [viewMode, setViewMode] = useState("select");

  const {
    selectedNodes,
    setSelectedNodes,
    selectedWaypoints,
    setSelectedWaypoints,
    selectStartPoint,
    setSelectStartPoint,
    selectEndPoint,
    setSelectEndPoint,
    clearSelection,
    selectAllNodes,
    addNodesToSelection,
    removeNodesFromSelection,
    addWaypointToSelection,
    removeWaypointFromSelection,
    isWaypointSelected,
    processAreaSelection,
  } = useElementSelection({ state });

  const [nodeDragStartPosition, setNodeDragStartPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!initialState) return;

    if (initialState.scale) setScale(initialState.scale);
    if (initialState.position) setPosition(initialState.position);
  }, [initialState, setScale, setPosition]);

  const setStateAndNotify = useCallback(
    (cb) => {
      setState((prev) => {
        const newState = cb(prev);
        setShouldNotify(true);
        return newState;
      });
    },
    [setState]
  );

  const notifyStateChange = useDebounceCallback(onChangeState, 150);

  useEffect(() => {
    if (shouldNotify) {
      notifyStateChange(state);
      setShouldNotify(false);
    }
  }, [state, notifyStateChange, shouldNotify]);

  const screenRef = useRef();

  const contRectRef = useRef(null);
  const getContRect = useCallback(() => {
    if (!contRectRef.current && screenRef.current) {
      contRectRef.current = screenRef.current.getBoundingClientRect();
    }
    return contRectRef.current;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      contRectRef.current = null;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const wrapperRef = useRef();

  const {
    addNode,
    removeNodes,
    cloneNode,
    removeConnectionFromOutput,
    addWaypoint,
    updateWaypointPosition,
    removeWaypoint,
    connectNodes,
    updateNodeValues,
  } = useNodeOperations({
    state,
    setStateAndNotify,
    setSelectedNodes,
    nodeTypes,
  });

  const { copyNodesToClipboard, pasteNodesFromClipboard } = useClipboard({
    state,
    setStateAndNotify,
    setSelectedNodes,
    setSelectedWaypoints,
    nodeTypes,
    position,
    scale,
    pointerPosition,
    screenRef,
  });

  useKeyboardShortcuts({
    screenRef,
    removeNodes,
    selectedNodes,
    setSelectedNodes,
    selectAllNodes,
    copyNodesToClipboard,
    pasteNodesFromClipboard,
  });

  const updateSelectEndPoint = useCallback(
    (event) => {
      const dx = event.pageX + window.scrollX;
      const dy = event.pageY + window.scrollY;
      setSelectEndPoint({ x: dx, y: dy });
    },
    [setSelectEndPoint]
  );

  const throttledUpdateSelectEndPoint = useCallback(
    throttle(updateSelectEndPoint, 16, { leading: true, trailing: false }),
    [updateSelectEndPoint]
  );

  const throttledSetScale = useCallback(
    throttle(setScale, 16, { leading: true, trailing: true }),
    [setScale]
  );

  const handleMouseDown = useCallback(
    (event) => {
      if (event.button === 1) {
        //middle mouse button
        setViewMode("move");
        return;
      } else if (event.button !== 0) {
        //NOT left mouse button
        return;
      }

      //select mode below
      event.stopPropagation();

      const selectMode = event.ctrlKey
        ? "select-remove"
        : event.shiftKey
          ? "select-add"
          : "select";
      setViewMode(selectMode);

      const startX = event.pageX + window.scrollX;
      const startY = event.pageY + window.scrollY;

      const pos = { x: startX, y: startY };
      setSelectStartPoint(pos);
      setSelectEndPoint(pos);

      const handleMouseMove = throttledUpdateSelectEndPoint;

      const handleMouseUp = (e) => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        const dx = e.pageX + window.scrollX;
        const dy = e.pageY + window.scrollY;

        if (Math.abs(dx - startX) >= 2 && Math.abs(dy - startY) >= 2) {
          const _posEnd = { x: dx, y: dy };
          setSelectEndPoint(_posEnd);

          const _selectedNodes = [];
          const nodes = state.nodes ? Object.values(state.nodes) : [];

          const p1 = {
            x: Math.min(pos.x, _posEnd.x),
            y: Math.min(pos.y, _posEnd.y),
          };

          const p2 = {
            x: Math.max(pos.x, _posEnd.x),
            y: Math.max(pos.y, _posEnd.y),
          };

          nodes.forEach((node) => {
            const cardElement = document.getElementById(`card-${node.id}`);
            if (!cardElement) return;

            const { x, y, width, height } = cardElement.getBoundingClientRect();

            if (x > p1.x && x + width < p2.x && y > p1.y && y + height < p2.y) {
              _selectedNodes.push(node.id);
            }
          });

          const selectedWaypoints = [];

          if (state.nodes) {
            Object.values(state.nodes).forEach((node) => {
              if (node.connections?.outputs) {
                node.connections.outputs.forEach((connection) => {
                  if (connection.waypoints) {
                    connection.waypoints.forEach((waypoint, waypointIndex) => {
                      const waypointScreenX =
                        waypoint.x * scale + position.x + window.scrollX;
                      const waypointScreenY =
                        waypoint.y * scale + position.y + window.scrollY;

                      if (
                        waypointScreenX > p1.x &&
                        waypointScreenX < p2.x &&
                        waypointScreenY > p1.y &&
                        waypointScreenY < p2.y
                      ) {
                        selectedWaypoints.push({
                          srcNode: node.id,
                          srcPort: connection.name,
                          dstNode: connection.node,
                          dstPort: connection.port,
                          waypointIndex: waypointIndex,
                        });
                      }
                    });
                  }
                });
              }
            });
          }

          processAreaSelection(
            { p1, p2 },
            selectMode,
            _selectedNodes,
            selectedWaypoints
          );

          setSelectStartPoint(_posEnd);
        }
        setSelectStartPoint({ x: 0, y: 0 });
        setSelectEndPoint({ x: 0, y: 0 });
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [position, scale, state, selectedNodes]
  );

  const handleMousePositionUpdate = useCallback(
    (event) => {
      const newPosition = {
        x: event.pageX - window.scrollX,
        y: event.pageY - window.scrollY,
      };

      window.mousePosition = newPosition;

      setPointerPosition(newPosition);
    },
    [setPointerPosition]
  );

  const throttledMouseMoveListener = useCallback(
    throttle(handleMousePositionUpdate, 16, { leading: true, trailing: false }),
    [handleMousePositionUpdate]
  );

  useEffect(() => {
    window.addEventListener("mousemove", throttledMouseMoveListener);
    return () => {
      window.removeEventListener("mousemove", throttledMouseMoveListener);
    };
  }, [throttledMouseMoveListener]);

  useEffect(() => {
    if (!dragInfo) {
      if (dstDragPosition && !lastConnectionSuccessful) {
        setIsInFadeout(true);

        const timeoutId = setTimeout(() => {
          setDstDragPosition(null);
          setIsInFadeout(false);
        }, 500);

        return () => clearTimeout(timeoutId);
      } else {
        setDstDragPosition(null);
      }

      setLastConnectionSuccessful(false);
      return;
    }

    setIsInFadeout(false);
    setLastConnectionSuccessful(false);

    const updateDragPosition = (event) => {
      const dx = event.pageX;
      const dy = event.pageY;

      if (dragInfo) {
        setDstDragPosition({
          x: dx,
          y: dy,
          srcX: dragInfo.startX,
          srcY: dragInfo.startY,
        });
      }
    };

    const throttledDragMoveListener = throttle(updateDragPosition, 16);

    window.addEventListener("mousemove", throttledDragMoveListener);
    return () => {
      window.removeEventListener("mousemove", throttledDragMoveListener);
    };
  }, [dragInfo, dstDragPosition, lastConnectionSuccessful]);

  const throttledPositionUpdate = useRef(
    throttle(
      (newPos) => {
        setPosition(newPos);
        contRectRef.current = null;
      },
      16, // 60fps
      { leading: true, trailing: true }
    )
  ).current;

  const [isMoveable, setIsMoveable] = useState(false);
  const [canMove, setCanMove] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const onZoom = useCallback(
    (params) => {
      const _scale = params.state.scale;
      throttledSetScale(_scale);

      const _position = {
        x: params.state.positionX,
        y: params.state.positionY,
      };
      throttledPositionUpdate(_position);
    },
    [throttledPositionUpdate, throttledSetScale]
  );

  const onZoomEnd = useCallback(
    (params) => {
      setStateAndNotify((prev) => {
        const _scale = params.state.scale;
        const _position = {
          x: params.state.positionX,
          y: params.state.positionY,
        };

        return {
          ...prev,
          scale: _scale,
          position: _position,
        };
      });
    },
    [setStateAndNotify]
  );

  const onTransform = useCallback(
    (params) => {
      const _position = {
        x: params.state.positionX,
        y: params.state.positionY,
      };
      throttledPositionUpdate(_position);
    },
    [throttledPositionUpdate]
  );

  const onTransformEnd = useCallback(
    (params) => {
      const {
        state: { positionX, positionY, scale: _scale },
      } = params;

      contRectRef.current = null;

      setPosition({ x: positionX, y: positionY });
      setScale(_scale);
      setStateAndNotify((prev) => {
        return {
          ...prev,
          position: { x: positionX, y: positionY },
          scale: _scale,
        };
      });
    },
    [setPosition, setScale, setStateAndNotify]
  );

  const gridSize = 40;
  const scaledGridSize = gridSize * (scale ?? 1);
  const scaledPositionX = (position?.x ?? 0) % scaledGridSize;
  const scaledPositionY = (position?.y ?? 0) % scaledGridSize;

  const { moveHandler } = useElementMovement({
    state,
    setState,
    setStateAndNotify,
    selectedWaypoints,
    gridSize,
    snapToGrid,
    selectedNodes,
    setSelectedNodes,
    selectedWaypoints,
    setSelectedWaypoints,
    isWaypointSelected,
  });

  const onConnect = useCallback(
    (connection) => {
      const success = connectNodes(connection);
      setLastConnectionSuccessful(Boolean(success));
      console.log("Connection attempt:", success ? "successful" : "failed");
      return success;
    },
    [connectNodes]
  );

  const pinchOptions = useMemo(
    () => ({
      step: 5,
    }),
    []
  );
  const panningOptions = useMemo(
    () => ({
      disabled: isMoveable,
      excluded: [
        nodeCss.node,
        "react-draggable",
        nodePortCss.port,
        nodePortCss.portConnector,
        commentCss.container,
        commentCss.moveHandler,
      ],
    }),
    [isMoveable]
  );

  const wrapperStyle = useMemo(
    () => ({
      height: "100%",
      width: "100%",
      backgroundColor: currentTheme.colors?.background,
      backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
      backgroundImage: `linear-gradient(to right, ${currentTheme.colors?.hover} 1px, transparent 1px), linear-gradient(to bottom, ${currentTheme.colors?.hover} 1px, transparent 1px)`,
      backgroundPosition: `${scaledPositionX}px ${scaledPositionY}px`,
    }),
    [scaledGridSize, scaledPositionX, scaledPositionY, currentTheme]
  );

  const nodeTypesByCategory = useMemo(() => {
    const categories = Object.values(nodeTypes).reduce((acc, nodeType) => {
      if (nodeType.root || nodeType.type === "comment") return acc;

      const _category = nodeType.category ?? "...";

      if (!acc[_category]) acc[_category] = [];
      acc[_category].push(nodeType);
      return acc;
    }, {});

    return Object.entries(categories).map(([category, nodeTypes]) => ({
      category,
      nodeTypes,
    }));
  }, [nodeTypes]);

  const cmMenu = (e) => ({
    label: i(i18n, "contextMenu.addComment.label", {}, "Add comment"),
    description: i(
      i18n,
      "contextMenu.addComment.description",
      {},
      "Add a comment to the screen"
    ),
    onClick: () => {
      const rect = e.target.getBoundingClientRect();
      const { x, y } = rect;

      const _position = {
        x: (e.clientX - position.x - x) / scale,
        y: (e.clientY - position.y - y) / scale,
      };

      if (snapToGrid) {
        _position.x = Math.round(_position.x / gridSize) * gridSize;
        _position.y = Math.round(_position.y / gridSize) * gridSize;
      }
      addNode(internalCommentType, _position);
    },
  });

  const wrapperProps = useCallback(
    (handleContextMenu) => ({
      onDragOver: (e) => {
        e.dataTransfer.dropEffect = "move";
        e.dataTransfer.effectAllowed = "move";
      },
      onDragLeave: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      onContextMenu: (e) =>
        handleContextMenu(e, [
          ...nodeTypesByCategory.map(({ category, nodeTypes }) => ({
            label: category,
            children: nodeTypes
              .filter((t) => !t.root && t.type !== internalCommentType.type)
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((nodeType) => ({
                label: i(
                  i18n,
                  "contextMenu.add",
                  { nodeType: nodeType.label },
                  "Add " + nodeType.label
                ),
                description: nodeType.description,
                onClick: () => {
                  const rect = e.target.getBoundingClientRect();
                  const { x, y } = rect;

                  const _position = {
                    x: (e.clientX - (position?.x ?? 0) - x) / scale,
                    y: (e.clientY - (position?.y ?? 0) - y) / scale,
                  };

                  if (snapToGrid) {
                    _position.x = Math.round(_position.x / gridSize) * gridSize;
                    _position.y = Math.round(_position.y / gridSize) * gridSize;
                  }

                  addNode(nodeType, _position);
                },
              })),
          })),
          cmMenu(e),
        ]),
      onMouseDown: handleMouseDown,
      onClick: (e) => {
        if (e.target === wrapperRef.current.instance.wrapperComponent)
          screenRef.current.focus({ preventScroll: true });
      },
    }),
    [state, viewMode, nodeTypesByCategory, addNode, position, scale]
  );

  const handleValueChange = useCallback(
    (id, values) => {
      updateNodeValues(id, values);
    },
    [updateNodeValues]
  );

  const handleSnapToGrid = useCallback(() => {
    setSnapToGrid((prev) => !prev);
  }, []);

  if (!state) return null;

  return (
    <div className={css.container} style={style} ref={screenRef} tabIndex={0}>
      <TransformWrapper
        initialScale={state?.scale ?? 1}
        initialPositionX={state?.position?.x ?? 0}
        initialPositionY={state?.position?.y ?? 0}
        disabled={isMoveable}
        minScale={0.1}
        maxScale={2}
        limitToBounds={false}
        onPanning={onTransform}
        onZoom={onZoom}
        pinch={pinchOptions}
        panning={panningOptions}
        onTransformed={onTransformEnd}
        ref={wrapperRef}
      >
        {({
          zoomIn,
          zoomOut,
          resetTransform,
          setTransform,
          centerView,
          ...rest
        }) => {
          const rect = getContRect();
          const localStartPoint = rect
            ? {
                x: selectStartPoint.x - rect.left,
                y: selectStartPoint.y - rect.top,
              }
            : { x: 0, y: 0 };
          const localEndPoint = rect
            ? {
                x: selectEndPoint.x - rect.left,
                y: selectEndPoint.y - rect.top,
              }
            : { x: 0, y: 0 };

          return (
            <>
              {/* Componente de área de seleção */}
              <SelectionArea
                localStartPoint={localStartPoint}
                localEndPoint={localEndPoint}
              />

              {/* Barra de ferramentas vertical */}
              <ToolbarVertical
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                centerView={centerView}
                resetView={() => {
                  setTransform(position.x, position.y, 1);
                  setScale(1);
                }}
                canMove={canMove}
                setCanMove={setCanMove}
                position={position}
                scale={scale}
                setStateAndNotify={setStateAndNotify}
              />

              {/* Barra de ferramentas horizontal */}
              <ToolbarHorizontal
                snapToGrid={snapToGrid}
                handleSnapToGrid={handleSnapToGrid}
                viewMode={viewMode}
              />

              {/* Painel de status */}
              <StatusPanel scale={scale} position={position} />
              <ContextMenu containerRef={screenRef} i18n={i18n}>
                {({ handleContextMenu }) => (
                  <TransformComponent
                    contentClass="main"
                    wrapperStyle={wrapperStyle}
                    wrapperProps={wrapperProps(handleContextMenu)}
                  >
                    {state?.nodes &&
                      Object.values(state.nodes).map((node, index) => {
                        const nodeDef = nodeTypes[node.type];

                        if (node.type === "comment")
                          return (
                            <Comment
                              nodeId={node.id}
                              text={node.value || ""}
                              title={node.title || ""}
                              isSelected={selectedNodes.includes(node.id)}
                              onChangeText={(value) => {
                                setStateAndNotify((prev) => ({
                                  ...prev,
                                  nodes: {
                                    ...prev.nodes,
                                    [node.id]: {
                                      ...prev.nodes[node.id],
                                      value,
                                    },
                                  },
                                }));
                              }}
                              onChangeTitle={(title) => {
                                setStateAndNotify((prev) => ({
                                  ...prev,
                                  nodes: {
                                    ...prev.nodes,
                                    [node.id]: {
                                      ...prev.nodes[node.id],
                                      title,
                                    },
                                  },
                                }));
                              }}
                              key={node.id}
                              id={node.id}
                              position={node.position}
                              size={node.size}
                              onResize={(size) => {
                                if (snapToGrid) {
                                  size.w =
                                    Math.round(size.w / gridSize) * gridSize;
                                  size.h =
                                    Math.round(size.h / gridSize) * gridSize;
                                }

                                setStateAndNotify((prev) => ({
                                  ...prev,
                                  nodes: {
                                    ...prev.nodes,
                                    [node.id]: {
                                      ...prev.nodes[node.id],
                                      size,
                                    },
                                  },
                                }));
                              }}
                              onMove={(position) =>
                                moveHandler(node, position, false)
                              }
                              onMoveEnd={(position) =>
                                moveHandler(node, position, true)
                              }
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

                        return (
                          <>
                            <Node
                              id={`node_${node.id}`}
                              key={`node_${node.id}`}
                              name={node.name}
                              portTypes={portTypes}
                              nodeType={nodeTypes?.[node.type]}
                              debugMode={debugMode}
                              value={node}
                              isSelected={selectedNodes.includes(node.id)}
                              onValueChange={(v) => {
                                handleValueChange(node.id, { ...v.values });
                              }}
                              onChangePosition={(position) =>
                                moveHandler(node, position, false)
                              }
                              onDragEnd={(position) =>
                                moveHandler(node, position, true)
                              }
                              containerRef={screenRef}
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
                                          ...(prev.nodes[node.id].connections
                                            ?.outputs ?? []),
                                        ],
                                      },
                                    },
                                  },
                                }));
                              }}
                            />
                          </>
                        );
                      })}

                    {/* Camada única de SVG para todas as conexões */}
                    <svg
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: (rect ? rect.width : 0) / (scale || 1),
                        height: (rect ? rect.height : 0) / (scale || 1),
                        overflow: "visible",
                        zIndex: -1,
                        pointerEvents: "none",
                      }}
                    >
                      {state?.nodes &&
                        Object.values(state.nodes).map((node) =>
                          node.connections?.outputs?.map(
                            (connection, index) => {
                              const srcNode = node.id;
                              const srcPort = connection.name;
                              const dstNode = connection.node;
                              const dstPort = connection.port;
                              const connType = connection.type;
                              const waypoints = connection.waypoints || [];

                              const srcBox = document.getElementById(
                                `card-${srcNode}`
                              );
                              const dstBox = document.getElementById(
                                `card-${dstNode}`
                              );

                              const srcElem = document.getElementById(
                                `card-${srcNode}-output-${srcPort}`
                              );
                              const dstElem = document.getElementById(
                                `card-${dstNode}-input-${dstPort}`
                              );

                              const containerRect = getContRect();
                              if (
                                !srcElem ||
                                !dstElem ||
                                !containerRect ||
                                !srcBox ||
                                !dstBox
                              ) {
                                return null;
                              }

                              const srcRect = srcElem.getBoundingClientRect();
                              const dstRect = dstElem.getBoundingClientRect();

                              const srcBoxRect = srcBox.getBoundingClientRect();
                              const dstBoxRect = dstBox.getBoundingClientRect();

                              const screenRect = getContRect();

                              const srcPos = {
                                x:
                                  (srcRect.x -
                                    position.x -
                                    screenRect.left +
                                    srcRect.width / 2) /
                                  scale,
                                y:
                                  (srcRect.y -
                                    position.y -
                                    screenRect.top +
                                    srcRect.height / 2) /
                                  scale,
                              };

                              const dstPos = {
                                x:
                                  (dstRect.x -
                                    position.x -
                                    screenRect.left +
                                    dstRect.width / 2) /
                                  scale,
                                y:
                                  (dstRect.y -
                                    position.y -
                                    screenRect.top +
                                    dstRect.height / 2) /
                                  scale,
                              };

                              const box1 = {
                                x:
                                  (srcBoxRect.x -
                                    position.x -
                                    screenRect.left) /
                                  scale,
                                y:
                                  (srcBoxRect.y - position.y - screenRect.top) /
                                  scale,
                                w: srcBoxRect.width,
                                h: srcBoxRect.height,
                              };

                              const box2 = {
                                x:
                                  (dstBoxRect.x -
                                    position.x -
                                    screenRect.left) /
                                  scale,
                                y:
                                  (dstBoxRect.y - position.y - screenRect.top) /
                                  scale,
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
                                  onUpdateWaypoint={(
                                    waypointIndex,
                                    newPosition
                                  ) =>
                                    updateWaypointPosition(
                                      srcNode,
                                      srcPort,
                                      dstNode,
                                      dstPort,
                                      waypointIndex,
                                      newPosition
                                    )
                                  }
                                  isWaypointSelected={(waypointIndex) =>
                                    isWaypointSelected({
                                      srcNode,
                                      srcPort,
                                      dstNode,
                                      dstPort,
                                      waypointIndex,
                                    })
                                  }
                                  onWaypointMouseDown={(e, waypointIndex) => {
                                    if (e.ctrlKey) {
                                      removeWaypointFromSelection({
                                        srcNode,
                                        srcPort,
                                        dstNode,
                                        dstPort,
                                        waypointIndex,
                                      });
                                    } else if (e.shiftKey) {
                                      addWaypointToSelection({
                                        srcNode,
                                        srcPort,
                                        dstNode,
                                        dstPort,
                                        waypointIndex,
                                      });
                                    } else {
                                      if (
                                        !isWaypointSelected({
                                          srcNode,
                                          srcPort,
                                          dstNode,
                                          dstPort,
                                          waypointIndex,
                                        })
                                      ) {
                                        setSelectedWaypoints([
                                          {
                                            srcNode,
                                            srcPort,
                                            dstNode,
                                            dstPort,
                                            waypointIndex,
                                          },
                                        ]);
                                      }
                                    }
                                  }}
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
                                                const contextMenuRect =
                                                  getContRect();
                                                const pointerX =
                                                  (e.clientX -
                                                    contextMenuRect.left -
                                                    position.x) /
                                                  scale;
                                                const pointerY =
                                                  (e.clientY -
                                                    contextMenuRect.top -
                                                    position.y) /
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
                            }
                          )
                        )}

                      {(dragInfo || isInFadeout) && dstDragPosition ? (
                        <ConnectorCurveForward
                          tmp
                          invalid={isInFadeout}
                          src={{
                            x:
                              (((dragInfo && dragInfo.startX) ||
                                (isInFadeout && dstDragPosition.srcX)) -
                                getContRect().left -
                                position.x +
                                PORT_SIZE / 2 -
                                2) /
                              scale,
                            y:
                              (((dragInfo && dragInfo.startY) ||
                                (isInFadeout && dstDragPosition.srcY)) -
                                getContRect().top -
                                position.y +
                                PORT_SIZE / 2 -
                                2) /
                              scale,
                          }}
                          dst={{
                            x:
                              (dstDragPosition.x -
                                window.scrollX -
                                getContRect().left -
                                position.x) /
                              scale,
                            y:
                              (dstDragPosition.y -
                                window.scrollY -
                                getContRect().top -
                                position.y) /
                              scale,
                          }}
                          scale={scale}
                        />
                      ) : null}
                    </svg>
                  </TransformComponent>
                )}
              </ContextMenu>
            </>
          );
        }}
      </TransformWrapper>
    </div>
  );
}

export default Screen;
