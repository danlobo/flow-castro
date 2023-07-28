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
import css from './Screen.module.css';

import nodeCss from './Node.module.css'
import nodePortCss from './NodePort.module.css'
import { useTheme } from './ThemeProvider.js';


function Screen({ portTypes, nodeTypes, onChangeState, initialState }) {

  const { currentTheme } = useTheme()

  const style = {
    '--port-size': '20px',
    '--color-primary': currentTheme.colors.primary,
    '--color-secondary': currentTheme.colors.secondary,
    '--color-bg': currentTheme.colors.background,
    '--color-text': currentTheme.colors.text,
    '--color-hover': currentTheme.colors.hover,
  }

  const { dragInfo } = useDragContext()
  const { position, setPosition, scale, setScale } = useScreenContext();

  const [dstDragPosition, setDstDragPosition] = useState({ x: 0, y: 0 })
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 })

  const [state, setState] = useState(initialState)
  const [shouldNotify, setShouldNotify] = useState(false)

  const debounceEvent = useCallback((fn, wait = 200, time) => (...args) =>
    clearTimeout(time, (time = setTimeout(() => fn(...args), wait)))
  , [])

  useEffect(() => {
    if (!initialState) return

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
      nodes: {
        ...(prev.nodes ?? {}),
        [newNode.id]: newNode
      }
    }))
  }, [setStateAndNotify])

  const removeNode = useCallback((id) => {
    const node = state.nodes[id]
    if (!node)  return

    const nodesToRemove = [id]
    const nodesToAdd = []

    node.connections.outputs?.forEach(conn => {
      const otherNode = state.nodes[conn.node]

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
      const otherNode = state.nodes[conn.node]

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

    // change nodes to object[id]

    setStateAndNotify(prev => {
      const newNodes = {
        ...(prev.nodes ?? {}),
      }

      nodesToRemove.forEach(id => {
        delete newNodes[id]
      })
      nodesToAdd.forEach(node => {
        newNodes[node.id] = node
      })

      return {
        ...prev,
        nodes: newNodes
      }
    })
  }, [state, setStateAndNotify])

  const cloneNode = useCallback((id) => {
    const node = state.nodes[id]
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
      nodes: {
        ...(prev.nodes ?? {}),
        [newNode.id]: newNode
      }
    }))
  }, [setStateAndNotify, state])

  const removeConnectionFromOutput = useCallback((srcNode, srcPort, dstNode, dstPort) => {
    setStateAndNotify(prev => {
      const newNodes = {
        ...(prev.nodes ?? {}),
      }

      if (!newNodes[srcNode] || !newNodes[dstNode]) return null

      newNodes[srcNode] = {
        ...newNodes[srcNode],
        connections: {
          ...newNodes[srcNode].connections,
          outputs: newNodes[srcNode].connections.outputs.filter(conn => !(conn.name === srcPort && conn.node === dstNode && conn.port === dstPort))
        }
      }

      newNodes[dstNode] = {
        ...newNodes[dstNode],
        connections: {
          ...newNodes[dstNode].connections,
          inputs: newNodes[dstNode].connections.inputs.filter(conn => !(conn.name === dstPort && conn.node === srcNode && conn.port === srcPort))
        }
      }

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
    const {
      state: {
        positionX,
        positionY,
        scale: _scale
      }
    } = params
    
    setPosition({x: positionX, y: positionY })
    setScale(_scale)
    setStateAndNotify(prev => {
      return {
        ...prev,
        position: {x: positionX, y: positionY },
        scale: _scale
      }
    })
  }, [setPosition, setScale, setStateAndNotify])

  const gridSize = 40;
  const scaledGridSize = gridSize * (scale ?? 1);
  const scaledPositionX = (position?.x ?? 0) % scaledGridSize;
  const scaledPositionY = (position?.y ?? 0) % scaledGridSize;

  const onConnect = useCallback(({ source, target }) => {
    setStateAndNotify(prev => {
      if (!prev?.nodes || !Object.keys(prev.nodes).length) return null;

      const item = {
        srcNode: source.nodeId,
        dstNode: target.nodeId,
        srcPort: source.portName,
        dstPort: target.portName,
      }

      if (item.srcNode === item.dstNode) return;
      
      // deep merge
      const srcNode = JSON.parse(JSON.stringify(prev.nodes[item.srcNode]));
      const dstNode = JSON.parse(JSON.stringify(prev.nodes[item.dstNode]));

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
        srcNode.connections.outputs.push({ name: srcPort.name, node: dstNode.id, port: dstPort.name, type: srcPort.type });
      }

      if (!dstNode.connections.inputs.find(c => c.name === srcPort.name)) {
        dstNode.connections.inputs.push({ name: dstPort.name, node: srcNode.id, port: srcPort.name, type: srcPort.type });
      }

      const nodes = {
        ...prev.nodes,
        [srcNode.id]: srcNode,
        [dstNode.id]: dstNode
      }

      return {
        ...prev,
        nodes
      }
    })
  }, [setStateAndNotify, nodeTypes]);

  const pinchOptions = useMemo(() => ({
    step: 5,
  }), [])
  const panningOptions = useMemo(() => ({
    disabled: isMoveable,
    excluded: [nodeCss.node, 'react-draggable', nodePortCss.port, nodePortCss.portConnector]
  }), [isMoveable])

  const wrapperStyle = useMemo(() => ({
    height: '100vh', 
    width: '100vw',
    backgroundColor: currentTheme.colors.background,
    backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
    backgroundImage: `linear-gradient(to right, ${currentTheme.colors.hover} 1px, transparent 1px), linear-gradient(to bottom, ${currentTheme.colors.hover} 1px, transparent 1px)`,
    backgroundPosition: `${scaledPositionX}px ${scaledPositionY}px`
  }), [scaledGridSize, scaledPositionX, scaledPositionY, currentTheme])


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

  const handleValueChange = useCallback((id, values) => {
    setStateAndNotify(prev => {
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [id]: {
            ...prev.nodes[id],
            values
          }
        }
      }
    })
  }, [setStateAndNotify])


  if (!state) return null

  return (
    <div className={css.container} style={style} ref={screenRef}>
      <TransformWrapper
        initialScale={state?.scale ?? 1}
        initialPositionX={state?.position?.x ?? 0}
        initialPositionY={state?.position?.y ?? 0}
        disabled={isMoveable}
        minScale={.25}
        maxScale={2}
        limitToBounds={false}
        onPanning={onTransform}
        onZoom={onZoom}
        pinch={pinchOptions}
        panning={panningOptions}
        onTransformed={debounceEvent(onTransformEnd, 200)}
      >
        {({ zoomIn, zoomOut, resetTransform, setTransform, centerView,  ...rest }) => {
          return (
            <>
              <div className={[css.panel, css.controlsPanel].join(' ')}>
                <button className={css.controlButton} onClick={() => zoomIn()}>+</button>
                <button className={css.controlButton} onClick={() => zoomOut()}>-</button>
                <button className={css.controlButton} onClick={() => {
                  centerView();
                  setStateAndNotify(prev => ({
                    ...prev,
                    position,
                    scale
                  }))
                }}>C</button>
                <button className={css.controlButton} onClick={() => {
                  setTransform(position.x, position.y, 1);
                  setScale(1);

                  setStateAndNotify(prev => ({
                    ...prev,
                    position,
                    scale: 1
                  }))
                }}>Z</button>
                
                <button className={css.controlButton} onClick={() => setCanMove(!canMove)}>{canMove ? 'L' : 'U'}</button>
              </div>

              <div className={[css.panel, css.statusPanel].join(' ')}>
                <div>Scale: {scale}</div>
                <div>Position: {JSON.stringify(position)}</div>
              </div>
              <ContextMenu>
                {({ handleContextMenu }) => (
                  <TransformComponent 
                    contentClass='main' 
                    wrapperStyle={wrapperStyle}
                    wrapperProps={wrapperProps(handleContextMenu)}
                    >
                    {state?.nodes && Object.values(state.nodes).map((node, index) => {
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
                              handleValueChange(node.id, { ...v.values })
                            }}
                            onChangePosition={(position) => {
                              setState(prev => ({
                                ...prev,
                                nodes: {
                                  ...prev.nodes,
                                  [node.id]: {
                                    ...prev.nodes[node.id],
                                    position
                                  }
                                }
                              }))
                            }}
                            onDragEnd={(position) => {
                              setStateAndNotify(prev => ({
                                ...prev,
                                nodes: {
                                  ...prev.nodes,
                                  [node.id]: {
                                    ...prev.nodes[node.id],
                                    position
                                  }
                                }
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
                                nodes: {
                                  ...prev.nodes,
                                  [node.id]: {
                                    ...prev.nodes[node.id],
                                    size,
                                    connections: {
                                      ...prev.nodes[node.id].connections,
                                      outputs: [ ...(prev.nodes[node.id].connections?.outputs ?? [])],
                                    }
                                  }
                                }
                              }))
                            }}
                          />
                          {node.connections?.outputs?.map((connection, index) => {
                            const srcNode = node.id
                            const srcPort = connection.name
                            const dstNode = connection.node
                            const dstPort = connection.port
                            const connType = connection.type

                            const srcElem = document.getElementById(`card-${srcNode}-output-${srcPort}`);
                            const dstElem = document.getElementById(`card-${dstNode}-input-${dstPort}`);


                            const contRect = screenRef.current?.getBoundingClientRect();
                            if (!srcElem || !dstElem || !contRect) {
                              return null;
                            }

                            const srcRect = srcElem.getBoundingClientRect();
                            const dstRect = dstElem.getBoundingClientRect();
                      
                            const srcPos = {
                              x: (srcRect.x + window.scrollX - position.x - contRect.left + srcRect.width / 2) / scale,
                              y: (srcRect.y + window.scrollY - position.y - contRect.top + srcRect.height / 2) / scale
                            }
                      
                            const dstPos = {
                              x: (dstRect.x + window.scrollX - position.x - contRect.left + dstRect.width / 2) / scale,
                              y: (dstRect.y + window.scrollY - position.y - contRect.top + dstRect.height / 2) / scale
                            }

                            return <ConnectorCurve
                              key={`connector-${srcNode}-${srcPort}-${dstNode}-${dstPort}`}
                              type={portTypes[connType]}
                              src={srcPos}
                              dst={dstPos}
                              scale={scale}
                              onContextMenu={(e) => handleContextMenu(e, [
                                canMove ? {
                                  label: `Remover esta conexão`, 
                                  style: { color: 'red'},
                                  onClick: () => {
                                    removeConnectionFromOutput(srcNode, srcPort, dstNode, dstPort)
                                  }
                                } : null
                              ].filter(Boolean))}
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
          )
        }}
      </TransformWrapper>
    </div>
  );
}

export default Screen;