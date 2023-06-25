import { useEffect, useMemo, useState } from 'react';
import './App.css'
import NodeContainer from './NodeContainer';

function App() {

  const portTypes = useMemo(() => ({
    string: { 
      type: 'string', 
      label: 'String', 
      color: '#f80',
      shape: 'circle',
      render({ value, onChange }) {
        return <textarea style={{width: '100%'}} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
     }
    },
    number: { 
      type: 'number', 
      label: 'Número',
      color: '#33f', 
      shape: 'diamond',
      render({ value, onChange }) {
        return <input type="tel" style={{width: '100%'}} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
     }
    },
  }), [])

  const nodeTypes = useMemo(() => ({
    string: {
      type: 'string',
      label: 'String',
      description: 'Cadeia de caracteres',
      inputs: [
        { type: 'string', name: 'string1', label: 'input 1' },
        { type: 'string', name: 'string2', label: 'input 2' }
      ],
      outputs: [
        { type: 'string', name: 'strOut', label: 'output 1' }
      ],
      resolve: (inputs) => {
        return { strOut: inputs.string1 + inputs.string2 }
      }
    },
    number: {
      type: 'number',
      label: 'Número',
      description: 'Número',
      inputs: [
        { type: 'number', name: 'number', label: 'input 1' }
      ],
      outputs: [
        { type: 'number', name: 'number', label: 'output 1' }
      ],
    },    
  }), [])

  const [state, setState] = useState()

  const MAX_CARDS = 2
  useEffect(() => {
    if (!localStorage.getItem('state')) {
      const _cards = []
      for(let i = 0; i < MAX_CARDS; i++) {
        _cards.push({
          id: i,
          type: 'string',
          name: `Card ${i}`,
          position: { x: (i * 350) % 1050, y: Math.round((i / 3) * 300) },
          values:{},
        })
      }

      setState({ nodes: _cards })
      localStorage.setItem('state', JSON.stringify({ nodes: _cards }))
    } else {
      const _state = JSON.parse(localStorage.getItem('state'))
      setState(_state)
    }
  }, [])

  useEffect(() => {
    if (state) {
      localStorage.setItem('state', JSON.stringify(state))
    }
  }, [state])

  return <div style={{ height: '100%'}}>
    <NodeContainer portTypes={portTypes} nodeTypes={nodeTypes} state={state} onChangeState={setState} />
  </div>
}

export default App;