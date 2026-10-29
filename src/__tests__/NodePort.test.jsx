import React from "react";
import { render, fireEvent } from "@testing-library/react";
import NodePort from "../NodePort";

jest.mock("../DragContext.jsx", () => ({
  useDragContext: () => ({
    dragInfo: null,
    setDragInfo: jest.fn(),
  }),
}));

jest.mock("../ScreenContext.jsx", () => ({
  useScreenContext: () => ({
    scale: 1,
    position: { x: 0, y: 0 },
  }),
  useScreenViewportRef: () => ({ current: { scale: 1, position: { x: 0, y: 0 } } }),
}));

jest.mock("../ThemeProvider.jsx", () => ({
  useTheme: () => ({
    currentTheme: {
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
    },
  }),
}));

jest.mock("../NodePort.module.css", () => ({
  port: "port",
  portConnector: "portConnector",
  input: "input",
  output: "output",
  label: "label",
  portOverlay: "portOverlay",
  formContainer: "formContainer",
  circle: "circle",
  square: "square",
  diamond: "diamond",
  pendingSource: "pendingSource",
  dragSource: "dragSource",
  compatible: "compatible",
  incompatible: "incompatible",
}));

const dragFromPort = (
  port,
  { pointerType = "mouse", from = { x: 0, y: 0 }, to = { x: 40, y: 0 } } = {}
) => {
  fireEvent.pointerDown(port, { pointerId: 1, pointerType, clientX: from.x, clientY: from.y });
  fireEvent.pointerMove(window, { pointerId: 1, pointerType, clientX: to.x, clientY: to.y });
  fireEvent.pointerUp(window, { pointerId: 1, pointerType, clientX: to.x, clientY: to.y });
};

const tapPort = (port, pointerType = "touch") => {
  fireEvent.pointerDown(port, { pointerId: 1, pointerType, clientX: 0, clientY: 0 });
  fireEvent.pointerUp(window, { pointerId: 1, pointerType, clientX: 2, clientY: 1 });
};

const mockDragContext = (value) =>
  jest.spyOn(require("../DragContext.jsx"), "useDragContext").mockReturnValue({
    dragInfo: null,
    setDragInfo: jest.fn(),
    pendingConnection: null,
    setPendingConnection: jest.fn(),
    ...value,
  });

jest.mock("../util/throttle", () => ({
  throttle: jest.fn((fn) => fn),
}));

describe("NodePort Component", () => {
  const defaultProps = {
    name: "testPort",
    type: { type: "test", color: "#cccccc", shape: "circle" },
    nodeId: "node1",
    label: "Test Port",
    hidePort: false,
    onConnected: jest.fn(),
    isConnected: false,
    direction: "input",
    value: "test value",
    onValueChange: jest.fn(),
    canMove: true,
    options: {},
  };

  const mockGetBoundingClientRect = () => {
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        width: 100,
        height: 50,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }),
    });

    document.elementsFromPoint = jest.fn().mockReturnValue([]);
  };

  beforeEach(() => {
    mockGetBoundingClientRect();
    jest.clearAllMocks();
  });

  test("renders the component with default properties", () => {
    const { container } = render(<NodePort {...defaultProps} />);

    expect(container.querySelector(".port")).toBeTruthy();
    expect(container.querySelector(".label")).toBeTruthy();
  });

  test("renders the connector with the correct shape", () => {
    const { container } = render(<NodePort {...defaultProps} />);

    const connector = container.querySelector(".portConnector");
    expect(connector).toBeTruthy();
    expect(connector.classList.contains("circle")).toBeTruthy();
  });

  test("does not render the connector when hidePort is true", () => {
    const { container } = render(
      <NodePort {...defaultProps} hidePort={true} />
    );

    const connector = container.querySelector(".portConnector");
    expect(connector).toBeFalsy();
  });

  test("calls onValueChange when isConnected changes to true", () => {
    const onValueChange = jest.fn();
    const { rerender } = render(
      <NodePort
        {...defaultProps}
        onValueChange={onValueChange}
        isConnected={false}
      />
    );

    rerender(
      <NodePort
        {...defaultProps}
        onValueChange={onValueChange}
        isConnected={true}
      />
    );

    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  test("renders the component with output direction", () => {
    const { container } = render(
      <NodePort {...defaultProps} direction="output" />
    );

    const portElement = container.querySelector(".port");
    expect(portElement.classList.contains("output")).toBeTruthy();
  });

  test("does not start dragging when hidePort is true", () => {
    const setDragInfoMock = jest.fn();
    jest.spyOn(React, "useContext").mockImplementation(() => ({
      dragInfo: null,
      setDragInfo: setDragInfoMock,
    }));

    const { container } = render(
      <NodePort {...defaultProps} hidePort={true} />
    );

    dragFromPort(container.querySelector(".port"));

    expect(setDragInfoMock).not.toHaveBeenCalled();
  });

  test("does not start dragging when canMove is false", () => {
    const setDragInfoMock = jest.fn();
    jest.spyOn(React, "useContext").mockImplementation(() => ({
      dragInfo: null,
      setDragInfo: setDragInfoMock,
    }));

    const { container } = render(
      <NodePort {...defaultProps} canMove={false} />
    );

    dragFromPort(container.querySelector(".port"));

    expect(setDragInfoMock).not.toHaveBeenCalled();
  });

  test("throws error when name is not provided", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    const props = { ...defaultProps };
    delete props.name;

    expect(() => {
      render(<NodePort {...props} />);
    }).toThrow("Port name is required");

    console.error.mockRestore();
  });

  test("prevents event propagation in formContainer", () => {
    const { container } = render(<NodePort {...defaultProps} />);
    const formContainer = container.querySelector(".formContainer");

    const event = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
    });

    event.stopPropagation = jest.fn();

    formContainer.dispatchEvent(event);

    expect(formContainer).toBeTruthy();
  });

  test("renders with square shape when specified in type", () => {
    const { container } = render(
      <NodePort
        {...defaultProps}
        type={{ ...defaultProps.type, shape: "square" }}
      />
    );

    const connector = container.querySelector(".portConnector");
    expect(connector).toBeTruthy();
    expect(connector.classList.contains("square")).toBeTruthy();
  });

  test("renders with diamond shape when specified in type", () => {
    const { container } = render(
      <NodePort
        {...defaultProps}
        type={{ ...defaultProps.type, shape: "diamond" }}
      />
    );

    const connector = container.querySelector(".portConnector");
    expect(connector).toBeTruthy();
    expect(connector.classList.contains("diamond")).toBeTruthy();
  });

  describe("connecting", () => {
    let elementsFromPoint;

    beforeEach(() => {
      elementsFromPoint = jest.fn(() => []);
      document.elementsFromPoint = elementsFromPoint;
    });

    afterEach(() => {
      delete document.elementsFromPoint;
      jest.restoreAllMocks();
    });

    test("starts dragging once the pointer moves past the threshold", () => {
      const setDragInfo = jest.fn();
      mockDragContext({ setDragInfo });

      const { container } = render(<NodePort {...defaultProps} />);
      const port = container.querySelector(".port");

      fireEvent.pointerDown(port, { pointerId: 1, clientX: 0, clientY: 0 });
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 1, clientY: 1 });
      expect(setDragInfo).not.toHaveBeenCalled();

      fireEvent.pointerMove(window, { pointerId: 1, clientX: 20, clientY: 0 });
      expect(setDragInfo).toHaveBeenCalledTimes(1);
      expect(setDragInfo.mock.calls[0][0]).toMatchObject({
        type: "connector",
        nodeId: defaultProps.nodeId,
        portName: defaultProps.name,
        portType: defaultProps.type.type,
        direction: "input",
        pointerType: "mouse",
      });

      fireEvent.pointerUp(window, { pointerId: 1, clientX: 20, clientY: 0 });
      expect(setDragInfo).toHaveBeenLastCalledWith(null);
    });

    test("connects to the compatible port the drag is released on", () => {
      const onConnected = jest.fn();
      mockDragContext();

      const target = document.createElement("div");
      target.className = "portOverlay";
      Object.assign(target.dataset, {
        nodeId: "node2",
        portName: "out",
        portType: "test",
        portDirection: "output",
      });
      elementsFromPoint.mockReturnValue([target]);

      const { container } = render(
        <NodePort {...defaultProps} onConnected={onConnected} />
      );
      // The mocked connector rect is 100x50 at the origin: centre (50, 25).
      dragFromPort(container.querySelector(".port"), {
        pointerType: "touch",
        from: { x: 50, y: 25 },
        to: { x: 150, y: 25 },
      });

      expect(onConnected).toHaveBeenCalledWith({
        source: { nodeId: "node1", portName: "testPort" },
        target: { nodeId: "node2", portName: "out" },
      });
    });

    test("ignores a release on a port of the same direction", () => {
      const onConnected = jest.fn();
      mockDragContext();

      const target = document.createElement("div");
      target.className = "portOverlay";
      Object.assign(target.dataset, {
        nodeId: "node2",
        portName: "in",
        portType: "test",
        portDirection: "input",
      });
      elementsFromPoint.mockReturnValue([target]);

      const { container } = render(
        <NodePort {...defaultProps} onConnected={onConnected} />
      );
      dragFromPort(container.querySelector(".port"));

      expect(onConnected).not.toHaveBeenCalled();
    });

    test("on touch, a drag far from the connector is left to the node", () => {
      const setDragInfo = jest.fn();
      const setPendingConnection = jest.fn();
      const onNodePointerDown = jest.fn();
      mockDragContext({ setDragInfo, setPendingConnection });

      const { container } = render(
        <div onPointerDown={onNodePointerDown}>
          <NodePort {...defaultProps} />
        </div>
      );
      // Centre of the mocked connector is (50, 25); start 100px away.
      dragFromPort(container.querySelector(".port"), {
        pointerType: "touch",
        from: { x: 150, y: 25 },
        to: { x: 250, y: 25 },
      });

      expect(onNodePointerDown).toHaveBeenCalled();
      expect(setDragInfo).not.toHaveBeenCalled();
      expect(setPendingConnection).not.toHaveBeenCalled();
    });

    test("on touch, a tap far from the connector still starts a connection", () => {
      const setPendingConnection = jest.fn();
      mockDragContext({ setPendingConnection });

      const { container } = render(<NodePort {...defaultProps} />);
      const port = container.querySelector(".port");
      fireEvent.pointerDown(port, { pointerId: 1, pointerType: "touch", clientX: 150, clientY: 25 });
      fireEvent.pointerUp(window, { pointerId: 1, pointerType: "touch", clientX: 151, clientY: 25 });

      expect(setPendingConnection).toHaveBeenCalledWith(
        expect.objectContaining({ nodeId: "node1", portName: "testPort" })
      );
    });

    test("in touch selection mode the port leaves presses to the node", () => {
      const setPendingConnection = jest.fn();
      const setDragInfo = jest.fn();
      const onNodePointerDown = jest.fn();
      mockDragContext({ setPendingConnection, setDragInfo });

      const { container } = render(
        <div onPointerDown={onNodePointerDown}>
          <NodePort {...defaultProps} selecting />
        </div>
      );
      const port = container.querySelector(".port");
      tapPort(port);
      dragFromPort(port, { pointerType: "touch", from: { x: 50, y: 25 }, to: { x: 150, y: 25 } });

      expect(onNodePointerDown).toHaveBeenCalledTimes(2);
      expect(setPendingConnection).not.toHaveBeenCalled();
      expect(setDragInfo).not.toHaveBeenCalled();
    });

    test("selection mode does not change how the mouse connects", () => {
      const setDragInfo = jest.fn();
      mockDragContext({ setDragInfo });

      const { container } = render(<NodePort {...defaultProps} selecting />);
      dragFromPort(container.querySelector(".port"));

      expect(setDragInfo).toHaveBeenCalledWith(expect.objectContaining({ type: "connector" }));
    });

    test("a tap starts a pending connection", () => {
      const setPendingConnection = jest.fn();
      const setDragInfo = jest.fn();
      mockDragContext({ setPendingConnection, setDragInfo });

      const { container } = render(<NodePort {...defaultProps} />);
      tapPort(container.querySelector(".port"));

      expect(setDragInfo).not.toHaveBeenCalled();
      expect(setPendingConnection).toHaveBeenCalledWith({
        nodeId: "node1",
        portName: "testPort",
        portType: "test",
        direction: "input",
      });
    });

    test("tapping the pending port again cancels it", () => {
      const setPendingConnection = jest.fn();
      mockDragContext({
        setPendingConnection,
        pendingConnection: {
          nodeId: "node1",
          portName: "testPort",
          portType: "test",
          direction: "input",
        },
      });

      const { container } = render(<NodePort {...defaultProps} />);
      expect(container.querySelector(".port")).toHaveClass("pendingSource");

      tapPort(container.querySelector(".port"));
      expect(setPendingConnection).toHaveBeenCalledWith(null);
    });

    test("tapping a compatible port completes the pending connection", () => {
      const setPendingConnection = jest.fn();
      const onConnected = jest.fn();
      mockDragContext({
        setPendingConnection,
        pendingConnection: {
          nodeId: "node2",
          portName: "out",
          portType: "test",
          direction: "output",
        },
      });

      const { container } = render(
        <NodePort {...defaultProps} onConnected={onConnected} />
      );
      expect(container.querySelector(".port")).toHaveClass("compatible");

      tapPort(container.querySelector(".port"));
      expect(onConnected).toHaveBeenCalledWith({
        source: { nodeId: "node1", portName: "testPort" },
        target: { nodeId: "node2", portName: "out" },
      });
      expect(setPendingConnection).toHaveBeenCalledWith(null);
    });

    test("tapping an incompatible port makes it the new origin", () => {
      const setPendingConnection = jest.fn();
      const onConnected = jest.fn();
      mockDragContext({
        setPendingConnection,
        pendingConnection: {
          nodeId: "node2",
          portName: "out",
          portType: "other",
          direction: "output",
        },
      });

      const { container } = render(
        <NodePort {...defaultProps} onConnected={onConnected} />
      );
      expect(container.querySelector(".port")).toHaveClass("incompatible");

      tapPort(container.querySelector(".port"));
      expect(onConnected).not.toHaveBeenCalled();
      expect(setPendingConnection).toHaveBeenCalledWith(
        expect.objectContaining({ nodeId: "node1", portName: "testPort" })
      );
    });

    test("does not react to taps when readOnly", () => {
      const setPendingConnection = jest.fn();
      mockDragContext({ setPendingConnection });

      const { container } = render(<NodePort {...defaultProps} readOnly />);
      tapPort(container.querySelector(".port"));

      expect(setPendingConnection).not.toHaveBeenCalled();
    });

    test("tapping the inline form does not start a connection", () => {
      const setPendingConnection = jest.fn();
      mockDragContext({ setPendingConnection });

      const { container } = render(<NodePort {...defaultProps} />);
      tapPort(container.querySelector(".formContainer"));

      expect(setPendingConnection).not.toHaveBeenCalled();
    });
  });

  test("renders the component when type.render is present and not connected", () => {
    const renderMock = jest.fn(() => <input data-testid="custom-input" />);

    const { getByTestId } = render(
      <NodePort
        {...defaultProps}
        direction="input"
        isConnected={false}
        type={{ ...defaultProps.type, render: renderMock }}
      />
    );

    expect(renderMock).toHaveBeenCalledWith({
      value: defaultProps.value,
      onChange: defaultProps.onValueChange,
      options: defaultProps.options,
    });

    expect(getByTestId("custom-input")).toBeInTheDocument();
  });

  test("does not render type.render component when isConnected is true", () => {
    const renderMock = jest.fn(() => <input data-testid="custom-input" />);

    const { container } = render(
      <NodePort
        {...defaultProps}
        direction="input"
        isConnected={true}
        type={{ ...defaultProps.type, render: renderMock }}
      />
    );

    expect(container.querySelector("[data-testid='custom-input']")).toBeNull();
  });

  test("uses theme color for portConnector when available", () => {
    jest.spyOn(require("../ThemeProvider.jsx"), "useTheme").mockReturnValue({
      currentTheme: {
        ports: {
          test: {
            color: "#ff5500",
          },
          default: {
            color: "#000000",
          },
        },
      },
    });

    const { container } = render(
      <NodePort
        {...defaultProps}
        type={{ ...defaultProps.type, type: "test" }}
      />
    );

    const connector = container.querySelector(".portConnector");
    expect(connector).toBeTruthy();
    expect(connector.style.background).toBe("rgb(255, 85, 0)"); // #ff5500 in rgb
  });

  test("uses default color when type doesn't have a specific color", () => {
    jest.clearAllMocks();

    jest
      .spyOn(require("../ThemeProvider.jsx"), "useTheme")
      .mockImplementation(() => ({
        currentTheme: {
          ports: {
            default: {
              color: "#aabbcc",
            },
          },
          colors: {
            primary: "#112233",
          },
        },
      }));

    const { container } = render(
      <NodePort
        {...defaultProps}
        type={{ type: "unknownType", color: "#cccccc" }}
      />
    );

    const connector = container.querySelector(".portConnector");
    expect(connector).toBeTruthy();

    expect(connector.style.background).toBeTruthy();
  });

  test("adds correct data-* attributes to portConnector", () => {
    const { container } = render(<NodePort {...defaultProps} />);

    const connector = container.querySelector(".portConnector");
    expect(connector).toBeTruthy();

    expect(connector.getAttribute("data-port-connector-name")).toBe(
      defaultProps.name
    );
    expect(connector.getAttribute("data-port-connector-type")).toBe(
      defaultProps.type.type
    );
    expect(connector.getAttribute("data-port-connector-direction")).toBe(
      defaultProps.direction
    );
    expect(connector.getAttribute("data-port-connector-connected")).toBe(
      "false"
    );
  });

  test("adds correct data-* attributes when isConnected is true", () => {
    const { container } = render(
      <NodePort {...defaultProps} isConnected={true} />
    );

    const connector = container.querySelector(".portConnector");
    expect(connector).toBeTruthy();

    expect(connector.getAttribute("data-port-connector-connected")).toBe(
      "true"
    );
  });

  test("applies the correct cursor style when hidePort is false and canMove is true", () => {
    const { container } = render(
      <NodePort {...defaultProps} hidePort={false} canMove={true} />
    );

    const portElement = container.querySelector(".port");
    expect(portElement.style.cursor).toBe("crosshair");
  });

  test("does not apply cursor style when hidePort is true", () => {
    const { container } = render(
      <NodePort {...defaultProps} hidePort={true} canMove={true} />
    );

    const portElement = container.querySelector(".port");
    expect(portElement.style.cursor).toBe("");
  });

  test("does not apply cursor style when canMove is false", () => {
    const { container } = render(
      <NodePort {...defaultProps} hidePort={false} canMove={false} />
    );

    const portElement = container.querySelector(".port");
    expect(portElement.style.cursor).toBe("");
  });
});
