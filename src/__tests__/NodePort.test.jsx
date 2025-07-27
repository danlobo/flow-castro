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
}));

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

    fireEvent.mouseDown(container.querySelector(".port"));

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

    fireEvent.mouseDown(container.querySelector(".port"));

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

  test("starts dragging when canMove is true and hidePort is false", () => {
    const setDragInfoMock = jest.fn();

    jest
      .spyOn(require("../DragContext.jsx"), "useDragContext")
      .mockReturnValue({
        dragInfo: null,
        setDragInfo: setDragInfoMock,
      });

    const { container } = render(
      <NodePort {...defaultProps} canMove={true} hidePort={false} />
    );

    fireEvent.mouseDown(container.querySelector(".port"));

    expect(setDragInfoMock).toHaveBeenCalled();
    expect(setDragInfoMock.mock.calls[0][0]).toMatchObject({
      type: "connector",
      nodeId: defaultProps.nodeId,
      portName: defaultProps.name,
      portType: defaultProps.type,
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
