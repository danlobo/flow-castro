import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import NodePort from './NodePort.jsx';
import { useScreenContext } from './ScreenContext.jsx';
import css from './Node.module.css'
import { useTheme } from './ThemeProvider.js';

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
  onValueChange,
  debugMode
}) {
  const { currentTheme } = useTheme()

  const nodeRef = useRef()
  useEffect(() => {
    const currentRef = nodeRef.current
    const observer = new ResizeObserver((entries) => {
      onResize({ width: entries[0].contentRect.width, height: entries[0].contentRect.height })
    })
    observer.observe(currentRef)

    return () => {
      observer.unobserve(currentRef)
    }
  }, [])

  const {
    id: nodeId,
    name: nodeName,
    position: nodePosition, 
    values: nodeValues
  } = value;

  useEffect(() => {
    if (nodeId == null)
      throw new Error('Node id is required')

      if (name == null)
      throw new Error('Node name is required')

    if (name !== nodeName) {
      console.warn('Node name mismatch', name, nodeName)
    }  
  }, [name, nodeName, nodeId])

  const { scale: screenScale } = useScreenContext()

  const handleMouseDown = useCallback((event) => {
    if (!canMove) return

    // event.preventDefault();
    event.stopPropagation();

    const startX = event.pageX;
    const startY = event.pageY;

    onDragStart?.({ x: nodePosition.x, y: nodePosition.y });

    const handleMouseMove = (event) => {
      const dx = event.pageX - startX;
      const dy = event.pageY - startY;

      onChangePosition({ x: nodePosition.x + dx / screenScale, y: nodePosition.y + dy / screenScale });
    };

    const handleMouseUp = (e) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      const dx = e.pageX - startX;
      const dy = e.pageY - startY;

      if (Math.abs(dx) >= 2 && Math.abs(dy) >= 2) {
        onDragEnd?.({ x: nodePosition.x + dx / screenScale, y: nodePosition.y + dy / screenScale });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [nodePosition, screenScale, onChangePosition, onDragStart, onDragEnd]);

  const onOutputPortConnected = useCallback(({ source, target }) => {
    onConnect?.({ source, target })
  }, [onConnect])

  const onInputPortConnected = useCallback(({ source, target }) => {
    onConnect?.({ source: target, target: source })
  }, [onConnect])

  const nodeInputs = useMemo(() => {
    if (typeof nodeType.inputs === 'function')
      return nodeType.inputs(nodeValues)
    return nodeType.inputs
  }, [nodeType, nodeValues]);


  useEffect(() => {
    if (nodeInputs == null) return
    if (nodeValues == null) return

    const extraValues = Object.keys(nodeValues).filter((key) => !nodeInputs.some((input) => input.name === key))
    if (extraValues.length > 0) {
      const newValues = Object.keys(nodeValues).filter((key) => !extraValues.includes(key)).reduce((acc, key) => {
        acc[key] = nodeValues[key]
        return acc
      }, {})

      onValueChange?.({
        ...value,
        values: newValues
      })
    }
  }, [nodeInputs])

  const nodeOutputs = useMemo(() => {
    if (typeof nodeType.outputs === 'function')
      return nodeType.outputs(nodeValues)
    return nodeType.outputs
  }, [nodeType, nodeValues]);

  return <div
    ref={nodeRef}
    id={`card-${nodeId}`}
    key={`card-${nodeId}`}
    className={[css.node, isSelected ? css.selected : ''].join(' ')}
    style={{
      backgroundColor: currentTheme?.nodes?.[nodeType?.type]?.body?.background ?? currentTheme?.nodes?.common?.body?.background,
      border: currentTheme?.nodes?.[nodeType?.type]?.body?.border ?? currentTheme?.nodes?.common?.body?.border,
      color: currentTheme?.nodes?.[nodeType?.type]?.body?.color ?? currentTheme?.nodes?.common?.body?.color,
      transform: `translate(${nodePosition.x}px, ${nodePosition.y}px)`,
      cursor: canMove ? 'grab' : null
    }}
    onMouseDown={handleMouseDown}
    onContextMenu={onContextMenu}
  >
    <div className={css.title} style={{
      backgroundColor: currentTheme?.nodes?.[nodeType?.type]?.title?.background ?? currentTheme?.nodes?.common?.title?.background,
      color: currentTheme?.nodes?.[nodeType?.type]?.title?.color ?? currentTheme?.nodes?.common?.title?.color,
    }}>
        <h3 style={{ textAlign: 'center' }}>{debugMode ? nodeId : name}</h3>
    </div>

    <div className={css.container}>
      <div className={[css.portsContainer, css.inputPortsContainer].join(' ')}>
        {nodeInputs?.map((input) => {
          const portType = portTypes[input.type]

          const hidePort = input.hidePort != null ? input.hidePort : portType.hidePort

          return <NodePort 
            name={input.name}
            value={nodeValues[input.name]}
            onValueChange={(v1) => {
              onValueChange?.({
                ...value,
                values: {
                  ...value.values,
                  [input.name]: v1,
                }
              })
            }}
            nodeId={nodeId}
            key={input.name} 
            type={portTypes[input.type]}
            direction="input" 
            label={input.label}
            hidePort={Boolean(hidePort)}
            containerRef={containerRef}
            isConnected={value.connections?.inputs?.some((c) => c.name === input.name)}
            onConnected={onInputPortConnected}
            canMove={canMove}
          />
        })}
      </div>
      <div className={[css.portsContainer, css.outputPortsContainer].join(' ')}>
        {nodeOutputs?.map((output) => {
          return <NodePort
            name={output.name}
            nodeId={nodeId}
            key={output.name}
            type={portTypes[output.type]}
            direction="output"
            label={output.label}
            containerRef={containerRef}
            isConnected={value.connections?.outputs?.some((c) => c.name === output.name)}
            onConnected={onOutputPortConnected}
            canMove={canMove}
          />
        })}
      </div>
    </div>
  </div>
}

export default  memo(Node);