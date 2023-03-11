import { useEffect, useRef, useState } from 'react';
import Node from './Node';
import { 
  TransformWrapper, 
  TransformComponent 
} from "react-zoom-pan-pinch";
import Xarrow, { useXarrow, Xwrapper } from 'react-xarrows';

function NodeContainer() {
  const [scale, setScale] = useState(1);
  const [transform, setTransform] = useState({ x: 0, y: 0 });

  const [cards, setCards] = useState([
    { 
      id: 2, 
      name: 'Daniel', 
      position: { x: 100, y: 0 },
      outputPorts: [
        { id: 1, label: 'output 1' },
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

  const [connections, setConnections] = useState([
    { srcNode: 2, dstNode: 3, srcPort: 1, dstPort: 1 }
  ]);

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

  const onZoom = (params) => {
    setScale(params.state.scale);
    updateXarrow(params)
  }

  const onTransform = (params) => {  
    setTransform({x: params.state.positionX, y: params.state.positionY });
    updateXarrow(params)
  }

  const gridSize = 40;
  const scaledGridSize = gridSize * scale;
  const scaledPositionX = (transform.x) % scaledGridSize;
  const scaledPositionY = (transform.y) % scaledGridSize;

  //hashed list
  const connectionsHash = connections.reduce((acc, curr) => {
    const { srcNode, dstNode, srcPort, dstPort } = curr;
    const key = `${srcNode}-${dstNode}-${srcPort}-${dstPort}`;
    acc[key] = curr;
    return acc;
  }, {});

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
        {({ zoomIn, zoomOut, resetTransform, setTransform, ...rest }) => (
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
              <button style={{ width: '30px', height: '30px' }} onClick={() => {setTransform(transform.x, transform.y, 1); setScale(1);} }>Z</button>
              
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
              <div>Transform: {JSON.stringify(transform)}</div>
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
                  key={index} 
                  id={value.id}
                  name={value.name}
                  position={value.position}
                  onChangePosition={(position) => setCards(prev => [
                    ...prev.slice(0, index),
                    { ...value, position },
                    ...prev.slice(index + 1)
                  ])}
                  scale={scale}
                  containerRef={screenRef}
                  // onDrag={onDrag} 
                  // onStop={onStop}
                  inputPorts={value.inputPorts}
                  outputPorts={value.outputPorts}
                  // canMove={canMove}
                  // onOutputPortConnected={handleOutputPortConnected}
                  />
              ))}
            </TransformComponent>
            <Xwrapper>
                {connections.map((rel, index) => (
                  <Xarrow 
                  key={index}
                  headShape={'arrow1'}
                  tailShape={'circle'}
                  arrowTailProps={{stroke:"#9BA1A6",strokeWidth:".2",fill:'#1A1D1E',fillOpacity:'0.1'}}
                  arrowHeadProps={{stroke:"#9BA1A6",strokeWidth:".2",fill:'#1A1D1E',fillOpacity:'0.1'}}
                  headSize={10 * scale}
                  tailSize={0}
                  path={'smooth'}
                  showHead={true}
                  showTail={false}
                  startAnchor={['right', 'left']}
                  endAnchor={['left', 'right']}
                  color={'#9BA1A6'}
                  start={`card-${rel.srcNode}-output-${rel.srcPort}`} 
                  end={`card-${rel.dstNode}-input-${rel.dstPort}`} 
                  strokeWidth={1.5}
                  curveness={0.5}
                />
              ))}
            </Xwrapper>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

export default NodeContainer;