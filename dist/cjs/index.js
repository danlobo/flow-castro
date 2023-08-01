'use strict';

var React = require('react');
var jsxRuntime = require('react/jsx-runtime');

const DragContext = /*#__PURE__*/React.createContext(null);
const DragContextProvider = ({
  children
}) => {
  const [dragInfo, setDragInfo] = React.useState(null);
  return /*#__PURE__*/jsxRuntime.jsx(DragContext.Provider, {
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
  } = React.useContext(DragContext);
  return {
    dragInfo,
    setDragInfo
  };
};

const ScreenContext = /*#__PURE__*/React.createContext();
const ScreenContextProvider = ({
  children,
  initialState,
  store
}) => {
  var _initialState$scale, _initialState$positio;
  const [scale, setScale] = React.useState((_initialState$scale = initialState?.scale) !== null && _initialState$scale !== void 0 ? _initialState$scale : 1);
  const [position, setPosition] = React.useState((_initialState$positio = initialState?.position) !== null && _initialState$positio !== void 0 ? _initialState$positio : {
    x: 0,
    y: 0
  });
  return /*#__PURE__*/jsxRuntime.jsx(ScreenContext.Provider, {
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
  } = React.useContext(ScreenContext);
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
    background: '#ffffff',
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
    background: '#222',
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
  const [currentTheme, setCurrentTheme] = React.useState(null);
  const [themeName, setThemeName] = React.useState(theme);
  React.useEffect(() => {
    setCurrentTheme(deepMerge({}, _themes[themeName], themes[themeName], themes.common));
  }, [themeName, themes]);
  React.useEffect(() => {
    setThemeName(theme);
  }, [theme]);
  if (!currentTheme) return null;
  return /*#__PURE__*/jsxRuntime.jsx(ThemeContext.Provider, {
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
  const [internalValue, setInternalValue] = React.useState(value);
  const shapeStyles = React.useMemo(() => ({
    circle: nodePortCss.circle,
    square: nodePortCss.square,
    diamond: nodePortCss.diamond
  }), []);
  React.useEffect(() => {
    if (!name) throw new Error('Port name is required');
  }, [name]);
  React.useEffect(() => {}, [internalValue]);
  React.useEffect(() => {
    if (isConnected) {
      onValueChange?.(null);
    }
  }, [isConnected]);
  const containerRef = React.useRef(null);
  const connectorRef = React.useRef(null);
  React.useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange?.(internalValue);
  }, [internalValue]);
  const connectorRect = React.useRef();
  React.useEffect(() => {
    if (!connectorRef.current) return;
    connectorRect.current = connectorRef.current.getBoundingClientRect();
  }, [connectorRef.current]);
  const containerRect = React.useRef();
  React.useEffect(() => {
    if (!containerRef.current) return;
    containerRect.current = containerRef.current.getBoundingClientRect();
  }, [containerRef.current]);
  const [pointerPos, setPointerPos] = React.useState({
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
  return /*#__PURE__*/jsxRuntime.jsxs("div", {
    ref: containerRef,
    style: {
      cursor: !hidePort && canMove ? 'crosshair' : null
    },
    className: nodePortCss.port,
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
      className: nodePortCss.portOverlay,
      id: `card-${nodeId}-${direction}-${name}-overlay`,
      "data-port-name": name,
      "data-port-type": type.type,
      "data-port-direction": direction,
      "data-node-id": nodeId
    }), /*#__PURE__*/jsxRuntime.jsx("div", {
      className: nodePortCss.label,
      style: {
        justifyContent: direction === 'input' ? 'flex-start' : 'flex-end'
      },
      children: /*#__PURE__*/jsxRuntime.jsx("span", {
        children: label
      })
    }), /*#__PURE__*/jsxRuntime.jsx("div", {
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
    }), !hidePort && /*#__PURE__*/jsxRuntime.jsx("div", {
      id: `card-${nodeId}-${direction}-${name}`,
      ref: connectorRef,
      style: {
        background: (_ref2 = (_currentTheme$ports$c = currentTheme.ports?.[(_type$type = type?.type) !== null && _type$type !== void 0 ? _type$type : 'default']?.color) !== null && _currentTheme$ports$c !== void 0 ? _currentTheme$ports$c : currentTheme.ports?.default?.color) !== null && _ref2 !== void 0 ? _ref2 : currentTheme.colors.background,
        borderColor: isConnected ? currentTheme.colors.hover : currentTheme.colors.text,
        left: direction === 'input' ? 'calc( var(--port-size) * -1 - 4px )' : null,
        right: direction === 'output' ? 'calc( var(--port-size) * -1 - 4px )' : null
      },
      className: [nodePortCss.portConnector, (_shapeStyles = shapeStyles[(_type$shape = type?.shape) !== null && _type$shape !== void 0 ? _type$shape : 'circle']) !== null && _shapeStyles !== void 0 ? _shapeStyles : null].filter(Boolean).join(' ')
    })]
  });
}
var NodePort$1 = /*#__PURE__*/React.memo(NodePort);

var nodeCss = {"node":"Node-module_node__yVhqG","title":"Node-module_title__IkogO","container":"Node-module_container__PfJft","portsContainer":"Node-module_portsContainer__3s5BH","inputPortsContainer":"Node-module_inputPortsContainer__FPkYh","outputPortsContainer":"Node-module_outputPortsContainer__qYiul"};

const Button = ({
  children,
  ...props
}) => {
  const {
    currentTheme
  } = useTheme();
  return /*#__PURE__*/jsxRuntime.jsx("button", {
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
  onChangePosition,
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
  const nodeRef = React.useRef();
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (nodeId == null) throw new Error('Node id is required');
    if (name == null) throw new Error('Node name is required');
    if (name !== nodeName) {
      console.warn('Node name mismatch', name, nodeName);
    }
  }, [name, nodeName, nodeId]);
  const {
    scale: screenScale
  } = useScreenContext();
  const handleMouseDown = React.useCallback(event => {
    if (!canMove) return;

    // event.preventDefault();
    event.stopPropagation();
    const startX = event.pageX;
    const startY = event.pageY;
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
  }, [nodePosition, screenScale, onChangePosition, onDragEnd]);
  const onOutputPortConnected = React.useCallback(({
    source,
    target
  }) => {
    onConnect?.({
      source,
      target
    });
  }, [onConnect]);
  const onInputPortConnected = React.useCallback(({
    source,
    target
  }) => {
    onConnect?.({
      source: target,
      target: source
    });
  }, [onConnect]);
  const nodeInputs = React.useMemo(() => {
    if (typeof nodeType.inputs === 'function') return nodeType.inputs(nodeValues);
    return nodeType.inputs;
  }, [nodeType, nodeValues]);
  const nodeOutputs = React.useMemo(() => {
    if (typeof nodeType.outputs === 'function') return nodeType.outputs(nodeValues);
    return nodeType.outputs;
  }, [nodeType, nodeValues]);
  return /*#__PURE__*/jsxRuntime.jsxs("div", {
    ref: nodeRef,
    id: `card-${name}`,
    className: nodeCss.node,
    style: {
      backgroundColor: (_currentTheme$nodes$n = currentTheme?.nodes?.[nodeType?.type]?.body?.background) !== null && _currentTheme$nodes$n !== void 0 ? _currentTheme$nodes$n : currentTheme?.nodes?.common?.body?.background,
      border: (_currentTheme$nodes$n2 = currentTheme?.nodes?.[nodeType?.type]?.body?.border) !== null && _currentTheme$nodes$n2 !== void 0 ? _currentTheme$nodes$n2 : currentTheme?.nodes?.common?.body?.border,
      color: (_currentTheme$nodes$n3 = currentTheme?.nodes?.[nodeType?.type]?.body?.color) !== null && _currentTheme$nodes$n3 !== void 0 ? _currentTheme$nodes$n3 : currentTheme?.nodes?.common?.body?.color,
      transform: `translate(${nodePosition.x}px, ${nodePosition.y}px)`,
      cursor: canMove ? 'grab' : null
    },
    onMouseDown: handleMouseDown,
    onContextMenu: onContextMenu,
    children: [/*#__PURE__*/jsxRuntime.jsx("div", {
      className: nodeCss.title,
      style: {
        backgroundColor: (_currentTheme$nodes$n4 = currentTheme?.nodes?.[nodeType?.type]?.background) !== null && _currentTheme$nodes$n4 !== void 0 ? _currentTheme$nodes$n4 : currentTheme?.nodes?.common?.title?.background,
        color: (_currentTheme$nodes$n5 = currentTheme?.nodes?.[nodeType?.type]?.color) !== null && _currentTheme$nodes$n5 !== void 0 ? _currentTheme$nodes$n5 : currentTheme?.nodes?.common?.title?.color
      },
      children: /*#__PURE__*/jsxRuntime.jsx("h3", {
        children: name
      })
    }), /*#__PURE__*/jsxRuntime.jsxs("div", {
      className: nodeCss.container,
      children: [/*#__PURE__*/jsxRuntime.jsx("div", {
        className: [nodeCss.portsContainer, nodeCss.inputPortsContainer].join(' '),
        children: nodeInputs?.map(input => {
          return /*#__PURE__*/jsxRuntime.jsx(NodePort$1, {
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
            hidePort: Boolean(input.hidePort),
            containerRef: containerRef,
            isConnected: value.connections?.inputs?.some(c => c.name === input.name),
            onConnected: onInputPortConnected,
            canMove: canMove
          }, input.name);
        })
      }), /*#__PURE__*/jsxRuntime.jsx("div", {
        className: [nodeCss.portsContainer, nodeCss.outputPortsContainer].join(' '),
        children: nodeOutputs?.map(output => {
          return /*#__PURE__*/jsxRuntime.jsx(NodePort$1, {
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
  }, `card-${name}`);
}
var Node$1 = /*#__PURE__*/React.memo(Node);

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
    var _a = React.useState(0), forceUpdate = _a[1];
    var children = props.children;
    var instance = React.useRef(new ZoomPanPinch(props)).current;
    var content = getContent(props.children, getContext(instance));
    var handleOnChange = React.useCallback(function () {
        if (typeof children === "function") {
            forceUpdate(function (prev) { return prev + 1; });
        }
    }, [children]);
    React.useImperativeHandle(ref, function () { return getContext(instance); }, [instance]);
    React.useEffect(function () {
        instance.update(props);
    }, [instance, props]);
    React.useEffect(function () {
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
    var init = React.useContext(Context).init;
    var wrapperRef = React.useRef(null);
    var contentRef = React.useRef(null);
    React.useEffect(function () {
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
    var localRef = React.useRef(null);
    var instance = React.useContext(Context);
    React.useEffect(function () {
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
  return /*#__PURE__*/jsxRuntime.jsx("svg", {
    style: {
      transform: `translate(${Math.min(src.x, dst.x)}px, ${Math.min(src.y, dst.y)}px)`,
      width: Math.abs(dst.x - src.x) + 10,
      height: Math.abs(dst.y - src.y) + 10,
      zIndex: tmp ? 1000 : -1
    },
    className: css$2.container,
    children: /*#__PURE__*/jsxRuntime.jsx("path", {
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

const ContextMenuList = ({
  isFiltered,
  options,
  onSelectOption,
  style
}) => {
  const [activeSubmenu, setActiveSubmenu] = React.useState(null);
  const [activeSubmenuPosition, setActiveSubmenuPosition] = React.useState(null);
  const [submenuDirection, setSubmenuDirection] = React.useState('left');
  const [submenuDirectionVertical, setSubmenuDirectionVertical] = React.useState('top');
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
  return /*#__PURE__*/jsxRuntime.jsx("ul", {
    className: css$1.contextMenu,
    style: style,
    children: options?.filter(isFiltered)?.map((option, index) => {
      if (option.separator === true) return /*#__PURE__*/jsxRuntime.jsx("li", {
        children: /*#__PURE__*/jsxRuntime.jsx("hr", {})
      }, `${option.id}-${index}`);
      return /*#__PURE__*/jsxRuntime.jsxs("li", {
        onClick: () => onSelectOption(option),
        onMouseEnter: e => handleMenuItemMouseEnter(e, option.label),
        onMouseLeave: () => handleMenuItemMouseLeave(),
        children: [/*#__PURE__*/jsxRuntime.jsxs("div", {
          className: css$1.contextMenuItemContainer,
          children: [/*#__PURE__*/jsxRuntime.jsxs("div", {
            className: css$1.contextMenuItemLabelContainer,
            children: [/*#__PURE__*/jsxRuntime.jsx("div", {
              className: css$1.contextMenuItemLabel,
              style: option.style,
              children: option.label
            }), option.description && /*#__PURE__*/jsxRuntime.jsx("div", {
              className: css$1.contextMenuItemDescription,
              children: option.description
            })]
          }), option.children && /*#__PURE__*/jsxRuntime.jsx("div", {
            className: css$1.contextMenuItemSubMenu,
            children: "\u25B6"
          })]
        }), option.children && option.label === activeSubmenu && /*#__PURE__*/jsxRuntime.jsx(ContextMenuList, {
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
  children
}) => {
  useTheme();
  const [position, setPosition] = React.useState({
    x: 0,
    y: 0
  });
  const [options, setOptions] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const menuRef = React.useRef(null);
  const searchRef = React.useRef(null);
  const handleContextMenu = (e, options) => {
    e.preventDefault();
    e.stopPropagation();
    setTimeout(() => searchRef.current?.focus(), 0);
    setOptions(options);
    setPosition({
      x: e.clientX,
      y: e.clientY
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
  React.useEffect(() => {
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
    return false;
  };
  return /*#__PURE__*/jsxRuntime.jsxs(jsxRuntime.Fragment, {
    children: [children({
      handleContextMenu
    }), options?.length ? /*#__PURE__*/jsxRuntime.jsxs("div", {
      ref: menuRef,
      className: css$1.container,
      style: {
        left: position.x,
        top: position.y,
        visibility: options ? 'visible' : 'hidden'
      },
      children: [/*#__PURE__*/jsxRuntime.jsx("input", {
        ref: searchRef,
        type: "text",
        placeholder: "Buscar...",
        autoFocus: true,
        value: search !== null && search !== void 0 ? search : '',
        onChange: e => setSearch(e.target.value)
      }), /*#__PURE__*/jsxRuntime.jsx(ContextMenuList, {
        isFiltered: isFiltered,
        options: options,
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

var css = {"container":"Screen-module_container__zkIN3","panel":"Screen-module_panel__P8WaY","controlsPanel":"Screen-module_controlsPanel__qhiH0","statusPanel":"Screen-module_statusPanel__9lLEm","controlButton":"Screen-module_controlButton__mTn3T"};

function Screen({
  portTypes,
  nodeTypes,
  onChangeState,
  initialState
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
  const [dstDragPosition, setDstDragPosition] = React.useState({
    x: 0,
    y: 0
  });
  const [pointerPosition, setPointerPosition] = React.useState({
    x: 0,
    y: 0
  });
  const [state, setState] = React.useState(initialState);
  const [shouldNotify, setShouldNotify] = React.useState(false);
  const debounceEvent = React.useCallback((fn, wait = 200, time) => (...args) => clearTimeout(time, time = setTimeout(() => fn(...args), wait)), []);
  React.useEffect(() => {
    if (!initialState) return;
    setScale(initialState.scale);
    setPosition(initialState.position);
  }, []);
  const setStateAndNotify = React.useCallback(cb => {
    setState(prev => {
      const newState = cb(prev);
      setShouldNotify(true);
      return newState;
    });
  }, [setState]);
  React.useEffect(() => {
    if (shouldNotify) {
      onChangeState(state);
      setShouldNotify(false);
    }
  }, [state, shouldNotify, onChangeState]);
  React.useEffect(() => {
    if (!dragInfo) {
      setDstDragPosition(null);
      return;
    }

    //const { startX, startY } = dragInfo

    const mouseMoveListener = event => {
      setPointerPosition({
        x: event.pageX - window.scrollX,
        y: event.pageY - window.scrollY
      });
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
  const addNode = React.useCallback((nodeType, pos) => {
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
  const removeNode = React.useCallback(id => {
    const node = state.nodes[id];
    if (!node) return;
    const nodesToRemove = [id];
    const nodesToAdd = [];
    node.connections.outputs?.forEach(conn => {
      const otherNode = state.nodes[conn.node];
      if (!otherNode) return;
      nodesToRemove.push(otherNode.id);
      nodesToAdd.push({
        ...otherNode,
        connections: {
          outputs: otherNode.connections.outputs,
          inputs: otherNode.connections.inputs.filter(c => !(c.port === conn.name && c.node === node.id))
        }
      });
    });
    node.connections.inputs?.forEach(conn => {
      const otherNode = state.nodes[conn.node];
      if (!otherNode) return;
      nodesToRemove.push(otherNode.id);
      nodesToAdd.push({
        ...otherNode,
        connections: {
          outputs: otherNode.connections.outputs.filter(c => !(c.port === conn.name && c.node === node.id)),
          inputs: otherNode.connections.inputs
        }
      });
    });

    // change nodes to object[id]

    setStateAndNotify(prev => {
      var _prev$nodes2;
      const newNodes = {
        ...((_prev$nodes2 = prev.nodes) !== null && _prev$nodes2 !== void 0 ? _prev$nodes2 : {})
      };
      nodesToRemove.forEach(id => {
        delete newNodes[id];
      });
      nodesToAdd.forEach(node => {
        newNodes[node.id] = node;
      });
      return {
        ...prev,
        nodes: newNodes
      };
    });
  }, [state, setStateAndNotify]);
  const cloneNode = React.useCallback(id => {
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
  const removeConnectionFromOutput = React.useCallback((srcNode, srcPort, dstNode, dstPort) => {
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
  const screenRef = React.useRef();
  const [isMoveable, setIsMoveable] = React.useState(false);
  const [canMove, setCanMove] = React.useState(true);
  const onZoom = React.useCallback(params => {
    const _scale = params.state.scale;
    setScale(_scale);
    const _position = {
      x: params.state.positionX,
      y: params.state.positionY
    };
    setPosition(_position);
  }, [setPosition, setScale]);
  React.useCallback(params => {
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
  const onTransform = React.useCallback(params => {
    const _position = {
      x: params.state.positionX,
      y: params.state.positionY
    };
    setPosition(_position);
  }, [setPosition]);
  const onTransformEnd = React.useCallback(params => {
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
  const onConnect = React.useCallback(({
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
  const pinchOptions = React.useMemo(() => ({
    step: 5
  }), []);
  const panningOptions = React.useMemo(() => ({
    disabled: isMoveable,
    excluded: [nodeCss.node, 'react-draggable', nodePortCss.port, nodePortCss.portConnector]
  }), [isMoveable]);
  const wrapperStyle = React.useMemo(() => ({
    height: '100vh',
    width: '100vw',
    backgroundColor: currentTheme.colors.background,
    backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
    backgroundImage: `linear-gradient(to right, ${currentTheme.colors.hover} 1px, transparent 1px), linear-gradient(to bottom, ${currentTheme.colors.hover} 1px, transparent 1px)`,
    backgroundPosition: `${scaledPositionX}px ${scaledPositionY}px`
  }), [scaledGridSize, scaledPositionX, scaledPositionY, currentTheme]);
  const nodeTypesByCategory = React.useMemo(() => {
    const categories = Object.values(nodeTypes).reduce((acc, nodeType) => {
      var _nodeType$category;
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
  const wrapperProps = React.useCallback(handleContextMenu => ({
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
      children: nodeTypes.sort((a, b) => a.label.localeCompare(b.label)).map(nodeType => ({
        label: `Adicionar ${nodeType.label}`,
        description: nodeType.description,
        onClick: () => {
          e.target.getBoundingClientRect();
          const position = {
            x: e.clientX,
            // - x,
            y: e.clientY // - y
          };

          addNode(nodeType, position);
        }
      }))
    })))
  }), [nodeTypesByCategory, addNode]);
  const handleValueChange = React.useCallback((id, values) => {
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
  if (!state) return null;
  const contRect = screenRef.current?.getBoundingClientRect();
  return /*#__PURE__*/jsxRuntime.jsx("div", {
    className: css.container,
    style: style,
    ref: screenRef,
    children: /*#__PURE__*/jsxRuntime.jsx(TransformWrapper, {
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
      children: ({
        zoomIn,
        zoomOut,
        resetTransform,
        setTransform,
        centerView,
        ...rest
      }) => {
        return /*#__PURE__*/jsxRuntime.jsxs(jsxRuntime.Fragment, {
          children: [/*#__PURE__*/jsxRuntime.jsxs("div", {
            className: [css.panel, css.controlsPanel].join(' '),
            children: [/*#__PURE__*/jsxRuntime.jsx(Button, {
              className: css.controlButton,
              onClick: () => zoomIn(),
              children: "+"
            }), /*#__PURE__*/jsxRuntime.jsx(Button, {
              className: css.controlButton,
              onClick: () => zoomOut(),
              children: "-"
            }), /*#__PURE__*/jsxRuntime.jsx(Button, {
              className: css.controlButton,
              onClick: () => {
                centerView();
                setStateAndNotify(prev => ({
                  ...prev,
                  position,
                  scale
                }));
              },
              children: "C"
            }), /*#__PURE__*/jsxRuntime.jsx(Button, {
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
              children: "Z"
            }), /*#__PURE__*/jsxRuntime.jsx(Button, {
              className: css.controlButton,
              onClick: () => setCanMove(!canMove),
              children: canMove ? 'L' : 'U'
            })]
          }), /*#__PURE__*/jsxRuntime.jsxs("div", {
            className: [css.panel, css.statusPanel].join(' '),
            children: [/*#__PURE__*/jsxRuntime.jsxs("div", {
              children: ["Scale: ", scale]
            }), /*#__PURE__*/jsxRuntime.jsxs("div", {
              children: ["Position: ", JSON.stringify(position)]
            })]
          }), /*#__PURE__*/jsxRuntime.jsx(ContextMenu, {
            children: ({
              handleContextMenu
            }) => /*#__PURE__*/jsxRuntime.jsxs(TransformComponent, {
              contentClass: "main",
              wrapperStyle: wrapperStyle,
              wrapperProps: wrapperProps(handleContextMenu),
              children: [state?.nodes && Object.values(state.nodes).map((node, index) => {
                return /*#__PURE__*/jsxRuntime.jsxs(jsxRuntime.Fragment, {
                  children: [/*#__PURE__*/jsxRuntime.jsx(Node$1, {
                    id: `node_${node.id}`,
                    name: node.name,
                    portTypes: portTypes,
                    nodeType: nodeTypes?.[node.type],
                    value: node,
                    onValueChange: v => {
                      handleValueChange(node.id, {
                        ...v.values
                      });
                    },
                    onChangePosition: position => {
                      setState(prev => ({
                        ...prev,
                        nodes: {
                          ...prev.nodes,
                          [node.id]: {
                            ...prev.nodes[node.id],
                            position
                          }
                        }
                      }));
                    },
                    onDragEnd: position => {
                      setStateAndNotify(prev => ({
                        ...prev,
                        nodes: {
                          ...prev.nodes,
                          [node.id]: {
                            ...prev.nodes[node.id],
                            position
                          }
                        }
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
                      label: `Remover este nó`,
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
                    return /*#__PURE__*/jsxRuntime.jsx(ConnectorCurve, {
                      type: portTypes[connType],
                      src: srcPos,
                      dst: dstPos,
                      scale: scale,
                      onContextMenu: e => handleContextMenu(e, [canMove ? {
                        label: `Remover esta conexão`,
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
              }), dragInfo && dstDragPosition ? /*#__PURE__*/jsxRuntime.jsx(ConnectorCurve, {
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
  return /*#__PURE__*/jsxRuntime.jsx(ScreenContextProvider, {
    initialState: state,
    children: /*#__PURE__*/jsxRuntime.jsx(DragContextProvider, {
      children: /*#__PURE__*/jsxRuntime.jsx(Screen, {
        ...props
      })
    })
  });
}

exports.NodeContainer = NodeContainer;
exports.ThemeProvider = ThemeProvider;
exports.useTheme = useTheme;
//# sourceMappingURL=index.js.map
