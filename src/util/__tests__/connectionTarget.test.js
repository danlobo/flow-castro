import { findConnectionTarget, isCompatiblePort } from "../connectionTarget";

const source = { nodeId: "a", portName: "out", portType: "num", direction: "output" };

const addOverlay = (root, { nodeId, portName, portType = "num", direction = "input", rect }) => {
  const el = document.createElement("div");
  el.className = "overlay";
  Object.assign(el.dataset, { nodeId, portName, portType, portDirection: direction });
  el.getBoundingClientRect = () => ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height });
  root.appendChild(el);
  return el;
};

describe("isCompatiblePort", () => {
  test("needs another node, the opposite direction and the same type", () => {
    expect(isCompatiblePort(source, { nodeId: "b", direction: "input", portType: "num" })).toBe(true);
    expect(isCompatiblePort(source, { nodeId: "a", direction: "input", portType: "num" })).toBe(false);
    expect(isCompatiblePort(source, { nodeId: "b", direction: "output", portType: "num" })).toBe(false);
    expect(isCompatiblePort(source, { nodeId: "b", direction: "input", portType: "str" })).toBe(false);
    expect(isCompatiblePort(null, { nodeId: "b", direction: "input", portType: "num" })).toBe(false);
  });
});

describe("findConnectionTarget", () => {
  let root;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.appendChild(root);
    document.elementsFromPoint = jest.fn(() => []);
  });

  afterEach(() => {
    root.remove();
    delete document.elementsFromPoint;
  });

  test("prefers the compatible port right under the pointer", () => {
    const under = addOverlay(root, { nodeId: "b", portName: "x", rect: { left: 100, top: 100, width: 10, height: 10 } });
    addOverlay(root, { nodeId: "c", portName: "y", rect: { left: 0, top: 0, width: 10, height: 10 } });
    document.elementsFromPoint.mockReturnValue([under]);

    expect(findConnectionTarget({ root, source, x: 1, y: 1, radius: 50, overlayClass: "overlay" })).toBe(under);
  });

  test("snaps to the closest compatible port within the radius", () => {
    addOverlay(root, { nodeId: "b", portName: "far", rect: { left: 40, top: 0, width: 10, height: 10 } });
    const near = addOverlay(root, { nodeId: "c", portName: "near", rect: { left: 20, top: 0, width: 10, height: 10 } });
    addOverlay(root, { nodeId: "d", portName: "wrongType", portType: "str", rect: { left: 12, top: 0, width: 10, height: 10 } });

    expect(findConnectionTarget({ root, source, x: 0, y: 5, radius: 32, overlayClass: "overlay" })).toBe(near);
  });

  test("returns null when nothing compatible is close enough", () => {
    addOverlay(root, { nodeId: "b", portName: "x", rect: { left: 100, top: 0, width: 10, height: 10 } });

    expect(findConnectionTarget({ root, source, x: 0, y: 0, radius: 32, overlayClass: "overlay" })).toBeNull();
    expect(findConnectionTarget({ root, source, x: 0, y: 0, radius: 0, overlayClass: "overlay" })).toBeNull();
  });

  test("ignores ports inside the loupe", () => {
    const loupe = document.createElement("div");
    loupe.setAttribute("data-flow-loupe", "");
    root.appendChild(loupe);
    addOverlay(loupe, { nodeId: "b", portName: "x", rect: { left: 0, top: 0, width: 10, height: 10 } });

    expect(findConnectionTarget({ root, source, x: 5, y: 5, radius: 32, overlayClass: "overlay" })).toBeNull();
  });
});
