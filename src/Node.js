import { useState } from 'react';
import NodePort from './NodePort';

function Node({ id, name, position, scale, onChangePosition, inputPorts, outputPorts, containerRef }) {
  const handleMouseDown = (event) => {
    // event.preventDefault();
    event.stopPropagation();

    console.log('mouse down', event.currentTarget, event.target)

    const startX = event.pageX;
    const startY = event.pageY;

    const handleMouseMove = (event) => {
      const dx = event.pageX - startX;
      const dy = event.pageY - startY;

      onChangePosition({ x: position.x + dx / scale, y: position.y + dy / scale });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return <div
    id={`card-${id}`}
    className="node"
    style={{
      transform: `translate(${position.x}px, ${position.y}px)`,
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

    <div style={{ width: '100%' }}>
      {inputPorts?.map((port) => (
          <NodePort 
            id={port.id} 
            nodeId={id} 
            key={port.id} 
            type="input" 
            label={port.label}
            scale={scale}
            containerRef={containerRef}
          />
        ))}
      {outputPorts?.map((port) => (
          <NodePort 
            id={port.id}
            nodeId={id}
            key={port.id}
            type="output"
            label={port.label}
            scale={scale}
            containerRef={containerRef}
            // onConnected={onOutputPortConnected}
          />
        ))}
    </div>

  </div>
}

export default Node;