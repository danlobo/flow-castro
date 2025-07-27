import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

describe("useKeyboardShortcuts Hook", () => {
  const mockRemoveNodes = jest.fn();
  const mockSetSelectedNodes = jest.fn();
  const mockSelectAllNodes = jest.fn();
  const mockCopyNodesToClipboard = jest.fn();
  const mockPasteNodesFromClipboard = jest.fn();

  const mockScreenRef = {
    current: document.createElement("div"),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    document.body.appendChild(mockScreenRef.current);
    mockScreenRef.current.focus = jest.fn();
    Object.defineProperty(document, "activeElement", {
      value: mockScreenRef.current,
      writable: true,
    });
  });

  afterEach(() => {
    if (mockScreenRef.current.parentNode) {
      document.body.removeChild(mockScreenRef.current);
    }
  });

  test("deve chamar removeNodes quando Delete é pressionado", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        screenRef: mockScreenRef,
        removeNodes: mockRemoveNodes,
        selectedNodes: ["node1", "node2"],
        setSelectedNodes: mockSetSelectedNodes,
        selectAllNodes: mockSelectAllNodes,
        copyNodesToClipboard: mockCopyNodesToClipboard,
        pasteNodesFromClipboard: mockPasteNodesFromClipboard,
      })
    );

    act(() => {
      const deleteEvent = new KeyboardEvent("keydown", {
        key: "Delete",
        bubbles: true,
      });
      mockScreenRef.current.dispatchEvent(deleteEvent);
    });

    expect(mockRemoveNodes).toHaveBeenCalledWith(["node1", "node2"]);
  });

  test("deve chamar setSelectedNodes com array vazio quando Escape é pressionado", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        screenRef: mockScreenRef,
        removeNodes: mockRemoveNodes,
        selectedNodes: ["node1", "node2"],
        setSelectedNodes: mockSetSelectedNodes,
        selectAllNodes: mockSelectAllNodes,
        copyNodesToClipboard: mockCopyNodesToClipboard,
        pasteNodesFromClipboard: mockPasteNodesFromClipboard,
      })
    );

    act(() => {
      const escapeEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      });
      mockScreenRef.current.dispatchEvent(escapeEvent);
    });

    expect(mockSetSelectedNodes).toHaveBeenCalledWith([]);
  });

  test("deve chamar selectAllNodes quando Ctrl+A é pressionado", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        screenRef: mockScreenRef,
        removeNodes: mockRemoveNodes,
        selectedNodes: ["node1", "node2"],
        setSelectedNodes: mockSetSelectedNodes,
        selectAllNodes: mockSelectAllNodes,
        copyNodesToClipboard: mockCopyNodesToClipboard,
        pasteNodesFromClipboard: mockPasteNodesFromClipboard,
      })
    );

    const preventDefaultMock = jest.fn();

    act(() => {
      const ctrlAEvent = new KeyboardEvent("keydown", {
        key: "a",
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(ctrlAEvent, "preventDefault", {
        value: preventDefaultMock,
      });

      mockScreenRef.current.dispatchEvent(ctrlAEvent);
    });

    expect(preventDefaultMock).toHaveBeenCalled();
    expect(mockSelectAllNodes).toHaveBeenCalled();
  });

  test("não deve chamar funções quando o elemento não está focado", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        screenRef: mockScreenRef,
        removeNodes: mockRemoveNodes,
        selectedNodes: ["node1", "node2"],
        setSelectedNodes: mockSetSelectedNodes,
        selectAllNodes: mockSelectAllNodes,
        copyNodesToClipboard: mockCopyNodesToClipboard,
        pasteNodesFromClipboard: mockPasteNodesFromClipboard,
      })
    );

    Object.defineProperty(document, "activeElement", {
      value: document.body,
      writable: true,
    });

    act(() => {
      const deleteEvent = new KeyboardEvent("keydown", {
        key: "Delete",
        bubbles: true,
      });
      mockScreenRef.current.dispatchEvent(deleteEvent);
    });

    expect(mockRemoveNodes).not.toHaveBeenCalled();
  });

  test("deve chamar copyNodesToClipboard quando Ctrl+C é pressionado", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        screenRef: mockScreenRef,
        removeNodes: mockRemoveNodes,
        selectedNodes: ["node1", "node2"],
        setSelectedNodes: mockSetSelectedNodes,
        selectAllNodes: mockSelectAllNodes,
        copyNodesToClipboard: mockCopyNodesToClipboard,
        pasteNodesFromClipboard: mockPasteNodesFromClipboard,
      })
    );

    const preventDefaultMock = jest.fn();
    const stopPropagationMock = jest.fn();

    act(() => {
      const ctrlCEvent = new KeyboardEvent("keydown", {
        key: "c",
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(ctrlCEvent, "preventDefault", {
        value: preventDefaultMock,
      });
      Object.defineProperty(ctrlCEvent, "stopPropagation", {
        value: stopPropagationMock,
      });

      mockScreenRef.current.dispatchEvent(ctrlCEvent);
    });

    expect(preventDefaultMock).toHaveBeenCalled();
    expect(stopPropagationMock).toHaveBeenCalled();
    expect(mockCopyNodesToClipboard).toHaveBeenCalledWith(["node1", "node2"]);
  });

  test("deve chamar pasteNodesFromClipboard quando Ctrl+V é pressionado", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        screenRef: mockScreenRef,
        removeNodes: mockRemoveNodes,
        selectedNodes: ["node1", "node2"],
        setSelectedNodes: mockSetSelectedNodes,
        selectAllNodes: mockSelectAllNodes,
        copyNodesToClipboard: mockCopyNodesToClipboard,
        pasteNodesFromClipboard: mockPasteNodesFromClipboard,
      })
    );

    window.mousePosition = { x: 100, y: 200 };

    const preventDefaultMock = jest.fn();
    const stopPropagationMock = jest.fn();

    act(() => {
      const ctrlVEvent = new KeyboardEvent("keydown", {
        key: "v",
        ctrlKey: true,
        bubbles: true,
        clientX: 150,
        clientY: 250,
      });

      Object.defineProperty(ctrlVEvent, "preventDefault", {
        value: preventDefaultMock,
      });
      Object.defineProperty(ctrlVEvent, "stopPropagation", {
        value: stopPropagationMock,
      });

      mockScreenRef.current.dispatchEvent(ctrlVEvent);
    });

    expect(preventDefaultMock).toHaveBeenCalled();
    expect(stopPropagationMock).toHaveBeenCalled();
    expect(mockPasteNodesFromClipboard).toHaveBeenCalledWith({
      x: 100,
      y: 200,
    });

    delete window.mousePosition;
  });

  test("deve usar a posição do evento se mousePosition não estiver disponível", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        screenRef: mockScreenRef,
        removeNodes: mockRemoveNodes,
        selectedNodes: ["node1", "node2"],
        setSelectedNodes: mockSetSelectedNodes,
        selectAllNodes: mockSelectAllNodes,
        copyNodesToClipboard: mockCopyNodesToClipboard,
        pasteNodesFromClipboard: mockPasteNodesFromClipboard,
      })
    );

    delete window.mousePosition;

    const preventDefaultMock = jest.fn();
    const stopPropagationMock = jest.fn();

    act(() => {
      const ctrlVEvent = new KeyboardEvent("keydown", {
        key: "v",
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(ctrlVEvent, "preventDefault", {
        value: preventDefaultMock,
      });
      Object.defineProperty(ctrlVEvent, "stopPropagation", {
        value: stopPropagationMock,
      });

      Object.defineProperty(ctrlVEvent, "clientX", { value: 300 });
      Object.defineProperty(ctrlVEvent, "clientY", { value: 400 });

      mockScreenRef.current.dispatchEvent(ctrlVEvent);
    });

    expect(preventDefaultMock).toHaveBeenCalled();
    expect(stopPropagationMock).toHaveBeenCalled();
    expect(mockPasteNodesFromClipboard).toHaveBeenCalledWith({
      x: 300,
      y: 400,
    });
  });
});
