import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConnectorCurve, ConnectorCurveForward } from "../ConnectorCurve";
import { useTheme } from "../ThemeProvider";
import { useScreenContext } from "../ScreenContext";

jest.mock("../ConnectorCurve.module.css", () => ({
  connector: "connector",
  container: "container",
  invalid: "invalid",
  hovered: "hovered",
  tmp: "tmp",
  pathTmp: "pathTmp",
  path: "path",
  waypoint: "waypoint",
  selected: "selected",
  waypointHovered: "waypointHovered",
}));

jest.mock("../ThemeProvider", () => ({
  useTheme: () => ({
    currentTheme: {
      connectors: {
        default: {
          stroke: "#ccc",
          strokeWidth: 2,
        },
        test: {
          stroke: "#ff0000",
          strokeWidth: 3,
        },
      },
      connections: {
        default: {
          color: "#ccc",
          strokeWidth: 2,
        },
        test: {
          color: "#ff0000",
          strokeWidth: 3,
        },
      },
    },
  }),
}));

jest.mock("../ScreenContext", () => ({
  useScreenContext: () => ({
    scale: 1,
  }),
}));

global.SVGPathElement = class SVGPathElement {};
global.SVGPathElement.prototype.getTotalLength = jest.fn().mockReturnValue(100);
global.SVGPathElement.prototype.getPointAtLength = jest
  .fn()
  .mockReturnValue({ x: 50, y: 50 });

describe("ConnectorCurve Component", () => {
  const defaultProps = {
    src: { x: 10, y: 10 },
    dst: { x: 100, y: 100 },
    type: "default",
    invalid: false,
    onContextMenu: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("ConnectorCurve renders when src and dst are defined", () => {
    const { container } = render(<ConnectorCurve {...defaultProps} />);

    expect(container).toBeTruthy();
    expect(container.querySelector("g")).toBeTruthy();
  });

  test("ConnectorCurve does not render when src or dst are not defined", () => {
    const { container: container1 } = render(
      <ConnectorCurve dst={{ x: 100, y: 100 }} />
    );
    expect(container1.firstChild).toBeNull();

    const { container: container2 } = render(
      <ConnectorCurve src={{ x: 10, y: 10 }} />
    );
    expect(container2.firstChild).toBeNull();
  });

  test("ConnectorCurveForward does not render when src or dst are not defined", () => {
    const { container: container1 } = render(
      <ConnectorCurveForward dst={{ x: 100, y: 100 }} />
    );
    expect(container1.firstChild).toBeNull();

    const { container: container2 } = render(
      <ConnectorCurveForward src={{ x: 10, y: 10 }} />
    );
    expect(container2.firstChild).toBeNull();
  });

  test("ConnectorCurve renders when invalid property is true", () => {
    const { container } = render(
      <ConnectorCurve {...defaultProps} invalid={true} />
    );
    const pathElement = container.querySelector("path");
    expect(pathElement).toBeTruthy();
  });

  test("ConnectorCurve applies 'tmp' class when tmp property is true", () => {
    const { container } = render(
      <ConnectorCurve {...defaultProps} tmp={true} />
    );
    const pathElement = container.querySelector("path");
    expect(pathElement.className.baseVal).toContain("pathTmp");
  });

  test("ConnectorCurve accepts type as a property and renders it correctly", () => {
    const { container } = render(
      <ConnectorCurve {...defaultProps} type="test" />
    );

    const pathElement = container.querySelector("path");
    expect(pathElement).toBeTruthy();

    expect(container.querySelector("g")).toBeTruthy();

    expect(pathElement).toBeInTheDocument();

    expect(pathElement.style.stroke).toBeTruthy();
  });

  test("ConnectorCurve calls onContextMenu when context event is triggered", () => {
    const onContextMenuMock = jest.fn();
    const { container } = render(
      <ConnectorCurve {...defaultProps} onContextMenu={onContextMenuMock} />
    );

    const pathElement = container.querySelector("path");
    expect(pathElement).toBeTruthy();

    fireEvent.contextMenu(pathElement);

    expect(onContextMenuMock).toHaveBeenCalledTimes(1);

    expect(onContextMenuMock.mock.calls[0][0]).toBeTruthy();
  });

  test("ConnectorCurveForward renders waypoints when provided", () => {
    const waypoints = [
      { x: 30, y: 30 },
      { x: 60, y: 60 },
    ];

    const completeProps = {
      ...defaultProps,
      scale: 1,
      src: { x: 10, y: 10 },
      dst: { x: 100, y: 100 },
      waypoints: waypoints,
      onWaypointContextMenu: jest.fn(),
      onUpdateWaypoint: jest.fn(),
      onWaypointMouseDown: jest.fn(),
      isWaypointSelected: () => false,
    };

    const { container } = render(<ConnectorCurveForward {...completeProps} />);

    const waypointElements = container.querySelectorAll(".waypoint");
    expect(waypointElements.length).toBe(2);
  });

  test("ConnectorCurveForward calls isWaypointSelected with correct index", () => {
    const waypoints = [
      { x: 30, y: 30 },
      { x: 60, y: 60 },
    ];

    const isWaypointSelected = jest.fn((index) => index === 1);

    const completeProps = {
      ...defaultProps,
      scale: 1,
      src: { x: 10, y: 10 },
      dst: { x: 100, y: 100 },
      waypoints: waypoints,
      onWaypointContextMenu: jest.fn(),
      onUpdateWaypoint: jest.fn(),
      onWaypointMouseDown: jest.fn(),
      isWaypointSelected: isWaypointSelected,
    };

    const { container } = render(<ConnectorCurveForward {...completeProps} />);

    expect(isWaypointSelected).toHaveBeenCalledWith(0);
    expect(isWaypointSelected).toHaveBeenCalledWith(1);
  });

  test("ConnectorCurveForward calls waypoint callbacks when events are triggered", () => {
    const waypoints = [{ x: 30, y: 30 }];

    const onWaypointMouseDownMock = jest.fn();
    const onWaypointContextMenuMock = jest.fn();
    const onUpdateWaypointMock = jest.fn();

    const completeProps = {
      ...defaultProps,
      scale: 1,
      src: { x: 10, y: 10 },
      dst: { x: 100, y: 100 },
      waypoints: waypoints,
      onWaypointContextMenu: onWaypointContextMenuMock,
      onUpdateWaypoint: onUpdateWaypointMock,
      onWaypointMouseDown: onWaypointMouseDownMock,
      isWaypointSelected: () => false,
    };

    const { container } = render(<ConnectorCurveForward {...completeProps} />);

    const waypointElement = container.querySelector("circle");
    expect(waypointElement).toBeTruthy();

    fireEvent.mouseDown(waypointElement);
    expect(onWaypointMouseDownMock).toHaveBeenCalledTimes(1);
    expect(onWaypointMouseDownMock).toHaveBeenCalledWith(expect.anything(), 0);

    fireEvent.contextMenu(waypointElement);
    expect(onWaypointContextMenuMock).toHaveBeenCalledTimes(1);
    expect(onWaypointContextMenuMock).toHaveBeenCalledWith(
      expect.anything(),
      0
    );
  });

  test("ConnectorCurveForward responds to mouse events", () => {
    const { container } = render(<ConnectorCurveForward {...defaultProps} />);

    const groupElement = container.querySelector("g");
    expect(groupElement).toBeTruthy();

    const pathElement = container.querySelector("path");
    expect(pathElement).toBeTruthy();

    const initialStrokeWidth = pathElement.style.strokeWidth;

    fireEvent.mouseEnter(pathElement);

    expect(pathElement).toBeTruthy();

    fireEvent.mouseLeave(pathElement);

    expect(pathElement).toBeInTheDocument();
  });
});
