import { useEffect } from "react";

/**
 * Custom hook for managing keyboard shortcuts
 * @param {Object} options - Configuration options
 * @param {Object} options.screenRef - Reference to screen element
 * @param {Function} options.removeNodes - Function to remove nodes
 * @param {Array} options.selectedNodes - Currently selected nodes
 * @param {Function} options.setSelectedNodes - Function to update selected nodes
 * @param {Function} options.selectAllNodes - Function to select all nodes
 * @param {Function} options.copyNodesToClipboard - Function to copy nodes to clipboard
 * @param {Function} options.pasteNodesFromClipboard - Function to paste nodes from clipboard
 * @returns {void}
 */
export function useKeyboardShortcuts({
  screenRef,
  removeNodes,
  selectedNodes,
  setSelectedNodes,
  selectAllNodes,
  copyNodesToClipboard,
  pasteNodesFromClipboard,
}) {
  useEffect(() => {
    const srr = screenRef.current;

    if (!srr) return;

    const focusHandler = () => {};

    const keyHandler = (e) => {
      const inside = screenRef.current === document.activeElement;

      if (!inside) return;

      switch (e.key.toLowerCase()) {
        case "delete":
        case "backspace":
          removeNodes(selectedNodes);
          break;

        case "escape":
          setSelectedNodes([]);
          break;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "a":
            e.preventDefault();
            e.stopPropagation();
            selectAllNodes();
            break;

          case "c":
            e.preventDefault();
            e.stopPropagation();
            copyNodesToClipboard(selectedNodes);
            break;

          case "v":
            e.preventDefault();
            e.stopPropagation();

            const mousePosition = window.mousePosition || {
              x: e.clientX,
              y: e.clientY,
            };
            pasteNodesFromClipboard(mousePosition);
            break;
        }
      }
    };

    srr.addEventListener("focus", focusHandler);
    srr.addEventListener("blur", focusHandler);
    srr.addEventListener("keydown", keyHandler);

    return () => {
      srr.removeEventListener("focus", focusHandler);
      srr.removeEventListener("blur", focusHandler);
      srr.removeEventListener("keydown", keyHandler);
    };
  }, [
    screenRef.current,
    selectedNodes,
    removeNodes,
    setSelectedNodes,
    selectAllNodes,
    copyNodesToClipboard,
    pasteNodesFromClipboard,
  ]);
}
