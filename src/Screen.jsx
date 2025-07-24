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

import nodeCss from "./Node.module.css";
import nodePortCss from "./NodePort.module.css";
import commentCss from "./Comment.module.css";
import { useTheme } from "./ThemeProvider.js";

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

// Importar componentes extraídos
import {
  ToolbarVertical,
  ToolbarHorizontal,
  StatusPanel,
  SelectionArea,
} from "./components";
import { useElementMovement } from "./hooks/useElementMovement.js";

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
    "--color-primary": currentTheme.colors.primary,
    "--color-secondary": currentTheme.colors.secondary,
    "--color-bg": currentTheme.colors.background,
    "--color-text": currentTheme.colors.text,
    "--color-hover": currentTheme.colors.hover,
    "--roundness": currentTheme.roundness,
  };

  const { dragInfo } = useDragContext();
  const { position, setPosition, scale, setScale } = useScreenContext();

  const [dstDragPosition, setDstDragPosition] = useState({ x: 0, y: 0 });
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });

  const [state, setState] = useState(initialState);
  const [shouldNotify, setShouldNotify] = useState(false);

  const [viewMode, setViewMode] = useState("select"); // 'select', 'move', 'select-add', 'select-remove'

  // Utilizando o hook de seleção para gerenciar seleção de elementos
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

  const debounceEvent = useCallback(
    (fn, wait = 200, time) =>
      (...args) =>
        clearTimeout(time, (time = setTimeout(() => fn(...args), wait))),
    []
  );

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

  const screenRef = useRef();
  const contRect = screenRef.current?.getBoundingClientRect();

  const wrapperRef = useRef();

  // Integrar hook de operações de nós
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

  // Integrate clipboard hook
  const { copyNodesToClipboard, pasteNodesFromClipboard } = useClipboard({
    state,
    setStateAndNotify,
    setSelectedNodes,
    setSelectedWaypoints,
    nodeTypes,
    position,
    scale,
    pointerPosition, // Agora pointerPosition está sempre atualizado
    screenRef,
  });

  // Integrar hook de atalhos de teclado
  useKeyboardShortcuts({
    screenRef,
    removeNodes,
    selectedNodes,
    setSelectedNodes,
    selectAllNodes,
    copyNodesToClipboard,
    pasteNodesFromClipboard,
  });

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

      // check if shift is pressed
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

      const handleMouseMove = (event) => {
        const dx = event.pageX + window.scrollX;
        const dy = event.pageY + window.scrollY;

        setSelectEndPoint({ x: dx, y: dy });
      };

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

          // Definir p1 e p2 fora do loop para que estejam disponíveis para o processAreaSelection
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

          // Procurar por waypoints na área selecionada
          const selectedWaypoints = [];

          // Iterar por todos os nós para encontrar comentários e waypoints
          if (state.nodes) {
            Object.values(state.nodes).forEach((node) => {
              // Verificar waypoints em conexões
              if (node.connections?.outputs) {
                node.connections.outputs.forEach((connection) => {
                  if (connection.waypoints) {
                    connection.waypoints.forEach((waypoint, waypointIndex) => {
                      // Converter a posição do waypoint para coordenadas da tela
                      const waypointScreenX =
                        waypoint.x * scale + position.x + window.scrollX;
                      const waypointScreenY =
                        waypoint.y * scale + position.y + window.scrollY;

                      // Verificar se o waypoint está dentro da área selecionada
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

          console.warn("selectedWaypoints", selectedWaypoints);

          // Usa o método processAreaSelection do hook para processar a seleção
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

  useEffect(() => {
    //const { startX, startY } = dragInfo

    const mouseMoveListener = (event) => {
      const newPosition = {
        x: event.pageX - window.scrollX,
        y: event.pageY - window.scrollY,
      };

      // Armazenar a posição do mouse em uma variável global para acesso imediato
      window.mousePosition = newPosition;

      // Only log when position changes significantly to avoid console overload
      setPointerPosition(newPosition);
    };

    window.addEventListener("mousemove", mouseMoveListener);
    return () => {
      window.removeEventListener("mousemove", mouseMoveListener);
    };
  }, []); // Removi pointerPosition das dependências para evitar ciclos

  useEffect(() => {
    if (!dragInfo) {
      setDstDragPosition(null);
      return;
    }

    //const { startX, startY } = dragInfo

    const mouseMoveListener = (event) => {
      const dx = event.pageX; //- startX
      const dy = event.pageY; //- startY

      setDstDragPosition({ x: dx, y: dy });
    };

    window.addEventListener("mousemove", mouseMoveListener);
    return () => {
      window.removeEventListener("mousemove", mouseMoveListener);
    };
  }, [dragInfo]);

  // Funções de manipulação de nós foram movidas para o hook useNodeOperations

  // Funções de manipulação de nós foram movidas para o hook useNodeOperations

  // Funções de manipulação de nós foram movidas para o hook useNodeOperations

  const [isMoveable, setIsMoveable] = useState(false);
  const [canMove, setCanMove] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const onZoom = useCallback(
    (params) => {
      const _scale = params.state.scale;
      setScale(_scale);

      const _position = {
        x: params.state.positionX,
        y: params.state.positionY,
      };
      setPosition(_position);
    },
    [setPosition, setScale]
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
      setPosition(_position);
    },
    [setPosition]
  );

  const onTransformEnd = useCallback(
    (params) => {
      const {
        state: { positionX, positionY, scale: _scale },
      } = params;

      setPosition({ x: positionX, y: positionY });
      setScale(_scale);

      debounceEvent((px, py, s) => {
        setStateAndNotify((prev) => {
          return {
            ...prev,
            position: { x: px, y: py },
            scale: s,
          };
        });
      }, 200)(positionX, positionY, _scale);
    },
    [setPosition, setScale, setStateAndNotify, debounceEvent]
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

  // Utilizando connectNodes do hook useNodeOperations
  const onConnect = useCallback(
    (connection) => {
      connectNodes(connection);
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
      backgroundColor: currentTheme.colors.background,
      backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
      backgroundImage: `linear-gradient(to right, ${currentTheme.colors.hover} 1px, transparent 1px), linear-gradient(to bottom, ${currentTheme.colors.hover} 1px, transparent 1px)`,
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

  // Utilizando updateNodeValues do hook useNodeOperations
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
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 20,
          border: "1px solid red",
          fontSize: "8px",
          height: "calc( 100vh - 36px )",
        }}
      >
        State
        <pre style={{ height: "100%" }}>{JSON.stringify(state, null, 2)}</pre>
      </div>

      <div
        style={{
          position: "absolute",
          top: 10,
          right: 50,
          border: "1px solid red",
          fontSize: "8px",
          height: "calc( 100vh - 36px )",
        }}
      >
        Selections
        <pre style={{ height: "100%" }}>
          {JSON.stringify({ selectedNodes, selectedWaypoints }, null, 2)}
        </pre>
      </div>
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
          const localStartPoint = contRect
            ? {
                x: selectStartPoint.x - contRect.left,
                y: selectStartPoint.y - contRect.top,
              }
            : { x: 0, y: 0 };
          const localEndPoint = contRect
            ? {
                x: selectEndPoint.x - contRect.left,
                y: selectEndPoint.y - contRect.top,
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
                              text={
                                JSON.stringify({
                                  selectedNodes,
                                  selectedWaypoints,
                                }) || ""
                              }
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
                                // O objetivo aqui é disparar a renderização das conexões.
                                // Se houver um modo melhor, por favor, me avise.
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
                            {node.connections?.outputs?.map(
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

                                if (
                                  !srcElem ||
                                  !dstElem ||
                                  !contRect ||
                                  !srcBox ||
                                  !dstBox
                                ) {
                                  return null;
                                }

                                const srcRect = srcElem.getBoundingClientRect();
                                const dstRect = dstElem.getBoundingClientRect();

                                const srcBoxRect =
                                  srcBox.getBoundingClientRect();
                                const dstBoxRect =
                                  dstBox.getBoundingClientRect();

                                const srcPos = {
                                  x:
                                    (srcRect.x -
                                      position.x -
                                      contRect.left +
                                      srcRect.width / 2) /
                                    scale,
                                  y:
                                    (srcRect.y -
                                      position.y -
                                      contRect.top +
                                      srcRect.height / 2) /
                                    scale,
                                };

                                const dstPos = {
                                  x:
                                    (dstRect.x -
                                      position.x -
                                      contRect.left +
                                      dstRect.width / 2) /
                                    scale,
                                  y:
                                    (dstRect.y -
                                      position.y -
                                      contRect.top +
                                      dstRect.height / 2) /
                                    scale,
                                };

                                const box1 = {
                                  x:
                                    (srcBoxRect.x -
                                      position.x -
                                      contRect.left) /
                                    scale,
                                  y:
                                    (srcBoxRect.y - position.y - contRect.top) /
                                    scale,
                                  w: srcBoxRect.width,
                                  h: srcBoxRect.height,
                                };

                                const box2 = {
                                  x:
                                    (dstBoxRect.x -
                                      position.x -
                                      contRect.left) /
                                    scale,
                                  y:
                                    (dstBoxRect.y - position.y - contRect.top) /
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
                                      // Verificar se Ctrl ou Shift está pressionado para seleção múltipla
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
                                        // Se não for seleção múltipla, limpar seleção anterior
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

                                      // Não bloqueamos o evento para permitir que o manipulador interno do ConnectorCurve
                                      // seja chamado para lidar com o arrasto
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
                                                  "Remover desvio"
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
                                                    (e.clientX -
                                                      contRect.left -
                                                      position.x) /
                                                    scale;
                                                  const pointerY =
                                                    (e.clientY -
                                                      contRect.top -
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
                            )}
                          </>
                        );
                      })}

                    {dragInfo && dstDragPosition ? (
                      <ConnectorCurveForward
                        tmp
                        src={{
                          x:
                            (dragInfo.startX -
                              contRect.left -
                              position.x +
                              PORT_SIZE / 2 -
                              2) /
                            scale,
                          y:
                            (dragInfo.startY -
                              contRect.top -
                              position.y +
                              PORT_SIZE / 2 -
                              2) /
                            scale,
                        }}
                        dst={{
                          x:
                            (dstDragPosition.x -
                              window.scrollX -
                              contRect.left -
                              position.x) /
                            scale,
                          y:
                            (dstDragPosition.y -
                              window.scrollY -
                              contRect.top -
                              position.y) /
                            scale,
                        }}
                        scale={scale}
                      />
                    ) : null}
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
