import React, { useRef, useState, useEffect } from 'react';
import './Screen.css';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

function Item({ position, scale, onChangePosition }) {
  const handleMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();

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

  return <img
    className="zoom-and-pan-image"
    src="https://picsum.photos/300/200"
    alt="Example"
    style={{
      transform: `translate(${position.x}px, ${position.y}px)`,
    }}
    onMouseDown={handleMouseDown}
  />
}

function Screen() {
  const [nodes, setNodes] = useState([
    { id: 1, position: { x: 0, y: 0 }, type: 'item' },
    { id: 2, position: { x: 400, y: 400 }, type: 'item' }
  ]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const panning = useRef(false);

  const start = useRef({ x: 0, y: 0 });

  const screenRef = useRef(null);

  const translatorRef = useRef(null);
  const scalerRef = useRef(null);
  
  const lastTouch = useRef(null);

  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [oldPointer, setOldPointer] = useState({ x: 0, y: 0 });

  const pointerRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();

    start.current = { 
      x: event.clientX - position.x, 
      y: event.clientY - position.y 
    };
    
    // setPointer({
    //   x: start.current.x / scale,
    //   y: start.current.y / scale,
    // })

    panning.current = true;

    const handleMouseMove = (event) => {
      event.preventDefault();
      event.stopPropagation();

      // const rect = translatorRef.current.getBoundingClientRect();
      // setPointer({
      //   x: (event.clientX - rect.x) / scale, 
      //   y: (event.clientY - rect.y) / scale
      // })

      if (!panning.current) {
        return;
      }

      setPosition(prev => {
        return { 
          x: event.clientX - start.current.x, 
          y: event.clientY - start.current.y
        }
      })
    };

    const handleMouseUp = () => {
      panning.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    const handleTouchStart = (event) => {
      lastTouch.current = event.touches[0];
    };
  
    const handleTouchMove = (event) => {
      if (event.touches.length === 1 && lastTouch.current) {
        const touch = event.touches[0];
        setPosition({
          x: position.x + touch.pageX - lastTouch.current.pageX,
          y: position.y + touch.pageY - lastTouch.current.pageY,
        });
        lastTouch.current = touch;
      } else {
        lastTouch.current = null;
      }
    };
  
    const handleTouchEnd = () => {
      lastTouch.current = null;
    };

    // handleWheel must consider the mouse position relative to the screen
    const handleWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const delta = (event.wheelDelta ? event.wheelDelta : -event.deltaY);
      const factor = delta > 0 ? 1.1 : 0.9;

      // const rect = translatorRef.current.getBoundingClientRect();
      // const mouseX = event.clientX - rect.left;
      // const mouseY = event.clientY - rect.top;

      setScale(currScale => {
        const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currScale * factor))
        return newScale;
      })
    };

    if (screenRef.current) {
      screenRef.current.addEventListener('touchstart', handleTouchStart);
      screenRef.current.addEventListener('touchmove', handleTouchMove);
      screenRef.current.addEventListener('touchend', handleTouchEnd);
      screenRef.current.addEventListener('wheel', handleWheel, { passive: false });
    }

    const refCurr = screenRef.current;
    return () => {
      if (refCurr) {
        refCurr.removeEventListener('touchstart', handleTouchStart);
        refCurr.removeEventListener('touchmove', handleTouchMove);
        refCurr.removeEventListener('touchend', handleTouchEnd);
        refCurr.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const gridSize = 40;
  const scaledGridSize = gridSize * scale;
  const scaledPositionX = (position.x) % scaledGridSize;
  const scaledPositionY = (position.y) % scaledGridSize;

  return (
    <div
      className="screen"
      ref={screenRef}
      style={{
        height: '100%',
        backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        backgroundImage: `linear-gradient(to right, #CCCCCC 1px, transparent 1px), linear-gradient(to bottom, #CCCCCC 1px, transparent 1px)`,
        backgroundPosition: `${scaledPositionX}px ${scaledPositionY}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        style={{
          position: 'absolute',
          right: '20px',
          bottom: '20px',
          width: '100px',
          border: '1px solid gray',
          borderRadius: '4px',
        }}>
          <div>Scale: {scale.toFixed(2)}</div>
          <div>Position: {position.x.toFixed(1)}, {position.y.toFixed(1)}</div>
      </div>
      <div
        ref={translatorRef}
        style={{
          width: 0,
          height: 0,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          // transformOrigin: `${pointer.x}px ${pointer.y}px`,
        }}
      >
        <div
          ref={scalerRef}
        >
          <div ref={pointerRef} style={{
            position: 'absolute', 
            left: pointer.x, 
            top: pointer.y, 
            width: `${Math.ceil(4 / scale)}px`, 
            height: `${Math.ceil(4 / scale)}px`, 
            translate: '(-2px, -2px)',
            border: '2px solid red',
            borderRadius: '2px',
            }}
          />
          <div style={{
            position: 'absolute', 
            left: oldPointer.x, 
            top: oldPointer.y, 
            width: `${Math.ceil(4 / scale)}px`, 
            height: `${Math.ceil(4 / scale)}px`, 
            translate: '(-2px, -2px)',
            border: '2px solid gray',
            borderRadius: '2px',
            }}
          />
          <div
            ref={targetRef}
            style={{ 
              position: 'absolute', 
              left: targetRef.current.x, 
              top: targetRef.current.y,
              width: `${Math.ceil(4 / scale)}px`, 
              height: `${Math.ceil(4 / scale)}px`, 
              translate: '(-2px, -2px)',
              border: '2px solid green',
              borderRadius: '2px',
            }} />
          {nodes.map((node, idx) => 
            <Item
              key={node.id}
              scale={scale}
              position={node.position}
              onChangePosition={(newPosition) => setNodes([
                ...nodes.slice(0, idx),
                { ...node, position: newPosition },
                ...nodes.slice(idx + 1),
              ])}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Screen;