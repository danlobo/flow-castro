import { memo } from 'react';
import NodePort from './NodePort';
import { useScreenContext } from './ScreenContext';

function Node({ id, name, position: nodePosition, onChangePosition, onConnect, inputPorts, outputPorts, containerRef }) {

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
    id={`card-${id}`}
    className="node"
    style={{
      transform: `translate(${nodePosition.x}px, ${nodePosition.y}px)`,
    }}
    onMouseDown={handleMouseDown}
  >
    <div style={{ padding: '1rem' }}>
        <h3>[{id}] {name}</h3>
    </div>
        
    <img
      className="zoom-and-pan-image"
      src="https://picsum.photos/300/200"
      alt="Example"
    />

    <div style={{ width: '100%', display: 'flex' }}>
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {inputPorts?.map((port) => (
          <NodePort 
            id={port.id} 
            nodeId={id} 
            key={port.id} 
            type="string"
            direction="input" 
            label={port.label}
            containerRef={containerRef}
            onConnected={onInputPortConnected}
          />
        ))}
      </div>
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {outputPorts?.map((port) => (
          <NodePort 
            id={port.id}
            nodeId={id}
            key={port.id}
            type="string"
            direction="output"
            label={port.label}
            containerRef={containerRef}
            onConnected={onOutputPortConnected}
          />
        ))}
      </div>
    </div>

  </div>
}

export default  memo(Node);