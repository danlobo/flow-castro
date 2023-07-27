import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Node from './Node.jsx';
import { 
  TransformWrapper, 
  TransformComponent 
} from "react-zoom-pan-pinch";
import { useDragContext } from './DragContext.jsx';
import { useScreenContext } from './ScreenContext.jsx';
import { ConnectorCurve } from './ConnectorCurve.jsx';
import { ContextMenu } from './ContextMenu.jsx';
import { nanoid } from 'nanoid';

function NodeContainer({ portTypes, nodeTypes, onChangeState, initialState }) {
  const { dragInfo } = useDragContext()
  const { position, setPosition, scale, setScale } = useScreenContext();

  const [dstDragPosition, setDstDragPosition] = useState({ x: 0, y: 0 })
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 })

  const [state, setState] = useState(initialState)
  const [shouldNotify, setShouldNotify] = useState(false)

  useEffect(() => {
    if (!initialState) return

    console.log('initialState', initialState)

    setScale(initialState.scale)
    setPosition(initialState.position)
  }, [])

  const setStateAndNotify = useCallback((cb) => {
    setState(prev => {
      const newState = cb(prev)
      setShouldNotify(true)
      return newState
    })
  }, [setState])

  useEffect(() => {
    if (shouldNotify) {
        onChangeState(state);
        setShouldNotify(false);
    }
}, [state, shouldNotify, onChangeState]);

  useEffect(() => {
    if (!dragInfo) {
      setDstDragPosition(null)
      return
    }

    //const { startX, startY } = dragInfo

    const mouseMoveListener = (event) => {
      setPointerPosition({
        x: event.pageX - window.scrollX,
        y: event.pageY - window.scrollY,
      })

      const dx = event.pageX //- startX
      const dy = event.pageY //- startY

      setDstDragPosition({ x: dx, y: dy })
    }

    window.addEventListener('mousemove', mouseMoveListener)
    return () => {
      window.removeEventListener('mousemove', mouseMoveListener)
    }
  }, [dragInfo])

  const addNode = useCallback((nodeType, pos) => {
    const newNode = {
      id: nanoid(),
      name: nodeType.label,
      type: nodeType.type,
      position: pos,
      values: {}
    }

    setStateAndNotify(prev => ({
      ...prev,
      nodes: [
        ...(prev.nodes ?? []),
        newNode
      ]
    }))
  }, [setStateAndNotify])

  const removeNode = useCallback((id) => {
    const node = state.nodes?.find(node => node.id === id)
    if (!node)  return

    const nodesToRemove = [id]
    const nodesToAdd = []

    node.connections.outputs?.forEach(conn => {
      const otherNode = state.nodes?.find(node => node.id === conn.node)

      if (!otherNode) return

      nodesToRemove.push(otherNode.id)
      nodesToAdd.push({
        ...otherNode,
        connections: {
          outputs: otherNode.connections.outputs,
          inputs: otherNode.connections.inputs.filter(c => !(c.port === conn.name && c.node === node.id))
        }
      })
    })

    node.connections.inputs?.forEach(conn => {
      const otherNode = state.nodes?.find(node => node.id === conn.node)

      if (!otherNode) return

      nodesToRemove.push(otherNode.id)
      nodesToAdd.push({
        ...otherNode,
        connections: {
          outputs: otherNode.connections.outputs.filter(c => !(c.port === conn.name && c.node === node.id)),
          inputs: otherNode.connections.inputs
        }
      })
    })

    setStateAndNotify(prev => ({
      ...prev,
      nodes: [
        ...(prev.nodes?.filter(node => !nodesToRemove.includes(node.id)) ?? []),
        ...nodesToAdd
      ]
    }))
  }, [state, onChangeState])

  const cloneNode = useCallback((id) => {
    const node = state.nodes?.find(node => node.id === id)
    if (!node)  return

    const newNode = {
      ...node,
      id: nanoid(),
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      connections: {
        inputs: [],
        outputs: []
      }
    }

    setStateAndNotify(prev => ({
      ...prev,
      nodes: [
        ...(prev.nodes ?? []),
        newNode
      ]
    }))
  }, [setStateAndNotify, state])

  const removeConnectionFromOutput = useCallback((srcNode, srcPort, dstNode, dstPort) => {
    setStateAndNotify(prev => {
      const newNodes = [
        ...(prev.nodes?.map(node => {
          if (node.id === srcNode) {
            return {
              ...node,
              connections: {
                inputs: node.connections.inputs,
                outputs: node.connections.outputs.filter(conn => !(conn.name === srcPort && conn.node === dstNode && conn.port === dstPort))
              }
            }
          } else if (node.id === dstNode) {
            return {
              ...node,
              connections: {
                inputs: node.connections.inputs.filter(conn => !(conn.name === dstPort && conn.node === srcNode && conn.port === srcPort)),
                outputs: node.connections.outputs
              }
            }
          }

          return node
        })  ?? [])
      ]

    return {
      ...prev,
      nodes: newNodes
    }
  })
  }, [setStateAndNotify])

  const screenRef = useRef()

  const [isMoveable, setIsMoveable] = useState(false);
  const [canMove, setCanMove] = useState(true);

  const onZoom = useCallback((params) => {
    const _scale = params.state.scale;
    setScale(_scale);

    const _position = {x: params.state.positionX, y: params.state.positionY };
    setPosition(_position);
  }, [setPosition, setScale])

  const onZoomEnd = useCallback((params) => {
    setStateAndNotify(prev => {
      const _scale = params.state.scale;
      const _position = {x: params.state.positionX, y: params.state.positionY };

      return {
        ...prev,
        scale: _scale,
        position: _position
      }
    })
  }, [setStateAndNotify])

  const onTransform = useCallback((params) => {  
    const _position = {x: params.state.positionX, y: params.state.positionY };
    setPosition(_position);
  }, [setPosition])

  const onTransformEnd = useCallback((params) => {
    setStateAndNotify(prev => {

      const _position = {x: params.state.positionX, y: params.state.positionY } 

      return {
        ...prev,
        position: _position
      }
    })
  }, [setStateAndNotify])

  const gridSize = 40;
  const scaledGridSize = gridSize * (scale ?? 1);
  const scaledPositionX = (position?.x ?? 0) % scaledGridSize;
  const scaledPositionY = (position?.y ?? 0) % scaledGridSize;

  const onConnect = useCallback(({ source, target }) => {
    setStateAndNotify(prev => {
      if (!prev?.nodes?.length) return null;

      const item = {
        srcNode: source.nodeId,
        dstNode: target.nodeId,
        srcPort: source.portName,
        dstPort: target.portName,
      }

      if (item.srcNode === item.dstNode) return;
      
      const srcNodeIdx = prev.nodes.findIndex(n => n.id === item.srcNode);
      const dstNodeIdx = prev.nodes.findIndex(n => n.id === item.dstNode);
      
      // deep merge
      const srcNode = JSON.parse(JSON.stringify(prev.nodes[srcNodeIdx]));
      const dstNode = JSON.parse(JSON.stringify(prev.nodes[dstNodeIdx]));

      const srcPort = nodeTypes[srcNode.type].outputs(srcNode.values).find(p => p.name === item.srcPort);
      const dstPort = nodeTypes[dstNode.type].inputs(dstNode.values).find(p => p.name === item.dstPort);

      if (srcPort.type !== dstPort.type) return;

      if (!srcNode.connections)   srcNode.connections = {};
      if (!srcNode.connections.outputs) srcNode.connections.outputs = [];
      if (!srcNode.connections.inputs)  srcNode.connections.inputs = [];


      if (!dstNode.connections)   dstNode.connections = {};
      if (!dstNode.connections.outputs) dstNode.connections.outputs = [];
      if (!dstNode.connections.inputs)  dstNode.connections.inputs = [];

      if (!srcNode.connections.outputs.find(c => c.name === dstPort.name)) {
        srcNode.connections.outputs.push({ name: srcPort.name, node: dstNode.id, port: dstPort.name });
      }

      if (!dstNode.connections.inputs.find(c => c.name === srcPort.name)) {
        dstNode.connections.inputs.push({ name: dstPort.name, node: srcNode.id, port: srcPort.name });
      }

      const minNodeIdx = Math.min(srcNodeIdx, dstNodeIdx);
      const maxNodeIdx = Math.max(srcNodeIdx, dstNodeIdx);
      const minNode = srcNodeIdx < dstNodeIdx ? srcNode : dstNode;
      const maxNode = srcNodeIdx < dstNodeIdx ? dstNode : srcNode;

      return {
        ...prev,
        nodes: [
          ...prev.nodes.slice(0, minNodeIdx),
          minNode,
          ...prev.nodes.slice(minNodeIdx + 1, maxNodeIdx),
          maxNode,
          ...prev.nodes.slice(maxNodeIdx + 1)
        ]
      }
    })
  }, [setStateAndNotify, nodeTypes]);

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


  const nodeTypesByCategory = useMemo(() => {
    const categories = Object.values(nodeTypes).reduce((acc, nodeType) => {
      const _category = nodeType.category ?? '...';
      if (!acc[_category]) acc[_category] = [];
      acc[_category].push(nodeType);
      return acc;
    }, {})

    return Object.entries(categories).map(([category, nodeTypes]) => ({
      category,
      nodeTypes
    }))
  }, [nodeTypes])

  const wrapperProps = useCallback((handleContextMenu) => ({
    onDragOver: (e) => {
      e.dataTransfer.dropEffect = "move";
      e.dataTransfer.effectAllowed = "move";
    },
    onDragLeave: (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onContextMenu: (e) => handleContextMenu(e, nodeTypesByCategory
      .map(({ category, nodeTypes }) => ({
        label: category,
        children: nodeTypes.sort((a,b) => a.label.localeCompare(b.label)).map(nodeType => ({
          label: `Adicionar ${nodeType.label}`,
          description: nodeType.description,
          onClick: () => {
            const { x, y } = e.target.getBoundingClientRect();
            const position = {
              x: e.clientX, // - x,
              y: e.clientY// - y
            }
            addNode(nodeType, position);
          }
        }))
      }))
    )
  }), [nodeTypesByCategory, addNode])

  const handleValueChange = useCallback((index, values) => {
    setStateAndNotify(prev => {
      return {
        ...prev,
        nodes: [
          ...prev.nodes.slice(0, index),
          { ...prev.nodes[index], values: {...values } },
          ...prev.nodes.slice(index + 1)
        ]
      }
    })
  }, [setStateAndNotify])


  if (!state) return null

  return (
    <div style={{ position: 'relative', border: `1px solid blue` }}>
      <TransformWrapper
        initialScale={state?.scale ?? 1}
        initialPositionX={state?.position?.x ?? 0}
        initialPositionY={state?.position?.y ?? 0}
        disabled={isMoveable}
        minScale={.25}
        maxScale={2}
        limitToBounds={false}
        onPanning={onTransform}
        onPanningStop={onTransformEnd}
        onZoom={onZoom}
        onZoomStop={onZoomEnd}
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
              <button style={{ width: '30px', height: '30px' }} onClick={() => {
                centerView();
                setStateAndNotify(prev => ({
                  ...prev,
                  position,
                  scale
                }))
              }}>C</button>
              <button style={{ width: '30px', height: '30px' }} onClick={() => {
                setTransform(position.x, position.y, 1);
                setScale(1);

                setStateAndNotify(prev => ({
                  ...prev,
                  position,
                  scale: 1
                }))
              }}>Z</button>
              
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
                          id={`node_${node.id}`}
                          key={`node_${node.id}`} 
                          name={node.name}
                          portTypes={portTypes}
                          nodeType={nodeTypes?.[node.type]}
                          value={node}
                          onValueChange={(v) => {
                            handleValueChange(index, { ...v.values })
                          }}
                          onChangePosition={(position) => {
                            setState(prev => ({
                              ...prev,
                              nodes: [
                                ...prev.nodes.slice(0, index),
                                { ...prev.nodes[index], position },
                                ...prev.nodes.slice(index + 1)
                              ]
                            }))
                          }}
                          onDragEnd={(position) => {
                            setStateAndNotify(prev => ({
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
                              cloneNode(node.id)
                            }},
                            { 
                              label: `Remover este nó`, 
                              style: { color: 'red'},
                              onClick: () => {
                                removeNode(node.id)
                              }
                            }
                          ])}
                          onResize={(size) => {
                            // O objetivo aqui é disparar a renderização das conexões.
                            // Se houver um modo melhor, por favor, me avise.
                            setState(prev => ({
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
                          const srcNode = node.id
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