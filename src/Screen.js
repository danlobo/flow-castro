import React, { useEffect, useRef, useState } from 'react';
import Node from './Node';
import { 
  TransformWrapper, 
  TransformComponent 
} from "react-zoom-pan-pinch";
import Xarrow, { useXarrow, Xwrapper } from 'react-xarrows';
import { useDragContext } from './DragContext';
import { useScreenContext } from './ScreenContext';
import { ConnectorCurve } from './ConnectorCurve';
import ConnectorCanvas from './ConnectorCanvas';

function NodeContainer() {
  const { dragInfo, setDragInfo } = useDragContext()
  const { position, setPosition, scale, setScale } = useScreenContext();

  const [dstDragPosition, setDstDragPosition] = useState({ x: 0, y: 0 })
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 })
  

  useEffect(() => {
    if (!dragInfo) {
      setDstDragPosition(null)
      return
    }

    const mouseMoveListener = (event) => {
      setPointerPosition({
        x: event.pageX - window.scrollX,
        y: event.pageY - window.scrollY,
      })

      if (!dragInfo) return

      const { startX, startY } = dragInfo
      const dx = event.pageX //- startX
      const dy = event.pageY //- startY

      setDstDragPosition({ x: dx, y: dy })
    }

    window.addEventListener('mousemove', mouseMoveListener)
    return () => {
      window.removeEventListener('mousemove', mouseMoveListener)
    }
  }, [dragInfo])
  
  const [cards, setCards] = useState([
    { 
      id: 1, 
      name: 'Aninha', 
      position: { x: 300, y: 300 },
      inputPorts: [
        { id: 1, label: 'input 1' },
      ],
      outputPorts: [
        { id: 1, label: 'output 1' },
      ]
    },
    { 
      id: 2, 
      name: 'Daniel', 
      position: { x: 100, y: 0 },
      outputPorts: [
        { id: 1, label: 'output 1' },
        { id: 2, label: 'output 2' },
      ]
    },
    { 
      id: 3, 
      name: 'Camylla', 
      position: { x: 200, y: 200 },
      inputPorts: [
        { id: 1, label: 'input 1' },
      ]
    }
  ]);

  const [connections, setConnections] = useState([]);

  const screenRef = useRef()

  const updateXarrow = useXarrow();
  useEffect(() => {
    window.addEventListener('resize', updateXarrow);
    return () => window.removeEventListener('resize', updateXarrow);
  }, [])

  const [isMoveable, setIsMoveable] = useState(false);
  const [canMove, setCanMove] = useState(true);

  const onDrag = () => {
    setIsMoveable(true)
    updateXarrow()
    //etc
  }
  const onStop = () => {
    setIsMoveable(false)
    updateXarrow()
    //etc 
  }

  const handleNodeMove = (node, position) => {
    const outputConnections = connections.filter(c => c.srcNode === node.id);
    const inputConnections = connections.filter(c => c.dstNode === node.id);


  }

  const onZoom = (params) => {
    setScale(params.state.scale);
    updateXarrow(params)
  }

  const onTransform = (params) => {  
    setPosition({x: params.state.positionX, y: params.state.positionY });
    updateXarrow(params)
  }

  const onConnect = ({ source, target }) => {
    const item = {
      srcNode: source.nodeId,
      dstNode: target.nodeId,
      srcPort: source.portId,
      dstPort: target.portId,
    }

    const key = `${item.srcNode}-${item.dstNode}-${item.srcPort}-${item.dstPort}`;
    if (connectionsHash[key]) return;

    const newConnections = [...connections, item];
    console.log('newConnections', newConnections)
    setConnections(newConnections);
  }

  const gridSize = 40;
  const scaledGridSize = gridSize * scale;
  const scaledPositionX = (position.x) % scaledGridSize;
  const scaledPositionY = (position.y) % scaledGridSize;

  //hashed list
  const connectionsHash = React.useMemo(() => connections.reduce((acc, curr) => {
    const { srcNode, dstNode, srcPort, dstPort } = curr;
    const key = `${srcNode}-${dstNode}-${srcPort}-${dstPort}`;
    acc[key] = curr;
    return acc;
  }, {})
  , [connections]);

  const handleOutputPortConnected = (props) => {
    console.log('handleOutputPortConnected', props);
  };

  return (
    <div style={{ position: 'relative', border: `1px solid blue` }}>
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        disabled={isMoveable}
        minScale={.25}
        maxScale={2}
        limitToBounds={false}
        onPanning={onTransform}
        onZoom={onZoom}
        pinch={{ step: 5 }}
        panning={{ excluded: ['node', 'react-draggable', 'port', 'port-connector']}}
      >
        {({ zoomIn, zoomOut, resetTransform, setTransform, centerView, ...rest }) => (
          <>
            <div style={{ 
              position: 'absolute', 
              bottom: '40px', 
              right: '40px', 
              zIndex: 1000, 
              width: '30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'white',
              border: '1px solid #CCC',
              borderRadius: '.5rem',
              padding: '.5rem',
              boxShadow: '0 0 5px #CCC',
              gap: '.5rem'
              }}
            >
              <button style={{ width: '30px', height: '30px' }} onClick={() => zoomIn()}>+</button>
              <button style={{ width: '30px', height: '30px' }} onClick={() => zoomOut()}>-</button>
              <button style={{ width: '30px', height: '30px' }} onClick={() => centerView()}>C</button>
              <button style={{ width: '30px', height: '30px' }} onClick={() => {setTransform(position.x, position.y, 1); setScale(1);} }>Z</button>
              
              <button style={{ width: '30px', height: '30px' }} onClick={() => setCanMove(!canMove)}>{canMove ? 'L' : 'U'}</button>
            </div>

            <div style={{ 
              position: 'absolute', 
              bottom: '40px', 
              right: '150px', 
              zIndex: 1000,
              width: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'white',
              border: '1px solid #CCC',
              borderRadius: '.5rem',
              padding: '.5rem',
              boxShadow: '0 0 5px #CCC',
              gap: '.5rem',
              fontSize: '9px'
              }}
            >
              <div>Scale: {scale}</div>
              <div>Position: {JSON.stringify(position)}</div>
              <div>Pointer: {JSON.stringify(pointerPosition)}</div>
            </div>

            <TransformComponent 
              contentClass='main' 
              wrapperStyle={{ 
                height: '100vh', 
                width: '100vw',
                backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
                backgroundImage: `linear-gradient(to right, #CCCCCC 1px, transparent 1px), linear-gradient(to bottom, #CCCCCC 1px, transparent 1px)`,
                backgroundPosition: `${scaledPositionX}px ${scaledPositionY}px`,
              }}
              wrapperProps={{
                onDragOver: (e) => {
                  e.dataTransfer.dropEffect = "move";
                  e.dataTransfer.effectAllowed = "move";

                  console.log(`drag over dropEffect: ${e.dataTransfer.dropEffect} effectAllowed: ${e.dataTransfer.effectAllowed}`)
                },
                onDragLeave: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              
              >
              {cards.map((value, index) => (
                <Node 
                  key={value.id} 
                  id={value.id}
                  name={value.name}
                  position={value.position}
                  onMove={(pos) => handleNodeMove(value, pos)}
                  onChangePosition={(position) => setCards(prev => [
                    ...prev.slice(0, index),
                    { ...value, position },
                    ...prev.slice(index + 1)
                  ])}
                  containerRef={screenRef}
                  inputPorts={value.inputPorts}
                  outputPorts={value.outputPorts}
                  canMove={canMove}
                  onConnect={onConnect}
                  />
              ))}
            </TransformComponent>
              {dragInfo && dstDragPosition && <ConnectorCurve tmp src={{
                x: dragInfo.startX + window.scrollX,
                y: dragInfo.startY + window.scrollY
              }}
              dst={{
                x: dstDragPosition.x,
                y: dstDragPosition.y
              }}
              scale={scale}
              />}
              {connections.map((rel, index) => {
                const srcElem = document.getElementById(`card-${rel.srcNode}-output-${rel.srcPort}`);
                const dstElem = document.getElementById(`card-${rel.dstNode}-input-${rel.dstPort}`);

                if (!srcElem || !dstElem) {
                  return null;
                }

                const srcRect = srcElem.getBoundingClientRect();
                const dstRect = dstElem.getBoundingClientRect();

                const srcPos = {
                  x: srcRect.x + window.scrollX + srcRect.width / 2,
                  y: srcRect.y + window.scrollY + srcRect.height / 2
                }

                const dstPos = {
                  x: dstRect.x + window.scrollX + dstRect.width / 2,
                  y: dstRect.y + window.scrollY + dstRect.height / 2
                }

                // srcPos.x = srcPos.x + srcRect.width * Math.sign(dstPos.x - srcPos.x);
                // dstPos.x = dstPos.x + dstRect.width * Math.sign(srcPos.x - dstPos.x);

                return <ConnectorCurve
                  key={`connector-${rel.srcNode}-${rel.srcPort}-${rel.dstNode}-${rel.dstPort}`}
                  src={srcPos}
                  dst={dstPos}
                  scale={scale} 
                />
              })}
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

export default NodeContainer;