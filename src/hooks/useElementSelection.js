import { useState, useCallback } from "react";

/**
 * Custom hook for managing element selection in the flow editor
 * @param {Object} options - Configuration options
 * @param {Object} options.state - Current flow state
 * @returns {Object} Functions and state to manage selections
 */
export function useElementSelection({ state }) {
  const [selectedNodes, setSelectedNodes] = useState([]);

  const [selectedWaypoints, setSelectedWaypoints] = useState([]);
  const [selectStartPoint, setSelectStartPoint] = useState({ x: 0, y: 0 });
  const [selectEndPoint, setSelectEndPoint] = useState({ x: 0, y: 0 });

  /**
   * Clears the current selection
   */
  const clearSelection = useCallback(() => {
    setSelectedNodes([]);
    setSelectedWaypoints([]);
  }, []);

  /**
   * Selects all nodes
   */
  const selectAllNodes = useCallback(() => {
    if (!state?.nodes) return;
    setSelectedNodes(Object.keys(state.nodes));
  }, [state?.nodes]);

  /**
   * Adds nodes to the current selection
   * @param {Array} nodeIds - IDs of nodes to add
   */
  const addNodesToSelection = useCallback((nodeIds) => {
    setSelectedNodes((prev) => {
      const uniqueNewIds = nodeIds.filter((id) => !prev.includes(id));
      return [...prev, ...uniqueNewIds];
    });
  }, []);

  /**
   * Removes nodes from the current selection
   * @param {Array} nodeIds - IDs of nodes to remove
   */
  const removeNodesFromSelection = useCallback((nodeIds) => {
    setSelectedNodes((prev) => prev.filter((id) => !nodeIds.includes(id)));
  }, []);

  /**
   * Adds a waypoint to the current selection
   * @param {Object} waypointInfo - Waypoint information
   */
  const addWaypointToSelection = useCallback((waypointInfo) => {
    setSelectedWaypoints((prev) => {
      const isAlreadySelected = prev.some(
        (wp) =>
          wp.srcNode === waypointInfo.srcNode &&
          wp.srcPort === waypointInfo.srcPort &&
          wp.dstNode === waypointInfo.dstNode &&
          wp.dstPort === waypointInfo.dstPort &&
          wp.waypointIndex === waypointInfo.waypointIndex
      );

      if (isAlreadySelected) return prev;
      return [...prev, waypointInfo];
    });
  }, []);

  /**
   * Removes a waypoint from the current selection
   * @param {Object} waypointInfo - Waypoint information
   */
  const removeWaypointFromSelection = useCallback((waypointInfo) => {
    setSelectedWaypoints((prev) =>
      prev.filter(
        (wp) =>
          !(
            wp.srcNode === waypointInfo.srcNode &&
            wp.srcPort === waypointInfo.srcPort &&
            wp.dstNode === waypointInfo.dstNode &&
            wp.dstPort === waypointInfo.dstPort &&
            wp.waypointIndex === waypointInfo.waypointIndex
          )
      )
    );
  }, []);

  /**
   * Checks if a waypoint is selected
   * @param {Object} waypointInfo - Waypoint information
   * @returns {boolean} - True if the waypoint is selected
   */
  const isWaypointSelected = useCallback(
    (waypointInfo) => {
      if (
        !waypointInfo ||
        typeof waypointInfo !== "object" ||
        !waypointInfo.srcNode ||
        !waypointInfo.dstNode ||
        !waypointInfo.srcPort ||
        !waypointInfo.dstPort ||
        waypointInfo.waypointIndex === undefined
      ) {
        return false;
      }

      const result = selectedWaypoints.some(
        (wp) =>
          wp.srcNode === waypointInfo.srcNode &&
          wp.srcPort === waypointInfo.srcPort &&
          wp.dstNode === waypointInfo.dstNode &&
          wp.dstPort === waypointInfo.dstPort &&
          wp.waypointIndex === waypointInfo.waypointIndex
      );
      return result;
    },
    [selectedWaypoints]
  );

  /**
   * Adds comments to the current selection
   * @param {Array} commentIds - IDs of comments to add
   */
  const addCommentsToSelection = useCallback((commentIds) => {
    setSelectedNodes((prev) => {
      const uniqueNewIds = commentIds.filter((id) => !prev.includes(id));
      return [...prev, ...uniqueNewIds];
    });
  }, []);

  /**
   * Removes comments from the current selection
   * @param {Array} commentIds - IDs of comments to remove
   */
  const removeCommentsFromSelection = useCallback((commentIds) => {
    setSelectedNodes((prev) => prev.filter((id) => !commentIds.includes(id)));
  }, []);
  const processAreaSelection = useCallback(
    (selectionArea, selectionMode, nodesInArea, waypointsInArea = []) => {
      if (!selectionArea) return;

      const hasElements =
        nodesInArea?.length > 0 || waypointsInArea?.length > 0;

      if (hasElements) {
        if (selectionMode === "select") {
          setSelectedNodes(nodesInArea || []);
          setSelectedWaypoints(waypointsInArea || []);
        } else if (selectionMode === "select-add") {
          if (nodesInArea?.length > 0) addNodesToSelection(nodesInArea);
          if (waypointsInArea?.length > 0)
            waypointsInArea.forEach((wp) => addWaypointToSelection(wp));
        } else if (selectionMode === "select-remove") {
          if (nodesInArea?.length > 0) removeNodesFromSelection(nodesInArea);
          if (waypointsInArea?.length > 0)
            waypointsInArea.forEach((wp) => removeWaypointFromSelection(wp));
        }
      } else if (selectionMode === "select") {
        clearSelection();
      }
    },
    [
      addNodesToSelection,
      removeNodesFromSelection,
      addWaypointToSelection,
      removeWaypointFromSelection,
      addCommentsToSelection,
      removeCommentsFromSelection,
      clearSelection,
    ]
  );

  return {
    selectedNodes,
    setSelectedNodes,
    selectedWaypoints,
    setSelectedWaypoints,
    selectStartPoint,
    setSelectStartPoint,
    selectEndPoint,
    setSelectEndPoint,
    clearSelection,
    selectAllNodes,
    addNodesToSelection,
    removeNodesFromSelection,
    addWaypointToSelection,
    removeWaypointFromSelection,
    addCommentsToSelection,
    removeCommentsFromSelection,
    isWaypointSelected,
    processAreaSelection,
  };
}
