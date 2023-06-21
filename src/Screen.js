import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ContextMenu } from './ContextMenu';

function NodeContainer() {
  const { dragInfo, setDragInfo } = useDragContext()
  const { position, setPosition, scale, setScale } = useScreenContext();

  const [dstDragPosition, setDstDragPosition] = useState({ x: 0, y: 0 })
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 })
  
  const portTypes = useMemo(() => ({
    string: { 
      type: 'string', 
      label: 'String', 
      color: '#f80', 
      render({ value, onChange }) {
        return <textarea style={{width: '100%'}} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
     }
    },
    number: { 
      type: 'number', 
      label: 'Número', 
      color: '#33f', 
      render({ value, onChange }) {
        return <input type="tel" style={{width: '100%'}} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
     }
    },
  }), [])

  const nodeTypes = useMemo(() => ({
    string: {
      type: 'string',
      label: 'String',
      inputs: [
        { type: 'string', name: 'string', label: 'input 1' }
      ],
      outputs: [
        { type: 'string', name: 'string', label: 'output 1' }
      ],
    },
    number: {
      type: 'number',
      label: 'Número',
      inputs: [
        { type: 'number', name: 'number', label: 'input 1' }
      ],
      outputs: [
        { type: 'number', name: 'number', label: 'output 1' }
      ],
    },    
  }), [])

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
      type: 'string',
      name: 'Aninha', 
      position: { x: 300, y: 300 },
      inputPorts: [
        { id: 1, name: 'string', type: 'string', label: 'input 1' },
      ],
      outputPorts: [
        { id: 1, name: 'string', type: 'string', label: 'output 1' },
      ]
    },
    { 
      id: 2,
      type: 'number',
      name: 'Daniel', 
      position: { x: 100, y: 0 },
      inputPorts: [
        { id: 1, name: 'number', type: 'number', label: 'input 1' },
      ],
      outputPorts: [
        { id: 1, name: 'number', type: 'number', label: 'output 1' },
      ]
    },
    { 
      id: 3,
      type: 'string',
      name: 'Camylla', 
      position: { x: 200, y: 200 },
      inputPorts: [
        { id: 1, name: 'string', type: 'string', label: 'input 1' },
      ],
      outputPorts: [
        { id: 1, name: 'string', type: 'string', label: 'output 1' },
      ]
    }
  ]);

  const [connections, setConnections] = useState([]);
  const [connectionsMap, setConnectionsMap] = useState(new Map());


  const updateConnections = useCallback((newConnections, nodeAffected) => {
    setConnections((curConnections) => {
      const strNodeAffected = nodeAffected?.toString()
      const retConnections = []
      const _connections = newConnections ?? curConnections
      const _scale = scale
      const _position = position
  
      for(const _conn of _connections) {
        if (nodeAffected && strNodeAffected != _conn.srcNode && strNodeAffected != _conn.dstNode) {
          retConnections.push(_conn)
          continue;
        }

        const srcElem = document.getElementById(`card-${_conn.srcNode}-output-${_conn.srcPort}`);
        const dstElem = document.getElementById(`card-${_conn.dstNode}-input-${_conn.dstPort}`);
  
        if (!srcElem || !dstElem) {
          continue;
        }
  
        const srcRect = srcElem.getBoundingClientRect();
        const dstRect = dstElem.getBoundingClientRect();
  
        const srcPos = {
          x: (srcRect.x + window.scrollX - _position.x + srcRect.width / 2) / _scale,
          y: (srcRect.y + window.scrollY - _position.y + srcRect.height / 2) / _scale
        }
  
        const dstPos = {
          x: (dstRect.x + window.scrollX - _position.x + dstRect.width / 2) / _scale,
          y: (dstRect.y + window.scrollY - _position.y + dstRect.height / 2) / _scale
        }
  
        retConnections.push({
          ..._conn,
          srcPos,
          dstPos
        })
      }

      return retConnections
    })
  }, [scale, position])

  useEffect(() => {
    updateConnections();
  }, [scale, position, updateConnections]);

  useEffect(() => {
  const _cm = new Map()

   connections.forEach(conn => {
      _cm.set(`src_` + conn.srcNode + "_" + conn.srcPort, conn);
      _cm.set(`dst_` + conn.dstNode + "_" + conn.dstPort, conn);
    });
    setConnectionsMap(_cm)
  }, [connections])

  const screenRef = useRef()

  const updateXarrow = useXarrow();
  useEffect(() => {
    window.addEventListener('resize', updateXarrow);
    return () => window.removeEventListener('resize', updateXarrow);
  }, [])

  const [isMoveable, setIsMoveable] = useState(false);
  const [canMove, setCanMove] = useState(true);

  const onZoom = useCallback((params) => {
    const _scale = params.state.scale;
    setScale(_scale);

    const _position = {x: params.state.positionX, y: params.state.positionY };
    setPosition(_position);
  }, [])

  const onTransform = useCallback((params) => {  
    const _position = {x: params.state.positionX, y: params.state.positionY };
    setPosition(_position);
  }, [])

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
    updateConnections(newConnections);
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
            <ContextMenu>
              {({ handleContextMenu }) => (
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
                    },
                    onDragLeave: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    },
                    onContextMenu: (e) => handleContextMenu(e, [
                      { label: 'Adicionar nó', onClick: () => {}}
                    ])
                  }}
                  
                  >
                  {cards.map((value, index) => (
                    <Node 
                      key={value.id} 
                      id={value.id}
                      portTypes={portTypes}
                      nodeType={nodeTypes[value.type]}
                      settings={value}
                      connectionsMap={connectionsMap}
                      onChangePosition={(position) => {
                        setCards(prev => [
                          ...prev.slice(0, index),
                          { ...value, position },
                          ...prev.slice(index + 1)
                        ])
                        updateConnections(null, value.id);
                      }}
                      containerRef={screenRef}
                      canMove={canMove}
                      onConnect={onConnect}
                      onContextMenu={(e) => handleContextMenu(e, [
                        { label: 'Clonar este nó', onClick: () => {}}
                      ])}
                      onResize={(size) => {
                        updateConnections(null, value.id);
                      }}
                      />
                  ))}

                  {dragInfo && dstDragPosition && <ConnectorCurve tmp src={{
                    x: (dragInfo.startX + window.scrollX - position.x + 5) / scale,
                    y: (dragInfo.startY + window.scrollY - position.y + 5) / scale
                  }}
                  dst={{
                    x: (dstDragPosition.x + window.scrollX - position.x) / scale,
                    y: (dstDragPosition.y + window.scrollY - position.y) / scale
                  }}
                  scale={scale}
                  />}
                  {connections.map((rel, index) => {
                    return (
                      <ConnectorCurve
                        key={`connector-${rel.srcNode}-${rel.srcPort}-${rel.dstNode}-${rel.dstPort}`}
                        src={rel.srcPos}
                        dst={rel.dstPos}
                        scale={scale}
                        onContextMenu={(e) => handleContextMenu(e, [
                          {label: 'Remover esta conexão', onClick: () => {
                            updateConnections(connections.filter((c, idx) => idx !== index), '');
                          }}
                        ])}
                      />
                    )
                  })}
                </TransformComponent>
              )}
            </ContextMenu>      
          </>
        )}
      </TransformWrapper>
    </div>
      
  );
}

export default NodeContainer;