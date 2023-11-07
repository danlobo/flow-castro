import React, { useState, createContext, useContext, useEffect, memo, useMemo, useRef, useCallback, useImperativeHandle } from 'react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

const DragContext = /*#__PURE__*/createContext(null);
const DragContextProvider = ({
  children
}) => {
  const [dragInfo, setDragInfo] = useState(null);
  return /*#__PURE__*/jsx(DragContext.Provider, {
    value: {
      dragInfo,
      setDragInfo
    },
    children: children
  });
};
const useDragContext = () => {
  const {
    dragInfo,
    setDragInfo
  } = useContext(DragContext);
  return {
    dragInfo,
    setDragInfo
  };
};

const ScreenContext = /*#__PURE__*/createContext();
const ScreenContextProvider = ({
  children,
  initialState,
  store
}) => {
  var _initialState$scale, _initialState$positio;
  const [scale, setScale] = useState((_initialState$scale = initialState?.scale) !== null && _initialState$scale !== void 0 ? _initialState$scale : 1);
  const [position, setPosition] = useState((_initialState$positio = initialState?.position) !== null && _initialState$positio !== void 0 ? _initialState$positio : {
    x: 0,
    y: 0
  });
  return /*#__PURE__*/jsx(ScreenContext.Provider, {
    value: {
      scale,
      setScale,
      position,
      setPosition
    },
    children: children
  });
};
const useScreenContext = () => {
  const {
    scale,
    setScale,
    position,
    setPosition
  } = useContext(ScreenContext);
  return {
    scale,
    setScale,
    position,
    setPosition
  };
};

var nodePortCss = {"port":"NodePort-module_port__aKb8R","portOverlay":"NodePort-module_portOverlay__mjlyG","label":"NodePort-module_label__4Kc0j","formContainer":"NodePort-module_formContainer__lna8k","portConnector":"NodePort-module_portConnector__4GyCZ","circle":"NodePort-module_circle__3fRNv","square":"NodePort-module_square__QSRn2","diamond":"NodePort-module_diamond__NHCFW"};

const deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, {
          [key]: {}
        });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, {
          [key]: source[key]
        });
      }
    }
  }
  return deepMerge(target, ...sources);
};
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function build(theme) {
  const _common = {
    roundness: 0,
    nodes: {
      common: {
        padding: 2,
        borderRadius: 4,
        boxShadow: '0 0 8px rgba(0, 0, 0, 0.125)',
        title: {
          background: theme.colors.hover,
          color: theme.colors.text
        },
        body: {
          background: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          color: theme.colors.text
        }
      }
    },
    ports: {},
    connections: {},
    buttons: {
      default: {
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        color: theme.colors.text
      }
    },
    contextMenu: {
      background: theme.colors.background,
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.text
    }
  };
  return deepMerge({}, _common, theme);
}

const theme$1 = {
  colors: {
    primary: '#0000ff',
    secondary: '#00ff00',
    background: '#ffffffcc',
    text: '#000000',
    hover: '#f2f2f2',
    border: '#888'
  }
};
var light = build(theme$1);

const theme = {
  colors: {
    primary: '#000088',
    secondary: '#008800',
    background: '#222D',
    text: '#DDD',
    hover: '#333',
    border: '#888'
  }
};
var dark = build(theme);

const _themes = {
  light,
  dark
};
const _defaultTheme = {
  themeName: 'light',
  currentTheme: _themes.light,
  setThemeName: v => {
    console.log('setThemeName not initialized');
  }
};
const ThemeContext = /*#__PURE__*/React.createContext(_defaultTheme);
const ThemeProvider = ({
  children,
  themes,
  theme = 'light'
}) => {
  const [currentTheme, setCurrentTheme] = useState(null);
  const [themeName, setThemeName] = useState(theme);
  useEffect(() => {
    setCurrentTheme(deepMerge({}, _themes[themeName], themes[themeName], themes.common));
  }, [themeName, themes]);
  useEffect(() => {
    setThemeName(theme);
  }, [theme]);
  if (!currentTheme) return null;
  return /*#__PURE__*/jsx(ThemeContext.Provider, {
    value: {
      themeName,
      currentTheme,
      setThemeName
    },
    children: children
  });
};
const useTheme = () => React.useContext(ThemeContext);

const globalToLocal = (globalX, globalY, translate, scale) => {
  const localX = globalX / scale;
  const localY = globalY / scale;
  return {
    x: localX,
    y: localY
  };
};
function NodePort({
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
}) {
  var _ref, _ref2, _currentTheme$ports$c, _type$type, _shapeStyles, _type$shape;
  const {
    currentTheme
  } = useTheme();
  const {
    position: screenPosition,
    scale: screenScale
  } = useScreenContext();
  const {
    dragInfo,
    setDragInfo
  } = useDragContext();
  const [internalValue, setInternalValue] = useState(value);
  const shapeStyles = useMemo(() => ({
    circle: nodePortCss.circle,
    square: nodePortCss.square,
    diamond: nodePortCss.diamond
  }), []);
  useEffect(() => {
    if (!name) throw new Error('Port name is required');
  }, [name]);
  useEffect(() => {}, [internalValue]);
  useEffect(() => {
    if (isConnected) {
      onValueChange?.(null);
    }
  }, [isConnected]);
  const containerRef = useRef(null);
  const connectorRef = useRef(null);
  useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange?.(internalValue);
  }, [internalValue]);
  const connectorRect = useRef();
  useEffect(() => {
    if (!connectorRef.current) return;
    connectorRect.current = connectorRef.current.getBoundingClientRect();
  }, [connectorRef.current]);
  const containerRect = useRef();
  useEffect(() => {
    if (!containerRef.current) return;
    containerRect.current = containerRef.current.getBoundingClientRect();
  }, [containerRef.current]);
  const [pointerPos, setPointerPos] = useState({
    x: 0,
    y: 0
  });
  const handleMouseDown = event => {
    if (hidePort || !canMove) return;

    //event.preventDefault();
    event.stopPropagation();
    const nodePos = containerRef.current.getBoundingClientRect();
    globalToLocal(event.pageX - nodePos.left, event.pageY - nodePos.top, screenPosition, screenScale);
    const connectorRect = connectorRef.current.getBoundingClientRect();
    const _dragInfo = {
      type: 'connector',
      nodeId,
      portName: name,
      portType: type,
      startX: connectorRect.left,
      startY: connectorRect.top
    };
    setDragInfo(_dragInfo);
    const handleMouseMove = event => {
      if (!_dragInfo) return;
      if (_dragInfo.type !== 'connector') return;
      const localPos = globalToLocal(event.pageX - nodePos.left, event.pageY - nodePos.top, screenPosition, screenScale);
      setPointerPos({
        x: localPos.x,
        y: localPos.y
      });
    };
    const handleMouseUp = e => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setDragInfo(null);
      if (!_dragInfo) return;
      const targets = document.elementsFromPoint(e.pageX - window.scrollX, e.pageY - window.scrollY);
      const target = targets.find(t => t.classList?.contains(nodePortCss.portOverlay) && t.dataset.portDirection.toString() !== direction.toString() && t.dataset.portType.toString() === type.type?.toString());
      if (target) {
        onConnected?.({
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
      cursor: !hidePort && canMove ? 'crosshair' : null
    },
    className: nodePortCss.port,
    onMouseDown: handleMouseDown,
    children: [!hidePort && /*#__PURE__*/jsx("div", {
      style: {
        left: direction === 'input' ? 'calc( var(--port-size) * -1.5 )' : 'calc( var(--port-size) * 1.5 )',
        right: 0,
        borderTopLeftRadius: direction === 'input' ? '15px' : null,
        borderBottomLeftRadius: direction === 'input' ? '15px' : null,
        borderTopRightRadius: direction === 'output' ? '15px' : null,
        borderBottomRightRadius: direction === 'output' ? '15px' : null
      },
      className: nodePortCss.portOverlay,
      id: `card-${nodeId}-${direction}-${name}-overlay`,
      "data-port-name": name,
      "data-port-type": type.type,
      "data-port-direction": direction,
      "data-node-id": nodeId
    }), /*#__PURE__*/jsx("div", {
      className: nodePortCss.label,
      style: {
        justifyContent: direction === 'input' ? 'flex-start' : 'flex-end'
      },
      children: /*#__PURE__*/jsx("span", {
        children: label
      })
    }), /*#__PURE__*/jsx("div", {
      className: nodePortCss.formContainer
      //onBlur={handleUpdateForm}
      ,
      onMouseDown: e => {
        e.stopPropagation();
      },
      children: (_ref = direction === 'input' && !isConnected && type.render?.({
        value,
        onChange: onValueChange
      })) !== null && _ref !== void 0 ? _ref : null
    }), !hidePort && /*#__PURE__*/jsx("div", {
      id: `card-${nodeId}-${direction}-${name}`,
      ref: connectorRef,
      "data-port-connector-name": name,
      "data-port-connector-type": type.type,
      "data-port-connector-direction": direction,
      "data-port-connector-connected": Boolean(isConnected),
      style: {
        background: (_ref2 = (_currentTheme$ports$c = currentTheme.ports?.[(_type$type = type?.type) !== null && _type$type !== void 0 ? _type$type : 'default']?.color) !== null && _currentTheme$ports$c !== void 0 ? _currentTheme$ports$c : currentTheme.ports?.default?.color) !== null && _ref2 !== void 0 ? _ref2 : currentTheme.colors.background,
        left: direction === 'input' ? 'calc( var(--port-size) * -1 - 4px )' : null,
        right: direction === 'output' ? 'calc( var(--port-size) * -1 - 4px )' : null
      },
      className: [nodePortCss.portConnector, (_shapeStyles = shapeStyles[(_type$shape = type?.shape) !== null && _type$shape !== void 0 ? _type$shape : 'circle']) !== null && _shapeStyles !== void 0 ? _shapeStyles : null].filter(Boolean).join(' ')
    })]
  });
}
var NodePort$1 = /*#__PURE__*/memo(NodePort);

var nodeCss = {"node":"Node-module_node__yVhqG","selected":"Node-module_selected__bA-o1","title":"Node-module_title__IkogO","container":"Node-module_container__PfJft","portsContainer":"Node-module_portsContainer__3s5BH","inputPortsContainer":"Node-module_inputPortsContainer__FPkYh","outputPortsContainer":"Node-module_outputPortsContainer__qYiul"};

const Button = ({
  children,
  ...props
}) => {
  const {
    currentTheme
  } = useTheme();
  return /*#__PURE__*/jsx("button", {
    ...props,
    style: {
      backgroundColor: currentTheme.buttons.default.backgroundColor,
      border: currentTheme.buttons.default.border,
      color: currentTheme.buttons.default.color,
      borderRadius: currentTheme.roundness
    },
    children: children
  });
};

function Node({
  name,
  portTypes,
  nodeType,
  value,
  canMove,
  isSelected,
  onChangePosition,
  onDragStart,
  onDragEnd,
  onConnect,
  containerRef,
  onContextMenu,
  onResize,
  onValueChange
}) {
  var _currentTheme$nodes$n, _currentTheme$nodes$n2, _currentTheme$nodes$n3, _currentTheme$nodes$n4, _currentTheme$nodes$n5;
  const {
    currentTheme
  } = useTheme();
  const nodeRef = useRef();
  useEffect(() => {
    const currentRef = nodeRef.current;
    const observer = new ResizeObserver(entries => {
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
  const {
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
  const {
    scale: screenScale
  } = useScreenContext();
  const handleMouseDown = useCallback(event => {
    if (!canMove) return;

    // event.preventDefault();
    event.stopPropagation();
    const startX = event.pageX;
    const startY = event.pageY;
    onDragStart?.({
      x: nodePosition.x,
      y: nodePosition.y
    });
    const handleMouseMove = event => {
      const dx = event.pageX - startX;
      const dy = event.pageY - startY;
      onChangePosition({
        x: nodePosition.x + dx / screenScale,
        y: nodePosition.y + dy / screenScale
      });
    };
    const handleMouseUp = e => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      if (Math.abs(dx) >= 2 && Math.abs(dy) >= 2) {
        onDragEnd?.({
          x: nodePosition.x + dx / screenScale,
          y: nodePosition.y + dy / screenScale
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [nodePosition, screenScale, onChangePosition, onDragStart, onDragEnd]);
  const onOutputPortConnected = useCallback(({
    source,
    target
  }) => {
    onConnect?.({
      source,
      target
    });
  }, [onConnect]);
  const onInputPortConnected = useCallback(({
    source,
    target
  }) => {
    onConnect?.({
      source: target,
      target: source
    });
  }, [onConnect]);
  const nodeInputs = useMemo(() => {
    if (typeof nodeType.inputs === 'function') return nodeType.inputs(nodeValues);
    return nodeType.inputs;
  }, [nodeType, nodeValues]);
  const nodeOutputs = useMemo(() => {
    if (typeof nodeType.outputs === 'function') return nodeType.outputs(nodeValues);
    return nodeType.outputs;
  }, [nodeType, nodeValues]);
  return /*#__PURE__*/jsxs("div", {
    ref: nodeRef,
    id: `card-${nodeId}`,
    className: [nodeCss.node, isSelected ? nodeCss.selected : ''].join(' '),
    style: {
      backgroundColor: (_currentTheme$nodes$n = currentTheme?.nodes?.[nodeType?.type]?.body?.background) !== null && _currentTheme$nodes$n !== void 0 ? _currentTheme$nodes$n : currentTheme?.nodes?.common?.body?.background,
      border: (_currentTheme$nodes$n2 = currentTheme?.nodes?.[nodeType?.type]?.body?.border) !== null && _currentTheme$nodes$n2 !== void 0 ? _currentTheme$nodes$n2 : currentTheme?.nodes?.common?.body?.border,
      color: (_currentTheme$nodes$n3 = currentTheme?.nodes?.[nodeType?.type]?.body?.color) !== null && _currentTheme$nodes$n3 !== void 0 ? _currentTheme$nodes$n3 : currentTheme?.nodes?.common?.body?.color,
      transform: `translate(${nodePosition.x}px, ${nodePosition.y}px)`,
      cursor: canMove ? 'grab' : null
    },
    onMouseDown: handleMouseDown,
    onContextMenu: onContextMenu,
    children: [/*#__PURE__*/jsx("div", {
      className: nodeCss.title,
      style: {
        backgroundColor: (_currentTheme$nodes$n4 = currentTheme?.nodes?.[nodeType?.type]?.title?.background) !== null && _currentTheme$nodes$n4 !== void 0 ? _currentTheme$nodes$n4 : currentTheme?.nodes?.common?.title?.background,
        color: (_currentTheme$nodes$n5 = currentTheme?.nodes?.[nodeType?.type]?.title?.color) !== null && _currentTheme$nodes$n5 !== void 0 ? _currentTheme$nodes$n5 : currentTheme?.nodes?.common?.title?.color
      },
      children: /*#__PURE__*/jsx("h3", {
        style: {
          textAlign: 'center'
        },
        children: name
      })
    }), /*#__PURE__*/jsxs("div", {
      className: nodeCss.container,
      children: [/*#__PURE__*/jsx("div", {
        className: [nodeCss.portsContainer, nodeCss.inputPortsContainer].join(' '),
        children: nodeInputs?.map(input => {
          const portType = portTypes[input.type];
          const hidePort = input.hidePort != null ? input.hidePort : portType.hidePort;
          return /*#__PURE__*/jsx(NodePort$1, {
            name: input.name,
            value: nodeValues[input.name],
            onValueChange: v1 => {
              onValueChange?.({
                ...value,
                values: {
                  ...value.values,
                  [input.name]: v1
                }
              });
            },
            nodeId: nodeId,
            type: portTypes[input.type],
            direction: "input",
            label: input.label,
            hidePort: Boolean(hidePort),
            containerRef: containerRef,
            isConnected: value.connections?.inputs?.some(c => c.name === input.name),
            onConnected: onInputPortConnected,
            canMove: canMove
          }, input.name);
        })
      }), /*#__PURE__*/jsx("div", {
        className: [nodeCss.portsContainer, nodeCss.outputPortsContainer].join(' '),
        children: nodeOutputs?.map(output => {
          return /*#__PURE__*/jsx(NodePort$1, {
            name: output.name,
            nodeId: nodeId,
            type: portTypes[output.type],
            direction: "output",
            label: output.label,
            containerRef: containerRef,
            isConnected: value.connections?.outputs?.some(c => c.name === output.name),
            onConnected: onOutputPortConnected,
            canMove: canMove
          }, output.name);
        })
      })]
    })]
  }, `card-${nodeId}`);
}
var Node$1 = /*#__PURE__*/memo(Node);

/**
 * Rounds number to given decimal
 * eg. roundNumber(2.34343, 1) => 2.3
 */
var roundNumber = function (num, decimal) {
    return Number(num.toFixed(decimal));
};
/**
 * Checks if value is number, if not it returns default value
 * 1# eg. checkIsNumber(2, 30) => 2
 * 2# eg. checkIsNumber(null, 30) => 30
 */
var checkIsNumber = function (num, defaultValue) {
    return typeof num === "number" ? num : defaultValue;
};

var handleCallback = function (context, event, callback) {
    if (callback && typeof callback === "function") {
        callback(context, event);
    }
};

/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/**
 * Functions should return denominator of the target value, which is the next animation step.
 * t is a value from 0 to 1, reflecting the percentage of animation status.
 */
var easeOut = function (t) {
    return -Math.cos(t * Math.PI) / 2 + 0.5;
};
// linear
var linear = function (t) {
    return t;
};
// accelerating from zero velocity
var easeInQuad = function (t) {
    return t * t;
};
// decelerating to zero velocity
var easeOutQuad = function (t) {
    return t * (2 - t);
};
// acceleration until halfway, then deceleration
var easeInOutQuad = function (t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};
// accelerating from zero velocity
var easeInCubic = function (t) {
    return t * t * t;
};
// decelerating to zero velocity
var easeOutCubic = function (t) {
    return --t * t * t + 1;
};
// acceleration until halfway, then deceleration
var easeInOutCubic = function (t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
};
// accelerating from zero velocity
var easeInQuart = function (t) {
    return t * t * t * t;
};
// decelerating to zero velocity
var easeOutQuart = function (t) {
    return 1 - --t * t * t * t;
};
// acceleration until halfway, then deceleration
var easeInOutQuart = function (t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
};
// accelerating from zero velocity
var easeInQuint = function (t) {
    return t * t * t * t * t;
};
// decelerating to zero velocity
var easeOutQuint = function (t) {
    return 1 + --t * t * t * t * t;
};
// acceleration until halfway, then deceleration
var easeInOutQuint = function (t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
};
var animations = {
    easeOut: easeOut,
    linear: linear,
    easeInQuad: easeInQuad,
    easeOutQuad: easeOutQuad,
    easeInOutQuad: easeInOutQuad,
    easeInCubic: easeInCubic,
    easeOutCubic: easeOutCubic,
    easeInOutCubic: easeInOutCubic,
    easeInQuart: easeInQuart,
    easeOutQuart: easeOutQuart,
    easeInOutQuart: easeInOutQuart,
    easeInQuint: easeInQuint,
    easeOutQuint: easeOutQuint,
    easeInOutQuint: easeInOutQuint,
};

/* eslint-disable no-param-reassign */
var handleCancelAnimationFrame = function (animation) {
    if (typeof animation === "number") {
        cancelAnimationFrame(animation);
    }
};
var handleCancelAnimation = function (contextInstance) {
    if (!contextInstance.mounted)
        return;
    handleCancelAnimationFrame(contextInstance.animation);
    // Clear animation state
    contextInstance.animate = false;
    contextInstance.animation = null;
    contextInstance.velocity = null;
};
function handleSetupAnimation(contextInstance, animationName, animationTime, callback) {
    if (!contextInstance.mounted)
        return;
    var startTime = new Date().getTime();
    var lastStep = 1;
    // if another animation is active
    handleCancelAnimation(contextInstance);
    // new animation
    contextInstance.animation = function () {
        if (!contextInstance.mounted) {
            return handleCancelAnimationFrame(contextInstance.animation);
        }
        var frameTime = new Date().getTime() - startTime;
        var animationProgress = frameTime / animationTime;
        var animationType = animations[animationName];
        var step = animationType(animationProgress);
        if (frameTime >= animationTime) {
            callback(lastStep);
            contextInstance.animation = null;
        }
        else if (contextInstance.animation) {
            callback(step);
            requestAnimationFrame(contextInstance.animation);
        }
    };
    requestAnimationFrame(contextInstance.animation);
}
function isValidTargetState(targetState) {
    var scale = targetState.scale, positionX = targetState.positionX, positionY = targetState.positionY;
    if (Number.isNaN(scale) ||
        Number.isNaN(positionX) ||
        Number.isNaN(positionY)) {
        return false;
    }
    return true;
}
function animate(contextInstance, targetState, animationTime, animationName) {
    var isValid = isValidTargetState(targetState);
    if (!contextInstance.mounted || !isValid)
        return;
    var setTransformState = contextInstance.setTransformState;
    var _a = contextInstance.transformState, scale = _a.scale, positionX = _a.positionX, positionY = _a.positionY;
    var scaleDiff = targetState.scale - scale;
    var positionXDiff = targetState.positionX - positionX;
    var positionYDiff = targetState.positionY - positionY;
    if (animationTime === 0) {
        setTransformState(targetState.scale, targetState.positionX, targetState.positionY);
    }
    else {
        // animation start timestamp
        handleSetupAnimation(contextInstance, animationName, animationTime, function (step) {
            var newScale = scale + scaleDiff * step;
            var newPositionX = positionX + positionXDiff * step;
            var newPositionY = positionY + positionYDiff * step;
            setTransformState(newScale, newPositionX, newPositionY);
        });
    }
}

/* eslint-disable no-param-reassign */
function getComponentsSizes(wrapperComponent, contentComponent, newScale) {
    var wrapperWidth = wrapperComponent.offsetWidth;
    var wrapperHeight = wrapperComponent.offsetHeight;
    var contentWidth = contentComponent.offsetWidth;
    var contentHeight = contentComponent.offsetHeight;
    var newContentWidth = contentWidth * newScale;
    var newContentHeight = contentHeight * newScale;
    var newDiffWidth = wrapperWidth - newContentWidth;
    var newDiffHeight = wrapperHeight - newContentHeight;
    return {
        wrapperWidth: wrapperWidth,
        wrapperHeight: wrapperHeight,
        newContentWidth: newContentWidth,
        newDiffWidth: newDiffWidth,
        newContentHeight: newContentHeight,
        newDiffHeight: newDiffHeight,
    };
}
var getBounds = function (wrapperWidth, newContentWidth, diffWidth, wrapperHeight, newContentHeight, diffHeight, centerZoomedOut) {
    var scaleWidthFactor = wrapperWidth > newContentWidth
        ? diffWidth * (centerZoomedOut ? 1 : 0.5)
        : 0;
    var scaleHeightFactor = wrapperHeight > newContentHeight
        ? diffHeight * (centerZoomedOut ? 1 : 0.5)
        : 0;
    var minPositionX = wrapperWidth - newContentWidth - scaleWidthFactor;
    var maxPositionX = scaleWidthFactor;
    var minPositionY = wrapperHeight - newContentHeight - scaleHeightFactor;
    var maxPositionY = scaleHeightFactor;
    return { minPositionX: minPositionX, maxPositionX: maxPositionX, minPositionY: minPositionY, maxPositionY: maxPositionY };
};
var calculateBounds = function (contextInstance, newScale) {
    var wrapperComponent = contextInstance.wrapperComponent, contentComponent = contextInstance.contentComponent;
    var centerZoomedOut = contextInstance.setup.centerZoomedOut;
    if (!wrapperComponent || !contentComponent) {
        throw new Error("Components are not mounted");
    }
    var _a = getComponentsSizes(wrapperComponent, contentComponent, newScale), wrapperWidth = _a.wrapperWidth, wrapperHeight = _a.wrapperHeight, newContentWidth = _a.newContentWidth, newDiffWidth = _a.newDiffWidth, newContentHeight = _a.newContentHeight, newDiffHeight = _a.newDiffHeight;
    var bounds = getBounds(wrapperWidth, newContentWidth, newDiffWidth, wrapperHeight, newContentHeight, newDiffHeight, Boolean(centerZoomedOut));
    return bounds;
};
/**
 * Keeps value between given bounds, used for limiting view to given boundaries
 * 1# eg. boundLimiter(2, 0, 3, true) => 2
 * 2# eg. boundLimiter(4, 0, 3, true) => 3
 * 3# eg. boundLimiter(-2, 0, 3, true) => 0
 * 4# eg. boundLimiter(10, 0, 3, false) => 10
 */
var boundLimiter = function (value, minBound, maxBound, isActive) {
    if (!isActive)
        return roundNumber(value, 2);
    if (value < minBound)
        return roundNumber(minBound, 2);
    if (value > maxBound)
        return roundNumber(maxBound, 2);
    return roundNumber(value, 2);
};
var handleCalculateBounds = function (contextInstance, newScale) {
    var bounds = calculateBounds(contextInstance, newScale);
    // Save bounds
    contextInstance.bounds = bounds;
    return bounds;
};
function getMouseBoundedPosition(positionX, positionY, bounds, limitToBounds, paddingValueX, paddingValueY, wrapperComponent) {
    var minPositionX = bounds.minPositionX, minPositionY = bounds.minPositionY, maxPositionX = bounds.maxPositionX, maxPositionY = bounds.maxPositionY;
    var paddingX = 0;
    var paddingY = 0;
    if (wrapperComponent) {
        paddingX = paddingValueX;
        paddingY = paddingValueY;
    }
    var x = boundLimiter(positionX, minPositionX - paddingX, maxPositionX + paddingX, limitToBounds);
    var y = boundLimiter(positionY, minPositionY - paddingY, maxPositionY + paddingY, limitToBounds);
    return { x: x, y: y };
}

function handleCalculateZoomPositions(contextInstance, mouseX, mouseY, newScale, bounds, limitToBounds) {
    var _a = contextInstance.transformState, scale = _a.scale, positionX = _a.positionX, positionY = _a.positionY;
    var scaleDifference = newScale - scale;
    if (typeof mouseX !== "number" || typeof mouseY !== "number") {
        console.error("Mouse X and Y position were not provided!");
        return { x: positionX, y: positionY };
    }
    var calculatedPositionX = positionX - mouseX * scaleDifference;
    var calculatedPositionY = positionY - mouseY * scaleDifference;
    // do not limit to bounds when there is padding animation,
    // it causes animation strange behaviour
    var newPositions = getMouseBoundedPosition(calculatedPositionX, calculatedPositionY, bounds, limitToBounds, 0, 0, null);
    return newPositions;
}
function checkZoomBounds(zoom, minScale, maxScale, zoomPadding, enablePadding) {
    var scalePadding = enablePadding ? zoomPadding : 0;
    var minScaleWithPadding = minScale - scalePadding;
    if (!Number.isNaN(maxScale) && zoom >= maxScale)
        return maxScale;
    if (!Number.isNaN(minScale) && zoom <= minScaleWithPadding)
        return minScaleWithPadding;
    return zoom;
}

var isPanningStartAllowed = function (contextInstance, event) {
    var excluded = contextInstance.setup.panning.excluded;
    var isInitialized = contextInstance.isInitialized, wrapperComponent = contextInstance.wrapperComponent;
    var target = event.target;
    var isWrapperChild = wrapperComponent === null || wrapperComponent === void 0 ? void 0 : wrapperComponent.contains(target);
    var isAllowed = isInitialized && target && isWrapperChild;
    if (!isAllowed)
        return false;
    var isExcluded = isExcludedNode(target, excluded);
    if (isExcluded)
        return false;
    return true;
};
var isPanningAllowed = function (contextInstance) {
    var isInitialized = contextInstance.isInitialized, isPanning = contextInstance.isPanning, setup = contextInstance.setup;
    var disabled = setup.panning.disabled;
    var isAllowed = isInitialized && isPanning && !disabled;
    if (!isAllowed)
        return false;
    return true;
};
var handlePanningSetup = function (contextInstance, event) {
    var _a = contextInstance.transformState, positionX = _a.positionX, positionY = _a.positionY;
    contextInstance.isPanning = true;
    // Panning with mouse
    var x = event.clientX;
    var y = event.clientY;
    contextInstance.startCoords = { x: x - positionX, y: y - positionY };
};
var handleTouchPanningSetup = function (contextInstance, event) {
    var touches = event.touches;
    var _a = contextInstance.transformState, positionX = _a.positionX, positionY = _a.positionY;
    contextInstance.isPanning = true;
    // Panning with touch
    var oneFingerTouch = touches.length === 1;
    if (oneFingerTouch) {
        var x = touches[0].clientX;
        var y = touches[0].clientY;
        contextInstance.startCoords = { x: x - positionX, y: y - positionY };
    }
};
function handlePanToBounds(contextInstance) {
    var _a = contextInstance.transformState, positionX = _a.positionX, positionY = _a.positionY, scale = _a.scale;
    var _b = contextInstance.setup, disabled = _b.disabled, limitToBounds = _b.limitToBounds, centerZoomedOut = _b.centerZoomedOut;
    var wrapperComponent = contextInstance.wrapperComponent;
    if (disabled || !wrapperComponent || !contextInstance.bounds)
        return;
    var _c = contextInstance.bounds, maxPositionX = _c.maxPositionX, minPositionX = _c.minPositionX, maxPositionY = _c.maxPositionY, minPositionY = _c.minPositionY;
    var xChanged = positionX > maxPositionX || positionX < minPositionX;
    var yChanged = positionY > maxPositionY || positionY < minPositionY;
    var mousePosX = positionX > maxPositionX
        ? wrapperComponent.offsetWidth
        : contextInstance.setup.minPositionX || 0;
    var mousePosY = positionY > maxPositionY
        ? wrapperComponent.offsetHeight
        : contextInstance.setup.minPositionY || 0;
    var _d = handleCalculateZoomPositions(contextInstance, mousePosX, mousePosY, scale, contextInstance.bounds, limitToBounds || centerZoomedOut), x = _d.x, y = _d.y;
    return {
        scale: scale,
        positionX: xChanged ? x : positionX,
        positionY: yChanged ? y : positionY,
    };
}
function handleNewPosition(contextInstance, newPositionX, newPositionY, paddingValueX, paddingValueY) {
    var limitToBounds = contextInstance.setup.limitToBounds;
    var wrapperComponent = contextInstance.wrapperComponent, bounds = contextInstance.bounds;
    var _a = contextInstance.transformState, scale = _a.scale, positionX = _a.positionX, positionY = _a.positionY;
    if (wrapperComponent === null ||
        bounds === null ||
        (newPositionX === positionX && newPositionY === positionY)) {
        return;
    }
    var _b = getMouseBoundedPosition(newPositionX, newPositionY, bounds, limitToBounds, paddingValueX, paddingValueY, wrapperComponent), x = _b.x, y = _b.y;
    contextInstance.setTransformState(scale, x, y);
}
var getPanningClientPosition = function (contextInstance, clientX, clientY) {
    var startCoords = contextInstance.startCoords, transformState = contextInstance.transformState;
    var panning = contextInstance.setup.panning;
    var lockAxisX = panning.lockAxisX, lockAxisY = panning.lockAxisY;
    var positionX = transformState.positionX, positionY = transformState.positionY;
    if (!startCoords) {
        return { x: positionX, y: positionY };
    }
    var mouseX = clientX - startCoords.x;
    var mouseY = clientY - startCoords.y;
    var newPositionX = lockAxisX ? positionX : mouseX;
    var newPositionY = lockAxisY ? positionY : mouseY;
    return { x: newPositionX, y: newPositionY };
};
var getPaddingValue = function (contextInstance, size) {
    var setup = contextInstance.setup, transformState = contextInstance.transformState;
    var scale = transformState.scale;
    var minScale = setup.minScale, disablePadding = setup.disablePadding;
    if (size > 0 && scale >= minScale && !disablePadding) {
        return size;
    }
    return 0;
};

var isVelocityCalculationAllowed = function (contextInstance) {
    var mounted = contextInstance.mounted;
    var _a = contextInstance.setup, disabled = _a.disabled, velocityAnimation = _a.velocityAnimation;
    var scale = contextInstance.transformState.scale;
    var disabledVelocity = velocityAnimation.disabled;
    var isAllowed = !disabledVelocity || scale > 1 || !disabled || mounted;
    if (!isAllowed)
        return false;
    return true;
};
var isVelocityAllowed = function (contextInstance) {
    var mounted = contextInstance.mounted, velocity = contextInstance.velocity, bounds = contextInstance.bounds;
    var _a = contextInstance.setup, disabled = _a.disabled, velocityAnimation = _a.velocityAnimation;
    var scale = contextInstance.transformState.scale;
    var disabledVelocity = velocityAnimation.disabled;
    var isAllowed = !disabledVelocity || scale > 1 || !disabled || mounted;
    if (!isAllowed)
        return false;
    if (!velocity || !bounds)
        return false;
    return true;
};
function getVelocityMoveTime(contextInstance, velocity) {
    var velocityAnimation = contextInstance.setup.velocityAnimation;
    var equalToMove = velocityAnimation.equalToMove, animationTime = velocityAnimation.animationTime, sensitivity = velocityAnimation.sensitivity;
    if (equalToMove) {
        return animationTime * velocity * sensitivity;
    }
    return animationTime;
}
function getVelocityPosition(newPosition, startPosition, currentPosition, isLocked, limitToBounds, minPosition, maxPosition, minTarget, maxTarget, step) {
    if (limitToBounds) {
        if (startPosition > maxPosition && currentPosition > maxPosition) {
            var calculatedPosition = maxPosition + (newPosition - maxPosition) * step;
            if (calculatedPosition > maxTarget)
                return maxTarget;
            if (calculatedPosition < maxPosition)
                return maxPosition;
            return calculatedPosition;
        }
        if (startPosition < minPosition && currentPosition < minPosition) {
            var calculatedPosition = minPosition + (newPosition - minPosition) * step;
            if (calculatedPosition < minTarget)
                return minTarget;
            if (calculatedPosition > minPosition)
                return minPosition;
            return calculatedPosition;
        }
    }
    if (isLocked)
        return startPosition;
    return boundLimiter(newPosition, minPosition, maxPosition, limitToBounds);
}

function getSizeMultiplier(wrapperComponent, equalToMove) {
    var defaultMultiplier = 1;
    if (equalToMove) {
        return Math.min(defaultMultiplier, wrapperComponent.offsetWidth / window.innerWidth);
    }
    return defaultMultiplier;
}
function handleCalculateVelocity(contextInstance, position) {
    var isAllowed = isVelocityCalculationAllowed(contextInstance);
    if (!isAllowed) {
        return;
    }
    var lastMousePosition = contextInstance.lastMousePosition, velocityTime = contextInstance.velocityTime, setup = contextInstance.setup;
    var wrapperComponent = contextInstance.wrapperComponent;
    var equalToMove = setup.velocityAnimation.equalToMove;
    var now = Date.now();
    if (lastMousePosition && velocityTime && wrapperComponent) {
        var sizeMultiplier = getSizeMultiplier(wrapperComponent, equalToMove);
        var distanceX = position.x - lastMousePosition.x;
        var distanceY = position.y - lastMousePosition.y;
        var velocityX = distanceX / sizeMultiplier;
        var velocityY = distanceY / sizeMultiplier;
        var interval = now - velocityTime;
        var speed = distanceX * distanceX + distanceY * distanceY;
        var velocity = Math.sqrt(speed) / interval;
        contextInstance.velocity = { velocityX: velocityX, velocityY: velocityY, total: velocity };
    }
    contextInstance.lastMousePosition = position;
    contextInstance.velocityTime = now;
}
function handleVelocityPanning(contextInstance) {
    var velocity = contextInstance.velocity, bounds = contextInstance.bounds, setup = contextInstance.setup, wrapperComponent = contextInstance.wrapperComponent;
    var isAllowed = isVelocityAllowed(contextInstance);
    if (!isAllowed || !velocity || !bounds || !wrapperComponent) {
        return;
    }
    var velocityX = velocity.velocityX, velocityY = velocity.velocityY, total = velocity.total;
    var maxPositionX = bounds.maxPositionX, minPositionX = bounds.minPositionX, maxPositionY = bounds.maxPositionY, minPositionY = bounds.minPositionY;
    var limitToBounds = setup.limitToBounds, alignmentAnimation = setup.alignmentAnimation;
    var zoomAnimation = setup.zoomAnimation, panning = setup.panning;
    var lockAxisY = panning.lockAxisY, lockAxisX = panning.lockAxisX;
    var animationType = zoomAnimation.animationType;
    var sizeX = alignmentAnimation.sizeX, sizeY = alignmentAnimation.sizeY, velocityAlignmentTime = alignmentAnimation.velocityAlignmentTime;
    var alignAnimationTime = velocityAlignmentTime;
    var moveAnimationTime = getVelocityMoveTime(contextInstance, total);
    var finalAnimationTime = Math.max(moveAnimationTime, alignAnimationTime);
    var paddingValueX = getPaddingValue(contextInstance, sizeX);
    var paddingValueY = getPaddingValue(contextInstance, sizeY);
    var paddingX = (paddingValueX * wrapperComponent.offsetWidth) / 100;
    var paddingY = (paddingValueY * wrapperComponent.offsetHeight) / 100;
    var maxTargetX = maxPositionX + paddingX;
    var minTargetX = minPositionX - paddingX;
    var maxTargetY = maxPositionY + paddingY;
    var minTargetY = minPositionY - paddingY;
    var startState = contextInstance.transformState;
    var startTime = new Date().getTime();
    handleSetupAnimation(contextInstance, animationType, finalAnimationTime, function (step) {
        var _a = contextInstance.transformState, scale = _a.scale, positionX = _a.positionX, positionY = _a.positionY;
        var frameTime = new Date().getTime() - startTime;
        var animationProgress = frameTime / alignAnimationTime;
        var alignAnimation = animations[alignmentAnimation.animationType];
        var alignStep = 1 - alignAnimation(Math.min(1, animationProgress));
        var customStep = 1 - step;
        var newPositionX = positionX + velocityX * customStep;
        var newPositionY = positionY + velocityY * customStep;
        var currentPositionX = getVelocityPosition(newPositionX, startState.positionX, positionX, lockAxisX, limitToBounds, minPositionX, maxPositionX, minTargetX, maxTargetX, alignStep);
        var currentPositionY = getVelocityPosition(newPositionY, startState.positionY, positionY, lockAxisY, limitToBounds, minPositionY, maxPositionY, minTargetY, maxTargetY, alignStep);
        if (positionX !== newPositionX || positionY !== newPositionY) {
            contextInstance.setTransformState(scale, currentPositionX, currentPositionY);
        }
    });
}

function handlePanningStart(contextInstance, event) {
    var scale = contextInstance.transformState.scale;
    handleCancelAnimation(contextInstance);
    handleCalculateBounds(contextInstance, scale);
    if (window.TouchEvent !== undefined && event instanceof TouchEvent) {
        handleTouchPanningSetup(contextInstance, event);
    }
    else {
        handlePanningSetup(contextInstance, event);
    }
}
function handleAlignToBounds(contextInstance) {
    var scale = contextInstance.transformState.scale;
    var _a = contextInstance.setup, minScale = _a.minScale, alignmentAnimation = _a.alignmentAnimation;
    var disabled = alignmentAnimation.disabled, sizeX = alignmentAnimation.sizeX, sizeY = alignmentAnimation.sizeY, animationTime = alignmentAnimation.animationTime, animationType = alignmentAnimation.animationType;
    var isDisabled = disabled || scale < minScale || (!sizeX && !sizeY);
    if (isDisabled)
        return;
    var targetState = handlePanToBounds(contextInstance);
    if (targetState) {
        animate(contextInstance, targetState, animationTime, animationType);
    }
}
function handlePanning(contextInstance, clientX, clientY) {
    var startCoords = contextInstance.startCoords, setup = contextInstance.setup;
    var _a = setup.alignmentAnimation, sizeX = _a.sizeX, sizeY = _a.sizeY;
    if (!startCoords)
        return;
    var _b = getPanningClientPosition(contextInstance, clientX, clientY), x = _b.x, y = _b.y;
    var paddingValueX = getPaddingValue(contextInstance, sizeX);
    var paddingValueY = getPaddingValue(contextInstance, sizeY);
    handleCalculateVelocity(contextInstance, { x: x, y: y });
    handleNewPosition(contextInstance, x, y, paddingValueX, paddingValueY);
}
function handlePanningEnd(contextInstance) {
    if (contextInstance.isPanning) {
        var velocityDisabled = contextInstance.setup.panning.velocityDisabled;
        var velocity = contextInstance.velocity, wrapperComponent = contextInstance.wrapperComponent, contentComponent = contextInstance.contentComponent;
        contextInstance.isPanning = false;
        contextInstance.animate = false;
        contextInstance.animation = null;
        var wrapperRect = wrapperComponent === null || wrapperComponent === void 0 ? void 0 : wrapperComponent.getBoundingClientRect();
        var contentRect = contentComponent === null || contentComponent === void 0 ? void 0 : contentComponent.getBoundingClientRect();
        var wrapperWidth = (wrapperRect === null || wrapperRect === void 0 ? void 0 : wrapperRect.width) || 0;
        var wrapperHeight = (wrapperRect === null || wrapperRect === void 0 ? void 0 : wrapperRect.height) || 0;
        var contentWidth = (contentRect === null || contentRect === void 0 ? void 0 : contentRect.width) || 0;
        var contentHeight = (contentRect === null || contentRect === void 0 ? void 0 : contentRect.height) || 0;
        var isZoomed = wrapperWidth < contentWidth || wrapperHeight < contentHeight;
        var shouldAnimate = !velocityDisabled && velocity && (velocity === null || velocity === void 0 ? void 0 : velocity.total) > 0.1 && isZoomed;
        if (shouldAnimate) {
            handleVelocityPanning(contextInstance);
        }
        else {
            handleAlignToBounds(contextInstance);
        }
    }
}

function handleZoomToPoint(contextInstance, scale, mouseX, mouseY) {
    var _a = contextInstance.setup, minScale = _a.minScale, maxScale = _a.maxScale, limitToBounds = _a.limitToBounds;
    var newScale = checkZoomBounds(roundNumber(scale, 2), minScale, maxScale, 0, false);
    var bounds = handleCalculateBounds(contextInstance, newScale);
    var _b = handleCalculateZoomPositions(contextInstance, mouseX, mouseY, newScale, bounds, limitToBounds), x = _b.x, y = _b.y;
    return { scale: newScale, positionX: x, positionY: y };
}
function handleAlignToScaleBounds(contextInstance, mousePositionX, mousePositionY) {
    var scale = contextInstance.transformState.scale;
    var wrapperComponent = contextInstance.wrapperComponent;
    var _a = contextInstance.setup, minScale = _a.minScale, limitToBounds = _a.limitToBounds, zoomAnimation = _a.zoomAnimation;
    var disabled = zoomAnimation.disabled, animationTime = zoomAnimation.animationTime, animationType = zoomAnimation.animationType;
    var isDisabled = disabled || scale >= minScale;
    if (scale >= 1 || limitToBounds) {
        // fire fit to bounds animation
        handleAlignToBounds(contextInstance);
    }
    if (isDisabled || !wrapperComponent || !contextInstance.mounted)
        return;
    var mouseX = mousePositionX || wrapperComponent.offsetWidth / 2;
    var mouseY = mousePositionY || wrapperComponent.offsetHeight / 2;
    var targetState = handleZoomToPoint(contextInstance, minScale, mouseX, mouseY);
    if (targetState) {
        animate(contextInstance, targetState, animationTime, animationType);
    }
}

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

var initialState = {
    previousScale: 1,
    scale: 1,
    positionX: 0,
    positionY: 0,
};
var initialSetup = {
    disabled: false,
    minPositionX: null,
    maxPositionX: null,
    minPositionY: null,
    maxPositionY: null,
    minScale: 1,
    maxScale: 8,
    limitToBounds: true,
    centerZoomedOut: false,
    centerOnInit: false,
    disablePadding: false,
    wheel: {
        step: 0.2,
        disabled: false,
        wheelDisabled: false,
        touchPadDisabled: false,
        activationKeys: [],
        excluded: [],
    },
    panning: {
        disabled: false,
        velocityDisabled: false,
        lockAxisX: false,
        lockAxisY: false,
        activationKeys: [],
        excluded: [],
    },
    pinch: {
        step: 5,
        disabled: false,
        excluded: [],
    },
    doubleClick: {
        disabled: false,
        step: 0.7,
        mode: "zoomIn",
        animationType: "easeOut",
        animationTime: 200,
        excluded: [],
    },
    zoomAnimation: {
        disabled: false,
        size: 0.4,
        animationTime: 200,
        animationType: "easeOut",
    },
    alignmentAnimation: {
        disabled: false,
        sizeX: 100,
        sizeY: 100,
        animationTime: 200,
        velocityAlignmentTime: 400,
        animationType: "easeOut",
    },
    velocityAnimation: {
        disabled: false,
        sensitivity: 1,
        animationTime: 400,
        animationType: "easeOut",
        equalToMove: true,
    },
};

var createState = function (props) {
    var _a, _b, _c, _d;
    return {
        previousScale: (_a = props.initialScale) !== null && _a !== void 0 ? _a : initialState.scale,
        scale: (_b = props.initialScale) !== null && _b !== void 0 ? _b : initialState.scale,
        positionX: (_c = props.initialPositionX) !== null && _c !== void 0 ? _c : initialState.positionX,
        positionY: (_d = props.initialPositionY) !== null && _d !== void 0 ? _d : initialState.positionY,
    };
};
var createSetup = function (props) {
    var newSetup = __assign({}, initialSetup);
    Object.keys(props).forEach(function (key) {
        var validValue = typeof props[key] !== "undefined";
        var validParameter = typeof initialSetup[key] !== "undefined";
        if (validParameter && validValue) {
            var dataType = Object.prototype.toString.call(initialSetup[key]);
            var isObject = dataType === "[object Object]";
            var isArray = dataType === "[object Array]";
            if (isObject) {
                newSetup[key] = __assign(__assign({}, initialSetup[key]), props[key]);
            }
            else if (isArray) {
                newSetup[key] = __spreadArray(__spreadArray([], initialSetup[key], true), props[key], true);
            }
            else {
                newSetup[key] = props[key];
            }
        }
    });
    return newSetup;
};

var handleCalculateButtonZoom = function (contextInstance, delta, step) {
    var scale = contextInstance.transformState.scale;
    var wrapperComponent = contextInstance.wrapperComponent, setup = contextInstance.setup;
    var maxScale = setup.maxScale, minScale = setup.minScale, zoomAnimation = setup.zoomAnimation;
    var size = zoomAnimation.size;
    if (!wrapperComponent) {
        throw new Error("Wrapper is not mounted");
    }
    var targetScale = scale * Math.exp(delta * step);
    var newScale = checkZoomBounds(roundNumber(targetScale, 3), minScale, maxScale, size, false);
    return newScale;
};
function handleZoomToViewCenter(contextInstance, delta, step, animationTime, animationType) {
    var wrapperComponent = contextInstance.wrapperComponent;
    var _a = contextInstance.transformState, scale = _a.scale, positionX = _a.positionX, positionY = _a.positionY;
    if (!wrapperComponent)
        return console.error("No WrapperComponent found");
    var wrapperWidth = wrapperComponent.offsetWidth;
    var wrapperHeight = wrapperComponent.offsetHeight;
    var mouseX = (wrapperWidth / 2 - positionX) / scale;
    var mouseY = (wrapperHeight / 2 - positionY) / scale;
    var newScale = handleCalculateButtonZoom(contextInstance, delta, step);
    var targetState = handleZoomToPoint(contextInstance, newScale, mouseX, mouseY);
    if (!targetState) {
        return console.error("Error during zoom event. New transformation state was not calculated.");
    }
    animate(contextInstance, targetState, animationTime, animationType);
}
function resetTransformations(contextInstance, animationTime, animationType, onResetTransformation) {
    var setup = contextInstance.setup, wrapperComponent = contextInstance.wrapperComponent;
    var limitToBounds = setup.limitToBounds;
    var initialTransformation = createState(contextInstance.props);
    var _a = contextInstance.transformState, scale = _a.scale, positionX = _a.positionX, positionY = _a.positionY;
    if (!wrapperComponent)
        return;
    var newBounds = calculateBounds(contextInstance, initialTransformation.scale);
    var boundedPositions = getMouseBoundedPosition(initialTransformation.positionX, initialTransformation.positionY, newBounds, limitToBounds, 0, 0, wrapperComponent);
    var newState = {
        scale: initialTransformation.scale,
        positionX: boundedPositions.x,
        positionY: boundedPositions.y,
    };
    if (scale === initialTransformation.scale &&
        positionX === initialTransformation.positionX &&
        positionY === initialTransformation.positionY) {
        return;
    }
    onResetTransformation === null || onResetTransformation === void 0 ? void 0 : onResetTransformation();
    animate(contextInstance, newState, animationTime, animationType);
}
function getOffset(element, wrapper, content, state) {
    var offset = element.getBoundingClientRect();
    var wrapperOffset = wrapper.getBoundingClientRect();
    var contentOffset = content.getBoundingClientRect();
    var xOff = wrapperOffset.x * state.scale;
    var yOff = wrapperOffset.y * state.scale;
    return {
        x: (offset.x - contentOffset.x + xOff) / state.scale,
        y: (offset.y - contentOffset.y + yOff) / state.scale,
    };
}
function calculateZoomToNode(contextInstance, node, customZoom) {
    var wrapperComponent = contextInstance.wrapperComponent, contentComponent = contextInstance.contentComponent, transformState = contextInstance.transformState;
    var _a = contextInstance.setup, limitToBounds = _a.limitToBounds, minScale = _a.minScale, maxScale = _a.maxScale;
    if (!wrapperComponent || !contentComponent)
        return transformState;
    var wrapperRect = wrapperComponent.getBoundingClientRect();
    var nodeRect = node.getBoundingClientRect();
    var nodeOffset = getOffset(node, wrapperComponent, contentComponent, transformState);
    var nodeLeft = nodeOffset.x;
    var nodeTop = nodeOffset.y;
    var nodeWidth = nodeRect.width / transformState.scale;
    var nodeHeight = nodeRect.height / transformState.scale;
    var scaleX = wrapperComponent.offsetWidth / nodeWidth;
    var scaleY = wrapperComponent.offsetHeight / nodeHeight;
    var newScale = checkZoomBounds(customZoom || Math.min(scaleX, scaleY), minScale, maxScale, 0, false);
    var offsetX = (wrapperRect.width - nodeWidth * newScale) / 2;
    var offsetY = (wrapperRect.height - nodeHeight * newScale) / 2;
    var newPositionX = (wrapperRect.left - nodeLeft) * newScale + offsetX;
    var newPositionY = (wrapperRect.top - nodeTop) * newScale + offsetY;
    var bounds = calculateBounds(contextInstance, newScale);
    var _b = getMouseBoundedPosition(newPositionX, newPositionY, bounds, limitToBounds, 0, 0, wrapperComponent), x = _b.x, y = _b.y;
    return { positionX: x, positionY: y, scale: newScale };
}

var zoomIn = function (contextInstance) {
    return function (step, animationTime, animationType) {
        if (step === void 0) { step = 0.5; }
        if (animationTime === void 0) { animationTime = 300; }
        if (animationType === void 0) { animationType = "easeOut"; }
        handleZoomToViewCenter(contextInstance, 1, step, animationTime, animationType);
    };
};
var zoomOut = function (contextInstance) {
    return function (step, animationTime, animationType) {
        if (step === void 0) { step = 0.5; }
        if (animationTime === void 0) { animationTime = 300; }
        if (animationType === void 0) { animationType = "easeOut"; }
        handleZoomToViewCenter(contextInstance, -1, step, animationTime, animationType);
    };
};
var setTransform = function (contextInstance) {
    return function (newPositionX, newPositionY, newScale, animationTime, animationType) {
        if (animationTime === void 0) { animationTime = 300; }
        if (animationType === void 0) { animationType = "easeOut"; }
        var _a = contextInstance.transformState, positionX = _a.positionX, positionY = _a.positionY, scale = _a.scale;
        var wrapperComponent = contextInstance.wrapperComponent, contentComponent = contextInstance.contentComponent;
        var disabled = contextInstance.setup.disabled;
        if (disabled || !wrapperComponent || !contentComponent)
            return;
        var targetState = {
            positionX: Number.isNaN(newPositionX) ? positionX : newPositionX,
            positionY: Number.isNaN(newPositionY) ? positionY : newPositionY,
            scale: Number.isNaN(newScale) ? scale : newScale,
        };
        animate(contextInstance, targetState, animationTime, animationType);
    };
};
var resetTransform = function (contextInstance) {
    return function (animationTime, animationType) {
        if (animationTime === void 0) { animationTime = 200; }
        if (animationType === void 0) { animationType = "easeOut"; }
        resetTransformations(contextInstance, animationTime, animationType);
    };
};
var centerView = function (contextInstance) {
    return function (scale, animationTime, animationType) {
        if (animationTime === void 0) { animationTime = 200; }
        if (animationType === void 0) { animationType = "easeOut"; }
        var transformState = contextInstance.transformState, wrapperComponent = contextInstance.wrapperComponent, contentComponent = contextInstance.contentComponent;
        if (wrapperComponent && contentComponent) {
            var targetState = getCenterPosition(scale || transformState.scale, wrapperComponent, contentComponent);
            animate(contextInstance, targetState, animationTime, animationType);
        }
    };
};
var zoomToElement = function (contextInstance) {
    return function (node, scale, animationTime, animationType) {
        if (animationTime === void 0) { animationTime = 600; }
        if (animationType === void 0) { animationType = "easeOut"; }
        handleCancelAnimation(contextInstance);
        var wrapperComponent = contextInstance.wrapperComponent;
        var target = typeof node === "string" ? document.getElementById(node) : node;
        if (wrapperComponent && target && wrapperComponent.contains(target)) {
            var targetState = calculateZoomToNode(contextInstance, target, scale);
            animate(contextInstance, targetState, animationTime, animationType);
        }
    };
};

var getContext = function (contextInstance) {
    return {
        instance: contextInstance,
        state: contextInstance.transformState,
        zoomIn: zoomIn(contextInstance),
        zoomOut: zoomOut(contextInstance),
        setTransform: setTransform(contextInstance),
        resetTransform: resetTransform(contextInstance),
        centerView: centerView(contextInstance),
        zoomToElement: zoomToElement(contextInstance),
    };
};

// We want to make event listeners non-passive, and to do so have to check
// that browsers support EventListenerOptions in the first place.
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
var passiveSupported = false;
function makePassiveEventOption() {
    try {
        var options = {
            get passive() {
                // This function will be called when the browser
                //   attempts to access the passive property.
                passiveSupported = true;
                return false;
            },
        };
        return options;
    }
    catch (err) {
        passiveSupported = false;
        return passiveSupported;
    }
}

var isExcludedNode = function (node, excluded) {
    var targetTagName = node.tagName.toUpperCase();
    var isExcludedTag = excluded.find(function (tag) { return tag.toUpperCase() === targetTagName; });
    if (isExcludedTag)
        return true;
    var isExcludedClassName = excluded.find(function (className) {
        return node.classList.contains(className);
    });
    if (isExcludedClassName)
        return true;
    return false;
};
var cancelTimeout = function (timeout) {
    if (timeout) {
        clearTimeout(timeout);
    }
};

var getTransformStyles = function (x, y, scale) {
    // Standard translate prevents blurry svg on the safari
    return "translate(".concat(x, "px, ").concat(y, "px) scale(").concat(scale, ")");
};
var getCenterPosition = function (scale, wrapperComponent, contentComponent) {
    var contentWidth = contentComponent.offsetWidth * scale;
    var contentHeight = contentComponent.offsetHeight * scale;
    var centerPositionX = (wrapperComponent.offsetWidth - contentWidth) / 2;
    var centerPositionY = (wrapperComponent.offsetHeight - contentHeight) / 2;
    return {
        scale: scale,
        positionX: centerPositionX,
        positionY: centerPositionY,
    };
};

function mergeRefs(refs) {
    return function (value) {
        refs.forEach(function (ref) {
            if (typeof ref === "function") {
                ref(value);
            }
            else if (ref != null) {
                ref.current = value;
            }
        });
    };
}

var isWheelAllowed = function (contextInstance, event) {
    var _a = contextInstance.setup.wheel, disabled = _a.disabled, wheelDisabled = _a.wheelDisabled, touchPadDisabled = _a.touchPadDisabled, excluded = _a.excluded;
    var isInitialized = contextInstance.isInitialized, isPanning = contextInstance.isPanning;
    var target = event.target;
    var isAllowed = isInitialized && !isPanning && !disabled && target;
    if (!isAllowed)
        return false;
    // Event ctrlKey detects if touchpad action is executing wheel or pinch gesture
    if (wheelDisabled && !event.ctrlKey)
        return false;
    if (touchPadDisabled && event.ctrlKey)
        return false;
    var isExcluded = isExcludedNode(target, excluded);
    if (isExcluded)
        return false;
    return true;
};
var getDeltaY = function (event) {
    if (event) {
        return event.deltaY < 0 ? 1 : -1;
    }
    return 0;
};
function getDelta(event, customDelta) {
    var deltaY = getDeltaY(event);
    var delta = checkIsNumber(customDelta, deltaY);
    return delta;
}
function getMousePosition(event, contentComponent, scale) {
    var contentRect = contentComponent.getBoundingClientRect();
    var mouseX = 0;
    var mouseY = 0;
    if ("clientX" in event) {
        // mouse position x, y over wrapper component
        mouseX = (event.clientX - contentRect.left) / scale;
        mouseY = (event.clientY - contentRect.top) / scale;
    }
    else {
        var touch = event.touches[0];
        mouseX = (touch.clientX - contentRect.left) / scale;
        mouseY = (touch.clientY - contentRect.top) / scale;
    }
    if (Number.isNaN(mouseX) || Number.isNaN(mouseY))
        console.error("No mouse or touch offset found");
    return {
        x: mouseX,
        y: mouseY,
    };
}
var handleCalculateWheelZoom = function (contextInstance, delta, step, disable, getTarget) {
    var scale = contextInstance.transformState.scale;
    var wrapperComponent = contextInstance.wrapperComponent, setup = contextInstance.setup;
    var maxScale = setup.maxScale, minScale = setup.minScale, zoomAnimation = setup.zoomAnimation, disablePadding = setup.disablePadding;
    var size = zoomAnimation.size, disabled = zoomAnimation.disabled;
    if (!wrapperComponent) {
        throw new Error("Wrapper is not mounted");
    }
    var targetScale = scale + delta * (scale - scale * step) * step;
    if (getTarget)
        return targetScale;
    var paddingEnabled = disable ? false : !disabled;
    var newScale = checkZoomBounds(roundNumber(targetScale, 3), minScale, maxScale, size, paddingEnabled && !disablePadding);
    return newScale;
};
var handleWheelZoomStop = function (contextInstance, event) {
    var previousWheelEvent = contextInstance.previousWheelEvent;
    var scale = contextInstance.transformState.scale;
    var _a = contextInstance.setup, maxScale = _a.maxScale, minScale = _a.minScale;
    if (!previousWheelEvent)
        return false;
    if (scale < maxScale || scale > minScale)
        return true;
    if (Math.sign(previousWheelEvent.deltaY) !== Math.sign(event.deltaY))
        return true;
    if (previousWheelEvent.deltaY > 0 && previousWheelEvent.deltaY < event.deltaY)
        return true;
    if (previousWheelEvent.deltaY < 0 && previousWheelEvent.deltaY > event.deltaY)
        return true;
    if (Math.sign(previousWheelEvent.deltaY) !== Math.sign(event.deltaY))
        return true;
    return false;
};

var isPinchStartAllowed = function (contextInstance, event) {
    var _a = contextInstance.setup.pinch, disabled = _a.disabled, excluded = _a.excluded;
    var isInitialized = contextInstance.isInitialized;
    var target = event.target;
    var isAllowed = isInitialized && !disabled && target;
    if (!isAllowed)
        return false;
    var isExcluded = isExcludedNode(target, excluded);
    if (isExcluded)
        return false;
    return true;
};
var isPinchAllowed = function (contextInstance) {
    var disabled = contextInstance.setup.pinch.disabled;
    var isInitialized = contextInstance.isInitialized, pinchStartDistance = contextInstance.pinchStartDistance;
    var isAllowed = isInitialized && !disabled && pinchStartDistance;
    if (!isAllowed)
        return false;
    return true;
};
var calculateTouchMidPoint = function (event, scale, contentComponent) {
    var contentRect = contentComponent.getBoundingClientRect();
    var touches = event.touches;
    var firstPointX = roundNumber(touches[0].clientX - contentRect.left, 5);
    var firstPointY = roundNumber(touches[0].clientY - contentRect.top, 5);
    var secondPointX = roundNumber(touches[1].clientX - contentRect.left, 5);
    var secondPointY = roundNumber(touches[1].clientY - contentRect.top, 5);
    return {
        x: (firstPointX + secondPointX) / 2 / scale,
        y: (firstPointY + secondPointY) / 2 / scale,
    };
};
var getTouchDistance = function (event) {
    return Math.sqrt(Math.pow((event.touches[0].pageX - event.touches[1].pageX), 2) +
        Math.pow((event.touches[0].pageY - event.touches[1].pageY), 2));
};
var calculatePinchZoom = function (contextInstance, currentDistance) {
    var pinchStartScale = contextInstance.pinchStartScale, pinchStartDistance = contextInstance.pinchStartDistance, setup = contextInstance.setup;
    var maxScale = setup.maxScale, minScale = setup.minScale, zoomAnimation = setup.zoomAnimation, disablePadding = setup.disablePadding;
    var size = zoomAnimation.size, disabled = zoomAnimation.disabled;
    if (!pinchStartScale || pinchStartDistance === null || !currentDistance) {
        throw new Error("Pinch touches distance was not provided");
    }
    if (currentDistance < 0) {
        return contextInstance.transformState.scale;
    }
    var touchProportion = currentDistance / pinchStartDistance;
    var scaleDifference = touchProportion * pinchStartScale;
    return checkZoomBounds(roundNumber(scaleDifference, 2), minScale, maxScale, size, !disabled && !disablePadding);
};

var wheelStopEventTime = 160;
var wheelAnimationTime = 100;
var handleWheelStart = function (contextInstance, event) {
    var _a = contextInstance.props, onWheelStart = _a.onWheelStart, onZoomStart = _a.onZoomStart;
    if (!contextInstance.wheelStopEventTimer) {
        handleCancelAnimation(contextInstance);
        handleCallback(getContext(contextInstance), event, onWheelStart);
        handleCallback(getContext(contextInstance), event, onZoomStart);
    }
};
var handleWheelZoom = function (contextInstance, event) {
    var _a = contextInstance.props, onWheel = _a.onWheel, onZoom = _a.onZoom;
    var contentComponent = contextInstance.contentComponent, setup = contextInstance.setup, transformState = contextInstance.transformState;
    var scale = transformState.scale;
    var limitToBounds = setup.limitToBounds, centerZoomedOut = setup.centerZoomedOut, zoomAnimation = setup.zoomAnimation, wheel = setup.wheel, disablePadding = setup.disablePadding;
    var size = zoomAnimation.size, disabled = zoomAnimation.disabled;
    var step = wheel.step;
    if (!contentComponent) {
        throw new Error("Component not mounted");
    }
    event.preventDefault();
    event.stopPropagation();
    var delta = getDelta(event, null);
    var newScale = handleCalculateWheelZoom(contextInstance, delta, step, !event.ctrlKey);
    // if scale not change
    if (scale === newScale)
        return;
    var bounds = handleCalculateBounds(contextInstance, newScale);
    var mousePosition = getMousePosition(event, contentComponent, scale);
    var isPaddingDisabled = disabled || size === 0 || centerZoomedOut || disablePadding;
    var isLimitedToBounds = limitToBounds && isPaddingDisabled;
    var _b = handleCalculateZoomPositions(contextInstance, mousePosition.x, mousePosition.y, newScale, bounds, isLimitedToBounds), x = _b.x, y = _b.y;
    contextInstance.previousWheelEvent = event;
    contextInstance.setTransformState(newScale, x, y);
    handleCallback(getContext(contextInstance), event, onWheel);
    handleCallback(getContext(contextInstance), event, onZoom);
};
var handleWheelStop = function (contextInstance, event) {
    var _a = contextInstance.props, onWheelStop = _a.onWheelStop, onZoomStop = _a.onZoomStop;
    // fire animation
    cancelTimeout(contextInstance.wheelAnimationTimer);
    contextInstance.wheelAnimationTimer = setTimeout(function () {
        if (!contextInstance.mounted)
            return;
        handleAlignToScaleBounds(contextInstance, event.x, event.y);
        contextInstance.wheelAnimationTimer = null;
    }, wheelAnimationTime);
    // Wheel stop event
    var hasStoppedZooming = handleWheelZoomStop(contextInstance, event);
    if (hasStoppedZooming) {
        cancelTimeout(contextInstance.wheelStopEventTimer);
        contextInstance.wheelStopEventTimer = setTimeout(function () {
            if (!contextInstance.mounted)
                return;
            contextInstance.wheelStopEventTimer = null;
            handleCallback(getContext(contextInstance), event, onWheelStop);
            handleCallback(getContext(contextInstance), event, onZoomStop);
        }, wheelStopEventTime);
    }
};

var handlePinchStart = function (contextInstance, event) {
    var distance = getTouchDistance(event);
    contextInstance.pinchStartDistance = distance;
    contextInstance.lastDistance = distance;
    contextInstance.pinchStartScale = contextInstance.transformState.scale;
    contextInstance.isPanning = false;
    handleCancelAnimation(contextInstance);
};
var handlePinchZoom = function (contextInstance, event) {
    var contentComponent = contextInstance.contentComponent, pinchStartDistance = contextInstance.pinchStartDistance;
    var scale = contextInstance.transformState.scale;
    var _a = contextInstance.setup, limitToBounds = _a.limitToBounds, centerZoomedOut = _a.centerZoomedOut, zoomAnimation = _a.zoomAnimation;
    var disabled = zoomAnimation.disabled, size = zoomAnimation.size;
    // if one finger starts from outside of wrapper
    if (pinchStartDistance === null || !contentComponent)
        return;
    var midPoint = calculateTouchMidPoint(event, scale, contentComponent);
    // if touches goes off of the wrapper element
    if (!Number.isFinite(midPoint.x) || !Number.isFinite(midPoint.y))
        return;
    var currentDistance = getTouchDistance(event);
    var newScale = calculatePinchZoom(contextInstance, currentDistance);
    if (newScale === scale)
        return;
    var bounds = handleCalculateBounds(contextInstance, newScale);
    var isPaddingDisabled = disabled || size === 0 || centerZoomedOut;
    var isLimitedToBounds = limitToBounds && isPaddingDisabled;
    var _b = handleCalculateZoomPositions(contextInstance, midPoint.x, midPoint.y, newScale, bounds, isLimitedToBounds), x = _b.x, y = _b.y;
    contextInstance.pinchMidpoint = midPoint;
    contextInstance.lastDistance = currentDistance;
    contextInstance.setTransformState(newScale, x, y);
};
var handlePinchStop = function (contextInstance) {
    var pinchMidpoint = contextInstance.pinchMidpoint;
    contextInstance.velocity = null;
    contextInstance.lastDistance = null;
    contextInstance.pinchMidpoint = null;
    contextInstance.pinchStartScale = null;
    contextInstance.pinchStartDistance = null;
    handleAlignToScaleBounds(contextInstance, pinchMidpoint === null || pinchMidpoint === void 0 ? void 0 : pinchMidpoint.x, pinchMidpoint === null || pinchMidpoint === void 0 ? void 0 : pinchMidpoint.y);
};

var handleDoubleClickStop = function (contextInstance, event) {
    var onZoomStop = contextInstance.props.onZoomStop;
    var animationTime = contextInstance.setup.doubleClick.animationTime;
    cancelTimeout(contextInstance.doubleClickStopEventTimer);
    contextInstance.doubleClickStopEventTimer = setTimeout(function () {
        contextInstance.doubleClickStopEventTimer = null;
        handleCallback(getContext(contextInstance), event, onZoomStop);
    }, animationTime);
};
var handleDoubleClickResetMode = function (contextInstance, event) {
    var _a = contextInstance.props, onZoomStart = _a.onZoomStart, onZoom = _a.onZoom;
    var _b = contextInstance.setup.doubleClick, animationTime = _b.animationTime, animationType = _b.animationType;
    handleCallback(getContext(contextInstance), event, onZoomStart);
    resetTransformations(contextInstance, animationTime, animationType, function () {
        return handleCallback(getContext(contextInstance), event, onZoom);
    });
    handleDoubleClickStop(contextInstance, event);
};
function handleDoubleClick(contextInstance, event) {
    var setup = contextInstance.setup, doubleClickStopEventTimer = contextInstance.doubleClickStopEventTimer, transformState = contextInstance.transformState, contentComponent = contextInstance.contentComponent;
    var scale = transformState.scale;
    var _a = contextInstance.props, onZoomStart = _a.onZoomStart, onZoom = _a.onZoom;
    var _b = setup.doubleClick, disabled = _b.disabled, mode = _b.mode, step = _b.step, animationTime = _b.animationTime, animationType = _b.animationType;
    if (disabled)
        return;
    if (doubleClickStopEventTimer)
        return;
    if (mode === "reset") {
        return handleDoubleClickResetMode(contextInstance, event);
    }
    if (!contentComponent)
        return console.error("No ContentComponent found");
    var delta = mode === "zoomOut" ? -1 : 1;
    var newScale = handleCalculateButtonZoom(contextInstance, delta, step);
    // stop execution when scale didn't change
    if (scale === newScale)
        return;
    handleCallback(getContext(contextInstance), event, onZoomStart);
    var mousePosition = getMousePosition(event, contentComponent, scale);
    var targetState = handleZoomToPoint(contextInstance, newScale, mousePosition.x, mousePosition.y);
    if (!targetState) {
        return console.error("Error during zoom event. New transformation state was not calculated.");
    }
    handleCallback(getContext(contextInstance), event, onZoom);
    animate(contextInstance, targetState, animationTime, animationType);
    handleDoubleClickStop(contextInstance, event);
}
var isDoubleClickAllowed = function (contextInstance, event) {
    var isInitialized = contextInstance.isInitialized, setup = contextInstance.setup, wrapperComponent = contextInstance.wrapperComponent;
    var _a = setup.doubleClick, disabled = _a.disabled, excluded = _a.excluded;
    var target = event.target;
    var isWrapperChild = wrapperComponent === null || wrapperComponent === void 0 ? void 0 : wrapperComponent.contains(target);
    var isAllowed = isInitialized && target && isWrapperChild && !disabled;
    if (!isAllowed)
        return false;
    var isExcluded = isExcludedNode(target, excluded);
    if (isExcluded)
        return false;
    return true;
};

var ZoomPanPinch = /** @class */ (function () {
    function ZoomPanPinch(props) {
        var _this = this;
        this.mounted = true;
        this.onChangeCallbacks = new Set();
        // Components
        this.wrapperComponent = null;
        this.contentComponent = null;
        // Initialization
        this.isInitialized = false;
        this.bounds = null;
        // wheel helpers
        this.previousWheelEvent = null;
        this.wheelStopEventTimer = null;
        this.wheelAnimationTimer = null;
        // panning helpers
        this.isPanning = false;
        this.startCoords = null;
        this.lastTouch = null;
        // pinch helpers
        this.distance = null;
        this.lastDistance = null;
        this.pinchStartDistance = null;
        this.pinchStartScale = null;
        this.pinchMidpoint = null;
        // double click helpers
        this.doubleClickStopEventTimer = null;
        // velocity helpers
        this.velocity = null;
        this.velocityTime = null;
        this.lastMousePosition = null;
        // animations helpers
        this.animate = false;
        this.animation = null;
        this.maxBounds = null;
        // key press
        this.pressedKeys = {};
        this.mount = function () {
            _this.initializeWindowEvents();
        };
        this.unmount = function () {
            _this.cleanupWindowEvents();
        };
        this.update = function (newProps) {
            handleCalculateBounds(_this, _this.transformState.scale);
            _this.setup = createSetup(newProps);
        };
        this.initializeWindowEvents = function () {
            var _a;
            var passive = makePassiveEventOption();
            var currentDocument = (_a = _this.wrapperComponent) === null || _a === void 0 ? void 0 : _a.ownerDocument;
            var currentWindow = currentDocument === null || currentDocument === void 0 ? void 0 : currentDocument.defaultView;
            // Panning on window to allow panning when mouse is out of component wrapper
            currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.addEventListener("mousedown", _this.onPanningStart, passive);
            currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.addEventListener("mousemove", _this.onPanning, passive);
            currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.addEventListener("mouseup", _this.onPanningStop, passive);
            currentDocument === null || currentDocument === void 0 ? void 0 : currentDocument.addEventListener("mouseleave", _this.clearPanning, passive);
            currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.addEventListener("keyup", _this.setKeyUnPressed, passive);
            currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.addEventListener("keydown", _this.setKeyPressed, passive);
        };
        this.cleanupWindowEvents = function () {
            var _a, _b;
            var passive = makePassiveEventOption();
            var currentDocument = (_a = _this.wrapperComponent) === null || _a === void 0 ? void 0 : _a.ownerDocument;
            var currentWindow = currentDocument === null || currentDocument === void 0 ? void 0 : currentDocument.defaultView;
            currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.removeEventListener("mousedown", _this.onPanningStart, passive);
            currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.removeEventListener("mousemove", _this.onPanning, passive);
            currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.removeEventListener("mouseup", _this.onPanningStop, passive);
            currentDocument === null || currentDocument === void 0 ? void 0 : currentDocument.removeEventListener("mouseleave", _this.clearPanning, passive);
            currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.removeEventListener("keyup", _this.setKeyUnPressed, passive);
            currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.removeEventListener("keydown", _this.setKeyPressed, passive);
            document.removeEventListener("mouseleave", _this.clearPanning, passive);
            handleCancelAnimation(_this);
            (_b = _this.observer) === null || _b === void 0 ? void 0 : _b.disconnect();
        };
        this.handleInitializeWrapperEvents = function (wrapper) {
            // Zooming events on wrapper
            var passive = makePassiveEventOption();
            wrapper.addEventListener("wheel", _this.onWheelZoom, passive);
            wrapper.addEventListener("dblclick", _this.onDoubleClick, passive);
            wrapper.addEventListener("touchstart", _this.onTouchPanningStart, passive);
            wrapper.addEventListener("touchmove", _this.onTouchPanning, passive);
            wrapper.addEventListener("touchend", _this.onTouchPanningStop, passive);
        };
        this.handleInitialize = function (contentComponent) {
            var centerOnInit = _this.setup.centerOnInit;
            _this.applyTransformation();
            if (centerOnInit) {
                _this.setCenter();
                _this.observer = new ResizeObserver(function () {
                    var _a;
                    _this.setCenter();
                    (_a = _this.observer) === null || _a === void 0 ? void 0 : _a.disconnect();
                });
                // Start observing the target node for configured mutations
                _this.observer.observe(contentComponent);
            }
        };
        /// ///////
        // Zoom
        /// ///////
        this.onWheelZoom = function (event) {
            var disabled = _this.setup.disabled;
            if (disabled)
                return;
            var isAllowed = isWheelAllowed(_this, event);
            if (!isAllowed)
                return;
            var keysPressed = _this.isPressingKeys(_this.setup.wheel.activationKeys);
            if (!keysPressed)
                return;
            handleWheelStart(_this, event);
            handleWheelZoom(_this, event);
            handleWheelStop(_this, event);
        };
        /// ///////
        // Pan
        /// ///////
        this.onPanningStart = function (event) {
            var disabled = _this.setup.disabled;
            var onPanningStart = _this.props.onPanningStart;
            if (disabled)
                return;
            var isAllowed = isPanningStartAllowed(_this, event);
            if (!isAllowed)
                return;
            var keysPressed = _this.isPressingKeys(_this.setup.panning.activationKeys);
            if (!keysPressed)
                return;
            event.preventDefault();
            event.stopPropagation();
            handleCancelAnimation(_this);
            handlePanningStart(_this, event);
            handleCallback(getContext(_this), event, onPanningStart);
        };
        this.onPanning = function (event) {
            var disabled = _this.setup.disabled;
            var onPanning = _this.props.onPanning;
            if (disabled)
                return;
            var isAllowed = isPanningAllowed(_this);
            if (!isAllowed)
                return;
            var keysPressed = _this.isPressingKeys(_this.setup.panning.activationKeys);
            if (!keysPressed)
                return;
            event.preventDefault();
            event.stopPropagation();
            handlePanning(_this, event.clientX, event.clientY);
            handleCallback(getContext(_this), event, onPanning);
        };
        this.onPanningStop = function (event) {
            var onPanningStop = _this.props.onPanningStop;
            if (_this.isPanning) {
                handlePanningEnd(_this);
                handleCallback(getContext(_this), event, onPanningStop);
            }
        };
        /// ///////
        // Pinch
        /// ///////
        this.onPinchStart = function (event) {
            var disabled = _this.setup.disabled;
            var _a = _this.props, onPinchingStart = _a.onPinchingStart, onZoomStart = _a.onZoomStart;
            if (disabled)
                return;
            var isAllowed = isPinchStartAllowed(_this, event);
            if (!isAllowed)
                return;
            handlePinchStart(_this, event);
            handleCancelAnimation(_this);
            handleCallback(getContext(_this), event, onPinchingStart);
            handleCallback(getContext(_this), event, onZoomStart);
        };
        this.onPinch = function (event) {
            var disabled = _this.setup.disabled;
            var _a = _this.props, onPinching = _a.onPinching, onZoom = _a.onZoom;
            if (disabled)
                return;
            var isAllowed = isPinchAllowed(_this);
            if (!isAllowed)
                return;
            event.preventDefault();
            event.stopPropagation();
            handlePinchZoom(_this, event);
            handleCallback(getContext(_this), event, onPinching);
            handleCallback(getContext(_this), event, onZoom);
        };
        this.onPinchStop = function (event) {
            var _a = _this.props, onPinchingStop = _a.onPinchingStop, onZoomStop = _a.onZoomStop;
            if (_this.pinchStartScale) {
                handlePinchStop(_this);
                handleCallback(getContext(_this), event, onPinchingStop);
                handleCallback(getContext(_this), event, onZoomStop);
            }
        };
        /// ///////
        // Touch
        /// ///////
        this.onTouchPanningStart = function (event) {
            var disabled = _this.setup.disabled;
            var onPanningStart = _this.props.onPanningStart;
            if (disabled)
                return;
            var isAllowed = isPanningStartAllowed(_this, event);
            if (!isAllowed)
                return;
            var isDoubleTap = _this.lastTouch && +new Date() - _this.lastTouch < 200;
            if (isDoubleTap && event.touches.length === 1) {
                _this.onDoubleClick(event);
            }
            else {
                _this.lastTouch = +new Date();
                handleCancelAnimation(_this);
                var touches = event.touches;
                var isPanningAction = touches.length === 1;
                var isPinchAction = touches.length === 2;
                if (isPanningAction) {
                    handleCancelAnimation(_this);
                    handlePanningStart(_this, event);
                    handleCallback(getContext(_this), event, onPanningStart);
                }
                if (isPinchAction) {
                    _this.onPinchStart(event);
                }
            }
        };
        this.onTouchPanning = function (event) {
            var disabled = _this.setup.disabled;
            var onPanning = _this.props.onPanning;
            if (_this.isPanning && event.touches.length === 1) {
                if (disabled)
                    return;
                var isAllowed = isPanningAllowed(_this);
                if (!isAllowed)
                    return;
                event.preventDefault();
                event.stopPropagation();
                var touch = event.touches[0];
                handlePanning(_this, touch.clientX, touch.clientY);
                handleCallback(getContext(_this), event, onPanning);
            }
            else if (event.touches.length > 1) {
                _this.onPinch(event);
            }
        };
        this.onTouchPanningStop = function (event) {
            _this.onPanningStop(event);
            _this.onPinchStop(event);
        };
        /// ///////
        // Double Click
        /// ///////
        this.onDoubleClick = function (event) {
            var disabled = _this.setup.disabled;
            if (disabled)
                return;
            var isAllowed = isDoubleClickAllowed(_this, event);
            if (!isAllowed)
                return;
            handleDoubleClick(_this, event);
        };
        /// ///////
        // Helpers
        /// ///////
        this.clearPanning = function (event) {
            if (_this.isPanning) {
                _this.onPanningStop(event);
            }
        };
        this.setKeyPressed = function (e) {
            _this.pressedKeys[e.key] = true;
        };
        this.setKeyUnPressed = function (e) {
            _this.pressedKeys[e.key] = false;
        };
        this.isPressingKeys = function (keys) {
            if (!keys.length) {
                return true;
            }
            return Boolean(keys.find(function (key) { return _this.pressedKeys[key]; }));
        };
        this.setTransformState = function (scale, positionX, positionY) {
            var onTransformed = _this.props.onTransformed;
            if (!Number.isNaN(scale) &&
                !Number.isNaN(positionX) &&
                !Number.isNaN(positionY)) {
                if (scale !== _this.transformState.scale) {
                    _this.transformState.previousScale = _this.transformState.scale;
                    _this.transformState.scale = scale;
                }
                _this.transformState.positionX = positionX;
                _this.transformState.positionY = positionY;
                var ctx_1 = getContext(_this);
                _this.onChangeCallbacks.forEach(function (callback) { return callback(ctx_1); });
                handleCallback(ctx_1, { scale: scale, positionX: positionX, positionY: positionY }, onTransformed);
                _this.applyTransformation();
            }
            else {
                console.error("Detected NaN set state values");
            }
        };
        this.setCenter = function () {
            if (_this.wrapperComponent && _this.contentComponent) {
                var targetState = getCenterPosition(_this.transformState.scale, _this.wrapperComponent, _this.contentComponent);
                _this.setTransformState(targetState.scale, targetState.positionX, targetState.positionY);
            }
        };
        this.handleTransformStyles = function (x, y, scale) {
            if (_this.props.customTransform) {
                return _this.props.customTransform(x, y, scale);
            }
            return getTransformStyles(x, y, scale);
        };
        this.applyTransformation = function () {
            if (!_this.mounted || !_this.contentComponent)
                return;
            var _a = _this.transformState, scale = _a.scale, positionX = _a.positionX, positionY = _a.positionY;
            var transform = _this.handleTransformStyles(positionX, positionY, scale);
            _this.contentComponent.style.transform = transform;
        };
        this.getContext = function () {
            return getContext(_this);
        };
        this.onChange = function (callback) {
            if (!_this.onChangeCallbacks.has(callback)) {
                _this.onChangeCallbacks.add(callback);
            }
            return function () {
                _this.onChangeCallbacks.delete(callback);
            };
        };
        /**
         * Initialization
         */
        this.init = function (wrapperComponent, contentComponent) {
            _this.cleanupWindowEvents();
            _this.wrapperComponent = wrapperComponent;
            _this.contentComponent = contentComponent;
            handleCalculateBounds(_this, _this.transformState.scale);
            _this.handleInitializeWrapperEvents(wrapperComponent);
            _this.handleInitialize(contentComponent);
            _this.initializeWindowEvents();
            _this.isInitialized = true;
            handleCallback(getContext(_this), undefined, _this.props.onInit);
        };
        this.props = props;
        this.setup = createSetup(this.props);
        this.transformState = createState(this.props);
    }
    return ZoomPanPinch;
}());

var Context = React.createContext(null);
var getContent = function (children, ctx) {
    if (typeof children === "function") {
        return children(ctx);
    }
    return children;
};
var TransformWrapper = React.forwardRef(function (props, ref) {
    var _a = useState(0), forceUpdate = _a[1];
    var children = props.children;
    var instance = useRef(new ZoomPanPinch(props)).current;
    var content = getContent(props.children, getContext(instance));
    var handleOnChange = useCallback(function () {
        if (typeof children === "function") {
            forceUpdate(function (prev) { return prev + 1; });
        }
    }, [children]);
    useImperativeHandle(ref, function () { return getContext(instance); }, [instance]);
    useEffect(function () {
        instance.update(props);
    }, [instance, props]);
    useEffect(function () {
        return instance.onChange(handleOnChange);
    }, [instance, props, handleOnChange]);
    return React.createElement(Context.Provider, { value: instance }, content);
});

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".transform-component-module_wrapper__7HFJe {\n  position: relative;\n  width: -moz-fit-content;\n  width: fit-content;\n  height: -moz-fit-content;\n  height: fit-content;\n  overflow: hidden;\n  -webkit-touch-callout: none; /* iOS Safari */\n  -webkit-user-select: none; /* Safari */\n  -khtml-user-select: none; /* Konqueror HTML */\n  -moz-user-select: none; /* Firefox */\n  -ms-user-select: none; /* Internet Explorer/Edge */\n  user-select: none;\n  margin: 0;\n  padding: 0;\n}\n.transform-component-module_content__uCDPE {\n  display: flex;\n  flex-wrap: wrap;\n  width: -moz-fit-content;\n  width: fit-content;\n  height: -moz-fit-content;\n  height: fit-content;\n  margin: 0;\n  padding: 0;\n  transform-origin: 0% 0%;\n}\n.transform-component-module_content__uCDPE img {\n  pointer-events: none;\n}\n";
var styles = {"wrapper":"transform-component-module_wrapper__7HFJe","content":"transform-component-module_content__uCDPE"};
styleInject(css_248z);

var TransformComponent = function (_a) {
    var children = _a.children, _b = _a.wrapperClass, wrapperClass = _b === void 0 ? "" : _b, _c = _a.contentClass, contentClass = _c === void 0 ? "" : _c, wrapperStyle = _a.wrapperStyle, contentStyle = _a.contentStyle, _d = _a.wrapperProps, wrapperProps = _d === void 0 ? {} : _d, _e = _a.contentProps, contentProps = _e === void 0 ? {} : _e;
    var init = useContext(Context).init;
    var wrapperRef = useRef(null);
    var contentRef = useRef(null);
    useEffect(function () {
        var wrapper = wrapperRef.current;
        var content = contentRef.current;
        if (wrapper !== null && content !== null && init) {
            init(wrapper, content);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (React.createElement("div", __assign({}, wrapperProps, { ref: wrapperRef, className: "react-transform-wrapper ".concat(styles.wrapper, " ").concat(wrapperClass), style: wrapperStyle }),
        React.createElement("div", __assign({}, contentProps, { ref: contentRef, className: "react-transform-component ".concat(styles.content, " ").concat(contentClass), style: contentStyle }), children)));
};

React.forwardRef(function (props, ref) {
    var localRef = useRef(null);
    var instance = useContext(Context);
    useEffect(function () {
        return instance.onChange(function (ctx) {
            if (localRef.current) {
                var positionX = 0;
                var positionY = 0;
                localRef.current.style.transform = instance.handleTransformStyles(positionX, positionY, 1 / ctx.state.scale);
            }
        });
    }, [instance]);
    return React.createElement("div", __assign({}, props, { ref: mergeRefs([localRef, ref]) }));
});

var css$2 = {"container":"ConnectorCurve-module_container__pqaPv","path":"ConnectorCurve-module_path__CjFPJ","pathTmp":"ConnectorCurve-module_pathTmp__g4cyl"};

function ConnectorCurve({
  type,
  src,
  dst,
  scale,
  tmp,
  onContextMenu
}) {
  var _currentTheme$connect;
  const {
    currentTheme
  } = useTheme();
  if (!src || !dst) {
    return;
  }
  const x1 = {
    x: src.x < dst.x ? 5 : -(dst.x - src.x) + 5,
    y: src.y < dst.y ? 5 : -(dst.y - src.y) + 5
  };
  const x2 = {
    x: src.x < dst.x ? dst.x - src.x + 5 : 5,
    y: src.y < dst.y ? dst.y - src.y + 5 : 5
  };
  const b1 = {
    x: Math.abs(x2.x - x1.x) / 2,
    y: x1.y
  };
  const b2 = {
    x: Math.abs(x2.x - x1.x) / 2,
    y: x2.y
  };
  return /*#__PURE__*/jsx("svg", {
    style: {
      transform: `translate(${Math.min(src.x, dst.x)}px, ${Math.min(src.y, dst.y)}px)`,
      width: Math.abs(dst.x - src.x) + 10,
      height: Math.abs(dst.y - src.y) + 10,
      zIndex: tmp ? 1000 : -1
    },
    className: css$2.container,
    children: /*#__PURE__*/jsx("path", {
      style: {
        stroke: (_currentTheme$connect = currentTheme.connections?.[type?.type]?.color) !== null && _currentTheme$connect !== void 0 ? _currentTheme$connect : '#ccc',
        strokeWidth: Math.max(4, 5 * scale)
      },
      className: [css$2.path, tmp ? css$2.pathTmp : null].filter(Boolean).join(' '),
      d: `M ${x1.x} ${x1.y} C ${b1.x} ${b1.y}, ${b2.x} ${b2.y}, ${x2.x} ${x2.y}`,
      onContextMenu: onContextMenu
    })
  });
}

var css$1 = {"container":"ContextMenu-module_container__kpcIH","contextMenu":"ContextMenu-module_contextMenu__xllaM","contextMenuItemContainer":"ContextMenu-module_contextMenuItemContainer__T7rR2","contextMenuItemLabelContainer":"ContextMenu-module_contextMenuItemLabelContainer__fkrNo","contextMenuItemLabel":"ContextMenu-module_contextMenuItemLabel__IJE3x","contextMenuItemDescription":"ContextMenu-module_contextMenuItemDescription__wVBWj","contextMenuItemSubMenu":"ContextMenu-module_contextMenuItemSubMenu__n6J-S","submenu":"ContextMenu-module_submenu__7UZMP"};

function i(ctx, key, params = {}, defaultValue = '') {
  if (!ctx || !key) return defaultValue;
  const template = ctx[key]?.replace(/\{(\w+)\}/gim, (match, p1) => params[p1] || p1);
  return template || defaultValue;
}

const ContextMenuList = ({
  isFiltered,
  options,
  onSelectOption,
  style
}) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activeSubmenuPosition, setActiveSubmenuPosition] = useState(null);
  const [submenuDirection, setSubmenuDirection] = useState('left');
  const [submenuDirectionVertical, setSubmenuDirectionVertical] = useState('top');
  const handleMenuItemMouseEnter = (e, parentId) => {
    setActiveSubmenu(parentId);
    const pos = e.currentTarget.getBoundingClientRect().top - e.currentTarget.parentNode.getBoundingClientRect().top;
    setActiveSubmenuPosition(pos);
    const viewportWidth = window.innerWidth;
    const submenuWidth = e.target.getBoundingClientRect().width;
    const viewportHeight = window.innerHeight;
    const submenuHeight = e.target.getBoundingClientRect().height;
    const rightEdge = e.currentTarget.getBoundingClientRect().right;
    if (rightEdge + submenuWidth > viewportWidth) {
      setSubmenuDirection("right");
    } else {
      setSubmenuDirection("left");
    }
    const bottomEdge = e.currentTarget.getBoundingClientRect().bottom;
    if (bottomEdge + submenuHeight > viewportHeight) {
      setSubmenuDirectionVertical("bottom");
    } else {
      setSubmenuDirectionVertical("top");
    }
  };
  const handleMenuItemMouseLeave = () => {
    setActiveSubmenu(null);
  };
  if (!options?.length) return null;
  return /*#__PURE__*/jsx("ul", {
    className: css$1.contextMenu,
    style: style,
    children: options?.filter(isFiltered)?.map((option, index) => {
      if (option.separator === true) return /*#__PURE__*/jsx("li", {
        children: /*#__PURE__*/jsx("hr", {})
      }, `${option.id}-${index}`);
      return /*#__PURE__*/jsxs("li", {
        onClick: () => onSelectOption(option),
        onMouseEnter: e => handleMenuItemMouseEnter(e, option.label),
        onMouseLeave: () => handleMenuItemMouseLeave(),
        children: [/*#__PURE__*/jsxs("div", {
          className: css$1.contextMenuItemContainer,
          children: [/*#__PURE__*/jsxs("div", {
            className: css$1.contextMenuItemLabelContainer,
            children: [/*#__PURE__*/jsx("div", {
              className: css$1.contextMenuItemLabel,
              style: option.style,
              children: option.label
            }), option.description && /*#__PURE__*/jsx("div", {
              className: css$1.contextMenuItemDescription,
              children: option.description
            })]
          }), option.children && /*#__PURE__*/jsx("div", {
            className: css$1.contextMenuItemSubMenu,
            children: "\u25B6"
          })]
        }), option.children && option.label === activeSubmenu && /*#__PURE__*/jsx(ContextMenuList, {
          isFiltered: isFiltered,
          options: option.children.map(o => ({
            ...o,
            _parent: option
          })),
          onSelectOption: onSelectOption,
          className: css$1.submenu,
          style: {
            [submenuDirection]: '100%',
            top: submenuDirectionVertical === 'top' ? activeSubmenuPosition : null,
            bottom: submenuDirectionVertical === 'bottom' ? 0 : null
          }
        })]
      }, `${option.label}-${index}`);
    })
  });
};
const ContextMenu = ({
  containerRef,
  i18n,
  children
}) => {
  useTheme();
  const [position, setPosition] = useState({
    x: 0,
    y: 0
  });
  const [options, setOptions] = useState(null);
  const [search, setSearch] = useState('');
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const handleContextMenu = (e, options) => {
    var _containerRef$current;
    e.preventDefault();
    e.stopPropagation();
    setTimeout(() => searchRef.current?.focus(), 0);
    const containerRect = (_containerRef$current = containerRef.current?.getBoundingClientRect()) !== null && _containerRef$current !== void 0 ? _containerRef$current : {
      left: 0,
      top: 0
    };
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    setOptions(options);
    setPosition({
      x,
      y
    });
  };
  const handleMenuItemClick = option => {
    option.onClick?.(option);
    setSearch('');
    setOptions(null);
  };
  const handleOutsideClick = e => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setSearch('');
      setOptions(null);
    }
  };
  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);
  const isFiltered = option => {
    var _option$label$toLower, _option$description$t;
    if (!search?.length) return true;
    const _search = search.toLocaleLowerCase();
    if (((_option$label$toLower = option.label?.toLowerCase()?.indexOf(_search)) !== null && _option$label$toLower !== void 0 ? _option$label$toLower : -1) > -1) return true;
    if (((_option$description$t = option.description?.toLowerCase()?.indexOf(_search)) !== null && _option$description$t !== void 0 ? _option$description$t : -1) > -1) return true;

    // TODO isso não é muito eficiente.
    if (option.children?.length && option.children?.some(it => isFiltered(it))) return true;
    return false;
  };
  const nonNullOptions = options?.filter(it => Boolean(it));
  return /*#__PURE__*/jsxs(Fragment, {
    children: [children({
      handleContextMenu
    }), nonNullOptions?.length ? /*#__PURE__*/jsxs("div", {
      ref: menuRef,
      className: css$1.container,
      style: {
        left: position.x,
        top: position.y,
        visibility: nonNullOptions ? 'visible' : 'hidden'
      },
      children: [/*#__PURE__*/jsx("input", {
        ref: searchRef,
        type: "text",
        placeholder: i(i18n, 'contextMenu.search', {}, 'Search'),
        autoFocus: true,
        value: search !== null && search !== void 0 ? search : '',
        onChange: e => setSearch(e.target.value)
      }), /*#__PURE__*/jsx(ContextMenuList, {
        isFiltered: isFiltered,
        options: nonNullOptions,
        onSelectOption: handleMenuItemClick,
        style: {
          position: 'relative'
        }
      })]
    }) : null]
  });
};

let nanoid = (size = 21) =>
  crypto.getRandomValues(new Uint8Array(size)).reduce((id, byte) => {
    byte &= 63;
    if (byte < 36) {
      id += byte.toString(36);
    } else if (byte < 62) {
      id += (byte - 26).toString(36).toUpperCase();
    } else if (byte > 62) {
      id += '-';
    } else {
      id += '_';
    }
    return id
  }, '');

var css = {"container":"Screen-module_container__zkIN3","panel":"Screen-module_panel__P8WaY","controlsPanelVertical":"Screen-module_controlsPanelVertical__-1YKq","controlsPanelHorizontal":"Screen-module_controlsPanelHorizontal__LSyOH","statusPanel":"Screen-module_statusPanel__9lLEm","controlButton":"Screen-module_controlButton__mTn3T"};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var propTypes = {exports: {}};

var reactIs = {exports: {}};

var reactIs_development = {};

/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactIs_development;

function requireReactIs_development () {
	if (hasRequiredReactIs_development) return reactIs_development;
	hasRequiredReactIs_development = 1;



	{
	  (function() {

	// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
	// nor polyfill, then a plain number is used for performance.
	var hasSymbol = typeof Symbol === 'function' && Symbol.for;
	var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
	var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
	var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
	var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
	var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
	var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
	var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
	// (unstable) APIs that have been removed. Can we remove the symbols?

	var REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for('react.async_mode') : 0xeacf;
	var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
	var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
	var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
	var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
	var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
	var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
	var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;
	var REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for('react.fundamental') : 0xead5;
	var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for('react.responder') : 0xead6;
	var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for('react.scope') : 0xead7;

	function isValidElementType(type) {
	  return typeof type === 'string' || typeof type === 'function' || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
	  type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || typeof type === 'object' && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || type.$$typeof === REACT_BLOCK_TYPE);
	}

	function typeOf(object) {
	  if (typeof object === 'object' && object !== null) {
	    var $$typeof = object.$$typeof;

	    switch ($$typeof) {
	      case REACT_ELEMENT_TYPE:
	        var type = object.type;

	        switch (type) {
	          case REACT_ASYNC_MODE_TYPE:
	          case REACT_CONCURRENT_MODE_TYPE:
	          case REACT_FRAGMENT_TYPE:
	          case REACT_PROFILER_TYPE:
	          case REACT_STRICT_MODE_TYPE:
	          case REACT_SUSPENSE_TYPE:
	            return type;

	          default:
	            var $$typeofType = type && type.$$typeof;

	            switch ($$typeofType) {
	              case REACT_CONTEXT_TYPE:
	              case REACT_FORWARD_REF_TYPE:
	              case REACT_LAZY_TYPE:
	              case REACT_MEMO_TYPE:
	              case REACT_PROVIDER_TYPE:
	                return $$typeofType;

	              default:
	                return $$typeof;
	            }

	        }

	      case REACT_PORTAL_TYPE:
	        return $$typeof;
	    }
	  }

	  return undefined;
	} // AsyncMode is deprecated along with isAsyncMode

	var AsyncMode = REACT_ASYNC_MODE_TYPE;
	var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
	var ContextConsumer = REACT_CONTEXT_TYPE;
	var ContextProvider = REACT_PROVIDER_TYPE;
	var Element = REACT_ELEMENT_TYPE;
	var ForwardRef = REACT_FORWARD_REF_TYPE;
	var Fragment = REACT_FRAGMENT_TYPE;
	var Lazy = REACT_LAZY_TYPE;
	var Memo = REACT_MEMO_TYPE;
	var Portal = REACT_PORTAL_TYPE;
	var Profiler = REACT_PROFILER_TYPE;
	var StrictMode = REACT_STRICT_MODE_TYPE;
	var Suspense = REACT_SUSPENSE_TYPE;
	var hasWarnedAboutDeprecatedIsAsyncMode = false; // AsyncMode should be deprecated

	function isAsyncMode(object) {
	  {
	    if (!hasWarnedAboutDeprecatedIsAsyncMode) {
	      hasWarnedAboutDeprecatedIsAsyncMode = true; // Using console['warn'] to evade Babel and ESLint

	      console['warn']('The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 17+. Update your code to use ' + 'ReactIs.isConcurrentMode() instead. It has the exact same API.');
	    }
	  }

	  return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
	}
	function isConcurrentMode(object) {
	  return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
	}
	function isContextConsumer(object) {
	  return typeOf(object) === REACT_CONTEXT_TYPE;
	}
	function isContextProvider(object) {
	  return typeOf(object) === REACT_PROVIDER_TYPE;
	}
	function isElement(object) {
	  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
	}
	function isForwardRef(object) {
	  return typeOf(object) === REACT_FORWARD_REF_TYPE;
	}
	function isFragment(object) {
	  return typeOf(object) === REACT_FRAGMENT_TYPE;
	}
	function isLazy(object) {
	  return typeOf(object) === REACT_LAZY_TYPE;
	}
	function isMemo(object) {
	  return typeOf(object) === REACT_MEMO_TYPE;
	}
	function isPortal(object) {
	  return typeOf(object) === REACT_PORTAL_TYPE;
	}
	function isProfiler(object) {
	  return typeOf(object) === REACT_PROFILER_TYPE;
	}
	function isStrictMode(object) {
	  return typeOf(object) === REACT_STRICT_MODE_TYPE;
	}
	function isSuspense(object) {
	  return typeOf(object) === REACT_SUSPENSE_TYPE;
	}

	reactIs_development.AsyncMode = AsyncMode;
	reactIs_development.ConcurrentMode = ConcurrentMode;
	reactIs_development.ContextConsumer = ContextConsumer;
	reactIs_development.ContextProvider = ContextProvider;
	reactIs_development.Element = Element;
	reactIs_development.ForwardRef = ForwardRef;
	reactIs_development.Fragment = Fragment;
	reactIs_development.Lazy = Lazy;
	reactIs_development.Memo = Memo;
	reactIs_development.Portal = Portal;
	reactIs_development.Profiler = Profiler;
	reactIs_development.StrictMode = StrictMode;
	reactIs_development.Suspense = Suspense;
	reactIs_development.isAsyncMode = isAsyncMode;
	reactIs_development.isConcurrentMode = isConcurrentMode;
	reactIs_development.isContextConsumer = isContextConsumer;
	reactIs_development.isContextProvider = isContextProvider;
	reactIs_development.isElement = isElement;
	reactIs_development.isForwardRef = isForwardRef;
	reactIs_development.isFragment = isFragment;
	reactIs_development.isLazy = isLazy;
	reactIs_development.isMemo = isMemo;
	reactIs_development.isPortal = isPortal;
	reactIs_development.isProfiler = isProfiler;
	reactIs_development.isStrictMode = isStrictMode;
	reactIs_development.isSuspense = isSuspense;
	reactIs_development.isValidElementType = isValidElementType;
	reactIs_development.typeOf = typeOf;
	  })();
	}
	return reactIs_development;
}

var hasRequiredReactIs;

function requireReactIs () {
	if (hasRequiredReactIs) return reactIs.exports;
	hasRequiredReactIs = 1;

	{
	  reactIs.exports = requireReactIs_development();
	}
	return reactIs.exports;
}

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

var objectAssign;
var hasRequiredObjectAssign;

function requireObjectAssign () {
	if (hasRequiredObjectAssign) return objectAssign;
	hasRequiredObjectAssign = 1;
	/* eslint-disable no-unused-vars */
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (err) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (getOwnPropertySymbols) {
				symbols = getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};
	return objectAssign;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var ReactPropTypesSecret_1;
var hasRequiredReactPropTypesSecret;

function requireReactPropTypesSecret () {
	if (hasRequiredReactPropTypesSecret) return ReactPropTypesSecret_1;
	hasRequiredReactPropTypesSecret = 1;

	var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

	ReactPropTypesSecret_1 = ReactPropTypesSecret;
	return ReactPropTypesSecret_1;
}

var has;
var hasRequiredHas;

function requireHas () {
	if (hasRequiredHas) return has;
	hasRequiredHas = 1;
	has = Function.call.bind(Object.prototype.hasOwnProperty);
	return has;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var checkPropTypes_1;
var hasRequiredCheckPropTypes;

function requireCheckPropTypes () {
	if (hasRequiredCheckPropTypes) return checkPropTypes_1;
	hasRequiredCheckPropTypes = 1;

	var printWarning = function() {};

	{
	  var ReactPropTypesSecret = requireReactPropTypesSecret();
	  var loggedTypeFailures = {};
	  var has = requireHas();

	  printWarning = function(text) {
	    var message = 'Warning: ' + text;
	    if (typeof console !== 'undefined') {
	      console.error(message);
	    }
	    try {
	      // --- Welcome to debugging React ---
	      // This error was thrown as a convenience so that you can use this stack
	      // to find the callsite that caused this warning to fire.
	      throw new Error(message);
	    } catch (x) { /**/ }
	  };
	}

	/**
	 * Assert that the values match with the type specs.
	 * Error messages are memorized and will only be shown once.
	 *
	 * @param {object} typeSpecs Map of name to a ReactPropType
	 * @param {object} values Runtime values that need to be type-checked
	 * @param {string} location e.g. "prop", "context", "child context"
	 * @param {string} componentName Name of the component for error messages.
	 * @param {?Function} getStack Returns the component stack.
	 * @private
	 */
	function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
	  {
	    for (var typeSpecName in typeSpecs) {
	      if (has(typeSpecs, typeSpecName)) {
	        var error;
	        // Prop type validation may throw. In case they do, we don't want to
	        // fail the render phase where it didn't fail before. So we log it.
	        // After these have been cleaned up, we'll let them throw.
	        try {
	          // This is intentionally an invariant that gets caught. It's the same
	          // behavior as without this statement except with a better message.
	          if (typeof typeSpecs[typeSpecName] !== 'function') {
	            var err = Error(
	              (componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' +
	              'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' +
	              'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.'
	            );
	            err.name = 'Invariant Violation';
	            throw err;
	          }
	          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
	        } catch (ex) {
	          error = ex;
	        }
	        if (error && !(error instanceof Error)) {
	          printWarning(
	            (componentName || 'React class') + ': type specification of ' +
	            location + ' `' + typeSpecName + '` is invalid; the type checker ' +
	            'function must return `null` or an `Error` but returned a ' + typeof error + '. ' +
	            'You may have forgotten to pass an argument to the type checker ' +
	            'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
	            'shape all require an argument).'
	          );
	        }
	        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
	          // Only monitor this failure once because there tends to be a lot of the
	          // same error.
	          loggedTypeFailures[error.message] = true;

	          var stack = getStack ? getStack() : '';

	          printWarning(
	            'Failed ' + location + ' type: ' + error.message + (stack != null ? stack : '')
	          );
	        }
	      }
	    }
	  }
	}

	/**
	 * Resets warning cache when testing.
	 *
	 * @private
	 */
	checkPropTypes.resetWarningCache = function() {
	  {
	    loggedTypeFailures = {};
	  }
	};

	checkPropTypes_1 = checkPropTypes;
	return checkPropTypes_1;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var factoryWithTypeCheckers;
var hasRequiredFactoryWithTypeCheckers;

function requireFactoryWithTypeCheckers () {
	if (hasRequiredFactoryWithTypeCheckers) return factoryWithTypeCheckers;
	hasRequiredFactoryWithTypeCheckers = 1;

	var ReactIs = requireReactIs();
	var assign = requireObjectAssign();

	var ReactPropTypesSecret = requireReactPropTypesSecret();
	var has = requireHas();
	var checkPropTypes = requireCheckPropTypes();

	var printWarning = function() {};

	{
	  printWarning = function(text) {
	    var message = 'Warning: ' + text;
	    if (typeof console !== 'undefined') {
	      console.error(message);
	    }
	    try {
	      // --- Welcome to debugging React ---
	      // This error was thrown as a convenience so that you can use this stack
	      // to find the callsite that caused this warning to fire.
	      throw new Error(message);
	    } catch (x) {}
	  };
	}

	function emptyFunctionThatReturnsNull() {
	  return null;
	}

	factoryWithTypeCheckers = function(isValidElement, throwOnDirectAccess) {
	  /* global Symbol */
	  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
	  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

	  /**
	   * Returns the iterator method function contained on the iterable object.
	   *
	   * Be sure to invoke the function with the iterable as context:
	   *
	   *     var iteratorFn = getIteratorFn(myIterable);
	   *     if (iteratorFn) {
	   *       var iterator = iteratorFn.call(myIterable);
	   *       ...
	   *     }
	   *
	   * @param {?object} maybeIterable
	   * @return {?function}
	   */
	  function getIteratorFn(maybeIterable) {
	    var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
	    if (typeof iteratorFn === 'function') {
	      return iteratorFn;
	    }
	  }

	  /**
	   * Collection of methods that allow declaration and validation of props that are
	   * supplied to React components. Example usage:
	   *
	   *   var Props = require('ReactPropTypes');
	   *   var MyArticle = React.createClass({
	   *     propTypes: {
	   *       // An optional string prop named "description".
	   *       description: Props.string,
	   *
	   *       // A required enum prop named "category".
	   *       category: Props.oneOf(['News','Photos']).isRequired,
	   *
	   *       // A prop named "dialog" that requires an instance of Dialog.
	   *       dialog: Props.instanceOf(Dialog).isRequired
	   *     },
	   *     render: function() { ... }
	   *   });
	   *
	   * A more formal specification of how these methods are used:
	   *
	   *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
	   *   decl := ReactPropTypes.{type}(.isRequired)?
	   *
	   * Each and every declaration produces a function with the same signature. This
	   * allows the creation of custom validation functions. For example:
	   *
	   *  var MyLink = React.createClass({
	   *    propTypes: {
	   *      // An optional string or URI prop named "href".
	   *      href: function(props, propName, componentName) {
	   *        var propValue = props[propName];
	   *        if (propValue != null && typeof propValue !== 'string' &&
	   *            !(propValue instanceof URI)) {
	   *          return new Error(
	   *            'Expected a string or an URI for ' + propName + ' in ' +
	   *            componentName
	   *          );
	   *        }
	   *      }
	   *    },
	   *    render: function() {...}
	   *  });
	   *
	   * @internal
	   */

	  var ANONYMOUS = '<<anonymous>>';

	  // Important!
	  // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
	  var ReactPropTypes = {
	    array: createPrimitiveTypeChecker('array'),
	    bigint: createPrimitiveTypeChecker('bigint'),
	    bool: createPrimitiveTypeChecker('boolean'),
	    func: createPrimitiveTypeChecker('function'),
	    number: createPrimitiveTypeChecker('number'),
	    object: createPrimitiveTypeChecker('object'),
	    string: createPrimitiveTypeChecker('string'),
	    symbol: createPrimitiveTypeChecker('symbol'),

	    any: createAnyTypeChecker(),
	    arrayOf: createArrayOfTypeChecker,
	    element: createElementTypeChecker(),
	    elementType: createElementTypeTypeChecker(),
	    instanceOf: createInstanceTypeChecker,
	    node: createNodeChecker(),
	    objectOf: createObjectOfTypeChecker,
	    oneOf: createEnumTypeChecker,
	    oneOfType: createUnionTypeChecker,
	    shape: createShapeTypeChecker,
	    exact: createStrictShapeTypeChecker,
	  };

	  /**
	   * inlined Object.is polyfill to avoid requiring consumers ship their own
	   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
	   */
	  /*eslint-disable no-self-compare*/
	  function is(x, y) {
	    // SameValue algorithm
	    if (x === y) {
	      // Steps 1-5, 7-10
	      // Steps 6.b-6.e: +0 != -0
	      return x !== 0 || 1 / x === 1 / y;
	    } else {
	      // Step 6.a: NaN == NaN
	      return x !== x && y !== y;
	    }
	  }
	  /*eslint-enable no-self-compare*/

	  /**
	   * We use an Error-like object for backward compatibility as people may call
	   * PropTypes directly and inspect their output. However, we don't use real
	   * Errors anymore. We don't inspect their stack anyway, and creating them
	   * is prohibitively expensive if they are created too often, such as what
	   * happens in oneOfType() for any type before the one that matched.
	   */
	  function PropTypeError(message, data) {
	    this.message = message;
	    this.data = data && typeof data === 'object' ? data: {};
	    this.stack = '';
	  }
	  // Make `instanceof Error` still work for returned errors.
	  PropTypeError.prototype = Error.prototype;

	  function createChainableTypeChecker(validate) {
	    {
	      var manualPropTypeCallCache = {};
	      var manualPropTypeWarningCount = 0;
	    }
	    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
	      componentName = componentName || ANONYMOUS;
	      propFullName = propFullName || propName;

	      if (secret !== ReactPropTypesSecret) {
	        if (throwOnDirectAccess) {
	          // New behavior only for users of `prop-types` package
	          var err = new Error(
	            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
	            'Use `PropTypes.checkPropTypes()` to call them. ' +
	            'Read more at http://fb.me/use-check-prop-types'
	          );
	          err.name = 'Invariant Violation';
	          throw err;
	        } else if (typeof console !== 'undefined') {
	          // Old behavior for people using React.PropTypes
	          var cacheKey = componentName + ':' + propName;
	          if (
	            !manualPropTypeCallCache[cacheKey] &&
	            // Avoid spamming the console because they are often not actionable except for lib authors
	            manualPropTypeWarningCount < 3
	          ) {
	            printWarning(
	              'You are manually calling a React.PropTypes validation ' +
	              'function for the `' + propFullName + '` prop on `' + componentName + '`. This is deprecated ' +
	              'and will throw in the standalone `prop-types` package. ' +
	              'You may be seeing this warning due to a third-party PropTypes ' +
	              'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.'
	            );
	            manualPropTypeCallCache[cacheKey] = true;
	            manualPropTypeWarningCount++;
	          }
	        }
	      }
	      if (props[propName] == null) {
	        if (isRequired) {
	          if (props[propName] === null) {
	            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
	          }
	          return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
	        }
	        return null;
	      } else {
	        return validate(props, propName, componentName, location, propFullName);
	      }
	    }

	    var chainedCheckType = checkType.bind(null, false);
	    chainedCheckType.isRequired = checkType.bind(null, true);

	    return chainedCheckType;
	  }

	  function createPrimitiveTypeChecker(expectedType) {
	    function validate(props, propName, componentName, location, propFullName, secret) {
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== expectedType) {
	        // `propValue` being instance of, say, date/regexp, pass the 'object'
	        // check, but we can offer a more precise error message here rather than
	        // 'of type `object`'.
	        var preciseType = getPreciseType(propValue);

	        return new PropTypeError(
	          'Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'),
	          {expectedType: expectedType}
	        );
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createAnyTypeChecker() {
	    return createChainableTypeChecker(emptyFunctionThatReturnsNull);
	  }

	  function createArrayOfTypeChecker(typeChecker) {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (typeof typeChecker !== 'function') {
	        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
	      }
	      var propValue = props[propName];
	      if (!Array.isArray(propValue)) {
	        var propType = getPropType(propValue);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
	      }
	      for (var i = 0; i < propValue.length; i++) {
	        var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
	        if (error instanceof Error) {
	          return error;
	        }
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createElementTypeChecker() {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      if (!isValidElement(propValue)) {
	        var propType = getPropType(propValue);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createElementTypeTypeChecker() {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      if (!ReactIs.isValidElementType(propValue)) {
	        var propType = getPropType(propValue);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement type.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createInstanceTypeChecker(expectedClass) {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (!(props[propName] instanceof expectedClass)) {
	        var expectedClassName = expectedClass.name || ANONYMOUS;
	        var actualClassName = getClassName(props[propName]);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createEnumTypeChecker(expectedValues) {
	    if (!Array.isArray(expectedValues)) {
	      {
	        if (arguments.length > 1) {
	          printWarning(
	            'Invalid arguments supplied to oneOf, expected an array, got ' + arguments.length + ' arguments. ' +
	            'A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z]).'
	          );
	        } else {
	          printWarning('Invalid argument supplied to oneOf, expected an array.');
	        }
	      }
	      return emptyFunctionThatReturnsNull;
	    }

	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      for (var i = 0; i < expectedValues.length; i++) {
	        if (is(propValue, expectedValues[i])) {
	          return null;
	        }
	      }

	      var valuesString = JSON.stringify(expectedValues, function replacer(key, value) {
	        var type = getPreciseType(value);
	        if (type === 'symbol') {
	          return String(value);
	        }
	        return value;
	      });
	      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + String(propValue) + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createObjectOfTypeChecker(typeChecker) {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (typeof typeChecker !== 'function') {
	        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
	      }
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== 'object') {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
	      }
	      for (var key in propValue) {
	        if (has(propValue, key)) {
	          var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
	          if (error instanceof Error) {
	            return error;
	          }
	        }
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createUnionTypeChecker(arrayOfTypeCheckers) {
	    if (!Array.isArray(arrayOfTypeCheckers)) {
	      printWarning('Invalid argument supplied to oneOfType, expected an instance of array.') ;
	      return emptyFunctionThatReturnsNull;
	    }

	    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
	      var checker = arrayOfTypeCheckers[i];
	      if (typeof checker !== 'function') {
	        printWarning(
	          'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
	          'received ' + getPostfixForTypeWarning(checker) + ' at index ' + i + '.'
	        );
	        return emptyFunctionThatReturnsNull;
	      }
	    }

	    function validate(props, propName, componentName, location, propFullName) {
	      var expectedTypes = [];
	      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
	        var checker = arrayOfTypeCheckers[i];
	        var checkerResult = checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret);
	        if (checkerResult == null) {
	          return null;
	        }
	        if (checkerResult.data && has(checkerResult.data, 'expectedType')) {
	          expectedTypes.push(checkerResult.data.expectedType);
	        }
	      }
	      var expectedTypesMessage = (expectedTypes.length > 0) ? ', expected one of type [' + expectedTypes.join(', ') + ']': '';
	      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`' + expectedTypesMessage + '.'));
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createNodeChecker() {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (!isNode(props[propName])) {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function invalidValidatorError(componentName, location, propFullName, key, type) {
	    return new PropTypeError(
	      (componentName || 'React class') + ': ' + location + ' type `' + propFullName + '.' + key + '` is invalid; ' +
	      'it must be a function, usually from the `prop-types` package, but received `' + type + '`.'
	    );
	  }

	  function createShapeTypeChecker(shapeTypes) {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== 'object') {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
	      }
	      for (var key in shapeTypes) {
	        var checker = shapeTypes[key];
	        if (typeof checker !== 'function') {
	          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
	        }
	        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
	        if (error) {
	          return error;
	        }
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createStrictShapeTypeChecker(shapeTypes) {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== 'object') {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
	      }
	      // We need to check all keys in case some are required but missing from props.
	      var allKeys = assign({}, props[propName], shapeTypes);
	      for (var key in allKeys) {
	        var checker = shapeTypes[key];
	        if (has(shapeTypes, key) && typeof checker !== 'function') {
	          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
	        }
	        if (!checker) {
	          return new PropTypeError(
	            'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
	            '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
	            '\nValid keys: ' + JSON.stringify(Object.keys(shapeTypes), null, '  ')
	          );
	        }
	        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
	        if (error) {
	          return error;
	        }
	      }
	      return null;
	    }

	    return createChainableTypeChecker(validate);
	  }

	  function isNode(propValue) {
	    switch (typeof propValue) {
	      case 'number':
	      case 'string':
	      case 'undefined':
	        return true;
	      case 'boolean':
	        return !propValue;
	      case 'object':
	        if (Array.isArray(propValue)) {
	          return propValue.every(isNode);
	        }
	        if (propValue === null || isValidElement(propValue)) {
	          return true;
	        }

	        var iteratorFn = getIteratorFn(propValue);
	        if (iteratorFn) {
	          var iterator = iteratorFn.call(propValue);
	          var step;
	          if (iteratorFn !== propValue.entries) {
	            while (!(step = iterator.next()).done) {
	              if (!isNode(step.value)) {
	                return false;
	              }
	            }
	          } else {
	            // Iterator will provide entry [k,v] tuples rather than values.
	            while (!(step = iterator.next()).done) {
	              var entry = step.value;
	              if (entry) {
	                if (!isNode(entry[1])) {
	                  return false;
	                }
	              }
	            }
	          }
	        } else {
	          return false;
	        }

	        return true;
	      default:
	        return false;
	    }
	  }

	  function isSymbol(propType, propValue) {
	    // Native Symbol.
	    if (propType === 'symbol') {
	      return true;
	    }

	    // falsy value can't be a Symbol
	    if (!propValue) {
	      return false;
	    }

	    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
	    if (propValue['@@toStringTag'] === 'Symbol') {
	      return true;
	    }

	    // Fallback for non-spec compliant Symbols which are polyfilled.
	    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
	      return true;
	    }

	    return false;
	  }

	  // Equivalent of `typeof` but with special handling for array and regexp.
	  function getPropType(propValue) {
	    var propType = typeof propValue;
	    if (Array.isArray(propValue)) {
	      return 'array';
	    }
	    if (propValue instanceof RegExp) {
	      // Old webkits (at least until Android 4.0) return 'function' rather than
	      // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
	      // passes PropTypes.object.
	      return 'object';
	    }
	    if (isSymbol(propType, propValue)) {
	      return 'symbol';
	    }
	    return propType;
	  }

	  // This handles more types than `getPropType`. Only used for error messages.
	  // See `createPrimitiveTypeChecker`.
	  function getPreciseType(propValue) {
	    if (typeof propValue === 'undefined' || propValue === null) {
	      return '' + propValue;
	    }
	    var propType = getPropType(propValue);
	    if (propType === 'object') {
	      if (propValue instanceof Date) {
	        return 'date';
	      } else if (propValue instanceof RegExp) {
	        return 'regexp';
	      }
	    }
	    return propType;
	  }

	  // Returns a string that is postfixed to a warning about an invalid type.
	  // For example, "undefined" or "of type array"
	  function getPostfixForTypeWarning(value) {
	    var type = getPreciseType(value);
	    switch (type) {
	      case 'array':
	      case 'object':
	        return 'an ' + type;
	      case 'boolean':
	      case 'date':
	      case 'regexp':
	        return 'a ' + type;
	      default:
	        return type;
	    }
	  }

	  // Returns class name of the object, if any.
	  function getClassName(propValue) {
	    if (!propValue.constructor || !propValue.constructor.name) {
	      return ANONYMOUS;
	    }
	    return propValue.constructor.name;
	  }

	  ReactPropTypes.checkPropTypes = checkPropTypes;
	  ReactPropTypes.resetWarningCache = checkPropTypes.resetWarningCache;
	  ReactPropTypes.PropTypes = ReactPropTypes;

	  return ReactPropTypes;
	};
	return factoryWithTypeCheckers;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredPropTypes;

function requirePropTypes () {
	if (hasRequiredPropTypes) return propTypes.exports;
	hasRequiredPropTypes = 1;
	{
	  var ReactIs = requireReactIs();

	  // By explicitly using `prop-types` you are opting into new development behavior.
	  // http://fb.me/prop-types-in-prod
	  var throwOnDirectAccess = true;
	  propTypes.exports = requireFactoryWithTypeCheckers()(ReactIs.isElement, throwOnDirectAccess);
	}
	return propTypes.exports;
}

var Icon=function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n});},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=2)}([function(e,t){e.exports=requirePropTypes();},function(e,t){e.exports=React;},function(e,t,r){r.r(t);var n=r(1),o=r(0),l=function(){return (l=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++)for(var o in t=arguments[r])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)},i=function(e,t){var r={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(r[n]=e[n]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var o=0;for(n=Object.getOwnPropertySymbols(e);o<n.length;o++)t.indexOf(n[o])<0&&Object.prototype.propertyIsEnumerable.call(e,n[o])&&(r[n[o]]=e[n[o]]);}return r},a=0,s=n.forwardRef((function(e,t){var r=e.title,o=void 0===r?null:r,s=e.description,c=void 0===s?null:s,u=e.size,p=void 0===u?null:u,f=e.color,d=void 0===f?"currentColor":f,y=e.horizontal,v=void 0===y?null:y,b=e.vertical,m=void 0===b?null:b,h=e.rotate,g=void 0===h?null:h,O=e.spin,w=void 0===O?null:O,j=e.style,z=void 0===j?{}:j,E=e.children,P=i(e,["title","description","size","color","horizontal","vertical","rotate","spin","style","children"]);a++;var S,x=null!==w&&w,_=n.Children.map(E,(function(e){var t=e;!0!==x&&(x=!0===(null===w?t.props.spin:w));var r=t.props.size;"number"==typeof p&&"number"==typeof t.props.size&&(r=t.props.size/p);var o={size:r,color:null===d?t.props.color:d,horizontal:null===v?t.props.horizontal:v,vertical:null===m?t.props.vertical:m,rotate:null===g?t.props.rotate:g,spin:null===w?t.props.spin:w,inStack:!0};return n.cloneElement(t,o)}));null!==p&&(z.width="string"==typeof p?p:1.5*p+"rem");var k,T="stack_labelledby_"+a,q="stack_describedby_"+a;if(o)S=c?T+" "+q:T;else if(k="presentation",c)throw new Error("title attribute required when description is set");return n.createElement("svg",l({ref:t,viewBox:"0 0 24 24",style:z,role:k,"aria-labelledby":S},P),o&&n.createElement("title",{id:T},o),c&&n.createElement("desc",{id:q},c),x&&n.createElement("style",null,"@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }","@keyframes spin-inverse { from { transform: rotate(0deg) } to { transform: rotate(-360deg) } }"),_)}));s.displayName="Stack",s.propTypes={size:o.oneOfType([o.number,o.string]),color:o.string,horizontal:o.bool,vertical:o.bool,rotate:o.number,spin:o.oneOfType([o.bool,o.number]),children:o.oneOfType([o.arrayOf(o.node),o.node]).isRequired,className:o.string,style:o.object},s.defaultProps={size:null,color:null,horizontal:null,vertical:null,rotate:null,spin:null};var c=s;r.d(t,"Icon",(function(){return d})),r.d(t,"Stack",(function(){return c}));var u=function(){return (u=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++)for(var o in t=arguments[r])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)},p=function(e,t){var r={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(r[n]=e[n]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var o=0;for(n=Object.getOwnPropertySymbols(e);o<n.length;o++)t.indexOf(n[o])<0&&Object.prototype.propertyIsEnumerable.call(e,n[o])&&(r[n[o]]=e[n[o]]);}return r},f=0,d=n.forwardRef((function(e,t){var r=e.path,o=e.id,l=void 0===o?++f:o,i=e.title,a=void 0===i?null:i,s=e.description,c=void 0===s?null:s,d=e.size,y=void 0===d?null:d,v=e.color,b=void 0===v?"currentColor":v,m=e.horizontal,h=void 0!==m&&m,g=e.vertical,O=void 0!==g&&g,w=e.rotate,j=void 0===w?0:w,z=e.spin,E=void 0!==z&&z,P=e.style,S=void 0===P?{}:P,x=e.inStack,_=void 0!==x&&x,k=p(e,["path","id","title","description","size","color","horizontal","vertical","rotate","spin","style","inStack"]),T={},q=[];null!==y&&(_?q.push("scale("+y+")"):(S.width="string"==typeof y?y:1.5*y+"rem",S.height=S.width)),h&&q.push("scaleX(-1)"),O&&q.push("scaleY(-1)"),0!==j&&q.push("rotate("+j+"deg)"),null!==b&&(T.fill=b);var M=n.createElement("path",u({d:r,style:T},_?k:{})),C=M;q.length>0&&(S.transform=q.join(" "),S.transformOrigin="center",_&&(C=n.createElement("g",{style:S},M,n.createElement("rect",{width:"24",height:"24",fill:"transparent"}))));var I,N=C,R=!0===E||"number"!=typeof E?2:E,B=!_&&(h||O);if(R<0&&(B=!B),E&&(N=n.createElement("g",{style:{animation:"spin"+(B?"-inverse":"")+" linear "+Math.abs(R)+"s infinite",transformOrigin:"center"}},C,!(h||O||0!==j)&&n.createElement("rect",{width:"24",height:"24",fill:"transparent"}))),_)return N;var X,Y="icon_labelledby_"+l,A="icon_describedby_"+l;if(a)I=c?Y+" "+A:Y;else if(X="presentation",c)throw new Error("title attribute required when description is set");return n.createElement("svg",u({ref:t,viewBox:"0 0 24 24",style:S,role:X,"aria-labelledby":I},k),a&&n.createElement("title",{id:Y},a),c&&n.createElement("desc",{id:A},c),!_&&E&&(B?n.createElement("style",null,"@keyframes spin-inverse { from { transform: rotate(0deg) } to { transform: rotate(-360deg) } }"):n.createElement("style",null,"@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }")),N)}));d.displayName="Icon",d.propTypes={path:o.string.isRequired,size:o.oneOfType([o.number,o.string]),color:o.string,horizontal:o.bool,vertical:o.bool,rotate:o.number,spin:o.oneOfType([o.bool,o.number]),style:o.object,inStack:o.bool,className:o.string},d.defaultProps={size:null,color:"currentColor",horizontal:!1,vertical:!1,rotate:0,spin:!1};t.default=d;}]);


var Icon$1 = /*@__PURE__*/getDefaultExportFromCjs(Icon);

// Material Design Icons v7.3.67
var mdiCursorMove = "M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z";
var mdiGrid = "M10,4V8H14V4H10M16,4V8H20V4H16M16,10V14H20V10H16M16,16V20H20V16H16M14,20V16H10V20H14M8,20V16H4V20H8M8,14V10H4V14H8M8,8V4H4V8H8M10,14H14V10H10V14M4,2H20A2,2 0 0,1 22,4V20A2,2 0 0,1 20,22H4C2.92,22 2,21.1 2,20V4A2,2 0 0,1 4,2Z";
var mdiGridOff = "M0,2.77L1.28,1.5L22.5,22.72L21.23,24L19.23,22H4C2.92,22 2,21.1 2,20V4.77L0,2.77M10,4V7.68L8,5.68V4H6.32L4.32,2H20A2,2 0 0,1 22,4V19.7L20,17.7V16H18.32L16.32,14H20V10H16V13.68L14,11.68V10H12.32L10.32,8H14V4H10M16,4V8H20V4H16M16,20H17.23L16,18.77V20M4,8H5.23L4,6.77V8M10,14H11.23L10,12.77V14M14,20V16.77L13.23,16H10V20H14M8,20V16H4V20H8M8,14V10.77L7.23,10H4V14H8Z";
var mdiLock = "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z";
var mdiLockOpenVariant = "M18 1C15.24 1 13 3.24 13 6V8H4C2.9 8 2 8.89 2 10V20C2 21.11 2.9 22 4 22H16C17.11 22 18 21.11 18 20V10C18 8.9 17.11 8 16 8H15V6C15 4.34 16.34 3 18 3C19.66 3 21 4.34 21 6V8H23V6C23 3.24 20.76 1 18 1M10 13C11.1 13 12 13.89 12 15C12 16.11 11.11 17 10 17C8.9 17 8 16.11 8 15C8 13.9 8.9 13 10 13Z";
var mdiMagnifyMinus = "M9,2A7,7 0 0,1 16,9C16,10.57 15.5,12 14.61,13.19L15.41,14H16L22,20L20,22L14,16V15.41L13.19,14.61C12,15.5 10.57,16 9,16A7,7 0 0,1 2,9A7,7 0 0,1 9,2M5,8V10H13V8H5Z";
var mdiMagnifyPlus = "M9,2A7,7 0 0,1 16,9C16,10.57 15.5,12 14.61,13.19L15.41,14H16L22,20L20,22L14,16V15.41L13.19,14.61C12,15.5 10.57,16 9,16A7,7 0 0,1 2,9A7,7 0 0,1 9,2M8,5V8H5V10H8V13H10V10H13V8H10V5H8Z";
var mdiMagnifyScan = "M17 22V20H20V17H22V20.5C22 20.89 21.84 21.24 21.54 21.54C21.24 21.84 20.89 22 20.5 22H17M7 22H3.5C3.11 22 2.76 21.84 2.46 21.54C2.16 21.24 2 20.89 2 20.5V17H4V20H7V22M17 2H20.5C20.89 2 21.24 2.16 21.54 2.46C21.84 2.76 22 3.11 22 3.5V7H20V4H17V2M7 2V4H4V7H2V3.5C2 3.11 2.16 2.76 2.46 2.46C2.76 2.16 3.11 2 3.5 2H7M10.5 6C13 6 15 8 15 10.5C15 11.38 14.75 12.2 14.31 12.9L17.57 16.16L16.16 17.57L12.9 14.31C12.2 14.75 11.38 15 10.5 15C8 15 6 13 6 10.5C6 8 8 6 10.5 6M10.5 8C9.12 8 8 9.12 8 10.5C8 11.88 9.12 13 10.5 13C11.88 13 13 11.88 13 10.5C13 9.12 11.88 8 10.5 8Z";
var mdiSelectDrag = "M13,17H17V13H19V17H23V19H19V23H17V19H13V17M11,17V19H9V17H11M7,17V19H5V17H7M19,9V11H17V9H19M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7M7,13V15H5V13H7M7,9V11H5V9H7Z";
var mdiSetCenter = "M9,5A7,7 0 0,0 2,12A7,7 0 0,0 9,19C10.04,19 11.06,18.76 12,18.32C12.94,18.76 13.96,19 15,19A7,7 0 0,0 22,12A7,7 0 0,0 15,5C13.96,5 12.94,5.24 12,5.68C11.06,5.24 10.04,5 9,5M9,7C9.34,7 9.67,7.03 10,7.1C8.72,8.41 8,10.17 8,12C8,13.83 8.72,15.59 10,16.89C9.67,16.96 9.34,17 9,17A5,5 0 0,1 4,12A5,5 0 0,1 9,7M15,7A5,5 0 0,1 20,12A5,5 0 0,1 15,17C14.66,17 14.33,16.97 14,16.9C15.28,15.59 16,13.83 16,12C16,10.17 15.28,8.41 14,7.11C14.33,7.04 14.66,7 15,7Z";

const defaultI18n = {
  'contextMenu.search': 'Search',
  'contextMenu.add': 'Add {nodeType}',
  'contextMenu.removeThisNode': 'Remove this node',
  'contextMenu.removeSelectedNodes': 'Remove selected nodes',
  'contextMenu.cloneThisNode': 'Clone this node',
  'contextMenu.removeThisConnection': 'Remove this connection'
};
function Screen({
  portTypes,
  nodeTypes,
  onChangeState,
  initialState,
  i18n = defaultI18n
}) {
  var _position$x, _position$y, _state$scale, _state$position$x, _state$position$y;
  const {
    currentTheme
  } = useTheme();
  const PORT_SIZE = 20;
  const style = {
    '--port-size': `${PORT_SIZE}px`,
    '--color-primary': currentTheme.colors.primary,
    '--color-secondary': currentTheme.colors.secondary,
    '--color-bg': currentTheme.colors.background,
    '--color-text': currentTheme.colors.text,
    '--color-hover': currentTheme.colors.hover,
    '--roundness': currentTheme.roundness
  };
  const {
    dragInfo
  } = useDragContext();
  const {
    position,
    setPosition,
    scale,
    setScale
  } = useScreenContext();
  const [dstDragPosition, setDstDragPosition] = useState({
    x: 0,
    y: 0
  });
  const [pointerPosition, setPointerPosition] = useState({
    x: 0,
    y: 0
  });
  const [state, setState] = useState(initialState);
  const [shouldNotify, setShouldNotify] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectStartPoint, setSelectStartPoint] = useState({
    x: 0,
    y: 0
  });
  const [selectEndPoint, setSelectEndPoint] = useState({
    x: 0,
    y: 0
  });
  useState({
    x: 0,
    y: 0
  });
  const debounceEvent = useCallback((fn, wait = 200, time) => (...args) => clearTimeout(time, time = setTimeout(() => fn(...args), wait)), []);
  useEffect(() => {
    if (!initialState) return;
    setScale(initialState.scale);
    setPosition(initialState.position);
  }, []);
  const setStateAndNotify = useCallback(cb => {
    setState(prev => {
      const newState = cb(prev);
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
  const screenRef = useRef();
  const contRect = screenRef.current?.getBoundingClientRect();
  const wrapperRef = useRef();
  useEffect(() => {
    const srr = screenRef.current;
    if (!srr) return;
    const focusHandler = () => {};
    const keyHandler = e => {
      const inside = screenRef.current === document.activeElement;
      if (!inside) return;
      switch (e.key.toLowerCase()) {
        case 'delete':
        case 'backspace':
          console.log('delete');

          //delete selected nodes
          removeNodes(selectedNodes);
          break;
        case 'escape':
          console.log('escape');
          setSelectedNodes([]);
          break;
      }
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            console.log('select all');
            e.preventDefault();
            e.stopPropagation();

            //select all nodes
            setSelectedNodes(Object.keys(state.nodes));
            break;
          case 'c':
            console.log('copy');
            e.preventDefault();
            e.stopPropagation();

            //copy selected to clipboard
            const _selectedNodes = {};
            for (const nodeId of selectedNodes) {
              _selectedNodes[nodeId] = state.nodes[nodeId];
            }
            console.log('selected', _selectedNodes);
            const data = JSON.stringify(_selectedNodes);
            navigator.clipboard.writeText(data);
            break;
          case 'v':
            console.log('paste');
            //paste from clipboard

            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.readText().then(data => {
              console.log('clipboard', data);
              try {
                const _nodes = JSON.parse(data);
                console.log('clipboard', _nodes);

                // validate nodes
                const jsonNodes = Object.values(_nodes).filter(node => !node.root);
                let valid = true;
                for (const node of jsonNodes) {
                  if (!nodeTypes[node.type]) {
                    console.log('invalid node type', node.type);
                    valid = false;
                    break;
                  }
                  if (!node.position) {
                    console.log('invalid node position', node.position);
                    valid = false;
                    break;
                  }
                  if (!node.connections?.inputs || !node.connections?.outputs) {
                    console.log('invalid node connections', node.connections);
                    valid = false;
                    break;
                  }
                }
                if (!valid) return;

                // find node with minimum x position from nodes
                const nodeWithMinX = jsonNodes.reduce((acc, node) => {
                  var _acc$position$x;
                  if (node.position.x < ((_acc$position$x = acc?.position?.x) !== null && _acc$position$x !== void 0 ? _acc$position$x : Number.POSITIVE_INFINITY)) return node;
                  return acc;
                }, null);
                const delta = {
                  x: nodeWithMinX.position.x,
                  y: nodeWithMinX.position.y
                };
                const {
                  x,
                  y
                } = screenRef.current.getBoundingClientRect();
                const pos = {
                  x: (pointerPosition.x - x - position.x) / scale,
                  y: (pointerPosition.y - y - position.y) / scale
                };
                console.log('positioning', pointerPosition, x, y, position);
                const nodes = jsonNodes.map(node => ({
                  ...node,
                  id: nanoid(),
                  position: {
                    x: node.position.x - delta.x + pos.x,
                    y: node.position.y - delta.y + pos.y
                  },
                  connections: {
                    inputs: [],
                    outputs: []
                  }
                }));
                setStateAndNotify(prev => ({
                  ...prev,
                  nodes: {
                    ...prev.nodes,
                    ...nodes.reduce((acc, node) => {
                      acc[node.id] = node;
                      return acc;
                    }, {})
                  }
                }));
                setSelectedNodes(nodes.map(n => n.id));
              } catch (err) {
                console.log('invalid clipboard data', err);
              }
            });
            break;
        }
      }
    };
    srr.addEventListener('focus', focusHandler);
    srr.addEventListener('blur', focusHandler);
    srr.addEventListener('keydown', keyHandler);
    return () => {
      srr.removeEventListener('focus', focusHandler);
      srr.removeEventListener('blur', focusHandler);
      srr.removeEventListener('keydown', keyHandler);
    };
  }, [screenRef.current, selectedNodes, state, position, scale, pointerPosition]);
  const handleMouseDown = useCallback(event => {
    // event.preventDefault();
    event.stopPropagation();
    const startX = event.pageX + window.scrollX;
    const startY = event.pageY + window.scrollY;

    // if (selectMode) {
    const pos = {
      x: startX,
      y: startY
    };
    setSelectStartPoint(pos);
    setSelectEndPoint(pos);

    // }

    const handleMouseMove = event => {
      const dx = event.pageX + window.scrollX;
      const dy = event.pageY + window.scrollY;

      // if (selectMode) {
      setSelectEndPoint({
        x: dx,
        y: dy
      });
      // } else {
      // onChangePosition({ x: nodePosition.x + dx / screenScale, y: nodePosition.y + dy / screenScale });
      // }
    };

    const handleMouseUp = e => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      const dx = e.pageX + window.scrollX;
      const dy = e.pageY + window.scrollY;
      if (Math.abs(dx) >= 2 && Math.abs(dy) >= 2) {
        // if (selectMode) {
        const _posEnd = {
          x: dx,
          y: dy
        };
        setSelectEndPoint(_posEnd);

        // find all nodes in the selection, save the ids in selectedNodes
        const _selectedNodes = [];
        const nodes = Object.values(state.nodes);
        nodes.forEach(node => {
          console.log("picking", node.id);
          const {
            x,
            y,
            width,
            height
          } = document.getElementById(`card-${node.id}`).getBoundingClientRect();
          //detect if node is inside selection
          const p1 = {
            x: Math.min(pos.x, _posEnd.x),
            y: Math.min(pos.y, _posEnd.y)
          };
          const p2 = {
            x: Math.max(pos.x, _posEnd.x),
            y: Math.max(pos.y, _posEnd.y)
          };
          if (x > p1.x && x + width < p2.x && y > p1.y && y + height < p2.y) {
            _selectedNodes.push(node.id);
          }
        });
        console.log('selectedNodes', _selectedNodes);
        setSelectedNodes(_selectedNodes);
        // } else {
        //   onDragEnd?.({ x: nodePosition.x + dx / screenScale, y: nodePosition.y + dy / screenScale });
        // }
      }

      setSelectStartPoint({
        x: 0,
        y: 0
      });
      setSelectEndPoint({
        x: 0,
        y: 0
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [position, scale, state]);
  useEffect(() => {
    //const { startX, startY } = dragInfo

    const mouseMoveListener = event => {
      setPointerPosition({
        x: event.pageX - window.scrollX,
        y: event.pageY - window.scrollY
      });
    };
    window.addEventListener('mousemove', mouseMoveListener);
    return () => {
      window.removeEventListener('mousemove', mouseMoveListener);
    };
  }, []);
  useEffect(() => {
    if (!dragInfo) {
      setDstDragPosition(null);
      return;
    }

    //const { startX, startY } = dragInfo

    const mouseMoveListener = event => {
      const dx = event.pageX; //- startX
      const dy = event.pageY; //- startY

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
  const addNode = useCallback((nodeType, pos) => {
    const newNode = {
      id: nanoid(),
      name: nodeType.label,
      type: nodeType.type,
      position: pos,
      values: {}
    };
    setStateAndNotify(prev => {
      var _prev$nodes;
      return {
        ...prev,
        nodes: {
          ...((_prev$nodes = prev.nodes) !== null && _prev$nodes !== void 0 ? _prev$nodes : {}),
          [newNode.id]: newNode
        }
      };
    });
  }, [setStateAndNotify]);
  const removeNodes = useCallback(ids => {
    const nodesToRemove = [...ids];
    const nodesToAdd = {};
    for (const nodeId of ids) {
      const node = state.nodes[nodeId];
      if (!node) continue;
      for (const conn of node.connections.outputs) {
        const otherNode = state.nodes[conn.node];
        if (!otherNode || ids.includes(otherNode.id)) continue;
        if (!nodesToRemove.includes(otherNode.id)) nodesToRemove.push(otherNode.id);
        if (!nodesToAdd[otherNode.id]) nodesToAdd[otherNode.id] = {
          ...otherNode
        };
        nodesToAdd[otherNode.id].connections.outputs = [...otherNode.connections.outputs];
        nodesToAdd[otherNode.id].connections.inputs = otherNode.connections.inputs.filter(c => !(c.port === conn.name && c.node === node.id));
      }
      for (const conn of node.connections.inputs) {
        const otherNode = state.nodes[conn.node];
        if (!otherNode || ids.includes(otherNode.id)) continue;
        if (!nodesToRemove.includes(otherNode.id)) nodesToRemove.push(otherNode.id);
        if (!nodesToAdd[otherNode.id]) nodesToAdd[otherNode.id] = {
          ...otherNode
        };
        nodesToAdd[otherNode.id].connections.outputs = otherNode.connections.outputs.filter(c => !(c.port === conn.name && c.node === node.id));
        nodesToAdd[otherNode.id].connections.inputs = [...otherNode.connections.inputs];
      }
    }

    // change nodes to object[id]
    setSelectedNodes([]);
    setStateAndNotify(prev => {
      var _prev$nodes2;
      const newNodes = {
        ...((_prev$nodes2 = prev.nodes) !== null && _prev$nodes2 !== void 0 ? _prev$nodes2 : {})
      };
      nodesToRemove.forEach(id => {
        delete newNodes[id];
      });
      Object.values(nodesToAdd).forEach(node => {
        newNodes[node.id] = node;
      });
      return {
        ...prev,
        nodes: newNodes
      };
    });
  }, [state, setStateAndNotify]);
  const cloneNode = useCallback(id => {
    const node = state.nodes[id];
    if (!node) return;
    const newNode = {
      ...node,
      id: nanoid(),
      position: {
        x: node.position.x + 20,
        y: node.position.y + 20
      },
      connections: {
        inputs: [],
        outputs: []
      }
    };
    setStateAndNotify(prev => {
      var _prev$nodes3;
      return {
        ...prev,
        nodes: {
          ...((_prev$nodes3 = prev.nodes) !== null && _prev$nodes3 !== void 0 ? _prev$nodes3 : {}),
          [newNode.id]: newNode
        }
      };
    });
  }, [setStateAndNotify, state]);
  const removeConnectionFromOutput = useCallback((srcNode, srcPort, dstNode, dstPort) => {
    setStateAndNotify(prev => {
      var _prev$nodes4;
      const newNodes = {
        ...((_prev$nodes4 = prev.nodes) !== null && _prev$nodes4 !== void 0 ? _prev$nodes4 : {})
      };
      if (!newNodes[srcNode] || !newNodes[dstNode]) return null;
      newNodes[srcNode] = {
        ...newNodes[srcNode],
        connections: {
          ...newNodes[srcNode].connections,
          outputs: newNodes[srcNode].connections.outputs.filter(conn => !(conn.name === srcPort && conn.node === dstNode && conn.port === dstPort))
        }
      };
      newNodes[dstNode] = {
        ...newNodes[dstNode],
        connections: {
          ...newNodes[dstNode].connections,
          inputs: newNodes[dstNode].connections.inputs.filter(conn => !(conn.name === dstPort && conn.node === srcNode && conn.port === srcPort))
        }
      };
      return {
        ...prev,
        nodes: newNodes
      };
    });
  }, [setStateAndNotify]);
  const [isMoveable, setIsMoveable] = useState(false);
  const [canMove, setCanMove] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const onZoom = useCallback(params => {
    const _scale = params.state.scale;
    setScale(_scale);
    const _position = {
      x: params.state.positionX,
      y: params.state.positionY
    };
    setPosition(_position);
  }, [setPosition, setScale]);
  useCallback(params => {
    setStateAndNotify(prev => {
      const _scale = params.state.scale;
      const _position = {
        x: params.state.positionX,
        y: params.state.positionY
      };
      return {
        ...prev,
        scale: _scale,
        position: _position
      };
    });
  }, [setStateAndNotify]);
  const onTransform = useCallback(params => {
    const _position = {
      x: params.state.positionX,
      y: params.state.positionY
    };
    setPosition(_position);
  }, [setPosition]);
  const onTransformEnd = useCallback(params => {
    const {
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
        return {
          ...prev,
          position: {
            x: px,
            y: py
          },
          scale: s
        };
      });
    }, 200)(positionX, positionY, _scale);
  }, [setPosition, setScale, setStateAndNotify, debounceEvent]);
  const gridSize = 40;
  const scaledGridSize = gridSize * (scale !== null && scale !== void 0 ? scale : 1);
  const scaledPositionX = ((_position$x = position?.x) !== null && _position$x !== void 0 ? _position$x : 0) % scaledGridSize;
  const scaledPositionY = ((_position$y = position?.y) !== null && _position$y !== void 0 ? _position$y : 0) % scaledGridSize;
  const onConnect = useCallback(({
    source,
    target
  }) => {
    setStateAndNotify(prev => {
      if (!prev?.nodes || !Object.keys(prev.nodes).length) return null;
      const item = {
        srcNode: source.nodeId,
        dstNode: target.nodeId,
        srcPort: source.portName,
        dstPort: target.portName
      };
      if (item.srcNode === item.dstNode) return;

      // deep merge
      const srcNode = JSON.parse(JSON.stringify(prev.nodes[item.srcNode]));
      const dstNode = JSON.parse(JSON.stringify(prev.nodes[item.dstNode]));
      const srcPort = nodeTypes[srcNode.type].outputs(srcNode.values).find(p => p.name === item.srcPort);
      const dstPort = nodeTypes[dstNode.type].inputs(dstNode.values).find(p => p.name === item.dstPort);
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
      const nodes = {
        ...prev.nodes,
        [srcNode.id]: srcNode,
        [dstNode.id]: dstNode
      };
      return {
        ...prev,
        nodes
      };
    });
  }, [setStateAndNotify, nodeTypes]);
  const pinchOptions = useMemo(() => ({
    step: 5
  }), []);
  const panningOptions = useMemo(() => ({
    disabled: isMoveable,
    excluded: [nodeCss.node, 'react-draggable', nodePortCss.port, nodePortCss.portConnector]
  }), [isMoveable]);
  const wrapperStyle = useMemo(() => ({
    height: '100vh',
    width: '100vw',
    backgroundColor: currentTheme.colors.background,
    backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
    backgroundImage: `linear-gradient(to right, ${currentTheme.colors.hover} 1px, transparent 1px), linear-gradient(to bottom, ${currentTheme.colors.hover} 1px, transparent 1px)`,
    backgroundPosition: `${scaledPositionX}px ${scaledPositionY}px`
  }), [scaledGridSize, scaledPositionX, scaledPositionY, currentTheme]);
  const nodeTypesByCategory = useMemo(() => {
    const categories = Object.values(nodeTypes).reduce((acc, nodeType) => {
      var _nodeType$category;
      if (nodeType.root) return acc;
      const _category = (_nodeType$category = nodeType.category) !== null && _nodeType$category !== void 0 ? _nodeType$category : '...';
      if (!acc[_category]) acc[_category] = [];
      acc[_category].push(nodeType);
      return acc;
    }, {});
    return Object.entries(categories).map(([category, nodeTypes]) => ({
      category,
      nodeTypes
    }));
  }, [nodeTypes]);
  const wrapperProps = useCallback(handleContextMenu => ({
    onDragOver: e => {
      e.dataTransfer.dropEffect = "move";
      e.dataTransfer.effectAllowed = "move";
    },
    onDragLeave: e => {
      e.preventDefault();
      e.stopPropagation();
    },
    onContextMenu: e => handleContextMenu(e, nodeTypesByCategory.map(({
      category,
      nodeTypes
    }) => ({
      label: category,
      children: nodeTypes.filter(t => !t.root).sort((a, b) => a.label.localeCompare(b.label)).map(nodeType => ({
        label: i(i18n, 'contextMenu.add', {
          nodeType: nodeType.label
        }, 'Add ' + nodeType.label),
        description: nodeType.description,
        onClick: () => {
          const {
            x,
            y
          } = e.target.getBoundingClientRect();
          console.log(position);
          const _position = {
            x: (e.clientX - position.x - x) / scale,
            y: (e.clientY - position.y - y) / scale
          };
          addNode(nodeType, _position);
        }
      }))
    }))),
    onMouseDown: selectMode ? handleMouseDown : null,
    onClick: e => {
      if (e.target === wrapperRef.current.instance.wrapperComponent) screenRef.current.focus({
        preventScroll: true
      });
    }
  }), [state, selectMode, nodeTypesByCategory, addNode, position, scale]);
  const handleValueChange = useCallback((id, values) => {
    setStateAndNotify(prev => {
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [id]: {
            ...prev.nodes[id],
            values
          }
        }
      };
    });
  }, [setStateAndNotify]);
  const handleSnapToGrid = useCallback(() => {
    setSnapToGrid(prev => !prev);
  }, []);
  const handleSelectMode = useCallback(() => {
    setSelectMode(!selectMode);
    if (selectMode) setSelectedNodes([]);
  }, [selectMode]);
  if (!state) return null;
  return /*#__PURE__*/jsx("div", {
    className: css.container,
    style: style,
    ref: screenRef,
    tabIndex: 0,
    children: /*#__PURE__*/jsx(TransformWrapper, {
      initialScale: (_state$scale = state?.scale) !== null && _state$scale !== void 0 ? _state$scale : 1,
      initialPositionX: (_state$position$x = state?.position?.x) !== null && _state$position$x !== void 0 ? _state$position$x : 0,
      initialPositionY: (_state$position$y = state?.position?.y) !== null && _state$position$y !== void 0 ? _state$position$y : 0,
      disabled: isMoveable,
      minScale: .25,
      maxScale: 2,
      limitToBounds: false,
      onPanning: onTransform,
      onZoom: onZoom,
      pinch: pinchOptions,
      panning: panningOptions,
      onTransformed: onTransformEnd,
      ref: wrapperRef,
      children: ({
        zoomIn,
        zoomOut,
        resetTransform,
        setTransform,
        centerView,
        ...rest
      }) => {
        const localStartPoint = contRect ? {
          x: selectStartPoint.x - contRect.left,
          y: selectStartPoint.y - contRect.top
        } : {
          x: 0,
          y: 0
        };
        const localEndPoint = contRect ? {
          x: selectEndPoint.x - contRect.left,
          y: selectEndPoint.y - contRect.top
        } : {
          x: 0,
          y: 0
        };
        return /*#__PURE__*/jsxs(Fragment, {
          children: [localStartPoint.x !== localEndPoint.x && localStartPoint.y !== localEndPoint.y && /*#__PURE__*/jsx("div", {
            style: {
              position: 'absolute',
              transform: `translate(${Math.min(localStartPoint.x, localEndPoint.x)}px, ${Math.min(localStartPoint.y, localEndPoint.y)}px)`,
              width: Math.abs(localEndPoint.x - localStartPoint.x),
              height: Math.abs(localEndPoint.y - localStartPoint.y),
              border: '3px dashed black',
              backgroundColor: 'rgba(0,0,0,0.1)',
              pointerEvents: 'none'
            }
          }), /*#__PURE__*/jsxs("div", {
            className: [css.panel, css.controlsPanelVertical].join(' '),
            children: [/*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: () => zoomIn(),
              children: /*#__PURE__*/jsx(Icon$1, {
                path: mdiMagnifyPlus,
                size: 0.6
              })
            }), /*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: () => zoomOut(),
              children: /*#__PURE__*/jsx(Icon$1, {
                path: mdiMagnifyMinus,
                size: 0.6
              })
            }), /*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: () => {
                centerView();
                setStateAndNotify(prev => ({
                  ...prev,
                  position,
                  scale
                }));
              },
              children: /*#__PURE__*/jsx(Icon$1, {
                path: mdiSetCenter,
                size: 0.6
              })
            }), /*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: () => {
                setTransform(position.x, position.y, 1);
                setScale(1);
                setStateAndNotify(prev => ({
                  ...prev,
                  position,
                  scale: 1
                }));
              },
              children: /*#__PURE__*/jsx(Icon$1, {
                path: mdiMagnifyScan,
                size: 0.6
              })
            }), /*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: () => setCanMove(!canMove),
              children: /*#__PURE__*/jsx(Icon$1, {
                path: canMove ? mdiLockOpenVariant : mdiLock,
                size: 0.6
              })
            })]
          }), /*#__PURE__*/jsxs("div", {
            className: [css.panel, css.controlsPanelHorizontal].join(' '),
            children: [/*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: handleSnapToGrid,
              children: /*#__PURE__*/jsx(Icon$1, {
                path: snapToGrid ? mdiGrid : mdiGridOff,
                size: 0.6
              })
            }), /*#__PURE__*/jsx(Button, {
              className: css.controlButton,
              onClick: handleSelectMode,
              children: /*#__PURE__*/jsx(Icon$1, {
                path: selectMode ? mdiSelectDrag : mdiCursorMove,
                size: 0.6
              })
            })]
          }), /*#__PURE__*/jsxs("div", {
            className: [css.panel, css.statusPanel].join(' '),
            children: [/*#__PURE__*/jsxs("div", {
              children: ["Scale: ", scale]
            }), /*#__PURE__*/jsxs("div", {
              children: ["Position: ", JSON.stringify(position)]
            })]
          }), /*#__PURE__*/jsx(ContextMenu, {
            containerRef: screenRef,
            i18n: i18n,
            children: ({
              handleContextMenu
            }) => /*#__PURE__*/jsxs(TransformComponent, {
              contentClass: "main",
              wrapperStyle: wrapperStyle,
              wrapperProps: wrapperProps(handleContextMenu),
              children: [state?.nodes && Object.values(state.nodes).map((node, index) => {
                const nodeDef = nodeTypes[node.type];
                return /*#__PURE__*/jsxs(Fragment, {
                  children: [/*#__PURE__*/jsx(Node$1, {
                    id: `node_${node.id}`,
                    name: node.name,
                    portTypes: portTypes,
                    nodeType: nodeTypes?.[node.type],
                    value: node,
                    isSelected: selectedNodes.includes(node.id),
                    onValueChange: v => {
                      handleValueChange(node.id, {
                        ...v.values
                      });
                    },
                    onChangePosition: position => {
                      const pos = {
                        ...position
                      };
                      const _selectedNodes = selectedNodes;
                      if (!_selectedNodes.includes(node.id)) _selectedNodes.length = 0;
                      setSelectedNodes(_selectedNodes);
                      setState(prev => ({
                        ...prev,
                        nodes: Object.values(prev.nodes).reduce((acc, n) => {
                          const delta = {
                            x: pos.x - prev.nodes[node.id].position.x,
                            y: pos.y - prev.nodes[node.id].position.y
                          };
                          if (snapToGrid) {
                            pos.x = Math.round(pos.x / gridSize) * gridSize;
                            pos.y = Math.round(pos.y / gridSize) * gridSize;
                            delta.x = pos.x - prev.nodes[node.id].position.x;
                            delta.y = pos.y - prev.nodes[node.id].position.y;
                          }
                          if (n.id === node.id) {
                            acc[n.id] = {
                              ...n,
                              position: pos
                            };
                          } else if (_selectedNodes.includes(n.id)) {
                            acc[n.id] = {
                              ...n,
                              position: {
                                x: n.position.x + delta.x,
                                y: n.position.y + delta.y
                              }
                            };
                          } else {
                            acc[n.id] = n;
                          }
                          return acc;
                        }, {})
                      }));
                    },
                    onDragEnd: position => {
                      const pos = {
                        ...position
                      };
                      const _selectedNodes = selectedNodes;
                      if (!_selectedNodes.includes(node.id)) _selectedNodes.length = 0;
                      setSelectedNodes(_selectedNodes);
                      setStateAndNotify(prev => ({
                        ...prev,
                        nodes: Object.values(prev.nodes).reduce((acc, n) => {
                          const delta = {
                            x: pos.x - prev.nodes[node.id].position.x,
                            y: pos.y - prev.nodes[node.id].position.y
                          };
                          if (snapToGrid) {
                            pos.x = Math.round(pos.x / gridSize) * gridSize;
                            pos.y = Math.round(pos.y / gridSize) * gridSize;
                            delta.x = pos.x - prev.nodes[node.id].position.x;
                            delta.y = pos.y - prev.nodes[node.id].position.y;
                          }
                          if (n.id === node.id) {
                            acc[n.id] = {
                              ...n,
                              position: pos
                            };
                          } else if (_selectedNodes.includes(n.id)) {
                            acc[n.id] = {
                              ...n,
                              position: {
                                x: n.position.x + delta.x,
                                y: n.position.y + delta.y
                              }
                            };
                          } else {
                            acc[n.id] = n;
                          }
                          return acc;
                        }, {})
                      }));
                    },
                    containerRef: screenRef,
                    canMove: canMove,
                    onConnect: onConnect,
                    onContextMenu: e => handleContextMenu(e, [!nodeDef.root ? {
                      label: i(i18n, 'contextMenu.cloneThisNode', {}, 'Clone this node'),
                      onClick: () => {
                        cloneNode(node.id);
                      }
                    } : null, !nodeDef.root ? {
                      label: i(i18n, 'contextMenu.removeThisNode', {}, 'Remove this node'),
                      style: {
                        color: 'red'
                      },
                      onClick: () => {
                        removeNodes([node.id]);
                      }
                    } : null, selectedNodes?.length > 0 ? {
                      label: i(i18n, 'contextMenu.removeSelectedNodes', {}, 'Remove selected nodes'),
                      style: {
                        color: 'red'
                      },
                      onClick: () => {
                        removeNodes(selectedNodes);
                      }
                    } : null]),
                    onResize: size => {
                      // O objetivo aqui é disparar a renderização das conexões.
                      // Se houver um modo melhor, por favor, me avise.
                      setState(prev => {
                        var _prev$nodes$node$id$c;
                        return {
                          ...prev,
                          nodes: {
                            ...prev.nodes,
                            [node.id]: {
                              ...prev.nodes[node.id],
                              size,
                              connections: {
                                ...prev.nodes[node.id].connections,
                                outputs: [...((_prev$nodes$node$id$c = prev.nodes[node.id].connections?.outputs) !== null && _prev$nodes$node$id$c !== void 0 ? _prev$nodes$node$id$c : [])]
                              }
                            }
                          }
                        };
                      });
                    }
                  }, `node_${node.id}`), node.connections?.outputs?.map((connection, index) => {
                    const srcNode = node.id;
                    const srcPort = connection.name;
                    const dstNode = connection.node;
                    const dstPort = connection.port;
                    const connType = connection.type;
                    const srcElem = document.getElementById(`card-${srcNode}-output-${srcPort}`);
                    const dstElem = document.getElementById(`card-${dstNode}-input-${dstPort}`);
                    if (!srcElem || !dstElem || !contRect) {
                      return null;
                    }
                    const srcRect = srcElem.getBoundingClientRect();
                    const dstRect = dstElem.getBoundingClientRect();
                    const srcPos = {
                      x: (srcRect.x - position.x - contRect.left + srcRect.width / 2) / scale,
                      y: (srcRect.y - position.y - contRect.top + srcRect.height / 2) / scale
                    };
                    const dstPos = {
                      x: (dstRect.x - position.x - contRect.left + dstRect.width / 2) / scale,
                      y: (dstRect.y - position.y - contRect.top + dstRect.height / 2) / scale
                    };
                    return /*#__PURE__*/jsx(ConnectorCurve, {
                      type: portTypes[connType],
                      src: srcPos,
                      dst: dstPos,
                      scale: scale,
                      onContextMenu: e => handleContextMenu(e, [canMove ? {
                        label: i(i18n, 'contextMenu.removeThisConnection', {}, 'Remove this connection'),
                        style: {
                          color: 'red'
                        },
                        onClick: () => {
                          removeConnectionFromOutput(srcNode, srcPort, dstNode, dstPort);
                        }
                      } : null].filter(Boolean))
                    }, `connector-${srcNode}-${srcPort}-${dstNode}-${dstPort}`);
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
            })
          })]
        });
      }
    })
  });
}

function NodeContainer({
  theme,
  themes,
  state,
  ...props
}) {
  return /*#__PURE__*/jsx(ScreenContextProvider, {
    initialState: state,
    children: /*#__PURE__*/jsx(DragContextProvider, {
      children: /*#__PURE__*/jsx(Screen, {
        ...props
      })
    })
  });
}

export { NodeContainer, ThemeProvider, useTheme };
//# sourceMappingURL=index.js.map
