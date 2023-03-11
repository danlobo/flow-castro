import React, { useRef, useState } from 'react';

function NodePort({ id, type, nodeId, label, onConnected, isConnected, scale, containerRef }) {

  const pointerRef = useRef(null)
  const handleMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();

    console.log('drag start', event)
  
    const startX =  event.clientX - 100;
    const startY =  event.clientY;

    const handleMouseMove = (event) => {
      const dx = (event.pageX - startX) / scale;
      const dy = (event.pageY - startY) / scale;

      pointerRef.current.style.left = `${dx}px`;
      pointerRef.current.style.top = `${dy}px`;
    }

    const handleMouseUp = (e) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      console.log('drag end', e.target)

      pointerRef.current.style.left = 0;
      pointerRef.current.style.top = 0;

      const target = document.elementFromPoint(event.pageX, event.pageY);
      if (target?.classList?.contains('port-connector')) {
        console.log('target found!', target, target.id, 'card-1-output-')
        const targetId = target.id.split('-')[3];
        onConnected?.({ source: id, target: targetId });
      }
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} className="port"
      onMouseDown={handleMouseDown}
      >
        <div ref={pointerRef} style={{ width: '4px', height: '4px', position: 'absolute', top: 0, left: 0, zIndex: 1, border: '1px solid red', borderRadius: '2px', backgroundColor: 'red' }} />

      <span style={{ fontSize: '9px' }}>{label}</span>
      <div 
        id={`card-${nodeId}-${type}-${id}`}
        style={{
          width: '10px',
          height: '10px',
          background: type === 'input' ? 'blue' : 'red',
          borderRadius: '50%',
          cursor: 'pointer',
          position: 'absolute',
          left: type === 'input' ? '-5px' : null,
          right: type === 'output' ? '-5px' : null,
          top: 'calc(50% - 5px)',
        }}
        className='port-connector'
      />
    </div>
  );
}

export default NodePort;
