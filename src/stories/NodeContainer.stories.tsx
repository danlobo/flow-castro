import React from 'react';
import { Meta } from '@storybook/react';
import { fn } from '@storybook/test';
import NodeContainer from '../NodeContainer';
import { ThemeProvider } from '../ThemeProvider';

const meta: Meta<typeof NodeContainer> = {
  title: 'Example/NodeContainer',
  component: NodeContainer,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    viewMode: {
      options: ['select', 'move'],
      control: { type: 'radio' }
    }
  }

} satisfies Meta<typeof NodeContainer>;

export default meta;

const Tpl = (args) => {
  const [state, setState] = React.useState(args.initialState)

  return <div style={{ height: '100vh', width: '100vw', display: 'flex' }}>
    <ThemeProvider theme={args.theme} themes={args.themes}>
      <NodeContainer initialState={state}
        onChangeState={(v) => {
          setState(v)
        }} {...args} />
    </ThemeProvider>
  </div>
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

const sandboxState = {
  nodes: { "gm2J1u2gIgWJH5Pw4GBty": { "id": "gm2J1u2gIgWJH5Pw4GBty", "name": "Comment", "type": "comment", "position": { "x": 40, "y": 40 }, "values": {}, "size": { "w": 320, "h": 200 }, "title": "Hello!", "value": "This is your canvas. You can zoom, pan and design your flow.\nTry to right click inside it, add some elements and link their ports!", "connections": {} } }
}

export const Sandbox = Tpl.bind({});
Sandbox.args = {
  theme: null,
  themes: null,
  nodeTypes,
  portTypes,
  onChangeState: fn(),
  initialState: sandboxState,
  state: {},
  debugMode: false,
  viewMode: 'select'
}


const waypointsState = {
  nodes: { "aNTeXvPpCC85NtQdNMJSZ": { "id": "aNTeXvPpCC85NtQdNMJSZ", "name": "String", "type": "string", "position": { "x": 40, "y": 280 }, "values": {}, "size": { "width": 450, "height": 148.4375 }, "connections": { "outputs": [{ "name": "string", "node": "ndV7WRH_1bMPj05xOur7A", "port": "string", "type": "string", "waypoints": [{ "x": 686, "y": 491 }] }], "inputs": [] } }, "ndV7WRH_1bMPj05xOur7A": { "id": "ndV7WRH_1bMPj05xOur7A", "name": "String", "type": "string", "position": { "x": 840, "y": 280 }, "values": { "string": null }, "size": { "width": 450, "height": 109.4375 }, "connections": { "outputs": [], "inputs": [{ "name": "string", "node": "aNTeXvPpCC85NtQdNMJSZ", "port": "string", "type": "string" }] } }, "Pi8131hof8YwxwzwnApkQ": { "id": "Pi8131hof8YwxwzwnApkQ", "name": "Comment", "type": "comment", "position": { "x": 40, "y": 40 }, "values": {}, "connections": {}, "size": { "w": 320, "h": 200 }, "value": "FlowCastro supports links between ports and waypoints to manage those links. Try right clicking into a connection to see the options.", "title": "Waypoints" } }
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

const selectionsState = {
  nodes: { "aNTeXvPpCC85NtQdNMJSZ": { "id": "aNTeXvPpCC85NtQdNMJSZ", "name": "String", "type": "string", "position": { "x": 40, "y": 280 }, "values": {}, "size": { "width": 450, "height": 148.4375 }, "connections": { "outputs": [{ "name": "string", "node": "ndV7WRH_1bMPj05xOur7A", "port": "string", "type": "string", "waypoints": [{ "x": 686, "y": 491 }] }], "inputs": [] } }, "ndV7WRH_1bMPj05xOur7A": { "id": "ndV7WRH_1bMPj05xOur7A", "name": "String", "type": "string", "position": { "x": 840, "y": 280 }, "values": { "string": null }, "size": { "width": 450, "height": 109.4375 }, "connections": { "outputs": [], "inputs": [{ "name": "string", "node": "aNTeXvPpCC85NtQdNMJSZ", "port": "string", "type": "string" }] } }, "Pi8131hof8YwxwzwnApkQ": { "id": "Pi8131hof8YwxwzwnApkQ", "name": "Comment", "type": "comment", "position": { "x": 40, "y": 40 }, "values": {}, "connections": {}, "size": { "w": 320, "h": 200 }, "value": "FlowCastro supports selections of nodes, waypoints and comments. Try dragging the mouse over the elements. Move, copy and/or paste them!", "title": "Selections" } }
}

export const Selections = Tpl.bind({});
Selections.args = {
  theme: null,
  themes: null,
  nodeTypes,
  portTypes,
  onChangeState: fn(),
  initialState: selectionsState,
  state: {},
  debugMode: false,
  viewMode: 'select'
}

const darkModeState = {
  nodes: { "aNTeXvPpCC85NtQdNMJSZ": { "id": "aNTeXvPpCC85NtQdNMJSZ", "name": "String", "type": "string", "position": { "x": 40, "y": 280 }, "values": {}, "size": { "width": 450, "height": 148.4375 }, "connections": { "outputs": [{ "name": "string", "node": "ndV7WRH_1bMPj05xOur7A", "port": "string", "type": "string", "waypoints": [{ "x": 686, "y": 491 }] }], "inputs": [] } }, "ndV7WRH_1bMPj05xOur7A": { "id": "ndV7WRH_1bMPj05xOur7A", "name": "String", "type": "string", "position": { "x": 840, "y": 280 }, "values": { "string": null }, "size": { "width": 450, "height": 109.4375 }, "connections": { "outputs": [], "inputs": [{ "name": "string", "node": "aNTeXvPpCC85NtQdNMJSZ", "port": "string", "type": "string" }] } }, "Pi8131hof8YwxwzwnApkQ": { "id": "Pi8131hof8YwxwzwnApkQ", "name": "Comment", "type": "comment", "position": { "x": 40, "y": 40 }, "values": {}, "connections": {}, "size": { "w": 320, "h": 200 }, "value": "You can change themes dinamically if you wish. By default, Flow Castro has two themes: light and dark.", "title": "Dark mode" } }
}

export const DarkMode = Tpl.bind({});
DarkMode.args = {
  theme: 'dark',
  themes: null,
  nodeTypes,
  portTypes,
  onChangeState: fn(),
  initialState: darkModeState,
  state: {},
  debugMode: false,
  viewMode: 'select'
}


const portTypesState = {
  nodes: { "aNTeXvPpCC85NtQdNMJSZ": { "id": "aNTeXvPpCC85NtQdNMJSZ", "name": "String", "type": "string", "position": { "x": 40, "y": 280 }, "values": {}, "size": { "width": 450, "height": 148.4375 }, "connections": { "outputs": [], "inputs": [] } }, "ndV7WRH_1bMPj05xOur7A": { "id": "ndV7WRH_1bMPj05xOur7A", "name": "String", "type": "string", "position": { "x": 840, "y": 280 }, "values": { "string": null }, "size": { "width": 450, "height": 148.4375 }, "connections": { "outputs": [], "inputs": [] } }, "Pi8131hof8YwxwzwnApkQ": { "id": "Pi8131hof8YwxwzwnApkQ", "name": "Comment", "type": "comment", "position": { "x": 40, "y": 40 }, "values": {}, "connections": {}, "size": { "w": 320, "h": 200 }, "value": "Each port has a specific type, and can only be connected like with like.\n\nTry linking the output string port to a number port. You'll see it will fail because the types don’t match.\n\nAfter, try to link the output string port to the input string port.", "title": "Port types" }, "_G0zi40TBmH1_XVOdV-Nm": { "id": "_G0zi40TBmH1_XVOdV-Nm", "name": "Number", "type": "number", "position": { "x": 840, "y": 80 }, "values": {}, "size": { "width": 450, "height": 128.4375 }, "connections": { "outputs": [] } } }
}

export const PortTypes = Tpl.bind({});
PortTypes.args = {
  theme: null,
  themes: null,
  nodeTypes,
  portTypes,
  onChangeState: fn(),
  initialState: portTypesState,
  state: {},
  debugMode: false,
  viewMode: 'select'
}