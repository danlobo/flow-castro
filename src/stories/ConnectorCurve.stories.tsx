import React from 'react';
import { Meta, StoryObj } from "@storybook/react";
import { ConnectorCurve } from "../ConnectorCurve";
import { fn } from "@storybook/test";

const meta = {
  title: 'Example/ConnectorCurve',
  component: ConnectorCurve,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },

  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {
    onContextMenu: fn(),
  }
} satisfies Meta<typeof ConnectorCurve>;

export default meta;

type Story = StoryObj<typeof meta>;
export const Forward: Story = {
  args: {
    src: {x: 100, y: 100},
    dst: {x: 200, y: 200},
    scale: 1,
    type: null,
    index: 0,
    n1Box: null,
    n2Box: null,
    tmp: true
  }
};

export const Backwards: Story = {
  args: {
    src: {x: 200, y: 200},
    dst: {x: 100, y: 100},
    scale: 1,
    type: null,
    index: 0,
    n1Box: { x: 200, y: 200, w: 10, h: 10 },
    n2Box: { x: 100, y: 100, w: 10, h: 10 },
    tmp: true
  },
};