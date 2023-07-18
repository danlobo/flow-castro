import { memo, useCallback, useEffect, useRef } from 'react';
import NodePort from './NodePort.jsx';
import { useScreenContext } from './ScreenContext.jsx';

function Node({ 
  name, 
  portTypes,
  nodeType,
  value,
  onChangePosition, 
  onConnect, 
  containerRef, 
  onContextMenu,
  onResize,
  onValueChange
}) {
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
  } = value

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

  const handleMouseDown = (event) => {
    // event.preventDefault();
    event.stopPropagation();

    const startX = event.pageX;
    const startY = event.pageY;

    const handleMouseMove = (event) => {
      const dx = event.pageX - startX;
      const dy = event.pageY - startY;

      onChangePosition({ x: nodePosition.x + dx / screenScale, y: nodePosition.y + dy / screenScale });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const onOutputPortConnected = useCallback(({ source, target }) => {
    console.log('onOutputPortConnected', { source, target })
    onConnect?.({ source, target })
  }, [onConnect])

  const onInputPortConnected = useCallback(({ source, target }) => {
    console.log('onInputPortConnected', { source, target })
    onConnect?.({ source: target, target: source })
  }, [onConnect])


  const handleResolveClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()

    const resolvedValue = nodeType?.resolve?.(nodeValues)
    console.log('resolvedValue', resolvedValue)
  }, [name, nodeValues, nodeType])

  return <div
    ref={nodeRef}
    id={`card-${name}`}
    key={`card-${name}`}
    className="node"
    style={{
      transform: `translate(${nodePosition.x}px, ${nodePosition.y}px)`,
    }}
    onMouseDown={handleMouseDown}
    onContextMenu={onContextMenu}
  >
    <div style={{ padding: '0 1rem' }}>
        <h3>{name}</h3>
    </div>
        
    {/* <img
      className="zoom-and-pan-image"
      src="https://picsum.photos/300/200"
      alt="Example"
    /> */}

    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-end',
        gap: '1rem'
      }}>
        {nodeType?.inputs?.map((input) => {
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
            containerRef={containerRef}
            isConnected={value.connections?.inputs?.some((c) => c.name === input.name)}
            onConnected={onInputPortConnected}
          />
        })}
      </div>
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        {nodeType?.outputs?.map((output) => {
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
          />
        })}
      </div>

      <div>
        <button onClick={handleResolveClick}>
          Resolve
        </button>
      </div>
    </div>

  </div>
}

export default  memo(Node);