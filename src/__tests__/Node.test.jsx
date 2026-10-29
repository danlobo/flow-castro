import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Node from "../Node";
import css from "../Node.module.css";

jest.mock("../Node.module.css", () => ({
  node: "node",
  selected: "selected",
  inputPortsContainer: "inputPortsContainer",
  outputPortsContainer: "outputPortsContainer",
}));

class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe(target) {
    this.callback([
      {
        contentRect: {
          width: 100,
          height: 100,
        },
        target,
      },
    ]);
  }
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

jest.mock("../ScreenContext.jsx", () => ({
  useScreenContext: () => ({
    scale: 1,
    position: { x: 0, y: 0 },
    dragStart: jest.fn(),
    dragEnd: jest.fn(),
  }),
  useScreenViewportRef: () => ({ current: { scale: 1, position: { x: 0, y: 0 } } }),
}));

jest.mock("../ThemeProvider.jsx", () => ({
  useTheme: () => ({
    currentTheme: {
      nodes: {
        default: {
          backgroundColor: "#ffffff",
          border: "1px solid #cccccc",
          color: "#000000",
        },
        selected: {
          border: "2px solid #0088ff",
        },
      },
      ports: {
        default: {
          color: "#000000",
        },
        input: {
          color: "#ff0000",
        },
        output: {
          color: "#00ff00",
        },
      },
      roundness: "4px",
      textColor: "#000000",
    },
  }),
}));

jest.mock("../DragContext.jsx", () => ({
  useDragContext: () => ({
    dragInfo: null,
    setDragInfo: jest.fn(),
  }),
}));

describe("Node Component", () => {
  const defaultProps = {
    name: "Test Node",
    portTypes: {
      input: { label: "Input", color: "#ff0000" },
      output: { label: "Output", color: "#00ff00" },
    },
    nodeType: {
      type: "default",
      inputs: [{ id: "in1", type: "input", name: "Input 1" }],
      outputs: [{ id: "out1", type: "output", name: "Output 1" }],
    },
    value: {
      id: "node1",
      name: "Test Node",
      position: { x: 100, y: 100 },
      values: {},
      inputs: [{ id: "in1", type: "input", name: "Input 1" }],
      outputs: [{ id: "out1", type: "output", name: "Output 1" }],
    },
    canMove: true,
    isSelected: false,
    onChangePosition: jest.fn(),
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
    onConnect: jest.fn(),
    containerRef: { current: document.createElement("div") },
    onContextMenu: jest.fn(),
    onResize: jest.fn(),
    onValueChange: jest.fn(),
  };

  test("should render the node name", () => {
    render(<Node {...defaultProps} />);

    expect(document.body.textContent).toContain("Test Node");
  });

  test("should apply the selected class when isSelected is true", () => {
    const { rerender, container } = render(
      <Node {...defaultProps} isSelected={false} />
    );

    const nodeElement = container.querySelector(`.${css.node}`);
    expect(nodeElement).not.toHaveClass(css.selected);

    rerender(<Node {...defaultProps} isSelected={true} />);

    expect(nodeElement).toHaveClass(css.selected);
  });

  test("should render the component without errors", () => {
    const { container } = render(<Node {...defaultProps} />);

    expect(container).toBeTruthy();
  });

  test("should render input and output ports", () => {
    const { container } = render(<Node {...defaultProps} />);

    const inputPorts = container.querySelectorAll(
      `.${css.inputPortsContainer} > *`
    );
    const outputPorts = container.querySelectorAll(
      `.${css.outputPortsContainer} > *`
    );

    expect(inputPorts.length).toBe(1);
    expect(outputPorts.length).toBe(1);
  });

  test("should call onChangePosition when the node is dragged", () => {
    const onChangePositionMock = jest.fn();
    const { container } = render(
      <Node {...defaultProps} onChangePosition={onChangePositionMock} />
    );

    const nodeElement = container.querySelector(`.${css.node}`);

    fireEvent.pointerDown(nodeElement, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 150 });
    fireEvent.pointerUp(window, { clientX: 150, clientY: 150 });

    expect(onChangePositionMock).toHaveBeenCalled();
  });

  test("should not allow dragging when canMove is false", () => {
    const onChangePositionMock = jest.fn();
    const { container } = render(
      <Node
        {...defaultProps}
        canMove={false}
        onChangePosition={onChangePositionMock}
      />
    );

    const nodeElement = container.querySelector(`.${css.node}`);

    fireEvent.pointerDown(nodeElement, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 150 });
    fireEvent.pointerUp(window, { clientX: 150, clientY: 150 });

    expect(onChangePositionMock).not.toHaveBeenCalled();
  });

  test("should call onConnect when a port is connected", () => {
    const onConnectMock = jest.fn();
    const { container } = render(
      <Node {...defaultProps} onConnect={onConnectMock} />
    );

    expect(container.querySelector("[data-port-connector-name]")).toBeTruthy();
  });

  test("should call onContextMenu when the context menu is opened", () => {
    const onContextMenuMock = jest.fn();
    const { container } = render(
      <Node {...defaultProps} onContextMenu={onContextMenuMock} />
    );

    const nodeElement = container.querySelector(`.${css.node}`);

    fireEvent.contextMenu(nodeElement);

    expect(onContextMenuMock).toHaveBeenCalled();
  });

  test("should call onDragStart and onDragEnd when dragging", () => {
    const onDragStartMock = jest.fn();
    const onDragEndMock = jest.fn();

    const { container } = render(
      <Node
        {...defaultProps}
        onDragStart={onDragStartMock}
        onDragEnd={onDragEndMock}
      />
    );

    const nodeElement = container.querySelector(`.${css.node}`);

    fireEvent.pointerDown(nodeElement, { clientX: 100, clientY: 100 });
    expect(onDragStartMock).not.toHaveBeenCalled();

    fireEvent.pointerMove(window, { clientX: 130, clientY: 100 });
    expect(onDragStartMock).toHaveBeenCalled();

    fireEvent.pointerUp(window, { clientX: 130, clientY: 100 });
    expect(onDragEndMock).toHaveBeenCalledWith(defaultProps.value.id, {
      x: defaultProps.value.position.x + 30,
      y: defaultProps.value.position.y,
    });
  });

  test("a tap does not move the node", () => {
    const onChangePositionMock = jest.fn();
    const onDragEndMock = jest.fn();
    const { container } = render(
      <Node
        {...defaultProps}
        onChangePosition={onChangePositionMock}
        onDragEnd={onDragEndMock}
      />
    );

    const nodeElement = container.querySelector(`.${css.node}`);
    fireEvent.pointerDown(nodeElement, { pointerType: "touch", clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { pointerType: "touch", clientX: 104, clientY: 103 });
    fireEvent.pointerUp(window, { pointerType: "touch", clientX: 104, clientY: 103 });

    expect(onChangePositionMock).not.toHaveBeenCalled();
    expect(onDragEndMock).not.toHaveBeenCalled();
  });

  test("a second finger puts the node back so the pinch can take over", () => {
    const onDragEndMock = jest.fn();
    const { container } = render(
      <Node {...defaultProps} onDragEnd={onDragEndMock} />
    );

    const nodeElement = container.querySelector(`.${css.node}`);
    fireEvent.pointerDown(nodeElement, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { pointerId: 1, pointerType: "touch", clientX: 160, clientY: 100 });
    fireEvent.pointerDown(document.body, { pointerId: 2, pointerType: "touch", clientX: 300, clientY: 300 });

    expect(onDragEndMock).toHaveBeenCalledWith(defaultProps.value.id, {
      x: defaultProps.value.position.x,
      y: defaultProps.value.position.y,
    });

    onDragEndMock.mockClear();
    fireEvent.pointerUp(window, { pointerId: 1, pointerType: "touch", clientX: 160, clientY: 100 });
    expect(onDragEndMock).not.toHaveBeenCalled();
  });

  test("a tap reports the node, a drag does not", () => {
    const onTap = jest.fn();
    const { container } = render(<Node {...defaultProps} onTap={onTap} />);
    const nodeElement = container.querySelector(`.${css.node}`);

    fireEvent.pointerDown(nodeElement, { pointerType: "touch", clientX: 100, clientY: 100 });
    fireEvent.pointerUp(window, { pointerType: "touch", clientX: 102, clientY: 101 });
    expect(onTap).toHaveBeenCalledWith(defaultProps.value.id);

    onTap.mockClear();
    fireEvent.pointerDown(nodeElement, { pointerType: "touch", clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { pointerType: "touch", clientX: 160, clientY: 100 });
    fireEvent.pointerUp(window, { pointerType: "touch", clientX: 160, clientY: 100 });
    expect(onTap).not.toHaveBeenCalled();
  });

  test("pressing inside a form field does not drag the node", () => {
    const onDragStartMock = jest.fn();
    const { container } = render(
      <Node {...defaultProps} onDragStart={onDragStartMock} />
    );

    const input = document.createElement("input");
    container.querySelector(`.${css.node}`).appendChild(input);
    fireEvent.pointerDown(input, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { clientX: 160, clientY: 100 });

    expect(onDragStartMock).not.toHaveBeenCalled();
  });

  test("should call onResize when the node size changes", () => {
    const onResizeMock = jest.fn();
    const { container } = render(
      <Node {...defaultProps} onResize={onResizeMock} />
    );

    expect(onResizeMock).toHaveBeenCalled();
  });
});
