import React from 'react';
import { Meta } from '@storybook/react';
import { fn } from '@storybook/test';
import NodeContainer from '../NodeContainer';

const meta: Meta<typeof NodeContainer> = {
  title: 'Example/NodeContainer',
  component: NodeContainer,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  argTypes: {
    viewMode: {
      options: ['select', 'move'],
      control: { type: 'radio' }
    }
  }

  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
} satisfies Meta<typeof NodeContainer>;

export default meta;

const Tpl = (args) => {
  const [state, setState] = React.useState(args.initialState)

  return <div style={{ height: '100vh', width: '100vw', display: 'flex' }}><NodeContainer initialState={state}
    onChangeState={(v) => {
      setState(v)
    }} {...args} /></div>
};

const nodeTypes = {
  string: {
    type: 'string',
    label: 'String',
    description: 'String',
    category: 'Text',
    inputs() {
      return [{
        name: 'string',
        type: 'string',
        label: 'String'

      }]
    },
    outputs() {
      return [{
        name: 'string',
        type: 'string',
        label: 'String'
      }]
    },
    resolveOutputs: async (inputValues) => {
      const msg = inputValues.string?.replace(/\{\{([^}]+)\}\}/g, (match, p1) => {
        return inputValues[p1] ?? `{{${p1}}}`
      }) ?? ''

      return {
        string: msg
      }
    }
  },
  string2: {
    type: 'string',
    label: 'String 2',
    description: 'String 2',
    category: 'Text',
    inputs() {
      return [{
        name: 'string',
        type: 'string',
        label: 'String'

      }]
    },
    outputs() {
      return [{
        name: 'string',
        type: 'string',
        label: 'String'
      }]
    },
    resolveOutputs: async (inputValues) => {
      const msg = inputValues.string?.replace(/\{\{([^}]+)\}\}/g, (match, p1) => {
        return inputValues[p1] ?? `{{${p1}}}`
      }) ?? ''

      return {
        string: msg
      }
    }
  },
  number: {
    type: 'number',
    label: 'Number',
    description: 'Number',
    category: 'Numeric',
    inputs() {
      return [{
        name: 'number',
        type: 'number',
        label: 'Number'
      }]
    },
    outputs() {
      return [{
        name: 'number',
        type: 'number',
        label: 'Number'
      }]
    },
    resolveOutputs: async (inputValues) => {
      const number = +inputValues.number
      return {
        number
      }
    }
  }
}

const portTypes = {
  string: {
    type: 'string',
    label: 'String',
    shape: 'circle',
    color: "#FFD700",
    render({ value, onChange }) {
      const taAdjustHeight = (elem) => {
        const ta = elem;
        ta.style.height = '0';
        ta.style.height = ta.scrollHeight + 2 + 'px';
      }

      return <textarea
        style={{ width: '100%' }}
        value={value ?? ''}
        onChange={(e) => {
          onChange(e.target.value);
          taAdjustHeight(e.target);
        }}
      />
    }
  },
  number: {
    type: 'number',
    label: 'Number',
    shape: 'square',
    color: "#FF00D7",
    render({ value, onChange }) {
      return <input
        type="number"
        style={{ width: '100%' }}
        value={value ?? ''}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
    }
  }
}

const waypointsState = {
  nodes: {
    "aNTeXvPpCC85NtQdNMJSZ": {
      "id": "aNTeXvPpCC85NtQdNMJSZ", "name": "String", "type": "string", "position": { "x": 33, "y": 54 }, "values": {}, "size": { "width": 450, "height": 140.4375 }, "connections": { "outputs": [{ "name": "string", "node": "ndV7WRH_1bMPj05xOur7A", "port": "string", "type": "string", "waypoints": [{ "x": 686, "y": 251 }] }], "inputs": [] }
    },
    "ndV7WRH_1bMPj05xOur7A": {
      "id": "ndV7WRH_1bMPj05xOur7A", "name": "String", "type": "string", "position": { "x": 840, "y": 40 }, "values": { "string": null }, "size": { "width": 450, "height": 107.4375 }, "connections": { "outputs": [], "inputs": [{ "name": "string", "node": "aNTeXvPpCC85NtQdNMJSZ", "port": "string", "type": "string" }] }
    }
  }
}

export const Default = Tpl.bind({});
Default.args = {
  theme: null,
  themes: null,
  nodeTypes,
  portTypes,
  onChangeState: fn(),
  initialState: {},
  state: {},
  debugMode: false,
  viewMode: 'select'
}

export const Waypoints = Tpl.bind({});
Waypoints.args = {
  theme: null,
  themes: null,
  nodeTypes,
  portTypes,
  onChangeState: fn(),
  initialState: waypointsState,
  state: {},
  debugMode: false,
  viewMode: 'select'
}