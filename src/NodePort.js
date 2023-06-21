import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDragContext } from './DragContext';
import { useScreenContext } from './ScreenContext';

const globalToLocal = (globalX, globalY, translate, scale) => {
  const localX = (globalX) / scale;
  const localY = (globalY) / scale;
  return { x: localX, y: localY };
};

function NodePort({ settings, id, type, nodeId, label, onConnected, isConnected, direction, onValueChange }) {
  const { position: screenPosition, scale: screenScale } = useScreenContext()
  const { dragInfo, setDragInfo } = useDragContext()

  const [internalValue, setInternalValue] = useState(settings.value)

  useEffect(() => {
    console.log('new Internal value', internalValue)
  }, [internalValue])

  const containerRef = useRef(null)
  const connectorRef = useRef(null)

  const handleUpdateForm = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('update port ', settings.name, `from node`, nodeId)
    onValueChange?.(internalValue)
  }, [internalValue])

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
      startX: connectorRect.left,
      startY: connectorRect.top,
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
      const target = targets.find(t => t.classList?.contains('port-overlay') && t.dataset.portDirection.toString() !== direction.toString() && t.dataset.portType.toString() === type.type?.toString())
      
      console.log('targets', targets, target, type, direction)

      if (target) {
        console.log(target.dataset)
        onConnected?.({ source: { nodeId, portId: id }, target: { nodeId: target.dataset.nodeId, portId: target.dataset.portId } });
      }
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div ref={containerRef} style={{ 
        position: 'relative', 
        width: '100%',
        minHeight: '20px'
      }} 
      className="port"
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
        padding: '0 15px',
        borderTopLeftRadius: direction === 'input' ? '15px' : null,
        borderBottomLeftRadius: direction === 'input' ? '15px' : null,
        borderTopRightRadius: direction === 'output' ? '15px' : null,
        borderBottomRightRadius: direction === 'output' ? '15px' : null,
      }} 
      className="port-overlay" 
      id={`card-${nodeId}-${direction}-${id}-overlay`}
      data-port-id={id}
      data-port-type={type.type}
      data-port-direction={direction}
      data-port-name={label}
      data-node-id={nodeId}
      >
      </div>
        
      <div style={{ fontSize: '10px', display: 'flex', justifyContent: direction === 'input' ? 'flex-start' : 'flex-end' }}>
        <span>{label}</span>
      </div>
      <div 
        style={{ position: 'relative', zIndex: 3000, width: '100%' }} 
        onBlur={handleUpdateForm}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        >
        {direction === 'input' && !isConnected ? type.render({ value: internalValue, onChange: setInternalValue }) : null}
      </div>
      <div 
        id={`card-${nodeId}-${direction}-${id}`}
        ref={connectorRef}
        style={{
          width: '10px',
          height: '10px',
          background: type.color,
          border: isConnected ? '2px solid #fff' : '2px solid #000',
          borderRadius: '50%',
          cursor: 'pointer',
          position: 'absolute',
          left: direction === 'input' ? '-15px' : null,
          right: direction === 'output' ? '-15px' : null,
          top: 'calc(50% - 5px)'
        }}
        className='port-connector'
      />
    </div>
  );
}

export default memo(NodePort);
