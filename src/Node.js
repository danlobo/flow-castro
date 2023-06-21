import { memo, useEffect, useRef } from 'react';
import NodePort from './NodePort';
import { useScreenContext } from './ScreenContext';

function Node({ 
  id, 
  portTypes,
  nodeType,
  connectionsMap,
  settings,
  onChangePosition, 
  onConnect, 
  containerRef, 
  onContextMenu,
  onResize
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
  }, [onResize])

  const {
    name, 
    position: nodePosition, 
    inputPorts, 
    outputPorts
  } = settings

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

  const onOutputPortConnected = ({ source, target }) => {
    console.log('output port connected', source, target)
    onConnect?.({ source, target })
  }

  const onInputPortConnected = ({ source, target }) => {
    console.log('input port connected', source, target)
    onConnect?.({ source: target, target: source })
  }

  return <div
    ref={nodeRef}
    id={`card-${id}`}
    className="node"
    style={{
      transform: `translate(${nodePosition.x}px, ${nodePosition.y}px)`,
    }}
    onMouseDown={handleMouseDown}
    onContextMenu={onContextMenu}
  >
    <div style={{ padding: '1rem' }}>
        <h3>{name}</h3>
    </div>
        
    {/* <img
      className="zoom-and-pan-image"
      src="https://picsum.photos/300/200"
      alt="Example"
    /> */}

    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {inputPorts?.map((port) => (
          <NodePort 
            settings={port}
            id={port.id} 
            nodeId={id}
            key={port.id} 
            type={portTypes[port.type]}
            direction="input" 
            label={port.label}
            containerRef={containerRef}
            isConnected={connectionsMap.has(`dst_${id}_${port.id}`)}
            onConnected={onInputPortConnected}
          />
        ))}
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {outputPorts?.map((port) => (
          <NodePort 
            settings={port}
            id={port.id}
            nodeId={id}
            key={port.id}
            type={portTypes[port.type]}
            direction="output"
            label={port.label}
            containerRef={containerRef}
            isConnected={connectionsMap.has(`src_${id}_${port.id}`)}
            onConnected={onOutputPortConnected}
          />
        ))}
      </div>
    </div>

  </div>
}

export default  memo(Node);