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
import { nanoid } from "nanoid";
import css from "./Screen.module.css";

import nodeCss from "./Node.module.css";
import nodePortCss from "./NodePort.module.css";
import commentCss from "./Comment.module.css";
import { useTheme } from "./ThemeProvider.js";
import Button from "./Button.jsx";

import { i } from "./util/i18n.js";

import Icon from "@mdi/react";
import {
  mdiMagnifyPlus,
  mdiMagnifyMinus,
  mdiSetCenter,
  mdiMagnifyScan,
  mdiLock,
  mdiGrid,
  mdiGridOff,
  mdiSelectDrag,
  mdiCursorMove,
  mdiLockOpenVariant,
  mdiSelectRemove,
  mdiSelect,
} from "@mdi/js";
import Comment from "./Comment.jsx";

const defaultI18n = {
  "contextMenu.search": "Search",
  "contextMenu.add": "Add {nodeType}",
  "contextMenu.removeThisNode": "Remove this node",
  "contextMenu.removeSelectedNodes": "Remove selected nodes",
  "contextMenu.cloneThisNode": "Clone this node",
  "contextMenu.removeThisConnection": "Remove this connection",
};

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
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectStartPoint, setSelectStartPoint] = useState({ x: 0, y: 0 });
  const [selectEndPoint, setSelectEndPoint] = useState({ x: 0, y: 0 });

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
  }, []);

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

  useEffect(() => {
    if (shouldNotify) {
      onChangeState(state);
      setShouldNotify(false);
    }
  }, [state, shouldNotify, onChangeState]);

  const screenRef = useRef();
  const contRect = screenRef.current?.getBoundingClientRect();

  const wrapperRef = useRef();

  useEffect(() => {
    const srr = screenRef.current;

    if (!srr) return;

    const focusHandler = () => {};

    const keyHandler = (e) => {
      const inside = screenRef.current === document.activeElement;

      if (!inside) return;

      switch (e.key.toLowerCase()) {
        case "delete":
        case "backspace":
          console.log("delete");

          //delete selected nodes
          removeNodes(selectedNodes);
          break;
        case "escape":
          console.log("escape");
          setSelectedNodes([]);
          break;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "a":
            console.log("select all");

            e.preventDefault();
            e.stopPropagation();

            //select all nodes
            setSelectedNodes(Object.keys(state.nodes));

            break;
          case "c":
            console.log("copy");

            e.preventDefault();
            e.stopPropagation();

            //copy selected to clipboard
            const _selectedNodes = {};
            for (const nodeId of selectedNodes) {
              _selectedNodes[nodeId] = state.nodes[nodeId];
            }
            console.log("selected", _selectedNodes);
            const data = JSON.stringify(_selectedNodes);
            navigator.clipboard.writeText(data);

            break;
          case "v":
            console.log("paste");
            //paste from clipboard

            e.preventDefault();
            e.stopPropagation();

            navigator.clipboard.readText().then((data) => {
              console.log("clipboard", data);
              try {
                const _nodes = JSON.parse(data);
                console.log("clipboard", _nodes);

                // validate nodes
                const jsonNodes = Object.values(_nodes).filter(
                  (node) => !node.root
                );
                let valid = true;
                for (const node of jsonNodes) {
                  if (!nodeTypes[node.type]) {
                    console.log("invalid node type", node.type);
                    valid = false;
                    break;
                  }

                  if (!node.position) {
                    console.log("invalid node position", node.position);
                    valid = false;
                    break;
                  }

                  if (
                    node.connections?.inputs == null ||
                    node.connections?.outputs == null
                  ) {
                    console.log("invalid node connections", node.connections);
                    valid = false;
                    break;
                  }
                }

                if (!valid) return;

                // find node with minimum x position from nodes
                const nodeWithMinX = jsonNodes.reduce((acc, node) => {
                  if (
                    node.position.x <
                    (acc?.position?.x ?? Number.POSITIVE_INFINITY)
                  )
                    return node;
                  return acc;
                }, null);

                const delta = {
                  x: nodeWithMinX.position.x,
                  y: nodeWithMinX.position.y,
                };

                const { x, y } = screenRef.current.getBoundingClientRect();
                const pos = {
                  x: (pointerPosition.x - x - position.x) / scale,
                  y: (pointerPosition.y - y - position.y) / scale,
                };

                console.log("positioning", pointerPosition, x, y, position);

                const idsDict = {};

                const nodes = jsonNodes.map((node) => {
                  const oldId = node.id;
                  const newId = nanoid();

                  idsDict[oldId] = newId;

                  return {
                    ...node,
                    id: newId,
                    position: {
                      x: node.position.x - delta.x + pos.x,
                      y: node.position.y - delta.y + pos.y,
                    },
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
                    }
                  }
                }

                setStateAndNotify((prev) => ({
                  ...prev,
                  nodes: {
                    ...prev.nodes,
                    ...nodes.reduce((acc, node) => {
                      acc[node.id] = node;
                      return acc;
                    }, {}),
                  },
                }));

                setSelectedNodes(nodes.map((n) => n.id));
              } catch (err) {
                console.log("invalid clipboard data", err);
              }
            });
            break;
        }
      }
    };

    srr.addEventListener("focus", focusHandler);
    srr.addEventListener("blur", focusHandler);
    srr.addEventListener("keydown", keyHandler);

    return () => {
      srr.removeEventListener("focus", focusHandler);
      srr.removeEventListener("blur", focusHandler);
      srr.removeEventListener("keydown", keyHandler);
    };
  }, [
    screenRef.current,
    selectedNodes,
    state,
    position,
    scale,
    pointerPosition,
  ]);

  const handleMouseDown = useCallback(
    (event) => {
      console.log("target", event.target);
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

          nodes.forEach((node) => {
            console.log("picking", node.id);
            const { x, y, width, height } = document
              .getElementById(`card-${node.id}`)
              .getBoundingClientRect();

            const p1 = {
              x: Math.min(pos.x, _posEnd.x),
              y: Math.min(pos.y, _posEnd.y),
            };

            const p2 = {
              x: Math.max(pos.x, _posEnd.x),
              y: Math.max(pos.y, _posEnd.y),
            };

            if (x > p1.x && x + width < p2.x && y > p1.y && y + height < p2.y) {
              _selectedNodes.push(node.id);
            }
          });

          if (selectMode === "select") {
            setSelectedNodes(_selectedNodes);
          } else {
            if (selectMode === "select-add") {
              setSelectedNodes((prev) => [...prev, ..._selectedNodes]);
            } else if (selectMode === "select-remove") {
              setSelectedNodes((prev) =>
                prev.filter((id) => !_selectedNodes.includes(id))
              );
            }
          }

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
      setPointerPosition({
        x: event.pageX - window.scrollX,
        y: event.pageY - window.scrollY,
      });
    };

    window.addEventListener("mousemove", mouseMoveListener);
    return () => {
      window.removeEventListener("mousemove", mouseMoveListener);
    };
  }, []);

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

  const addNode = useCallback(
    (nodeType, pos) => {
      const newNode = {
        id: nanoid(),
        name: nodeType.label,
        type: nodeType.type,
        position: pos,
        values: nodeType.inputs().reduce((acc, input) => {
          if (input.defaultValue == null) return acc;

          acc[input.name] = input.defaultValue;
          return acc;
        }, {}),
      };

      setStateAndNotify((prev) => ({
        ...prev,
        nodes: {
          ...(prev.nodes ?? {}),
          [newNode.id]: newNode,
        },
      }));
    },
    [setStateAndNotify]
  );

  const removeNodes = useCallback(
    (ids) => {
      const idsNoRoot = ids.filter(
        (id) => !nodeTypes[state.nodes[id].type].root
      );
      const nodesToRemove = [...ids];
      const nodesToAdd = {};

      for (const nodeId of ids) {
        const node = state.nodes[nodeId];
        if (!node) continue;

        if (node.connections?.outputs?.length) {
          for (const conn of node.connections.outputs) {
            const otherNode = state.nodes[conn.node];

            if (!otherNode || idsNoRoot.includes(otherNode.id)) continue;

            if (!nodesToRemove.includes(otherNode.id))
              nodesToRemove.push(otherNode.id);

            if (!nodesToAdd[otherNode.id]) {
              nodesToAdd[otherNode.id] = {
                ...otherNode,
                connections: {
                  ...otherNode.connections,
                  inputs: otherNode.connections?.inputs ?? [],
                  outputs: otherNode.connections?.outputs ?? [],
                },
              };
            }
            nodesToAdd[otherNode.id].connections.outputs = [
              ...(otherNode.connections.outputs ?? []),
            ];
            nodesToAdd[otherNode.id].connections.inputs =
              otherNode.connections?.inputs?.filter(
                (c) => !(c.port === conn.name && c.node === node.id)
              ) ?? [];
          }
        }

        if (node.connections?.inputs?.length) {
          for (const conn of node.connections.inputs) {
            const otherNode = state.nodes[conn.node];

            if (!otherNode || idsNoRoot.includes(otherNode.id)) continue;

            if (!nodesToRemove.includes(otherNode.id))
              nodesToRemove.push(otherNode.id);

            if (!nodesToAdd[otherNode.id])
              nodesToAdd[otherNode.id] = { ...otherNode };

            nodesToAdd[otherNode.id].connections.outputs =
              otherNode.connections?.outputs?.filter(
                (c) => !(c.port === conn.name && c.node === node.id)
              ) ?? [];
            nodesToAdd[otherNode.id].connections.inputs = [
              ...(otherNode.connections.inputs ?? []),
            ];
          }
        }
      }

      // change nodes to object[id]
      setSelectedNodes([]);

      setStateAndNotify((prev) => {
        const newNodes = {
          ...(prev.nodes ?? {}),
        };

        nodesToRemove
          .filter((id) => !nodeTypes[state.nodes[id].type].root)
          .forEach((id) => {
            delete newNodes[id];
          });
        Object.values(nodesToAdd).forEach((node) => {
          newNodes[node.id] = node;
        });

        return {
          ...prev,
          nodes: newNodes,
        };
      });
    },
    [state, setStateAndNotify]
  );

  const cloneNode = useCallback(
    (id) => {
      const node = state.nodes[id];
      if (!node) return;

      const newNode = {
        ...node,
        id: nanoid(),
        position: { x: node.position.x + 20, y: node.position.y + 20 },
        connections: {
          inputs: [],
          outputs: [],
        },
      };

      setStateAndNotify((prev) => ({
        ...prev,
        nodes: {
          ...(prev.nodes ?? {}),
          [newNode.id]: newNode,
        },
      }));
    },
    [setStateAndNotify, state]
  );

  const removeConnectionFromOutput = useCallback(
    (srcNode, srcPort, dstNode, dstPort) => {
      setStateAndNotify((prev) => {
        const newNodes = {
          ...(prev.nodes ?? {}),
        };

        if (!newNodes[srcNode] || !newNodes[dstNode]) return null;

        newNodes[srcNode] = {
          ...newNodes[srcNode],
          connections: {
            ...newNodes[srcNode].connections,
            outputs: newNodes[srcNode].connections.outputs.filter(
              (conn) =>
                !(
                  conn.name === srcPort &&
                  conn.node === dstNode &&
                  conn.port === dstPort
                )
            ),
          },
        };

        newNodes[dstNode] = {
          ...newNodes[dstNode],
          connections: {
            ...newNodes[dstNode].connections,
            inputs: newNodes[dstNode].connections.inputs.filter(
              (conn) =>
                !(
                  conn.name === dstPort &&
                  conn.node === srcNode &&
                  conn.port === srcPort
                )
            ),
          },
        };

        return {
          ...prev,
          nodes: newNodes,
        };
      });
    },
    [setStateAndNotify]
  );

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

  const onConnect = useCallback(
    ({ source, target }) => {
      setStateAndNotify((prev) => {
        if (!prev?.nodes || !Object.keys(prev.nodes).length) return null;

        const item = {
          srcNode: source.nodeId,
          dstNode: target.nodeId,
          srcPort: source.portName,
          dstPort: target.portName,
        };

        if (item.srcNode === item.dstNode) return;

        // deep merge
        const srcNode = JSON.parse(JSON.stringify(prev.nodes[item.srcNode]));
        const dstNode = JSON.parse(JSON.stringify(prev.nodes[item.dstNode]));

        const srcPort = nodeTypes[srcNode.type]
          .outputs(srcNode.values, srcNode.connections?.inputs)
          .find((p) => p.name === item.srcPort);
        const dstPort = nodeTypes[dstNode.type]
          .inputs(dstNode.values)
          .find((p) => p.name === item.dstPort);

        if (srcPort.type !== dstPort.type) return;

        if (!srcNode.connections) srcNode.connections = {};
        if (!srcNode.connections?.outputs) srcNode.connections.outputs = [];
        if (!srcNode.connections?.inputs) srcNode.connections.inputs = [];

        if (!dstNode.connections) dstNode.connections = {};
        if (!dstNode.connections?.outputs) dstNode.connections.outputs = [];
        if (!dstNode.connections?.inputs) dstNode.connections.inputs = [];

        if (
          !srcNode.connections.outputs.find(
            (c) => c.node === dstNode.id && c.name === dstPort.name
          )
        ) {
          srcNode.connections.outputs.push({
            name: srcPort.name,
            node: dstNode.id,
            port: dstPort.name,
            type: srcPort.type,
          });
        }

        if (
          !dstNode.connections.inputs.find(
            (c) => c.node === srcNode.id && c.name === srcPort.name
          )
        ) {
          dstNode.connections.inputs.push({
            name: dstPort.name,
            node: srcNode.id,
            port: srcPort.name,
            type: srcPort.type,
          });
        }

        const nodes = {
          ...prev.nodes,
          [srcNode.id]: srcNode,
          [dstNode.id]: dstNode,
        };

        return {
          ...prev,
          nodes,
        };
      });
    },
    [setStateAndNotify, nodeTypes]
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
      if (nodeType.root) return acc;

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
      console.log("rect", rect, position, scale);

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
                  console.log("rect", rect, position, scale);
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

  const handleValueChange = useCallback(
    (id, values) => {
      setStateAndNotify((prev) => {
        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [id]: {
              ...prev.nodes[id],
              values,
            },
          },
        };
      });
    },
    [setStateAndNotify]
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
              {localStartPoint.x !== localEndPoint.x &&
                localStartPoint.y !== localEndPoint.y && (
                  <div
                    style={{
                      position: "absolute",
                      transform: `translate(${Math.min(localStartPoint.x, localEndPoint.x)}px, ${Math.min(localStartPoint.y, localEndPoint.y)}px)`,
                      width: Math.abs(localEndPoint.x - localStartPoint.x),
                      height: Math.abs(localEndPoint.y - localStartPoint.y),
                      border: "3px dashed black",
                      backgroundColor: "rgba(0,0,0,0.1)",
                      pointerEvents: "none",
                    }}
                  ></div>
                )}

              <div className={[css.panel, css.controlsPanelVertical].join(" ")}>
                <Button className={css.controlButton} onClick={() => zoomIn()}>
                  <Icon path={mdiMagnifyPlus} size={0.6} />
                </Button>
                <Button className={css.controlButton} onClick={() => zoomOut()}>
                  <Icon path={mdiMagnifyMinus} size={0.6} />
                </Button>
                <Button
                  className={css.controlButton}
                  onClick={() => {
                    centerView();
                    setStateAndNotify((prev) => ({
                      ...prev,
                      position,
                      scale,
                    }));
                  }}
                >
                  <Icon path={mdiSetCenter} size={0.6} />
                </Button>
                <Button
                  className={css.controlButton}
                  onClick={() => {
                    setTransform(position.x, position.y, 1);
                    setScale(1);

                    setStateAndNotify((prev) => ({
                      ...prev,
                      position,
                      scale: 1,
                    }));
                  }}
                >
                  <Icon path={mdiMagnifyScan} size={0.6} />
                </Button>

                <Button
                  className={css.controlButton}
                  onClick={() => setCanMove(!canMove)}
                >
                  <Icon
                    path={canMove ? mdiLockOpenVariant : mdiLock}
                    size={0.6}
                  />
                </Button>
              </div>

              <div
                className={[css.panel, css.controlsPanelHorizontal].join(" ")}
              >
                <Button
                  className={css.controlButton}
                  onClick={handleSnapToGrid}
                >
                  <Icon path={snapToGrid ? mdiGrid : mdiGridOff} size={0.6} />
                </Button>
                <Button disabled={true} className={css.controlButton}>
                  {viewMode === "select" && (
                    <Icon path={mdiSelect} size={0.6} />
                  )}
                  {viewMode === "select-add" && (
                    <Icon path={mdiSelectDrag} size={0.6} />
                  )}
                  {viewMode === "select-remove" && (
                    <Icon path={mdiSelectRemove} size={0.6} />
                  )}
                  {viewMode === "move" && (
                    <Icon path={mdiCursorMove} size={0.6} />
                  )}
                </Button>
              </div>

              <div className={[css.panel, css.statusPanel].join(" ")}>
                <div>Scale: {scale}</div>
                <div>Position: {JSON.stringify(position)}</div>
              </div>
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
                              text={node.value}
                              title={node.title}
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
                              onMove={(position) => {
                                const pos = { ...position };

                                const _selectedNodes = selectedNodes;
                                if (!_selectedNodes.includes(node.id))
                                  _selectedNodes.length = 0;
                                setSelectedNodes(_selectedNodes);

                                setState((prev) => ({
                                  ...prev,
                                  nodes: Object.values(prev.nodes).reduce(
                                    (acc, n) => {
                                      const delta = {
                                        x:
                                          pos.x -
                                          prev.nodes[node.id].position.x,
                                        y:
                                          pos.y -
                                          prev.nodes[node.id].position.y,
                                      };

                                      if (snapToGrid) {
                                        pos.x =
                                          Math.round(pos.x / gridSize) *
                                          gridSize;
                                        pos.y =
                                          Math.round(pos.y / gridSize) *
                                          gridSize;
                                        delta.x =
                                          pos.x -
                                          prev.nodes[node.id].position.x;
                                        delta.y =
                                          pos.y -
                                          prev.nodes[node.id].position.y;
                                      }

                                      if (n.id === node.id) {
                                        acc[n.id] = {
                                          ...n,
                                          position: pos,
                                        };
                                      } else if (
                                        _selectedNodes.includes(n.id)
                                      ) {
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
                                    },
                                    {}
                                  ),
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
                                  nodes: Object.values(prev.nodes).reduce(
                                    (acc, n) => {
                                      const delta = {
                                        x:
                                          pos.x -
                                          prev.nodes[node.id].position.x,
                                        y:
                                          pos.y -
                                          prev.nodes[node.id].position.y,
                                      };

                                      if (snapToGrid) {
                                        pos.x =
                                          Math.round(pos.x / gridSize) *
                                          gridSize;
                                        pos.y =
                                          Math.round(pos.y / gridSize) *
                                          gridSize;
                                        delta.x =
                                          pos.x -
                                          prev.nodes[node.id].position.x;
                                        delta.y =
                                          pos.y -
                                          prev.nodes[node.id].position.y;
                                      }

                                      if (n.id === node.id) {
                                        acc[n.id] = {
                                          ...n,
                                          position: pos,
                                        };
                                      } else if (
                                        _selectedNodes.includes(n.id)
                                      ) {
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
                                    },
                                    {}
                                  ),
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
                              onChangePosition={(position) => {
                                const pos = { ...position };

                                const _selectedNodes = selectedNodes;
                                if (!_selectedNodes.includes(node.id))
                                  _selectedNodes.length = 0;
                                setSelectedNodes(_selectedNodes);

                                setState((prev) => ({
                                  ...prev,
                                  nodes: Object.values(prev.nodes).reduce(
                                    (acc, n) => {
                                      const delta = {
                                        x:
                                          pos.x -
                                          prev.nodes[node.id].position.x,
                                        y:
                                          pos.y -
                                          prev.nodes[node.id].position.y,
                                      };

                                      if (snapToGrid) {
                                        pos.x =
                                          Math.round(pos.x / gridSize) *
                                          gridSize;
                                        pos.y =
                                          Math.round(pos.y / gridSize) *
                                          gridSize;
                                        delta.x =
                                          pos.x -
                                          prev.nodes[node.id].position.x;
                                        delta.y =
                                          pos.y -
                                          prev.nodes[node.id].position.y;
                                      }

                                      if (n.id === node.id) {
                                        acc[n.id] = {
                                          ...n,
                                          position: pos,
                                        };
                                      } else if (
                                        _selectedNodes.includes(n.id)
                                      ) {
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
                                    },
                                    {}
                                  ),
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
                                  nodes: Object.values(prev.nodes).reduce(
                                    (acc, n) => {
                                      const delta = {
                                        x:
                                          pos.x -
                                          prev.nodes[node.id].position.x,
                                        y:
                                          pos.y -
                                          prev.nodes[node.id].position.y,
                                      };

                                      if (snapToGrid) {
                                        pos.x =
                                          Math.round(pos.x / gridSize) *
                                          gridSize;
                                        pos.y =
                                          Math.round(pos.y / gridSize) *
                                          gridSize;
                                        delta.x =
                                          pos.x -
                                          prev.nodes[node.id].position.x;
                                        delta.y =
                                          pos.y -
                                          prev.nodes[node.id].position.y;
                                      }

                                      if (n.id === node.id) {
                                        acc[n.id] = {
                                          ...n,
                                          position: pos,
                                        };
                                      } else if (
                                        _selectedNodes.includes(n.id)
                                      ) {
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
                                    },
                                    {}
                                  ),
                                }));
                              }}
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
                                    onContextMenu={(e) =>
                                      handleContextMenu(
                                        e,
                                        [
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
