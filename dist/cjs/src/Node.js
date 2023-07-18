'use strict';

var _rollupPluginBabelHelpers = require('../_virtual/_rollupPluginBabelHelpers.js');
var React = require('react');
var NodePort = require('./NodePort.js');
var ScreenContext = require('./ScreenContext.js');
var jsxRuntime = require('react/jsx-runtime');

function Node(_ref) {
  var _nodeType$inputs, _nodeType$outputs;
  var {
    name,
    portTypes,
    nodeType,
    value,
    onChangePosition,
    onConnect,
    containerRef,
    onContextMenu,
    onResize,
    onValueChange: _onValueChange
  } = _ref;
  var nodeRef = React.useRef();
  React.useEffect(() => {
    var currentRef = nodeRef.current;
    var observer = new ResizeObserver(entries => {
      onResize({
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height
      });
    });
    observer.observe(currentRef);
    return () => {
      observer.unobserve(currentRef);
    };
  }, []);
  var {
    id: nodeId,
    name: nodeName,
    position: nodePosition,
    values: nodeValues
  } = value;
  React.useEffect(() => {
    if (nodeId == null) throw new Error('Node id is required');
    if (name == null) throw new Error('Node name is required');
    if (name !== nodeName) {
      console.warn('Node name mismatch', name, nodeName);
    }
  }, [name, nodeName, nodeId]);
  var {
    scale: screenScale
  } = ScreenContext.useScreenContext();
  var handleMouseDown = event => {
    // event.preventDefault();
    event.stopPropagation();
    var startX = event.pageX;
    var startY = event.pageY;
    var handleMouseMove = event => {
      var dx = event.pageX - startX;
      var dy = event.pageY - startY;
      onChangePosition({
        x: nodePosition.x + dx / screenScale,
        y: nodePosition.y + dy / screenScale
      });
    };
    var handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  var onOutputPortConnected = React.useCallback(_ref2 => {
    var {
      source,
      target
    } = _ref2;
    console.log('onOutputPortConnected', {
      source,
      target
    });
    onConnect === null || onConnect === void 0 ? void 0 : onConnect({
      source,
      target
    });
  }, [onConnect]);
  var onInputPortConnected = React.useCallback(_ref3 => {
    var {
      source,
      target
    } = _ref3;
    console.log('onInputPortConnected', {
      source,
      target
    });
    onConnect === null || onConnect === void 0 ? void 0 : onConnect({
      source: target,
      target: source
    });
  }, [onConnect]);
  var handleResolveClick = React.useCallback(e => {
    var _nodeType$resolve;
    e.preventDefault();
    e.stopPropagation();
    var resolvedValue = nodeType === null || nodeType === void 0 ? void 0 : (_nodeType$resolve = nodeType.resolve) === null || _nodeType$resolve === void 0 ? void 0 : _nodeType$resolve.call(nodeType, nodeValues);
    console.log('resolvedValue', resolvedValue);
  }, [name, nodeValues, nodeType]);
  return /*#__PURE__*/jsxRuntime.jsxs("div", {
    ref: nodeRef,
    id: "card-".concat(name),
    className: "node",
    style: {
      transform: "translate(".concat(nodePosition.x, "px, ").concat(nodePosition.y, "px)")
    },
    onMouseDown: handleMouseDown,
    onContextMenu: onContextMenu,
    children: [/*#__PURE__*/jsxRuntime.jsx("div", {
      style: {
        padding: '0 1rem'
      },
      children: /*#__PURE__*/jsxRuntime.jsx("h3", {
        children: name
      })
    }), /*#__PURE__*/jsxRuntime.jsxs("div", {
      style: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      },
      children: [/*#__PURE__*/jsxRuntime.jsx("div", {
        style: {
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '1rem'
        },
        children: nodeType === null || nodeType === void 0 ? void 0 : (_nodeType$inputs = nodeType.inputs) === null || _nodeType$inputs === void 0 ? void 0 : _nodeType$inputs.map(input => {
          var _value$connections, _value$connections$in;
          return /*#__PURE__*/jsxRuntime.jsx(NodePort, {
            name: input.name,
            value: nodeValues[input.name],
            onValueChange: v1 => {
              _onValueChange === null || _onValueChange === void 0 ? void 0 : _onValueChange(_rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, value), {}, {
                values: _rollupPluginBabelHelpers.objectSpread2(_rollupPluginBabelHelpers.objectSpread2({}, value.values), {}, {
                  [input.name]: v1
                })
              }));
            },
            nodeId: nodeId,
            type: portTypes[input.type],
            direction: "input",
            label: input.label,
            containerRef: containerRef,
            isConnected: (_value$connections = value.connections) === null || _value$connections === void 0 ? void 0 : (_value$connections$in = _value$connections.inputs) === null || _value$connections$in === void 0 ? void 0 : _value$connections$in.some(c => c.name === input.name),
            onConnected: onInputPortConnected
          }, input.name);
        })
      }), /*#__PURE__*/jsxRuntime.jsx("div", {
        style: {
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '1rem'
        },
        children: nodeType === null || nodeType === void 0 ? void 0 : (_nodeType$outputs = nodeType.outputs) === null || _nodeType$outputs === void 0 ? void 0 : _nodeType$outputs.map(output => {
          var _value$connections2, _value$connections2$o;
          return /*#__PURE__*/jsxRuntime.jsx(NodePort, {
            name: output.name,
            nodeId: nodeId,
            type: portTypes[output.type],
            direction: "output",
            label: output.label,
            containerRef: containerRef,
            isConnected: (_value$connections2 = value.connections) === null || _value$connections2 === void 0 ? void 0 : (_value$connections2$o = _value$connections2.outputs) === null || _value$connections2$o === void 0 ? void 0 : _value$connections2$o.some(c => c.name === output.name),
            onConnected: onOutputPortConnected
          }, output.name);
        })
      }), /*#__PURE__*/jsxRuntime.jsx("div", {
        children: /*#__PURE__*/jsxRuntime.jsx("button", {
          onClick: handleResolveClick,
          children: "Resolve"
        })
      })]
    })]
  }, "card-".concat(name));
}
var Node$1 = /*#__PURE__*/React.memo(Node);

module.exports = Node$1;
//# sourceMappingURL=Node.js.map
