import { objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import { memo, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useDragContext } from './DragContext.js';
import { useScreenContext } from './ScreenContext.js';
import { jsxs, jsx } from 'react/jsx-runtime';

var globalToLocal = (globalX, globalY, translate, scale) => {
  var localX = globalX / scale;
  var localY = globalY / scale;
  return {
    x: localX,
    y: localY
  };
};
function NodePort(_ref) {
  var _shapeStyles, _type$shape;
  var {
    name,
    type,
    nodeId,
    label,
    onConnected,
    isConnected,
    direction,
    value,
    onValueChange
  } = _ref;
  var {
    position: screenPosition,
    scale: screenScale
  } = useScreenContext();
  var {
    dragInfo,
    setDragInfo
  } = useDragContext();
  var [internalValue, setInternalValue] = useState(value);
  var shapeStyles = useMemo(() => ({
    circle: {
      borderRadius: '50%'
    },
    square: {
      borderRadius: '0%'
    },
    diamond: {
      borderRadius: '0%',
      transform: 'rotate(45deg)'
    }
  }), []);
  useEffect(() => {
    if (!name) throw new Error('Port name is required');
  }, [name]);
  useEffect(() => {}, [internalValue]);
  useEffect(() => {
    if (isConnected) {
      onValueChange === null || onValueChange === void 0 ? void 0 : onValueChange(null);
    }
  }, [isConnected]);
  var containerRef = useRef(null);
  var connectorRef = useRef(null);
  var handleUpdateForm = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    console.log('handleUpdateForm', internalValue);
    onValueChange === null || onValueChange === void 0 ? void 0 : onValueChange(internalValue);
  }, [internalValue]);
  var connectorRect = useRef();
  useEffect(() => {
    if (!connectorRef.current) return;
    connectorRect.current = connectorRef.current.getBoundingClientRect();
  }, [connectorRef.current]);
  var containerRect = useRef();
  useEffect(() => {
    if (!containerRef.current) return;
    containerRect.current = containerRef.current.getBoundingClientRect();
  }, [containerRef.current]);
  var [pointerPos, setPointerPos] = useState({
    x: 0,
    y: 0
  });
  var handleMouseDown = event => {
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
        return ((_t$classList = t.classList) === null || _t$classList === void 0 ? void 0 : _t$classList.contains('port-overlay')) && t.dataset.portDirection.toString() !== direction.toString() && t.dataset.portType.toString() === ((_type$type = type.type) === null || _type$type === void 0 ? void 0 : _type$type.toString());
      });
      console.log('targets', targets);
      console.log('target', target);
      console.log('dragInfo', _dragInfo);
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
  return /*#__PURE__*/jsxs("div", {
    ref: containerRef,
    style: {
      position: 'relative',
      width: '100%',
      minHeight: '20px'
    },
    className: "port",
    onMouseDown: handleMouseDown,
    children: [/*#__PURE__*/jsx("div", {
      style: {
        position: 'absolute',
        top: 0,
        left: direction === 'input' ? '-20px' : 0,
        right: direction === 'output' ? '-20px' : 0,
        width: '100%',
        height: '100%',
        zIndex: 2000,
        // borderRadius: '4px',
        // backgroundColor: 'rgba(0,0,0,0.1)',
        padding: '0 15px',
        borderTopLeftRadius: direction === 'input' ? '15px' : null,
        borderBottomLeftRadius: direction === 'input' ? '15px' : null,
        borderTopRightRadius: direction === 'output' ? '15px' : null,
        borderBottomRightRadius: direction === 'output' ? '15px' : null
      },
      className: "port-overlay",
      id: "card-".concat(nodeId, "-").concat(direction, "-").concat(name, "-overlay"),
      "data-port-name": name,
      "data-port-type": type.type,
      "data-port-direction": direction,
      "data-node-id": nodeId
    }), /*#__PURE__*/jsx("div", {
      style: {
        fontSize: '10px',
        display: 'flex',
        justifyContent: direction === 'input' ? 'flex-start' : 'flex-end'
      },
      children: /*#__PURE__*/jsx("span", {
        children: label
      })
    }), /*#__PURE__*/jsx("div", {
      style: {
        position: 'relative',
        zIndex: 3000,
        width: '100%'
      },
      onBlur: handleUpdateForm,
      onMouseDown: e => {
        e.stopPropagation();
      },
      children: direction === 'input' && !isConnected ? type.render({
        value: internalValue,
        onChange: setInternalValue
      }) : null
    }), /*#__PURE__*/jsx("div", {
      id: "card-".concat(nodeId, "-").concat(direction, "-").concat(name),
      ref: connectorRef,
      style: _objectSpread2({
        width: '10px',
        height: '10px',
        background: type.color,
        border: isConnected ? '2px solid #fff' : '2px solid #000',
        cursor: 'pointer',
        position: 'absolute',
        left: direction === 'input' ? '-15px' : null,
        right: direction === 'output' ? '-15px' : null,
        top: 'calc(50% - 5px)'
      }, (_shapeStyles = shapeStyles[(_type$shape = type === null || type === void 0 ? void 0 : type.shape) !== null && _type$shape !== void 0 ? _type$shape : 'circle']) !== null && _shapeStyles !== void 0 ? _shapeStyles : {}),
      className: "port-connector"
    })]
  });
}
var NodePort$1 = /*#__PURE__*/memo(NodePort);

export { NodePort$1 as default };
//# sourceMappingURL=NodePort.js.map
