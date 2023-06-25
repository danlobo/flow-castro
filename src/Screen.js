import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Node from './Node';
import { 
  TransformWrapper, 
  TransformComponent 
} from "react-zoom-pan-pinch";
import { useDragContext } from './DragContext';
import { useScreenContext } from './ScreenContext';
import { ConnectorCurve } from './ConnectorCurve';
import { ContextMenu } from './ContextMenu';

function NodeContainer({ portTypes, nodeTypes, state, onChangeState }) {
  const { dragInfo } = useDragContext()
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

  const addNode = useCallback((type, pos) => {
    const newNode = {
      name: Math.random().toString(36).substr(2, 9),
      type,
      position: pos,
      values: {}
    }

    onChangeState(prev => ({ ...prev, nodes: [...prev.nodes, newNode]}))
  }, [onChangeState])

  const removeNode = useCallback((name) => {
    const node = state.nodes.find(node => node.name === name)
    if (!node)  return

    const nodesToRemove = [name]
    const nodesToAdd = []

    node.connections.outputs?.forEach(conn => {
      const otherNode = state.nodes.find(node => node.name === conn.node)

      if (!otherNode) return

      nodesToRemove.push(otherNode.name)
      nodesToAdd.push({
        ...otherNode,
        connections: {
          outputs: otherNode.connections.outputs,
          inputs: otherNode.connections.inputs.filter(c => !(c.port === conn.name && c.node === node.name))
        }
      })
    })

    node.connections.inputs?.forEach(conn => {
      const otherNode = state.nodes.find(node => node.name === conn.node)

      if (!otherNode) return

      nodesToRemove.push(otherNode.name)
      nodesToAdd.push({
        ...otherNode,
        connections: {
          outputs: otherNode.connections.outputs.filter(c => !(c.port === conn.name && c.node === node.name)),
          inputs: otherNode.connections.inputs
        }
      })
    })



    onChangeState(prev => ({ 
      ...prev, 
      nodes: [
        ...prev.nodes.filter(node => !nodesToRemove.includes(node.name)),
        ...nodesToAdd
      ]
    }))
  }, [onChangeState, state?.nodes])

  const cloneNode = useCallback((name) => {
    const node = state.nodes.find(node => node.name === name)
    const newNode = {
      ...node,
      name: Math.random().toString(36).substr(2, 9),
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      connections: {
        inputs: [],
        outputs: []
      }
    }

    onChangeState(prev => ({ ...prev, nodes: [...prev.nodes, newNode]}))
  }, [onChangeState, state?.nodes])

  const removeConnectionFromOutput = useCallback((srcNode, srcPort, dstNode, dstPort) => {
    onChangeState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => {
        if (node.name === srcNode) {
          return {
            ...node,
            connections: {
              inputs: node.connections.inputs,
              outputs: node.connections.outputs.filter(conn => !(conn.name === srcPort && conn.node === dstNode && conn.port === dstPort))
            }
          }
        } else if (node.name === dstNode) {
          return {
            ...node,
            connections: {
              inputs: node.connections.inputs.filter(conn => !(conn.name === dstPort && conn.node === srcNode && conn.port === srcPort)),
              outputs: node.connections.outputs
            }
          }
        }

        return node
      })
    }))
  }, [onChangeState])

  const screenRef = useRef()

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

  const gridSize = 40;
  const scaledGridSize = gridSize * scale;
  const scaledPositionX = (position.x) % scaledGridSize;
  const scaledPositionY = (position.y) % scaledGridSize;

  const onConnect = useCallback(({ source, target }) => {
    if (!state?.nodes) return;

    const item = {
      srcNode: source.nodeName,
      dstNode: target.nodeName,
      srcPort: source.portName,
      dstPort: target.portName,
    }

    if (item.srcNode === item.dstNode) return;
    
    const srcNodeIdx = state.nodes.findIndex(n => n.name === item.srcNode);
    const dstNodeIdx = state.nodes.findIndex(n => n.name === item.dstNode);
    
    // deep merge
    const srcNode = JSON.parse(JSON.stringify(state.nodes[srcNodeIdx]));
    const dstNode = JSON.parse(JSON.stringify(state.nodes[dstNodeIdx]));

    const srcPort = nodeTypes[srcNode.type].outputs.find(p => p.name === item.srcPort);
    const dstPort = nodeTypes[dstNode.type].inputs.find(p => p.name === item.dstPort);

    if (srcPort.type !== dstPort.type) return;

    if (!srcNode.connections)   srcNode.connections = {};
    if (!srcNode.connections.outputs) srcNode.connections.outputs = [];
    if (!srcNode.connections.inputs)  srcNode.connections.inputs = [];


    if (!dstNode.connections)   dstNode.connections = {};
    if (!dstNode.connections.outputs) dstNode.connections.outputs = [];
    if (!dstNode.connections.inputs)  dstNode.connections.inputs = [];

    if (!srcNode.connections.outputs.find(c => c.name === dstPort.name)) {
      srcNode.connections.outputs.push({ name: srcPort.name, node: dstNode.name, port: dstPort.name });
    }

    if (!dstNode.connections.inputs.find(c => c.name === srcPort.name)) {
      dstNode.connections.inputs.push({ name: dstPort.name, node: srcNode.name, port: srcPort.name });
    }

    const minNodeIdx = Math.min(srcNodeIdx, dstNodeIdx);
    const maxNodeIdx = Math.max(srcNodeIdx, dstNodeIdx);
    const minNode = srcNodeIdx < dstNodeIdx ? srcNode : dstNode;
    const maxNode = srcNodeIdx < dstNodeIdx ? dstNode : srcNode;

    onChangeState(prev => ({
      ...prev,
      nodes: [
        ...prev.nodes.slice(0, minNodeIdx),
        minNode,
        ...prev.nodes.slice(minNodeIdx + 1, maxNodeIdx),
        maxNode,
        ...prev.nodes.slice(maxNodeIdx + 1)
      ]
    }))
  }, [state?.nodes, onChangeState, nodeTypes]);

  const pinchOptions = useMemo(() => ({
    step: 5,
  }), [])
  const panningOptions = useMemo(() => ({
    disabled: isMoveable,
    excluded: ['node', 'react-draggable', 'port', 'port-connector']
  }), [isMoveable])

  const wrapperStyle = useMemo(() => ({
    height: '100vh', 
    width: '100vw',
    backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
    backgroundImage: `linear-gradient(to right, #CCCCCC 1px, transparent 1px), linear-gradient(to bottom, #CCCCCC 1px, transparent 1px)`,
    backgroundPosition: `${scaledPositionX}px ${scaledPositionY}px`
  }), [scaledGridSize, scaledPositionX, scaledPositionY])

  const wrapperProps = useCallback((handleContextMenu) => ({
    onDragOver: (e) => {
      e.dataTransfer.dropEffect = "move";
      e.dataTransfer.effectAllowed = "move";
    },
    onDragLeave: (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onContextMenu: (e) => handleContextMenu(e, [
      ...Object.values(nodeTypes).sort((a,b) => a.label.localeCompare(b.label)).map(nodeType => ({
        label: `Adicionar ${nodeType.label}`,
        description: nodeType.description,
        onClick: () => {
          const { x, y } = e.target.getBoundingClientRect();
          const position = {
            x: e.clientX, // - x,
            y: e.clientY// - y
          }
          addNode(nodeType.type, position);
        }
      })),
      {
        label: 'Adicionar nó',
        description: 'Adicionar nó',
        children: [
          {
            label: 'Nó de entrada',
            description: 'Nó de entrada',
            onClick: (o) => {console.log('add input node', o)},
            children: [
              {
                label: 'Nó de entrada 1',
                description: 'Nó de entrada 1',
                onClick: (o) => {console.log('add input node 1', o)}
              },
              {
                label: 'Nó de entrada 2',
                description: 'Nó de entrada 2',
                onClick: (o) => {console.log('add input node 2', o)}
              },
            ]
          },
          {
            label: 'Nó de saída',
            description: 'Nó de saída',
            onClick: (o) => {console.log('add output node', o)},
            children: [
              {
                label: 'Nó de saída 1',
                description: 'Nó de saída 1',
                onClick: (o) => {console.log('add output node 1', o)}
              },
              {
                label: 'Nó de saída 2',
                description: 'Nó de saída 2',
                onClick: (o) => {console.log('add output node 2', o)}
              },
            ]
          },
        ]
      }
    ])
  }), [])

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
        pinch={pinchOptions}
        panning={panningOptions}
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
                  wrapperStyle={wrapperStyle}
                  wrapperProps={wrapperProps(handleContextMenu)}
                  >
                  {state?.nodes?.map((node, index) => {
                    return (
                      <>
                        <Node 
                          key={node.name} 
                          name={node.name}
                          portTypes={portTypes}
                          nodeType={nodeTypes?.[node.type]}
                          value={node}
                          onValueChange={(v) => {
                            onChangeState(prev => ({
                              ...prev,
                              nodes: [
                                ...prev.nodes.slice(0, index),
                                { ...prev.nodes[index], values: {...v.values } },
                                ...prev.nodes.slice(index + 1)
                              ]
                            }))
                          }}
                          onChangePosition={(position) => {
                            console.log('onChangePosition', position)

                            onChangeState(prev => ({
                              ...prev,
                              nodes: [
                                ...prev.nodes.slice(0, index),
                                { ...prev.nodes[index], position },
                                ...prev.nodes.slice(index + 1)
                              ]
                            }))
                          }}
                          containerRef={screenRef}
                          canMove={canMove}
                          onConnect={onConnect}
                          onContextMenu={(e) => handleContextMenu(e, [
                            { label: 'Clonar este nó', onClick: () => {
                              cloneNode(node.name)
                            }},
                            { 
                              label: `Remover este nó`, 
                              style: { color: 'red'},
                              onClick: () => {
                                removeNode(node.name)
                              }
                            }
                          ])}
                          onResize={(size) => {
                            // O objetivo aqui é disparar a renderização das conexões.
                            // Se houver um modo melhor, por favor, me avise.
                            console.log('onResize', size)
                            onChangeState(prev => ({
                              ...prev,
                              nodes: [
                                ...prev.nodes.slice(0, index),
                                { 
                                  ...prev.nodes[index], 
                                  connections: {
                                    ...prev.nodes[index].connections,
                                    outputs: [ ...(prev.nodes[index].connections?.outputs ?? [])],
                                  },
                                  size 
                                },
                                ...prev.nodes.slice(index + 1)
                              ]
                            }))
                          }}
                        />
                        {node.connections?.outputs?.map((connection, index) => {
                          const srcNode = node.name
                          const srcPort = connection.name
                          const dstNode = connection.node
                          const dstPort = connection.port

                          const srcElem = document.getElementById(`card-${srcNode}-output-${srcPort}`);
                          const dstElem = document.getElementById(`card-${dstNode}-input-${dstPort}`);
                    
                          if (!srcElem || !dstElem) {
                            return null;
                          }
                    
                          const srcRect = srcElem.getBoundingClientRect();
                          const dstRect = dstElem.getBoundingClientRect();
                    
                          const srcPos = {
                            x: (srcRect.x + window.scrollX - position.x + srcRect.width / 2) / scale,
                            y: (srcRect.y + window.scrollY - position.y + srcRect.height / 2) / scale
                          }
                    
                          const dstPos = {
                            x: (dstRect.x + window.scrollX - position.x + dstRect.width / 2) / scale,
                            y: (dstRect.y + window.scrollY - position.y + dstRect.height / 2) / scale
                          }

                          return <ConnectorCurve
                            key={`connector-${srcNode}-${srcPort}-${dstNode}-${dstPort}`}
                            src={srcPos}
                            dst={dstPos}
                            scale={scale}
                            onContextMenu={(e) => handleContextMenu(e, [
                              {
                                label: `Remover esta conexão`, 
                                style: { color: 'red'},
                                onClick: () => {
                                  removeConnectionFromOutput(srcNode, srcPort, dstNode, dstPort)
                                }
                              }
                            ])}
                          />
                        })}
                      </>
                    )
                  })}

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