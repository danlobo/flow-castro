import { objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import { memo, useRef, useEffect, useCallback, useMemo } from 'react';
import NodePort from './NodePort.js';
import { useScreenContext } from './ScreenContext.js';
import nodeCss from './Node.module.css.js';
import { useTheme } from './ThemeProvider.js';
import { jsxs, jsx } from 'react/jsx-runtime';

function Node(_ref) {
  var _currentTheme$nodes$n, _currentTheme$nodes, _currentTheme$nodes2, _currentTheme$nodes$n2, _currentTheme$nodes3, _currentTheme$nodes4, _currentTheme$nodes$n3, _currentTheme$nodes5, _currentTheme$nodes6, _currentTheme$nodes$n4, _currentTheme$nodes7, _currentTheme$nodes8, _currentTheme$nodes$n5, _currentTheme$nodes9, _currentTheme$nodes10;
  var {
    name,
    portTypes,
    nodeType,
    value,
    canMove,
    onChangePosition,
    onDragEnd,
    onConnect,
    containerRef,
    onContextMenu,
    onResize,
    onValueChange: _onValueChange
  } = _ref;
  var {
    currentTheme
  } = useTheme();
  var nodeRef = useRef();
  useEffect(() => {
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
  useEffect(() => {
    if (nodeId == null) throw new Error('Node id is required');
    if (name == null) throw new Error('Node name is required');
    if (name !== nodeName) {
      console.warn('Node name mismatch', name, nodeName);
    }
  }, [name, nodeName, nodeId]);
  var {
    scale: screenScale
  } = useScreenContext();
  var handleMouseDown = useCallback(event => {
    if (!canMove) return;

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
    var handleMouseUp = e => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      var dx = e.pageX - startX;
      var dy = e.pageY - startY;
      if (Math.abs(dx) >= 2 && Math.abs(dy) >= 2) {
        onDragEnd === null || onDragEnd === void 0 ? void 0 : onDragEnd({
          x: nodePosition.x + dx / screenScale,
          y: nodePosition.y + dy / screenScale
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [nodePosition, screenScale, onChangePosition, onDragEnd]);
  var onOutputPortConnected = useCallback(_ref2 => {
    var {
      source,
      target
    } = _ref2;
    onConnect === null || onConnect === void 0 ? void 0 : onConnect({
      source,
      target
    });
  }, [onConnect]);
  var onInputPortConnected = useCallback(_ref3 => {
    var {
      source,
      target
    } = _ref3;
    onConnect === null || onConnect === void 0 ? void 0 : onConnect({
      source: target,
      target: source
    });
  }, [onConnect]);
  var nodeInputs = useMemo(() => {
    if (typeof nodeType.inputs === 'function') return nodeType.inputs(nodeValues);
    return nodeType.inputs;
  }, [nodeType, nodeValues]);
  var nodeOutputs = useMemo(() => {
    if (typeof nodeType.outputs === 'function') return nodeType.outputs(nodeValues);
    return nodeType.outputs;
  }, [nodeType, nodeValues]);
  return /*#__PURE__*/jsxs("div", {
    ref: nodeRef,
    id: "card-".concat(name),
    className: nodeCss.node,
    style: {
      backgroundColor: (_currentTheme$nodes$n = currentTheme === null || currentTheme === void 0 || (_currentTheme$nodes = currentTheme.nodes) === null || _currentTheme$nodes === void 0 || (_currentTheme$nodes = _currentTheme$nodes[nodeType === null || nodeType === void 0 ? void 0 : nodeType.type]) === null || _currentTheme$nodes === void 0 || (_currentTheme$nodes = _currentTheme$nodes.body) === null || _currentTheme$nodes === void 0 ? void 0 : _currentTheme$nodes.background) !== null && _currentTheme$nodes$n !== void 0 ? _currentTheme$nodes$n : currentTheme === null || currentTheme === void 0 || (_currentTheme$nodes2 = currentTheme.nodes) === null || _currentTheme$nodes2 === void 0 || (_currentTheme$nodes2 = _currentTheme$nodes2.common) === null || _currentTheme$nodes2 === void 0 || (_currentTheme$nodes2 = _currentTheme$nodes2.body) === null || _currentTheme$nodes2 === void 0 ? void 0 : _currentTheme$nodes2.background,
      border: (_currentTheme$nodes$n2 = currentTheme === null || currentTheme === void 0 || (_currentTheme$nodes3 = currentTheme.nodes) === null || _currentTheme$nodes3 === void 0 || (_currentTheme$nodes3 = _currentTheme$nodes3[nodeType === null || nodeType === void 0 ? void 0 : nodeType.type]) === null || _currentTheme$nodes3 === void 0 || (_currentTheme$nodes3 = _currentTheme$nodes3.body) === null || _currentTheme$nodes3 === void 0 ? void 0 : _currentTheme$nodes3.border) !== null && _currentTheme$nodes$n2 !== void 0 ? _currentTheme$nodes$n2 : currentTheme === null || currentTheme === void 0 || (_currentTheme$nodes4 = currentTheme.nodes) === null || _currentTheme$nodes4 === void 0 || (_currentTheme$nodes4 = _currentTheme$nodes4.common) === null || _currentTheme$nodes4 === void 0 || (_currentTheme$nodes4 = _currentTheme$nodes4.body) === null || _currentTheme$nodes4 === void 0 ? void 0 : _currentTheme$nodes4.border,
      color: (_currentTheme$nodes$n3 = currentTheme === null || currentTheme === void 0 || (_currentTheme$nodes5 = currentTheme.nodes) === null || _currentTheme$nodes5 === void 0 || (_currentTheme$nodes5 = _currentTheme$nodes5[nodeType === null || nodeType === void 0 ? void 0 : nodeType.type]) === null || _currentTheme$nodes5 === void 0 || (_currentTheme$nodes5 = _currentTheme$nodes5.body) === null || _currentTheme$nodes5 === void 0 ? void 0 : _currentTheme$nodes5.color) !== null && _currentTheme$nodes$n3 !== void 0 ? _currentTheme$nodes$n3 : currentTheme === null || currentTheme === void 0 || (_currentTheme$nodes6 = currentTheme.nodes) === null || _currentTheme$nodes6 === void 0 || (_currentTheme$nodes6 = _currentTheme$nodes6.common) === null || _currentTheme$nodes6 === void 0 || (_currentTheme$nodes6 = _currentTheme$nodes6.body) === null || _currentTheme$nodes6 === void 0 ? void 0 : _currentTheme$nodes6.color,
      transform: "translate(".concat(nodePosition.x, "px, ").concat(nodePosition.y, "px)"),
      cursor: canMove ? 'grab' : null
    },
    onMouseDown: handleMouseDown,
    onContextMenu: onContextMenu,
    children: [/*#__PURE__*/jsx("div", {
      className: nodeCss.title,
      style: {
        backgroundColor: (_currentTheme$nodes$n4 = currentTheme === null || currentTheme === void 0 || (_currentTheme$nodes7 = currentTheme.nodes) === null || _currentTheme$nodes7 === void 0 || (_currentTheme$nodes7 = _currentTheme$nodes7[nodeType === null || nodeType === void 0 ? void 0 : nodeType.type]) === null || _currentTheme$nodes7 === void 0 ? void 0 : _currentTheme$nodes7.background) !== null && _currentTheme$nodes$n4 !== void 0 ? _currentTheme$nodes$n4 : currentTheme === null || currentTheme === void 0 || (_currentTheme$nodes8 = currentTheme.nodes) === null || _currentTheme$nodes8 === void 0 || (_currentTheme$nodes8 = _currentTheme$nodes8.common) === null || _currentTheme$nodes8 === void 0 || (_currentTheme$nodes8 = _currentTheme$nodes8.title) === null || _currentTheme$nodes8 === void 0 ? void 0 : _currentTheme$nodes8.background,
        color: (_currentTheme$nodes$n5 = currentTheme === null || currentTheme === void 0 || (_currentTheme$nodes9 = currentTheme.nodes) === null || _currentTheme$nodes9 === void 0 || (_currentTheme$nodes9 = _currentTheme$nodes9[nodeType === null || nodeType === void 0 ? void 0 : nodeType.type]) === null || _currentTheme$nodes9 === void 0 ? void 0 : _currentTheme$nodes9.color) !== null && _currentTheme$nodes$n5 !== void 0 ? _currentTheme$nodes$n5 : currentTheme === null || currentTheme === void 0 || (_currentTheme$nodes10 = currentTheme.nodes) === null || _currentTheme$nodes10 === void 0 || (_currentTheme$nodes10 = _currentTheme$nodes10.common) === null || _currentTheme$nodes10 === void 0 || (_currentTheme$nodes10 = _currentTheme$nodes10.title) === null || _currentTheme$nodes10 === void 0 ? void 0 : _currentTheme$nodes10.color
      },
      children: /*#__PURE__*/jsx("h3", {
        children: name
      })
    }), /*#__PURE__*/jsxs("div", {
      className: nodeCss.container,
      children: [/*#__PURE__*/jsx("div", {
        className: [nodeCss.portsContainer, nodeCss.inputPortsContainer].join(' '),
        children: nodeInputs === null || nodeInputs === void 0 ? void 0 : nodeInputs.map(input => {
          var _value$connections;
          return /*#__PURE__*/jsx(NodePort, {
            name: input.name,
            value: nodeValues[input.name],
            onValueChange: v1 => {
              _onValueChange === null || _onValueChange === void 0 ? void 0 : _onValueChange(_objectSpread2(_objectSpread2({}, value), {}, {
                values: _objectSpread2(_objectSpread2({}, value.values), {}, {
                  [input.name]: v1
                })
              }));
            },
            nodeId: nodeId,
            type: portTypes[input.type],
            direction: "input",
            label: input.label,
            hidePort: Boolean(input.hidePort),
            containerRef: containerRef,
            isConnected: (_value$connections = value.connections) === null || _value$connections === void 0 || (_value$connections = _value$connections.inputs) === null || _value$connections === void 0 ? void 0 : _value$connections.some(c => c.name === input.name),
            onConnected: onInputPortConnected,
            canMove: canMove
          }, input.name);
        })
      }), /*#__PURE__*/jsx("div", {
        className: [nodeCss.portsContainer, nodeCss.outputPortsContainer].join(' '),
        children: nodeOutputs === null || nodeOutputs === void 0 ? void 0 : nodeOutputs.map(output => {
          var _value$connections2;
          return /*#__PURE__*/jsx(NodePort, {
            name: output.name,
            nodeId: nodeId,
            type: portTypes[output.type],
            direction: "output",
            label: output.label,
            containerRef: containerRef,
            isConnected: (_value$connections2 = value.connections) === null || _value$connections2 === void 0 || (_value$connections2 = _value$connections2.outputs) === null || _value$connections2 === void 0 ? void 0 : _value$connections2.some(c => c.name === output.name),
            onConnected: onOutputPortConnected,
            canMove: canMove
          }, output.name);
        })
      })]
    })]
  }, "card-".concat(name));
}
var Node$1 = /*#__PURE__*/memo(Node);

export { Node$1 as default };
//# sourceMappingURL=Node.js.map
