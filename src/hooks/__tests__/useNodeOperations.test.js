import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { useNodeOperations } from "../useNodeOperations";

jest.mock("nanoid", () => ({ nanoid: () => "id" }));

const nodeTypes = {
  src: { inputs: () => [], outputs: () => [{ name: "out", type: "num" }] },
  dst: { inputs: () => [{ name: "in", type: "num" }], outputs: () => [] },
};

const initial = {
  nodes: {
    a: { id: "a", type: "src", values: {}, position: { x: 0, y: 0 } },
    b: { id: "b", type: "dst", values: {}, position: { x: 0, y: 0 } },
  },
};

const setup = () =>
  renderHook(() => {
    const [state, setState] = useState(initial);
    const ops = useNodeOperations({
      state,
      setStateAndNotify: setState,
      setSelectedNodes: () => {},
      nodeTypes,
    });
    return { state, ...ops };
  });

describe("connectNodes", () => {
  test("connecting the same ports twice keeps a single connection", () => {
    const { result } = setup();
    const connection = {
      source: { nodeId: "a", portName: "out" },
      target: { nodeId: "b", portName: "in" },
    };

    act(() => {
      result.current.connectNodes(connection);
    });
    act(() => {
      result.current.connectNodes(connection);
    });

    expect(result.current.state.nodes.a.connections.outputs).toHaveLength(1);
    expect(result.current.state.nodes.b.connections.inputs).toHaveLength(1);
  });
});
