import React from "react";

/** Same node/port definitions the Storybook stories use, so the render cost of
 *  a node here matches what a real consumer of the library pays. */
export const nodeTypes = {
  string: {
    type: "string",
    label: "String",
    description: "String",
    category: "Text",
    inputs: () => [{ name: "string", type: "string", label: "String" }],
    outputs: () => [{ name: "string", type: "string", label: "String" }],
    resolveOutputs: async (inputValues) => ({ string: inputValues.string ?? "" }),
  },
  number: {
    type: "number",
    label: "Number",
    description: "Number",
    category: "Numeric",
    inputs: () => [{ name: "number", type: "number", label: "Number" }],
    outputs: () => [{ name: "number", type: "number", label: "Number" }],
    resolveOutputs: async (inputValues) => ({ number: +inputValues.number }),
  },
};

export const portTypes = {
  string: {
    type: "string",
    label: "String",
    shape: "circle",
    color: "#FFD700",
    render({ value, onChange }) {
      return (
        <textarea
          style={{ width: "100%" }}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    },
  },
  number: {
    type: "number",
    label: "Number",
    shape: "square",
    color: "#FF00D7",
    render({ value, onChange }) {
      return (
        <input
          type="number"
          style={{ width: "100%" }}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    },
  },
};
