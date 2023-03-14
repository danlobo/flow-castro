import React, { useEffect, useRef, useState } from 'react';
import { useDragContext } from './DragContext';
import { useScreenContext } from './ScreenContext';

const globalToLocal = (globalX, globalY, translate, scale) => {
  const localX = (globalX) / scale;
  const localY = (globalY) / scale;
  return { x: localX, y: localY };
};

function NodePort({ id, type, nodeId, label, onConnected, isConnected, direction }) {

  const { position: screenPosition, scale: screenScale } = useScreenContext()
  const { dragInfo, setDragInfo } = useDragContext()

  const containerRef = useRef(null)
  const connectorRef = useRef(null)

  const connectorRect = useRef()
  useEffect(() => {
    if (!connectorRef.current) return
    connectorRect.current = connectorRef.current.getBoundingClientRect()
  }, [connectorRef.current])
  
  const containerRect = useRef()
  useEffect(() => {
    if (!containerRef.current) return
    containerRect.current = containerRef.current.getBoundingClientRect()
  }, [containerRef.current])

  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 })
  
  const handleMouseDown = (event) => {
    //event.preventDefault();
    event.stopPropagation();

    const nodePos = containerRef.current.getBoundingClientRect()
    const localPos = globalToLocal(event.pageX - nodePos.left, event.pageY - nodePos.top, screenPosition, screenScale);
    
    const connectorRect = connectorRef.current.getBoundingClientRect()

    const _dragInfo = {
      type: 'connector',
      nodeId,
      portId: id,
      portType: type,
      startX: connectorRect.left + 5 * screenScale,
      startY: connectorRect.top + 5 * screenScale,
    }

    setDragInfo(_dragInfo)

    const handleMouseMove = (event) => {
      if (!_dragInfo) return

      if (_dragInfo.type !== 'connector') return

      const localPos = globalToLocal(event.pageX - nodePos.left, event.pageY - nodePos.top, screenPosition, screenScale);
      setPointerPos({ x: localPos.x, y: localPos.y })
    }

    const handleMouseUp = (e) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      setDragInfo(null)
      if (!_dragInfo) return

      const targets = document.elementsFromPoint(e.pageX - window.scrollX, e.pageY - window.scrollY);
      const target = targets.find(t => t.classList?.contains('port-overlay') && t.dataset.portDirection.toString() !== direction.toString() && t.dataset.portType.toString() === type.toString())
      if (target) {
        onConnected?.({ source: id, target: target.dataset.portId });
      }
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }} className="port"
      onMouseDown={handleMouseDown}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: direction === 'input' ? '-20px' : 0,
        right: direction === 'output' ? '-20px' : 0,
        width: '100%',
        height: '100%',
        zIndex: 2000,
        borderRadius: '4px',
        backgroundColor: 'rgba(0,0,0,0.1)',
        padding: direction === 'input' ? '0 15px 0 0' : '0 0 0 15px',
        borderTopLeftRadius: direction === 'input' ? '15px' : null,
        borderBottomLeftRadius: direction === 'input' ? '15px' : null,
        borderTopRightRadius: direction === 'output' ? '15px' : null,
        borderBottomRightRadius: direction === 'output' ? '15px' : null,
      }} 
      className="port-overlay" 
      id={`card-${nodeId}-${type}-${id}`}
      data-port-id={id}
      data-port-type={type}
      data-port-direction={direction}
      data-port-name={label}
      data-node-id={nodeId}
      >
      </div>
        
      <span style={{ fontSize: '9px' }}>{label}</span>
      <div 
        id={`card-${nodeId}-${type}-${id}`}
        ref={connectorRef}
        style={{
          width: '10px',
          height: '10px',
          background: direction === 'input' ? 'blue' : 'red',
          borderRadius: '50%',
          cursor: 'pointer',
          position: 'absolute',
          left: direction === 'input' ? '-10px' : null,
          right: direction === 'output' ? '-10px' : null,
          top: 'calc(50% - 5px)',
        }}
        className='port-connector'
      />
    </div>
  );
}

export default NodePort;
