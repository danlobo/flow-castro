import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import Node from "./Node.jsx";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useDragContext } from "./DragContext.jsx";
import { useScreenContext, useScreenViewportRef } from "./ScreenContext.jsx";
import { ConnectorCurve, ConnectorCurveForward } from "./ConnectorCurve.jsx";
import { ContextMenu } from "./ContextMenu.jsx";
import css from "./Screen.module.css";
import { useDebounceCallback } from "./hooks/useDebounceCallback";

import nodeCss from "./Node.module.css";
import nodePortCss from "./NodePort.module.css";
import commentCss from "./Comment.module.css";
import { useTheme } from "./ThemeProvider.jsx";

import { i } from "./util/i18n.js";
import { layoutFlow } from "./util/layout.js";
import { measurePortOffsets } from "./util/measurePorts.js";
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
  "contextMenu.organize": "Organize flow",
  "contextMenu.organizeSelection": "Organize selection",
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
  readOnly = false,
  highlightedNodes,
  highlightedConnections,
  onNodeClick,
  centerOnNode,
  layoutOptions,
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
  const viewportRef = useScreenViewportRef();

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
    [setState],
  );

  const notifyStateChange = useDebounceCallback(onChangeState, 150);

  useEffect(() => {
    if (shouldNotify) {
      notifyStateChange(state);
      setShouldNotify(false);
    }
  }, [state, notifyStateChange, shouldNotify]);

  const screenRef = useRef();

  const getContRect = useCallback(() => {
    return screenRef.current?.getBoundingClientRect() ?? null;
  }, []);

  // Força um render extra APÓS cada commit que alterou posições de nós.
  // Isso garante que getBoundingClientRect() nos conectores leia o DOM
  // já atualizado (e não o DOM do commit anterior).
  const [, forceConnectorUpdate] = useReducer((x) => x + 1, 0);
  useLayoutEffect(() => {
    forceConnectorUpdate();
  }, [state?.nodes]);

  const wrapperRef = useRef();
  const transformControlsRef = useRef({ setTransform: null });

  // Centralizar / zoom no nó indicado quando centerOnNode mudar
  useEffect(() => {
    if (!centerOnNode || !wrapperRef.current || !screenRef.current) return;
    const element = screenRef.current.querySelector(
      `#card-${CSS.escape(centerOnNode)}`,
    );
    if (!element) return;
    const wrapperWidth = screenRef.current.offsetWidth;
    const wrapperHeight = screenRef.current.offsetHeight;
    const nodeWidth = element.offsetWidth;
    const nodeHeight = element.offsetHeight;
    const fitScale = Math.min(
      wrapperWidth / nodeWidth,
      wrapperHeight / nodeHeight,
    );
    wrapperRef.current.zoomToElement(element, fitScale * 0.85);
  }, [centerOnNode]);
  const middleMousePanRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    lastPosX: 0,
    lastPosY: 0,
  });
  const positionRef = useRef(position);
  const scaleRef = useRef(scale);

  // Manter refs atualizadas
  useEffect(() => {
    positionRef.current = position;
    scaleRef.current = scale;
  }, [position, scale]);

  // Handler para pan com botão do meio do mouse
  useEffect(() => {
    if (!screenRef.current) return;

    const handleMiddleMouseDown = (e) => {
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();

        middleMousePanRef.current = {
          isPanning: true,
          startX: e.clientX,
          startY: e.clientY,
          lastPosX: positionRef.current.x,
          lastPosY: positionRef.current.y,
        };

        const handleMiddleMouseMove = (e) => {
          if (
            middleMousePanRef.current.isPanning &&
            transformControlsRef.current.setTransform
          ) {
            e.preventDefault();

            // Calcular imediatamente sem esperar
            requestAnimationFrame(() => {
              const deltaX = e.clientX - middleMousePanRef.current.startX;
              const deltaY = e.clientY - middleMousePanRef.current.startY;

              const newPosX = middleMousePanRef.current.lastPosX + deltaX;
              const newPosY = middleMousePanRef.current.lastPosY + deltaY;

              transformControlsRef.current.setTransform(
                newPosX,
                newPosY,
                scaleRef.current,
                0,
              );
            });
          }
        };

        const handleMiddleMouseUp = (e) => {
          if (e.button === 1 && middleMousePanRef.current.isPanning) {
            middleMousePanRef.current.isPanning = false;

            document.removeEventListener("mousemove", handleMiddleMouseMove);
            document.removeEventListener("mouseup", handleMiddleMouseUp);
          }
        };

        document.addEventListener("mousemove", handleMiddleMouseMove);
        document.addEventListener("mouseup", handleMiddleMouseUp);
      }
    };

    screenRef.current.addEventListener("mousedown", handleMiddleMouseDown);

    return () => {
      if (screenRef.current) {
        screenRef.current.removeEventListener(
          "mousedown",
          handleMiddleMouseDown,
        );
      }
    };
  }, []); // Sem dependências - só roda uma vez!

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
    [setSelectEndPoint],
  );

  const throttledUpdateSelectEndPoint = useCallback(
    throttle(updateSelectEndPoint, 16, { leading: true, trailing: false }),
    [updateSelectEndPoint],
  );

  const throttledSetScale = useCallback(
    throttle(setScale, 16, { leading: true, trailing: true }),
    [setScale],
  );

  const handleMouseDown = useCallback(
    (event) => {
      if (readOnly) return;
      if (event.button === 1) {
        //middle mouse button - do not capture it, let TransformWrapper handle it
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
            const cardElement = screenRef.current?.querySelector(
              `#card-${CSS.escape(node.id)}`,
            );
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
            selectedWaypoints,
          );

          setSelectStartPoint(_posEnd);
        }
        setSelectStartPoint({ x: 0, y: 0 });
        setSelectEndPoint({ x: 0, y: 0 });
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [position, scale, state, selectedNodes, readOnly],
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
    [setPointerPosition],
  );

  const throttledMouseMoveListener = useCallback(
    throttle(handleMousePositionUpdate, 16, { leading: true, trailing: false }),
    [handleMousePositionUpdate],
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
      },
      16, // 60fps
      { leading: true, trailing: true },
    ),
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
    [throttledPositionUpdate, throttledSetScale],
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
    [setStateAndNotify],
  );

  const onTransform = useCallback(
    (params) => {
      const _position = {
        x: params.state.positionX,
        y: params.state.positionY,
      };
      throttledPositionUpdate(_position);
    },
    [throttledPositionUpdate],
  );

  const onTransformEnd = useCallback(
    (params) => {
      const {
        state: { positionX, positionY, scale: _scale },
      } = params;

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
    [setPosition, setScale, setStateAndNotify],
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
    [connectNodes],
  );

  const pinchOptions = useMemo(
    () => ({
      step: 5,
    }),
    [],
  );
  const panningOptions = useMemo(
    () => ({
      disabled: isMoveable,
      excluded: [
        nodeCss.node,
        nodePortCss.port,
        nodePortCss.portConnector,
        commentCss.container,
        commentCss.moveHandler,
      ],
    }),
    [isMoveable],
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
    [scaledGridSize, scaledPositionX, scaledPositionY, currentTheme],
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
    pinned: true,
    label: i(i18n, "contextMenu.addComment.label", {}, "Add comment"),
    description: i(
      i18n,
      "contextMenu.addComment.description",
      {},
      "Add a comment to the screen",
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

  /**
   * Rearranges the flow with the layered layout. The ports are measured from
   * the DOM first: the algorithm has no idea how a custom node renders them,
   * and it uses their position to line the edges up and to keep the outputs
   * in their on-screen order.
   */
  const organizeFlow = useCallback(
    (only) => {
      const portOffsets = measurePortOffsets(
        screenRef.current,
        state,
        scaleRef.current,
      );

      setStateAndNotify((prev) =>
        layoutFlow(prev, {
          only,
          portOffsets,
          gridSize: snapToGrid ? gridSize : 0,
          ...layoutOptions,
        }),
      );
    },
    [state, setStateAndNotify, snapToGrid, gridSize, layoutOptions],
  );

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
      onContextMenu: readOnly
        ? undefined
        : (e) =>
            handleContextMenu(e, [
              // Pinned, so they stay at the top instead of being sorted in
              // among the node categories.
              cmMenu(e),
              {
                pinned: true,
                label: i(i18n, "contextMenu.organize", {}, "Organize flow"),
                onClick: () => organizeFlow(null),
              },
              selectedNodes?.length > 1
                ? {
                    pinned: true,
                    label: i(
                      i18n,
                      "contextMenu.organizeSelection",
                      {},
                      "Organize selection",
                    ),
                    onClick: () => organizeFlow(selectedNodes),
                  }
                : null,
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
                      "Add " + nodeType.label,
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
                        _position.x =
                          Math.round(_position.x / gridSize) * gridSize;
                        _position.y =
                          Math.round(_position.y / gridSize) * gridSize;
                      }

                      addNode(nodeType, _position);
                    },
                  })),
              })),
            ]),
      onMouseDown: handleMouseDown,
      onClick: (e) => {
        if (e.target === wrapperRef.current.instance.wrapperComponent)
          screenRef.current.focus({ preventScroll: true });
      },
    }),
    [
      state,
      viewMode,
      nodeTypesByCategory,
      addNode,
      position,
      scale,
      readOnly,
      organizeFlow,
      selectedNodes,
    ],
  );

  const handleValueChange = useCallback(
    (id, values) => {
      updateNodeValues(id, values);
    },
    [updateNodeValues],
  );

  const handleSnapToGrid = useCallback(() => {
    setSnapToGrid((prev) => !prev);
  }, []);

  /**
   * Every node is handed the same handler instances and the node id travels
   * with the call, instead of a closure being built per node on every render.
   * A fresh closure per node was defeating `memo(Node)` outright: moving a
   * single node re-rendered all of them. The volatile values the handlers need
   * are read from a ref, refreshed below on each render, so a stable identity
   * never means a stale read.
   */
  const nodeHandlerDeps = useRef({});
  nodeHandlerDeps.current = {
    state,
    i18n,
    nodeTypes,
    selectedNodes,
    moveHandler,
    handleValueChange,
    cloneNode,
    removeNodes,
    organizeFlow,
    onNodeClick,
  };

  const connectorDeps = useRef({});
  connectorDeps.current = {
    i18n,
    canMove,
    addWaypoint,
    removeWaypoint,
    updateWaypointPosition,
    removeConnectionFromOutput,
    isWaypointSelected,
    addWaypointToSelection,
    removeWaypointFromSelection,
    setSelectedWaypoints,
  };

  /** Set from inside the ContextMenu render prop, which is where it exists. */
  const contextMenuRef = useRef(null);

  const handleNodeValueChange = useCallback((nodeId, values) => {
    nodeHandlerDeps.current.handleValueChange(nodeId, values);
  }, []);

  const handleNodePositionChange = useCallback((nodeId, position) => {
    const { state: current, moveHandler: move } = nodeHandlerDeps.current;
    const node = current?.nodes?.[nodeId];
    if (node) move(node, position, false);
  }, []);

  const handleNodeDragEnd = useCallback((nodeId, position) => {
    const { state: current, moveHandler: move } = nodeHandlerDeps.current;
    const node = current?.nodes?.[nodeId];
    if (node) move(node, position, true);
  }, []);

  const handleNodeClick = useCallback((nodeId) => {
    nodeHandlerDeps.current.onNodeClick?.(nodeId);
  }, []);

  const handleNodeResize = useCallback(
    (nodeId, size) => {
      setState((prev) => {
        const node = prev.nodes?.[nodeId];
        if (!node) return prev;

        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [nodeId]: {
              ...node,
              size,
              connections: {
                ...node.connections,
                outputs: [...(node.connections?.outputs ?? [])],
              },
            },
          },
        };
      });
    },
    [setState],
  );

  /**
   * Connector geometry, cached per connection.
   *
   * Drawing a connection means four `querySelector` calls and four
   * `getBoundingClientRect` reads to find where its two ports ended up. At a
   * thousand connections that loop is by far the most expensive thing in a
   * render - with the nodes memoized it is what is left.
   *
   * The numbers only depend on the two nodes at the ends, and those come out of
   * state as new objects whenever anything about them changes, so identity is
   * the invalidation signal. Pan and zoom cannot change the result at all: the
   * math converts screen coordinates back into canvas coordinates, so the
   * viewport cancels out - which is why the cache survives them untouched.
   *
   * Each change is measured twice on purpose. React renders before the DOM is
   * updated, so the first read after a node moves still sees the old layout;
   * `forceConnectorUpdate` below schedules the second render, and the entry
   * stays `settled: false` until it has been measured there.
   */
  const connectorGeometryRef = useRef(new Map());
  const connectorViewportRef = useRef(null);

  const connectorHandlersRef = useRef(new Map());

  // The cached numbers are relative to the container, so they only go stale if
  // the container itself moves on screen - a window resize or a page scroll.
  const containerRect = getContRect();
  const containerKey = containerRect
    ? `${containerRect.left}:${containerRect.top}:${containerRect.width}:${containerRect.height}`
    : "";
  if (connectorViewportRef.current !== containerKey) {
    connectorViewportRef.current = containerKey;
    connectorGeometryRef.current.clear();
  }

  /**
   * Which of a connection's waypoints are selected, as a plain string: a fresh
   * array or predicate per render would defeat the connector's memo.
   */
  const selectedWaypointsKey = (
    srcNode,
    srcPort,
    dstNode,
    dstPort,
    waypoints,
  ) => {
    if (!selectedWaypoints?.length || !waypoints?.length) return "";

    return selectedWaypoints
      .filter(
        (w) =>
          w.srcNode === srcNode &&
          w.srcPort === srcPort &&
          w.dstNode === dstNode &&
          w.dstPort === dstPort,
      )
      .map((w) => w.waypointIndex)
      .sort((a, b) => a - b)
      .join(",");
  };

  const getConnectorGeometry = (
    srcNode,
    srcPort,
    dstNode,
    dstPort,
    connKey,
  ) => {
    const cache = connectorGeometryRef.current;
    const srcNodeValue = state?.nodes?.[srcNode];
    const dstNodeValue = state?.nodes?.[dstNode];

    const cached = cache.get(connKey);
    const sameState = Boolean(
      cached &&
      cached.srcNodeValue === srcNodeValue &&
      cached.dstNodeValue === dstNodeValue,
    );

    if (sameState && cached.settled) {
      return cached.geometry;
    }

    const srcBox = screenRef.current?.querySelector(
      `#card-${CSS.escape(srcNode)}`,
    );
    const dstBox = screenRef.current?.querySelector(
      `#card-${CSS.escape(dstNode)}`,
    );

    const srcElem = screenRef.current?.querySelector(
      `#card-${CSS.escape(srcNode)}-output-${CSS.escape(srcPort)}`,
    );
    const dstElem = screenRef.current?.querySelector(
      `#card-${CSS.escape(dstNode)}-input-${CSS.escape(dstPort)}`,
    );

    const screenRect = getContRect();
    if (!srcElem || !dstElem || !screenRect || !srcBox || !dstBox) {
      return null;
    }

    const srcRect = srcElem.getBoundingClientRect();
    const dstRect = dstElem.getBoundingClientRect();
    const srcBoxRect = srcBox.getBoundingClientRect();
    const dstBoxRect = dstBox.getBoundingClientRect();

    const toCanvas = (rect, centered) => ({
      x:
        (rect.x -
          position.x -
          screenRect.left +
          (centered ? rect.width / 2 : 0)) /
        scale,
      y:
        (rect.y -
          position.y -
          screenRect.top +
          (centered ? rect.height / 2 : 0)) /
        scale,
    });

    const geometry = {
      srcPos: toCanvas(srcRect, true),
      dstPos: toCanvas(dstRect, true),
      box1: {
        ...toCanvas(srcBoxRect, false),
        w: srcBoxRect.width,
        h: srcBoxRect.height,
      },
      box2: {
        ...toCanvas(dstBoxRect, false),
        w: dstBoxRect.width,
        h: dstBoxRect.height,
      },
    };

    cache.set(connKey, {
      srcNodeValue,
      dstNodeValue,
      geometry,
      // Settled only once this same state has been measured a second time,
      // against a DOM that already reflects it.
      settled: sameState,
    });

    return geometry;
  };

  /**
   * The handlers a connection hands down never change for the life of that
   * connection, so they are built once and kept, instead of five new closures
   * per connection per render - the same reason the node handlers are stable.
   */
  const getConnectorHandlers = (
    srcNode,
    srcPort,
    dstNode,
    dstPort,
    connKey,
  ) => {
    const existing = connectorHandlersRef.current.get(connKey);
    if (existing) return existing;

    const wp = (waypointIndex) => ({
      srcNode,
      srcPort,
      dstNode,
      dstPort,
      waypointIndex,
    });

    const handlers = {
      onUpdateWaypoint: (waypointIndex, newPosition) =>
        connectorDeps.current.updateWaypointPosition(
          srcNode,
          srcPort,
          dstNode,
          dstPort,
          waypointIndex,
          newPosition,
        ),

      onWaypointMouseDown: (e, waypointIndex) => {
        const deps = connectorDeps.current;

        if (e.ctrlKey) {
          deps.removeWaypointFromSelection(wp(waypointIndex));
        } else if (e.shiftKey) {
          deps.addWaypointToSelection(wp(waypointIndex));
        } else if (!deps.isWaypointSelected(wp(waypointIndex))) {
          deps.setSelectedWaypoints([wp(waypointIndex)]);
        }
      },

      onWaypointContextMenu: (e, waypointIndex) => {
        const deps = connectorDeps.current;

        contextMenuRef.current?.(
          e,
          [
            deps.canMove
              ? {
                  label: i(
                    deps.i18n,
                    "contextMenu.removeWaypoint",
                    {},
                    "Remove waypoint",
                  ),
                  style: { color: "red" },
                  onClick: () =>
                    deps.removeWaypoint(
                      srcNode,
                      srcPort,
                      dstNode,
                      dstPort,
                      waypointIndex,
                    ),
                }
              : null,
          ].filter(Boolean),
        );
      },

      onContextMenu: (e) => {
        const deps = connectorDeps.current;

        contextMenuRef.current?.(
          e,
          [
            deps.canMove
              ? {
                  label: i(
                    deps.i18n,
                    "contextMenu.addWaypoint",
                    {},
                    "Add waypoint",
                  ),
                  onClick: () => {
                    const rect = getContRect();
                    const { position: pos, scale: sc } = viewportRef.current;

                    deps.addWaypoint(srcNode, srcPort, dstNode, dstPort, {
                      x: (e.clientX - rect.left - pos.x) / sc,
                      y: (e.clientY - rect.top - pos.y) / sc,
                    });
                  },
                }
              : null,
            deps.canMove
              ? {
                  label: i(
                    deps.i18n,
                    "contextMenu.removeThisConnection",
                    {},
                    "Remove this connection",
                  ),
                  style: { color: "red" },
                  onClick: () =>
                    deps.removeConnectionFromOutput(
                      srcNode,
                      srcPort,
                      dstNode,
                      dstPort,
                    ),
                }
              : null,
          ].filter(Boolean),
        );
      },
    };

    connectorHandlersRef.current.set(connKey, handlers);
    return handlers;
  };

  const handleNodeContextMenu = useCallback((event, nodeId) => {
    const {
      state: current,
      i18n: currentI18n,
      nodeTypes: currentNodeTypes,
      selectedNodes: currentSelection,
      cloneNode: clone,
      removeNodes: remove,
      organizeFlow: organize,
    } = nodeHandlerDeps.current;

    const nodeDef = currentNodeTypes?.[current?.nodes?.[nodeId]?.type];

    contextMenuRef.current?.(event, [
      !nodeDef?.root
        ? {
            label: i(
              currentI18n,
              "contextMenu.cloneThisNode",
              {},
              "Clone this node",
            ),
            onClick: () => {
              clone(nodeId);
            },
          }
        : null,
      currentSelection?.length > 1
        ? {
            label: i(
              currentI18n,
              "contextMenu.organizeSelection",
              {},
              "Organize selection",
            ),
            onClick: () => {
              organize(currentSelection);
            },
          }
        : null,
      !nodeDef?.root
        ? {
            label: i(
              currentI18n,
              "contextMenu.removeThisNode",
              {},
              "Remove this node",
            ),
            style: { color: "red" },
            onClick: () => {
              remove([nodeId]);
            },
          }
        : null,
      currentSelection?.length > 0
        ? {
            label: i(
              currentI18n,
              "contextMenu.removeSelectedNodes",
              {},
              "Remove selected nodes",
            ),
            style: { color: "red" },
            onClick: () => {
              remove(currentSelection);
            },
          }
        : null,
    ]);
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
          // Guardar setTransform na ref para uso no handler de botão do meio
          transformControlsRef.current.setTransform = setTransform;

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
                {({ handleContextMenu }) => {
                  // The node menu is opened from a handler shared by every
                  // node, so the opener travels by ref rather than by closure.
                  contextMenuRef.current = handleContextMenu;

                  return (
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
                                        "Clone this comment",
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
                                        "Remove this comment",
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
                                            "Remove selected nodes",
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
                            <Node
                              id={`node_${node.id}`}
                              key={`node_${node.id}`}
                              name={node.name}
                              portTypes={portTypes}
                              nodeType={nodeTypes?.[node.type]}
                              debugMode={debugMode}
                              value={node}
                              isSelected={selectedNodes.includes(node.id)}
                              onValueChange={
                                readOnly ? undefined : handleNodeValueChange
                              }
                              onChangePosition={
                                readOnly ? undefined : handleNodePositionChange
                              }
                              onDragEnd={
                                readOnly ? undefined : handleNodeDragEnd
                              }
                              containerRef={screenRef}
                              canMove={readOnly ? false : canMove}
                              onConnect={readOnly ? undefined : onConnect}
                              highlight={highlightedNodes?.[node.id]}
                              readOnly={readOnly}
                              onClick={
                                onNodeClick ? handleNodeClick : undefined
                              }
                              onContextMenu={
                                readOnly ? undefined : handleNodeContextMenu
                              }
                              onResize={handleNodeResize}
                            />
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
                            node.connections?.outputs?.map((connection) => {
                              const srcNode = node.id;
                              const srcPort = connection.name;
                              const dstNode = connection.node;
                              const dstPort = connection.port;
                              const waypoints = connection.waypoints;

                              const connKey = `${srcNode}:${srcPort}>${dstNode}:${dstPort}`;

                              const geometry = getConnectorGeometry(
                                srcNode,
                                srcPort,
                                dstNode,
                                dstPort,
                                connKey,
                              );
                              if (!geometry) return null;

                              const handlers = getConnectorHandlers(
                                srcNode,
                                srcPort,
                                dstNode,
                                dstPort,
                                connKey,
                              );

                              return (
                                <ConnectorCurve
                                  key={`connector-${connKey}`}
                                  type={portTypes[connection.type]}
                                  src={geometry.srcPos}
                                  dst={geometry.dstPos}
                                  n1Box={geometry.box1}
                                  n2Box={geometry.box2}
                                  scale={scale}
                                  waypoints={waypoints}
                                  highlight={
                                    highlightedConnections?.[connKey] ?? null
                                  }
                                  selectedWaypointsKey={selectedWaypointsKey(
                                    srcNode,
                                    srcPort,
                                    dstNode,
                                    dstPort,
                                    waypoints,
                                  )}
                                  onUpdateWaypoint={handlers.onUpdateWaypoint}
                                  onWaypointMouseDown={
                                    handlers.onWaypointMouseDown
                                  }
                                  onWaypointContextMenu={
                                    handlers.onWaypointContextMenu
                                  }
                                  onContextMenu={handlers.onContextMenu}
                                />
                              );
                            }),
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
                  );
                }}
              </ContextMenu>
            </>
          );
        }}
      </TransformWrapper>
    </div>
  );
}

export default Screen;
