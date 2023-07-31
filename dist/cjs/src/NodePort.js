'use strict';

var React = require('react');
var DragContext = require('./DragContext.js');
var ScreenContext = require('./ScreenContext.js');
var NodePort_module = require('./NodePort.module.css.js');
var ThemeProvider = require('./ThemeProvider.js');
var jsxRuntime = require('react/jsx-runtime');

var globalToLocal = (globalX, globalY, translate, scale) => {
  var localX = globalX / scale;
  var localY = globalY / scale;
  return {
    x: localX,
    y: localY
  };
};
function NodePort(_ref) {
  var _ref2, _type$render, _ref3, _currentTheme$ports$c, _currentTheme$ports, _type$type2, _currentTheme$ports2, _shapeStyles, _type$shape;
  var {
    name,
    type,
    nodeId,
    label,
    hidePort,
    onConnected,
    isConnected,
    direction,
    value,
    onValueChange,
    canMove
  } = _ref;
  var {
    currentTheme
  } = ThemeProvider.useTheme();
  var {
    position: screenPosition,
    scale: screenScale
  } = ScreenContext.useScreenContext();
  var {
    dragInfo,
    setDragInfo
  } = DragContext.useDragContext();
  var [internalValue, setInternalValue] = React.useState(value);
  var shapeStyles = React.useMemo(() => ({
    circle: NodePort_module.circle,
    square: NodePort_module.square,
    diamond: NodePort_module.diamond
  }), []);
  React.useEffect(() => {
    if (!name) throw new Error('Port name is required');
  }, [name]);
  React.useEffect(() => {}, [internalValue]);
  React.useEffect(() => {
    if (isConnected) {
      onValueChange === null || onValueChange === void 0 ? void 0 : onValueChange(null);
    }
  }, [isConnected]);
  var containerRef = React.useRef(null);
  var connectorRef = React.useRef(null);
  React.useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange === null || onValueChange === void 0 ? void 0 : onValueChange(internalValue);
  }, [internalValue]);
  var connectorRect = React.useRef();
  React.useEffect(() => {
    if (!connectorRef.current) return;
    connectorRect.current = connectorRef.current.getBoundingClientRect();
  }, [connectorRef.current]);
  var containerRect = React.useRef();
  React.useEffect(() => {
    if (!containerRef.current) return;
    containerRect.current = containerRef.current.getBoundingClientRect();
  }, [containerRef.current]);
  var [pointerPos, setPointerPos] = React.useState({
    x: 0,
    y: 0
  });
  var handleMouseDown = event => {
    if (hidePort || !canMove) return;

    //event.preventDefault();
    event.stopPropagation();
    var nodePos = containerRef.current.getBoundingClientRect();
    globalToLocal(event.pageX - nodePos.left, event.pageY - nodePos.top, screenPosition, screenScale);
    var connectorRect = connectorRef.current.getBoundingClientRect();
    var _dragInfo = {
      type: 'connector',
      nodeId,
      portName: name,
      portType: type,
      startX: connectorRect.left,
      startY: connectorRect.top
    };
    setDragInfo(_dragInfo);
    var handleMouseMove = event => {
      if (!_dragInfo) return;
      if (_dragInfo.type !== 'connector') return;
      var localPos = globalToLocal(event.pageX - nodePos.left, event.pageY - nodePos.top, screenPosition, screenScale);
      setPointerPos({
        x: localPos.x,
        y: localPos.y
      });
    };
    var handleMouseUp = e => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setDragInfo(null);
      if (!_dragInfo) return;
      var targets = document.elementsFromPoint(e.pageX - window.scrollX, e.pageY - window.scrollY);
      var target = targets.find(t => {
        var _t$classList, _type$type;
        return ((_t$classList = t.classList) === null || _t$classList === void 0 ? void 0 : _t$classList.contains(NodePort_module.portOverlay)) && t.dataset.portDirection.toString() !== direction.toString() && t.dataset.portType.toString() === ((_type$type = type.type) === null || _type$type === void 0 ? void 0 : _type$type.toString());
      });
      if (target) {
        onConnected === null || onConnected === void 0 ? void 0 : onConnected({
          source: {
            nodeId,
            portName: name
          },
          target: {
            nodeId: target.dataset.nodeId,
            portName: target.dataset.portName
          }
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  return /*#__PURE__*/jsxRuntime.jsxs("div", {
    ref: containerRef,
    style: {
      cursor: !hidePort && canMove ? 'crosshair' : null
    },
    className: NodePort_module.port,
    onMouseDown: handleMouseDown,
    children: [!hidePort && /*#__PURE__*/jsxRuntime.jsx("div", {
      style: {
        left: direction === 'input' ? 'calc( var(--port-size) * -1.5 )' : 'calc( var(--port-size) * 1.5 )',
        right: 0,
        borderTopLeftRadius: direction === 'input' ? '15px' : null,
        borderBottomLeftRadius: direction === 'input' ? '15px' : null,
        borderTopRightRadius: direction === 'output' ? '15px' : null,
        borderBottomRightRadius: direction === 'output' ? '15px' : null
      },
      className: NodePort_module.portOverlay,
      id: "card-".concat(nodeId, "-").concat(direction, "-").concat(name, "-overlay"),
      "data-port-name": name,
      "data-port-type": type.type,
      "data-port-direction": direction,
      "data-node-id": nodeId
    }), /*#__PURE__*/jsxRuntime.jsx("div", {
      className: NodePort_module.label,
      style: {
        justifyContent: direction === 'input' ? 'flex-start' : 'flex-end'
      },
      children: /*#__PURE__*/jsxRuntime.jsx("span", {
        children: label
      })
    }), /*#__PURE__*/jsxRuntime.jsx("div", {
      className: NodePort_module.formContainer
      //onBlur={handleUpdateForm}
      ,
      onMouseDown: e => {
        e.stopPropagation();
      },
      children: (_ref2 = direction === 'input' && !isConnected && ((_type$render = type.render) === null || _type$render === void 0 ? void 0 : _type$render.call(type, {
        value,
        onChange: onValueChange
      }))) !== null && _ref2 !== void 0 ? _ref2 : null
    }), !hidePort && /*#__PURE__*/jsxRuntime.jsx("div", {
      id: "card-".concat(nodeId, "-").concat(direction, "-").concat(name),
      ref: connectorRef,
      style: {
        background: (_ref3 = (_currentTheme$ports$c = (_currentTheme$ports = currentTheme.ports) === null || _currentTheme$ports === void 0 || (_currentTheme$ports = _currentTheme$ports[(_type$type2 = type === null || type === void 0 ? void 0 : type.type) !== null && _type$type2 !== void 0 ? _type$type2 : 'default']) === null || _currentTheme$ports === void 0 ? void 0 : _currentTheme$ports.color) !== null && _currentTheme$ports$c !== void 0 ? _currentTheme$ports$c : (_currentTheme$ports2 = currentTheme.ports) === null || _currentTheme$ports2 === void 0 || (_currentTheme$ports2 = _currentTheme$ports2.default) === null || _currentTheme$ports2 === void 0 ? void 0 : _currentTheme$ports2.color) !== null && _ref3 !== void 0 ? _ref3 : currentTheme.colors.background,
        borderColor: isConnected ? currentTheme.colors.hover : currentTheme.colors.text,
        left: direction === 'input' ? 'calc( var(--port-size) * -1 - 4px )' : null,
        right: direction === 'output' ? 'calc( var(--port-size) * -1 - 4px )' : null
      },
      className: [NodePort_module.portConnector, (_shapeStyles = shapeStyles[(_type$shape = type === null || type === void 0 ? void 0 : type.shape) !== null && _type$shape !== void 0 ? _type$shape : 'circle']) !== null && _shapeStyles !== void 0 ? _shapeStyles : null].filter(Boolean).join(' ')
    })]
  });
}
var NodePort$1 = /*#__PURE__*/React.memo(NodePort);

module.exports = NodePort$1;
//# sourceMappingURL=NodePort.js.map
