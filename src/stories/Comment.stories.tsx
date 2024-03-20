import React from 'react';
import { Meta, StoryObj } from "@storybook/react";
import Comment from "../Comment";
import { fn } from '@storybook/test';

const meta = {
  title: 'Example/Comment',
  component: Comment,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  argTypes: {
    backgroundColor: { control: 'color' }, // Define o controle de cor para a prop 'backgroundColor'
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
} satisfies Meta<typeof Comment>;
export default meta;

const Template = (args: any) => {
  const [title, setTitle] = React.useState('Comment');
  const [value, setValue] = React.useState('');
  return <Comment title={title} onChangeTitle={setTitle} text={value} onChangeText={setValue} {...args}/>
};

export const Default = Template.bind({});
Default.args = {
  backgroundColor:'#fff',
  onResize: fn(),
  onMove: fn(),
  onMoveEnd: fn(),
} satisfies StoryObj<typeof Comment>;