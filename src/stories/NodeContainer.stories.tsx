import React from 'react';
import { Meta } from '@storybook/react';
import { fn } from '@storybook/test';
import NodeContainer from '../NodeContainer';

const meta:Meta<typeof NodeContainer> = {
  title: 'Example/NodeContainer',
  component: NodeContainer,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },

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

export const Default = Tpl.bind({});
Default.args = {
  theme: null,
  themes: null,
  nodeTypes: {
    string: {
      type: 'string',
      label: 'String',
      description: 'String',
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
    }
  },
  portTypes: {
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
          style={{width: '100%'}}
          value={value ?? ''}
          onChange={(e) => {
            onChange(e.target.value);
            taAdjustHeight(e.target);
          }}
        />
      }
    }
  },
  onChangeState: fn(),
  initialState: {},
  state: {},
  debugMode: false,
}
