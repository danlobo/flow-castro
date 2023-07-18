'use strict';

var _rollupPluginBabelHelpers = require('../_virtual/_rollupPluginBabelHelpers.js');
var React = require('react');
var Node = require('./Node.js');
var index_esm = require('../node_modules/react-zoom-pan-pinch/dist/index.esm.js');
var DragContext = require('./DragContext.js');
var ScreenContext = require('./ScreenContext.js');
var ConnectorCurve = require('./ConnectorCurve.js');
var ContextMenu = require('./ContextMenu.js');
var index_browser = require('../node_modules/nanoid/index.browser.js');
var jsxRuntime = require('react/jsx-runtime');

var _excluded = ["zoomIn", "zoomOut", "resetTransform", "setTransform", "centerView"];
function NodeContainer(_ref) {
  var _state$scale, _state$position$x, _state$position, _state$position$y, _state$position2;
  var {
    portTypes,
    nodeTypes,
    state,
    onChangeState
  } = _ref;
  var {
    dragInfo
  } = DragContext.useDragContext();
  var {
    position,
    setPosition,
    scale,
    setScale
  } = ScreenContext.useScreenContext();
  var [dstDragPosition, setDstDragPosition] = React.useState({
    x: 0,
    y: 0
  });
  var [pointerPosition, setPointerPosition] = React.useState({
    x: 0,
    y: 0
  });
  React.useEffect(() => {
    if (!dragInfo) {
      setDstDragPosition(null);
      return;
    }
    var mouseMoveListener = event => {
      setPointerPosition({
        x: event.pageX - window.scrollX,
        y: event.pageY - window.scrollY
      });
      if (!dragInfo) return;
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
  var addNode = React.useCallback((nodeType, pos) => {
    var newNode = {
      id: index_browser.nanoid(),
      name: nodeType.label,
      type: nodeType.type,
      position: pos,
      values: {}
    };
    onChangeState(prev => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev), {}, {
      nodes: [...prev.nodes, newNode]
    }));
  }, [onChangeState]);
  var removeNode = React.useCallback(id => {
    var _node$connections$out, _node$connections$inp;
    var node = state.nodes.find(node => node.id === id);
    if (!node) return;
    var nodesToRemove = [id];
    var nodesToAdd = [];
    (_node$connections$out = node.connections.outputs) === null || _node$connections$out === void 0 ? void 0 : _node$connections$out.forEach(conn => {
      var otherNode = state.nodes.find(node => node.id === conn.node);
      if (!otherNode) return;
      nodesToRemove.push(otherNode.id);
      nodesToAdd.push(_rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, otherNode), {}, {
        connections: {
          outputs: otherNode.connections.outputs,
          inputs: otherNode.connections.inputs.filter(c => !(c.port === conn.name && c.node === node.id))
        }
      }));
    });
    (_node$connections$inp = node.connections.inputs) === null || _node$connections$inp === void 0 ? void 0 : _node$connections$inp.forEach(conn => {
      var otherNode = state.nodes.find(node => node.id === conn.node);
      if (!otherNode) return;
      nodesToRemove.push(otherNode.id);
      nodesToAdd.push(_rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, otherNode), {}, {
        connections: {
          outputs: otherNode.connections.outputs.filter(c => !(c.port === conn.name && c.node === node.id)),
          inputs: otherNode.connections.inputs
        }
      }));
    });
    onChangeState(prev => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev), {}, {
      nodes: [...prev.nodes.filter(node => !nodesToRemove.includes(node.id)), ...nodesToAdd]
    }));
  }, [onChangeState, state === null || state === void 0 ? void 0 : state.nodes]);
  var cloneNode = React.useCallback(id => {
    var node = state.nodes.find(node => node.id === id);
    var newNode = _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, node), {}, {
      id: index_browser.nanoid(),
      position: {
        x: node.position.x + 20,
        y: node.position.y + 20
      },
      connections: {
        inputs: [],
        outputs: []
      }
    });
    onChangeState(prev => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev), {}, {
      nodes: [...prev.nodes, newNode]
    }));
  }, [onChangeState, state === null || state === void 0 ? void 0 : state.nodes]);
  var removeConnectionFromOutput = React.useCallback((srcNode, srcPort, dstNode, dstPort) => {
    onChangeState(prev => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev), {}, {
      nodes: prev.nodes.map(node => {
        if (node.id === srcNode) {
          return _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, node), {}, {
            connections: {
              inputs: node.connections.inputs,
              outputs: node.connections.outputs.filter(conn => !(conn.name === srcPort && conn.node === dstNode && conn.port === dstPort))
            }
          });
        } else if (node.id === dstNode) {
          return _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, node), {}, {
            connections: {
              inputs: node.connections.inputs.filter(conn => !(conn.name === dstPort && conn.node === srcNode && conn.port === srcPort)),
              outputs: node.connections.outputs
            }
          });
        }
        return node;
      })
    }));
  }, [onChangeState]);
  var screenRef = React.useRef();
  var [isMoveable, setIsMoveable] = React.useState(false);
  var [canMove, setCanMove] = React.useState(true);
  var onZoom = React.useCallback(params => {
    var _scale = params.state.scale;
    setScale(_scale);
    onChangeState(prev => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev), {}, {
      scale: _scale
    }));
    var _position = {
      x: params.state.positionX,
      y: params.state.positionY
    };
    setPosition(_position);
  }, []);
  var onTransform = React.useCallback(params => {
    var _position = {
      x: params.state.positionX,
      y: params.state.positionY
    };
    setPosition(_position);
    onChangeState(prev => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev), {}, {
      position: _position
    }));
  }, []);
  var gridSize = 40;
  var scaledGridSize = gridSize * scale;
  var scaledPositionX = position.x % scaledGridSize;
  var scaledPositionY = position.y % scaledGridSize;
  var onConnect = React.useCallback(_ref2 => {
    var {
      source,
      target
    } = _ref2;
    if (!(state !== null && state !== void 0 && state.nodes)) return;
    var item = {
      srcNode: source.nodeId,
      dstNode: target.nodeId,
      srcPort: source.portName,
      dstPort: target.portName
    };
    if (item.srcNode === item.dstNode) return;
    var srcNodeIdx = state.nodes.findIndex(n => n.id === item.srcNode);
    var dstNodeIdx = state.nodes.findIndex(n => n.id === item.dstNode);

    // deep merge
    var srcNode = JSON.parse(JSON.stringify(state.nodes[srcNodeIdx]));
    var dstNode = JSON.parse(JSON.stringify(state.nodes[dstNodeIdx]));
    var srcPort = nodeTypes[srcNode.type].outputs.find(p => p.name === item.srcPort);
    var dstPort = nodeTypes[dstNode.type].inputs.find(p => p.name === item.dstPort);
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
        port: dstPort.name
      });
    }
    if (!dstNode.connections.inputs.find(c => c.name === srcPort.name)) {
      dstNode.connections.inputs.push({
        name: dstPort.name,
        node: srcNode.id,
        port: srcPort.name
      });
    }
    var minNodeIdx = Math.min(srcNodeIdx, dstNodeIdx);
    var maxNodeIdx = Math.max(srcNodeIdx, dstNodeIdx);
    var minNode = srcNodeIdx < dstNodeIdx ? srcNode : dstNode;
    var maxNode = srcNodeIdx < dstNodeIdx ? dstNode : srcNode;
    onChangeState(prev => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev), {}, {
      nodes: [...prev.nodes.slice(0, minNodeIdx), minNode, ...prev.nodes.slice(minNodeIdx + 1, maxNodeIdx), maxNode, ...prev.nodes.slice(maxNodeIdx + 1)]
    }));
  }, [state === null || state === void 0 ? void 0 : state.nodes, onChangeState, nodeTypes]);
  var pinchOptions = React.useMemo(() => ({
    step: 5
  }), []);
  var panningOptions = React.useMemo(() => ({
    disabled: isMoveable,
    excluded: ['node', 'react-draggable', 'port', 'port-connector']
  }), [isMoveable]);
  var wrapperStyle = React.useMemo(() => ({
    height: '100vh',
    width: '100vw',
    backgroundSize: "".concat(scaledGridSize, "px ").concat(scaledGridSize, "px"),
    backgroundImage: "linear-gradient(to right, #CCCCCC 1px, transparent 1px), linear-gradient(to bottom, #CCCCCC 1px, transparent 1px)",
    backgroundPosition: "".concat(scaledPositionX, "px ").concat(scaledPositionY, "px")
  }), [scaledGridSize, scaledPositionX, scaledPositionY]);
  var nodeTypesByCategory = React.useMemo(() => {
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
  var wrapperProps = React.useCallback(handleContextMenu => ({
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
  if (!state) return null;
  return /*#__PURE__*/jsxRuntime.jsx("div", {
    style: {
      position: 'relative',
      border: "1px solid blue"
    },
    children: /*#__PURE__*/jsxRuntime.jsx(index_esm.TransformWrapper, {
      initialScale: (_state$scale = state === null || state === void 0 ? void 0 : state.scale) !== null && _state$scale !== void 0 ? _state$scale : 1,
      initialPositionX: (_state$position$x = state === null || state === void 0 ? void 0 : (_state$position = state.position) === null || _state$position === void 0 ? void 0 : _state$position.x) !== null && _state$position$x !== void 0 ? _state$position$x : 0,
      initialPositionY: (_state$position$y = state === null || state === void 0 ? void 0 : (_state$position2 = state.position) === null || _state$position2 === void 0 ? void 0 : _state$position2.y) !== null && _state$position$y !== void 0 ? _state$position$y : 0,
      disabled: isMoveable,
      minScale: .25,
      maxScale: 2,
      limitToBounds: false,
      onPanning: onTransform,
      onZoom: onZoom,
      pinch: pinchOptions,
      panning: panningOptions,
      children: _ref5 => {
        var {
            zoomIn,
            zoomOut,
            resetTransform,
            setTransform,
            centerView
          } = _ref5;
          _rollupPluginBabelHelpers.objectWithoutProperties(_ref5, _excluded);
        return /*#__PURE__*/jsxRuntime.jsxs(jsxRuntime.Fragment, {
          children: [/*#__PURE__*/jsxRuntime.jsxs("div", {
            style: {
              position: 'absolute',
              bottom: '40px',
              right: '40px',
              zIndex: 1000,
              width: '30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'white',
              border: '1px solid #CCC',
              borderRadius: '.5rem',
              padding: '.5rem',
              boxShadow: '0 0 5px #CCC',
              gap: '.5rem'
            },
            children: [/*#__PURE__*/jsxRuntime.jsx("button", {
              style: {
                width: '30px',
                height: '30px'
              },
              onClick: () => zoomIn(),
              children: "+"
            }), /*#__PURE__*/jsxRuntime.jsx("button", {
              style: {
                width: '30px',
                height: '30px'
              },
              onClick: () => zoomOut(),
              children: "-"
            }), /*#__PURE__*/jsxRuntime.jsx("button", {
              style: {
                width: '30px',
                height: '30px'
              },
              onClick: () => centerView(),
              children: "C"
            }), /*#__PURE__*/jsxRuntime.jsx("button", {
              style: {
                width: '30px',
                height: '30px'
              },
              onClick: () => {
                setTransform(position.x, position.y, 1);
                setScale(1);
              },
              children: "Z"
            }), /*#__PURE__*/jsxRuntime.jsx("button", {
              style: {
                width: '30px',
                height: '30px'
              },
              onClick: () => setCanMove(!canMove),
              children: canMove ? 'L' : 'U'
            })]
          }), /*#__PURE__*/jsxRuntime.jsxs("div", {
            style: {
              position: 'absolute',
              bottom: '40px',
              right: '150px',
              zIndex: 1000,
              width: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'white',
              border: '1px solid #CCC',
              borderRadius: '.5rem',
              padding: '.5rem',
              boxShadow: '0 0 5px #CCC',
              gap: '.5rem',
              fontSize: '9px'
            },
            children: [/*#__PURE__*/jsxRuntime.jsxs("div", {
              children: ["Scale: ", scale]
            }), /*#__PURE__*/jsxRuntime.jsxs("div", {
              children: ["Position: ", JSON.stringify(position)]
            }), /*#__PURE__*/jsxRuntime.jsxs("div", {
              children: ["Pointer: ", JSON.stringify(pointerPosition)]
            })]
          }), /*#__PURE__*/jsxRuntime.jsx(ContextMenu.ContextMenu, {
            children: _ref6 => {
              var _state$nodes;
              var {
                handleContextMenu
              } = _ref6;
              return /*#__PURE__*/jsxRuntime.jsxs(index_esm.TransformComponent, {
                contentClass: "main",
                wrapperStyle: wrapperStyle,
                wrapperProps: wrapperProps(handleContextMenu),
                children: [state === null || state === void 0 ? void 0 : (_state$nodes = state.nodes) === null || _state$nodes === void 0 ? void 0 : _state$nodes.map((node, index) => {
                  var _node$connections, _node$connections$out2;
                  return /*#__PURE__*/jsxRuntime.jsxs(jsxRuntime.Fragment, {
                    children: [/*#__PURE__*/jsxRuntime.jsx(Node, {
                      id: "node_".concat(node.id),
                      name: node.name,
                      portTypes: portTypes,
                      nodeType: nodeTypes === null || nodeTypes === void 0 ? void 0 : nodeTypes[node.type],
                      value: node,
                      onValueChange: v => {
                        onChangeState(prev => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev), {}, {
                          nodes: [...prev.nodes.slice(0, index), _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev.nodes[index]), {}, {
                            values: _rollupPluginBabelHelpers.objectSpread2({}, v.values)
                          }), ...prev.nodes.slice(index + 1)]
                        }));
                      },
                      onChangePosition: position => {
                        console.log('onChangePosition', position);
                        onChangeState(prev => _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev), {}, {
                          nodes: [...prev.nodes.slice(0, index), _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev.nodes[index]), {}, {
                            position
                          }), ...prev.nodes.slice(index + 1)]
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
                        console.log('onResize', size);
                        onChangeState(prev => {
                          var _prev$nodes$index$con, _prev$nodes$index$con2;
                          return _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev), {}, {
                            nodes: [...prev.nodes.slice(0, index), _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev.nodes[index]), {}, {
                              connections: _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, prev.nodes[index].connections), {}, {
                                outputs: [...((_prev$nodes$index$con = (_prev$nodes$index$con2 = prev.nodes[index].connections) === null || _prev$nodes$index$con2 === void 0 ? void 0 : _prev$nodes$index$con2.outputs) !== null && _prev$nodes$index$con !== void 0 ? _prev$nodes$index$con : [])]
                              }),
                              size
                            }), ...prev.nodes.slice(index + 1)]
                          });
                        });
                      }
                    }, "node_".concat(node.id)), (_node$connections = node.connections) === null || _node$connections === void 0 ? void 0 : (_node$connections$out2 = _node$connections.outputs) === null || _node$connections$out2 === void 0 ? void 0 : _node$connections$out2.map((connection, index) => {
                      var srcNode = node.id;
                      var srcPort = connection.name;
                      var dstNode = connection.node;
                      var dstPort = connection.port;
                      var srcElem = document.getElementById("card-".concat(srcNode, "-output-").concat(srcPort));
                      var dstElem = document.getElementById("card-".concat(dstNode, "-input-").concat(dstPort));
                      if (!srcElem || !dstElem) {
                        return null;
                      }
                      var srcRect = srcElem.getBoundingClientRect();
                      var dstRect = dstElem.getBoundingClientRect();
                      var srcPos = {
                        x: (srcRect.x + window.scrollX - position.x + srcRect.width / 2) / scale,
                        y: (srcRect.y + window.scrollY - position.y + srcRect.height / 2) / scale
                      };
                      var dstPos = {
                        x: (dstRect.x + window.scrollX - position.x + dstRect.width / 2) / scale,
                        y: (dstRect.y + window.scrollY - position.y + dstRect.height / 2) / scale
                      };
                      return /*#__PURE__*/jsxRuntime.jsx(ConnectorCurve.ConnectorCurve, {
                        src: srcPos,
                        dst: dstPos,
                        scale: scale,
                        onContextMenu: e => handleContextMenu(e, [{
                          label: "Remover esta conex\xE3o",
                          style: {
                            color: 'red'
                          },
                          onClick: () => {
                            removeConnectionFromOutput(srcNode, srcPort, dstNode, dstPort);
                          }
                        }])
                      }, "connector-".concat(srcNode, "-").concat(srcPort, "-").concat(dstNode, "-").concat(dstPort));
                    })]
                  });
                }), dragInfo && dstDragPosition && /*#__PURE__*/jsxRuntime.jsx(ConnectorCurve.ConnectorCurve, {
                  tmp: true,
                  src: {
                    x: (dragInfo.startX + window.scrollX - position.x + 5) / scale,
                    y: (dragInfo.startY + window.scrollY - position.y + 5) / scale
                  },
                  dst: {
                    x: (dstDragPosition.x + window.scrollX - position.x) / scale,
                    y: (dstDragPosition.y + window.scrollY - position.y) / scale
                  },
                  scale: scale
                })]
              });
            }
          })]
        });
      }
    })
  });
}

module.exports = NodeContainer;
//# sourceMappingURL=Screen.js.map
