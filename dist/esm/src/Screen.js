import { objectSpread2 as _objectSpread2, objectWithoutProperties as _objectWithoutProperties } from '../_virtual/_rollupPluginBabelHelpers.js';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Node from './Node.js';
import { TransformWrapper, TransformComponent } from '../node_modules/react-zoom-pan-pinch/dist/index.esm.js';
import { useDragContext } from './DragContext.js';
import { useScreenContext } from './ScreenContext.js';
import { ConnectorCurve } from './ConnectorCurve.js';
import { ContextMenu } from './ContextMenu.js';
import { nanoid } from '../node_modules/nanoid/index.browser.js';
import css from './Screen.module.css.js';
import nodeCss from './Node.module.css.js';
import nodePortCss from './NodePort.module.css.js';
import { useTheme } from './ThemeProvider.js';
import Button from './Button.js';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

var _excluded = ["zoomIn", "zoomOut", "resetTransform", "setTransform", "centerView"];
function Screen(_ref) {
  var _position$x, _position$y, _screenRef$current, _state$scale, _state$position$x, _state$position, _state$position$y, _state$position2;
  var {
    portTypes,
    nodeTypes,
    onChangeState,
    initialState
  } = _ref;
  var {
    currentTheme
  } = useTheme();
  var PORT_SIZE = 20;
  var style = {
    '--port-size': "".concat(PORT_SIZE, "px"),
    '--color-primary': currentTheme.colors.primary,
    '--color-secondary': currentTheme.colors.secondary,
    '--color-bg': currentTheme.colors.background,
    '--color-text': currentTheme.colors.text,
    '--color-hover': currentTheme.colors.hover,
    '--roundness': currentTheme.roundness
  };
  var {
    dragInfo
  } = useDragContext();
  var {
    position,
    setPosition,
    scale,
    setScale
  } = useScreenContext();
  var [dstDragPosition, setDstDragPosition] = useState({
    x: 0,
    y: 0
  });
  var [pointerPosition, setPointerPosition] = useState({
    x: 0,
    y: 0
  });
  var [state, setState] = useState(initialState);
  var [shouldNotify, setShouldNotify] = useState(false);
  var debounceEvent = useCallback(function (fn) {
    var wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;
    var time = arguments.length > 2 ? arguments[2] : undefined;
    return function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return clearTimeout(time, time = setTimeout(() => fn(...args), wait));
    };
  }, []);
  useEffect(() => {
    if (!initialState) return;
    setScale(initialState.scale);
    setPosition(initialState.position);
  }, []);
  var setStateAndNotify = useCallback(cb => {
    setState(prev => {
      var newState = cb(prev);
      setShouldNotify(true);
      return newState;
    });
  }, [setState]);
  useEffect(() => {
    if (shouldNotify) {
      onChangeState(state);
      setShouldNotify(false);
    }
  }, [state, shouldNotify, onChangeState]);
  useEffect(() => {
    if (!dragInfo) {
      setDstDragPosition(null);
      return;
    }

    //const { startX, startY } = dragInfo

    var mouseMoveListener = event => {
      setPointerPosition({
        x: event.pageX - window.scrollX,
        y: event.pageY - window.scrollY
      });
      var dx = event.pageX; //- startX
      var dy = event.pageY; //- startY

      setDstDragPosition({
        x: dx,
        y: dy
      });
    };
    window.addEventListener('mousemove', mouseMoveListener);
    return () => {
      window.removeEventListener('mousemove', mouseMoveListener);
    };
  }, [dragInfo]);
  var addNode = useCallback((nodeType, pos) => {
    var newNode = {
      id: nanoid(),
      name: nodeType.label,
      type: nodeType.type,
      position: pos,
      values: {}
    };
    setStateAndNotify(prev => {
      var _prev$nodes;
      return _objectSpread2(_objectSpread2({}, prev), {}, {
        nodes: _objectSpread2(_objectSpread2({}, (_prev$nodes = prev.nodes) !== null && _prev$nodes !== void 0 ? _prev$nodes : {}), {}, {
          [newNode.id]: newNode
        })
      });
    });
  }, [setStateAndNotify]);
  var removeNode = useCallback(id => {
    var _node$connections$out, _node$connections$inp;
    var node = state.nodes[id];
    if (!node) return;
    var nodesToRemove = [id];
    var nodesToAdd = [];
    (_node$connections$out = node.connections.outputs) === null || _node$connections$out === void 0 ? void 0 : _node$connections$out.forEach(conn => {
      var otherNode = state.nodes[conn.node];
      if (!otherNode) return;
      nodesToRemove.push(otherNode.id);
      nodesToAdd.push(_objectSpread2(_objectSpread2({}, otherNode), {}, {
        connections: {
          outputs: otherNode.connections.outputs,
          inputs: otherNode.connections.inputs.filter(c => !(c.port === conn.name && c.node === node.id))
        }
      }));
    });
    (_node$connections$inp = node.connections.inputs) === null || _node$connections$inp === void 0 ? void 0 : _node$connections$inp.forEach(conn => {
      var otherNode = state.nodes[conn.node];
      if (!otherNode) return;
      nodesToRemove.push(otherNode.id);
      nodesToAdd.push(_objectSpread2(_objectSpread2({}, otherNode), {}, {
        connections: {
          outputs: otherNode.connections.outputs.filter(c => !(c.port === conn.name && c.node === node.id)),
          inputs: otherNode.connections.inputs
        }
      }));
    });

    // change nodes to object[id]

    setStateAndNotify(prev => {
      var _prev$nodes2;
      var newNodes = _objectSpread2({}, (_prev$nodes2 = prev.nodes) !== null && _prev$nodes2 !== void 0 ? _prev$nodes2 : {});
      nodesToRemove.forEach(id => {
        delete newNodes[id];
      });
      nodesToAdd.forEach(node => {
        newNodes[node.id] = node;
      });
      return _objectSpread2(_objectSpread2({}, prev), {}, {
        nodes: newNodes
      });
    });
  }, [state, setStateAndNotify]);
  var cloneNode = useCallback(id => {
    var node = state.nodes[id];
    if (!node) return;
    var newNode = _objectSpread2(_objectSpread2({}, node), {}, {
      id: nanoid(),
      position: {
        x: node.position.x + 20,
        y: node.position.y + 20
      },
      connections: {
        inputs: [],
        outputs: []
      }
    });
    setStateAndNotify(prev => {
      var _prev$nodes3;
      return _objectSpread2(_objectSpread2({}, prev), {}, {
        nodes: _objectSpread2(_objectSpread2({}, (_prev$nodes3 = prev.nodes) !== null && _prev$nodes3 !== void 0 ? _prev$nodes3 : {}), {}, {
          [newNode.id]: newNode
        })
      });
    });
  }, [setStateAndNotify, state]);
  var removeConnectionFromOutput = useCallback((srcNode, srcPort, dstNode, dstPort) => {
    setStateAndNotify(prev => {
      var _prev$nodes4;
      var newNodes = _objectSpread2({}, (_prev$nodes4 = prev.nodes) !== null && _prev$nodes4 !== void 0 ? _prev$nodes4 : {});
      if (!newNodes[srcNode] || !newNodes[dstNode]) return null;
      newNodes[srcNode] = _objectSpread2(_objectSpread2({}, newNodes[srcNode]), {}, {
        connections: _objectSpread2(_objectSpread2({}, newNodes[srcNode].connections), {}, {
          outputs: newNodes[srcNode].connections.outputs.filter(conn => !(conn.name === srcPort && conn.node === dstNode && conn.port === dstPort))
        })
      });
      newNodes[dstNode] = _objectSpread2(_objectSpread2({}, newNodes[dstNode]), {}, {
        connections: _objectSpread2(_objectSpread2({}, newNodes[dstNode].connections), {}, {
          inputs: newNodes[dstNode].connections.inputs.filter(conn => !(conn.name === dstPort && conn.node === srcNode && conn.port === srcPort))
        })
      });
      return _objectSpread2(_objectSpread2({}, prev), {}, {
        nodes: newNodes
      });
    });
  }, [setStateAndNotify]);
  var screenRef = useRef();
  var [isMoveable, setIsMoveable] = useState(false);
  var [canMove, setCanMove] = useState(true);
  var onZoom = useCallback(params => {
    var _scale = params.state.scale;
    setScale(_scale);
    var _position = {
      x: params.state.positionX,
      y: params.state.positionY
    };
    setPosition(_position);
  }, [setPosition, setScale]);
  useCallback(params => {
    setStateAndNotify(prev => {
      var _scale = params.state.scale;
      var _position = {
        x: params.state.positionX,
        y: params.state.positionY
      };
      return _objectSpread2(_objectSpread2({}, prev), {}, {
        scale: _scale,
        position: _position
      });
    });
  }, [setStateAndNotify]);
  var onTransform = useCallback(params => {
    var _position = {
      x: params.state.positionX,
      y: params.state.positionY
    };
    setPosition(_position);
  }, [setPosition]);
  var onTransformEnd = useCallback(params => {
    var {
      state: {
        positionX,
        positionY,
        scale: _scale
      }
    } = params;
    setPosition({
      x: positionX,
      y: positionY
    });
    setScale(_scale);
    debounceEvent((px, py, s) => {
      setStateAndNotify(prev => {
        return _objectSpread2(_objectSpread2({}, prev), {}, {
          position: {
            x: px,
            y: py
          },
          scale: s
        });
      });
    }, 200)(positionX, positionY, _scale);
  }, [setPosition, setScale, setStateAndNotify, debounceEvent]);
  var gridSize = 40;
  var scaledGridSize = gridSize * (scale !== null && scale !== void 0 ? scale : 1);
  var scaledPositionX = ((_position$x = position === null || position === void 0 ? void 0 : position.x) !== null && _position$x !== void 0 ? _position$x : 0) % scaledGridSize;
  var scaledPositionY = ((_position$y = position === null || position === void 0 ? void 0 : position.y) !== null && _position$y !== void 0 ? _position$y : 0) % scaledGridSize;
  var onConnect = useCallback(_ref2 => {
    var {
      source,
      target
    } = _ref2;
    setStateAndNotify(prev => {
      if (!(prev !== null && prev !== void 0 && prev.nodes) || !Object.keys(prev.nodes).length) return null;
      var item = {
        srcNode: source.nodeId,
        dstNode: target.nodeId,
        srcPort: source.portName,
        dstPort: target.portName
      };
      if (item.srcNode === item.dstNode) return;

      // deep merge
      var srcNode = JSON.parse(JSON.stringify(prev.nodes[item.srcNode]));
      var dstNode = JSON.parse(JSON.stringify(prev.nodes[item.dstNode]));
      var srcPort = nodeTypes[srcNode.type].outputs(srcNode.values).find(p => p.name === item.srcPort);
      var dstPort = nodeTypes[dstNode.type].inputs(dstNode.values).find(p => p.name === item.dstPort);
      if (srcPort.type !== dstPort.type) return;
      if (!srcNode.connections) srcNode.connections = {};
      if (!srcNode.connections.outputs) srcNode.connections.outputs = [];
      if (!srcNode.connections.inputs) srcNode.connections.inputs = [];
      if (!dstNode.connections) dstNode.connections = {};
      if (!dstNode.connections.outputs) dstNode.connections.outputs = [];
      if (!dstNode.connections.inputs) dstNode.connections.inputs = [];
      if (!srcNode.connections.outputs.find(c => c.name === dstPort.name)) {
        srcNode.connections.outputs.push({
          name: srcPort.name,
          node: dstNode.id,
          port: dstPort.name,
          type: srcPort.type
        });
      }
      if (!dstNode.connections.inputs.find(c => c.name === srcPort.name)) {
        dstNode.connections.inputs.push({
          name: dstPort.name,
          node: srcNode.id,
          port: srcPort.name,
          type: srcPort.type
        });
      }
      var nodes = _objectSpread2(_objectSpread2({}, prev.nodes), {}, {
        [srcNode.id]: srcNode,
        [dstNode.id]: dstNode
      });
      return _objectSpread2(_objectSpread2({}, prev), {}, {
        nodes
      });
    });
  }, [setStateAndNotify, nodeTypes]);
  var pinchOptions = useMemo(() => ({
    step: 5
  }), []);
  var panningOptions = useMemo(() => ({
    disabled: isMoveable,
    excluded: [nodeCss.node, 'react-draggable', nodePortCss.port, nodePortCss.portConnector]
  }), [isMoveable]);
  var wrapperStyle = useMemo(() => ({
    height: '100vh',
    width: '100vw',
    backgroundColor: currentTheme.colors.background,
    backgroundSize: "".concat(scaledGridSize, "px ").concat(scaledGridSize, "px"),
    backgroundImage: "linear-gradient(to right, ".concat(currentTheme.colors.hover, " 1px, transparent 1px), linear-gradient(to bottom, ").concat(currentTheme.colors.hover, " 1px, transparent 1px)"),
    backgroundPosition: "".concat(scaledPositionX, "px ").concat(scaledPositionY, "px")
  }), [scaledGridSize, scaledPositionX, scaledPositionY, currentTheme]);
  var nodeTypesByCategory = useMemo(() => {
    var categories = Object.values(nodeTypes).reduce((acc, nodeType) => {
      var _nodeType$category;
      var _category = (_nodeType$category = nodeType.category) !== null && _nodeType$category !== void 0 ? _nodeType$category : '...';
      if (!acc[_category]) acc[_category] = [];
      acc[_category].push(nodeType);
      return acc;
    }, {});
    return Object.entries(categories).map(_ref3 => {
      var [category, nodeTypes] = _ref3;
      return {
        category,
        nodeTypes
      };
    });
  }, [nodeTypes]);
  var wrapperProps = useCallback(handleContextMenu => ({
    onDragOver: e => {
      e.dataTransfer.dropEffect = "move";
      e.dataTransfer.effectAllowed = "move";
    },
    onDragLeave: e => {
      e.preventDefault();
      e.stopPropagation();
    },
    onContextMenu: e => handleContextMenu(e, nodeTypesByCategory.map(_ref4 => {
      var {
        category,
        nodeTypes
      } = _ref4;
      return {
        label: category,
        children: nodeTypes.sort((a, b) => a.label.localeCompare(b.label)).map(nodeType => ({
          label: "Adicionar ".concat(nodeType.label),
          description: nodeType.description,
          onClick: () => {
            e.target.getBoundingClientRect();
            var position = {
              x: e.clientX,
              // - x,
              y: e.clientY // - y
            };

            addNode(nodeType, position);
          }
        }))
      };
    }))
  }), [nodeTypesByCategory, addNode]);
  var handleValueChange = useCallback((id, values) => {
    setStateAndNotify(prev => {
      return _objectSpread2(_objectSpread2({}, prev), {}, {
        nodes: _objectSpread2(_objectSpread2({}, prev.nodes), {}, {
          [id]: _objectSpread2(_objectSpread2({}, prev.nodes[id]), {}, {
            values
          })
        })
      });
    });
  }, [setStateAndNotify]);
  if (!state) return null;
  var contRect = (_screenRef$current = screenRef.current) === null || _screenRef$current === void 0 ? void 0 : _screenRef$current.getBoundingClientRect();
  return /*#__PURE__*/jsx("div", {
    className: css.container,
    style: style,
    ref: screenRef,
    children: /*#__PURE__*/jsx(TransformWrapper, {
      initialScale: (_state$scale = state === null || state === void 0 ? void 0 : state.scale) !== null && _state$scale !== void 0 ? _state$scale : 1,
      initialPositionX: (_state$position$x = state === null || state === void 0 || (_state$position = state.position) === null || _state$position === void 0 ? void 0 : _state$position.x) !== null && _state$position$x !== void 0 ? _state$position$x : 0,
      initialPositionY: (_state$position$y = state === null || state === void 0 || (_state$position2 = state.position) === null || _state$position2 === void 0 ? void 0 : _state$position2.y) !== null && _state$position$y !== void 0 ? _state$position$y : 0,
      disabled: isMoveable,
      minScale: .25,
      maxScale: 2,
      limitToBounds: false,
      onPanning: onTransform,
      onZoom: onZoom,
      pinch: pinchOptions,
      panning: panningOptions,
      onTransformed: onTransformEnd,
      children: _ref5 => {
        var {
            zoomIn,
            zoomOut,
            resetTransform,
            setTransform,
            centerView
          } = _ref5;
          _objectWithoutProperties(_ref5, _excluded);
        return /*#__PURE__*/jsxs(Fragment, {
          children: [/*#__PURE__*/jsxs("div", {
            className: [css.panel, css.controlsPanel].join(' '),
            children: [/*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: () => zoomIn(),
              children: "+"
            }), /*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: () => zoomOut(),
              children: "-"
            }), /*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: () => {
                centerView();
                setStateAndNotify(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
                  position,
                  scale
                }));
              },
              children: "C"
            }), /*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: () => {
                setTransform(position.x, position.y, 1);
                setScale(1);
                setStateAndNotify(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
                  position,
                  scale: 1
                }));
              },
              children: "Z"
            }), /*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: () => setCanMove(!canMove),
              children: canMove ? 'L' : 'U'
            })]
          }), /*#__PURE__*/jsxs("div", {
            className: [css.panel, css.statusPanel].join(' '),
            children: [/*#__PURE__*/jsxs("div", {
              children: ["Scale: ", scale]
            }), /*#__PURE__*/jsxs("div", {
              children: ["Position: ", JSON.stringify(position)]
            })]
          }), /*#__PURE__*/jsx(ContextMenu, {
            children: _ref6 => {
              var {
                handleContextMenu
              } = _ref6;
              return /*#__PURE__*/jsxs(TransformComponent, {
                contentClass: "main",
                wrapperStyle: wrapperStyle,
                wrapperProps: wrapperProps(handleContextMenu),
                children: [(state === null || state === void 0 ? void 0 : state.nodes) && Object.values(state.nodes).map((node, index) => {
                  var _node$connections;
                  return /*#__PURE__*/jsxs(Fragment, {
                    children: [/*#__PURE__*/jsx(Node, {
                      id: "node_".concat(node.id),
                      name: node.name,
                      portTypes: portTypes,
                      nodeType: nodeTypes === null || nodeTypes === void 0 ? void 0 : nodeTypes[node.type],
                      value: node,
                      onValueChange: v => {
                        handleValueChange(node.id, _objectSpread2({}, v.values));
                      },
                      onChangePosition: position => {
                        setState(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
                          nodes: _objectSpread2(_objectSpread2({}, prev.nodes), {}, {
                            [node.id]: _objectSpread2(_objectSpread2({}, prev.nodes[node.id]), {}, {
                              position
                            })
                          })
                        }));
                      },
                      onDragEnd: position => {
                        setStateAndNotify(prev => _objectSpread2(_objectSpread2({}, prev), {}, {
                          nodes: _objectSpread2(_objectSpread2({}, prev.nodes), {}, {
                            [node.id]: _objectSpread2(_objectSpread2({}, prev.nodes[node.id]), {}, {
                              position
                            })
                          })
                        }));
                      },
                      containerRef: screenRef,
                      canMove: canMove,
                      onConnect: onConnect,
                      onContextMenu: e => handleContextMenu(e, [{
                        label: 'Clonar este nó',
                        onClick: () => {
                          cloneNode(node.id);
                        }
                      }, {
                        label: "Remover este n\xF3",
                        style: {
                          color: 'red'
                        },
                        onClick: () => {
                          removeNode(node.id);
                        }
                      }]),
                      onResize: size => {
                        // O objetivo aqui é disparar a renderização das conexões.
                        // Se houver um modo melhor, por favor, me avise.
                        setState(prev => {
                          var _prev$nodes$node$id$c, _prev$nodes$node$id$c2;
                          return _objectSpread2(_objectSpread2({}, prev), {}, {
                            nodes: _objectSpread2(_objectSpread2({}, prev.nodes), {}, {
                              [node.id]: _objectSpread2(_objectSpread2({}, prev.nodes[node.id]), {}, {
                                size,
                                connections: _objectSpread2(_objectSpread2({}, prev.nodes[node.id].connections), {}, {
                                  outputs: [...((_prev$nodes$node$id$c = (_prev$nodes$node$id$c2 = prev.nodes[node.id].connections) === null || _prev$nodes$node$id$c2 === void 0 ? void 0 : _prev$nodes$node$id$c2.outputs) !== null && _prev$nodes$node$id$c !== void 0 ? _prev$nodes$node$id$c : [])]
                                })
                              })
                            })
                          });
                        });
                      }
                    }, "node_".concat(node.id)), (_node$connections = node.connections) === null || _node$connections === void 0 || (_node$connections = _node$connections.outputs) === null || _node$connections === void 0 ? void 0 : _node$connections.map((connection, index) => {
                      var srcNode = node.id;
                      var srcPort = connection.name;
                      var dstNode = connection.node;
                      var dstPort = connection.port;
                      var connType = connection.type;
                      var srcElem = document.getElementById("card-".concat(srcNode, "-output-").concat(srcPort));
                      var dstElem = document.getElementById("card-".concat(dstNode, "-input-").concat(dstPort));
                      if (!srcElem || !dstElem || !contRect) {
                        return null;
                      }
                      var srcRect = srcElem.getBoundingClientRect();
                      var dstRect = dstElem.getBoundingClientRect();
                      var srcPos = {
                        x: (srcRect.x - position.x - contRect.left + srcRect.width / 2) / scale,
                        y: (srcRect.y - position.y - contRect.top + srcRect.height / 2) / scale
                      };
                      var dstPos = {
                        x: (dstRect.x - position.x - contRect.left + dstRect.width / 2) / scale,
                        y: (dstRect.y - position.y - contRect.top + dstRect.height / 2) / scale
                      };
                      return /*#__PURE__*/jsx(ConnectorCurve, {
                        type: portTypes[connType],
                        src: srcPos,
                        dst: dstPos,
                        scale: scale,
                        onContextMenu: e => handleContextMenu(e, [canMove ? {
                          label: "Remover esta conex\xE3o",
                          style: {
                            color: 'red'
                          },
                          onClick: () => {
                            removeConnectionFromOutput(srcNode, srcPort, dstNode, dstPort);
                          }
                        } : null].filter(Boolean))
                      }, "connector-".concat(srcNode, "-").concat(srcPort, "-").concat(dstNode, "-").concat(dstPort));
                    })]
                  });
                }), dragInfo && dstDragPosition ? /*#__PURE__*/jsx(ConnectorCurve, {
                  tmp: true,
                  src: {
                    x: (dragInfo.startX - contRect.left - position.x + PORT_SIZE / 2 - 2) / scale,
                    y: (dragInfo.startY - contRect.top - position.y + PORT_SIZE / 2 - 2) / scale
                  },
                  dst: {
                    x: (dstDragPosition.x - window.scrollX - contRect.left - position.x) / scale,
                    y: (dstDragPosition.y - window.scrollY - contRect.top - position.y) / scale
                  },
                  scale: scale
                }) : null]
              });
            }
          })]
        });
      }
    })
  });
}

export { Screen as default };
//# sourceMappingURL=Screen.js.map
