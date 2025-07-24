# Setting up Flow-Castro in a React Application

This guide will walk you through the process of setting up and integrating the Flow-Castro library into your React application.

## Installation

First, install the Flow-Castro library along with its peer dependencies:

```bash
npm install flow-castro react react-dom
```

## Basic Setup

Create a new component in your React application that will use the Flow-Castro library:

```jsx
import React, { useState } from "react";
import { NodeContainer, ThemeProvider } from "flow-castro";

function FlowEditor() {
  const [state, setState] = useState({
    nodes: {
      // Your initial node configuration
    },
  });

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex" }}>
      <ThemeProvider theme="light">
        <NodeContainer
          initialState={state}
          onChangeState={(newState) => setState(newState)}
          nodeTypes={nodeTypes}
          portTypes={portTypes}
          viewMode="select"
        />
      </ThemeProvider>
    </div>
  );
}

export default FlowEditor;
```

## Defining Node Types

Node types define the behavior and structure of nodes in your flow. Each node type requires several properties:

- `type`: Defines a unique identifier for your node type
- `label`: Displays a user-friendly name in the UI
- `description`: Provides additional information about the node's purpose
- `category`: Groups similar nodes together in the context menu
- `inputs()`: A function that returns an array of input definitions with properties:
  - `name`: Unique identifier for the input
  - `type`: The data type (must match a defined port type)
  - `label`: User-friendly name for the input
  - `hidePort`: Optional boolean to hide the input port visually
- `outputs()`: A function that returns an array of output definitions with properties:
  - `name`: Unique identifier for the output
  - `type`: The data type (must match a defined port type)
  - `label`: User-friendly name for the output
- `resolveOutputs`: An async function that processes input values and returns output values. The returned object's property names must match your output names.

Here's how to define them:

```jsx
const nodeTypes = {
  string: {
    type: "string",
    label: "String",
    description: "String node",
    category: "Text",
    inputs() {
      return [
        {
          name: "string",
          type: "string",
          label: "String Input",
        },
      ];
    },
    outputs() {
      return [
        {
          name: "string",
          type: "string",
          label: "String Output",
        },
      ];
    },
    resolveOutputs: async (inputValues) => {
      // Process input values and return output values
      return {
        string: inputValues.string || "",
      };
    },
  },
  // Define more node types...
};
```

## Defining Port Types

Port types define how ports look and behave:

```jsx
const portTypes = {
  string: {
    type: "string",
    label: "String",
    shape: "circle",
    color: "#FFD700",
    render({ value, onChange }) {
      return (
        <input
          style={{ width: "100%" }}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    },
  },
  // Define more port types...
};
```

## Theming

Flow-Castro supports light and dark themes. You can specify the theme using the `theme` prop:

```jsx
<ThemeProvider theme="dark">
  <NodeContainer {...props} />
</ThemeProvider>
```

## Initial State

Define an initial state for your flow:

```jsx
const initialState = {
  nodes: {
    node1: {
      id: "node1",
      name: "String",
      type: "string",
      position: { x: 100, y: 100 },
      values: {},
      size: { width: 450, height: 140 },
      connections: {
        outputs: [],
        inputs: [],
      },
    },
    // More nodes...
  },
};
```

## Full Example

Here's a complete example of a component using Flow-Castro:

```jsx
import React, { useState } from "react";
import { NodeContainer, ThemeProvider } from "flow-castro";

const nodeTypes = {
  string: {
    type: "string",
    label: "String",
    description: "String node",
    category: "Text",
    inputs() {
      return [
        {
          name: "string",
          type: "string",
          label: "String Input",
        },
      ];
    },
    outputs() {
      return [
        {
          name: "string",
          type: "string",
          label: "String Output",
        },
      ];
    },
    resolveOutputs: async (inputValues) => {
      return {
        string: inputValues.string || "",
      };
    },
  },
};

const portTypes = {
  string: {
    type: "string",
    label: "String",
    shape: "circle",
    color: "#FFD700",
    render({ value, onChange }) {
      return (
        <input
          style={{ width: "100%" }}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    },
  },
};

// This can be a saved state, loaded from database, for example
const initialState = {
  nodes: {
    comment1: {
      id: "comment1",
      name: "Comment",
      type: "comment",
      position: { x: 30, y: 22 },
      values: {},
      size: { w: 320, h: 200 },
      title: "Hello!",
      value: "This is your first flow-castro canvas. Start adding nodes!",
    },
  },
};

function FlowEditor() {
  const [state, setState] = useState(initialState);

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex" }}>
      <ThemeProvider theme="light">
        <NodeContainer
          initialState={state}
          onChangeState={(newState) => {
            // Here is a good opportunity to save updated data
            setState(newState);
          }}
          nodeTypes={nodeTypes}
          portTypes={portTypes}
          viewMode="select"
          debugMode={false}
        />
      </ThemeProvider>
    </div>
  );
}

export default FlowEditor;
```

## Features

### Context Menu

The library includes a context menu that appears on right-click:

- Add new nodes
- Delete nodes
- Add waypoints to connections
- Delete connections

## Event Handling

Track changes to your flow state:

```jsx
<NodeContainer
  initialState={yourLoadedState}
  onChangeState={(newState) => {
    setState(newState);
    console.log("Flow state updated:", newState);
    // Perform any additional actions
  }}
  {...otherProps}
/>
```

## Troubleshooting

- If nodes aren't rendering properly, ensure the node types are correctly defined
- For connection issues, check that port types match between source and target
- For styling issues, verify the theme provider is correctly set up

For more examples, refer to the Storybook documentation or check the NodeContainer.stories.tsx file.
