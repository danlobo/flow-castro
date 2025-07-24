import { useCallback } from "react";
import { nanoid } from "nanoid";

/**
 * Custom hook for managing node operations
 * @param {Object} options - Configuration options
 * @param {Object} options.state - Current flow state
 * @param {Function} options.setStateAndNotify - Function to update state and notify changes
 * @param {Function} options.setSelectedNodes - Function to update node selection
 * @param {Object} options.nodeTypes - Definition of available node types
 * @returns {Object} Methods for manipulating nodes
 */
export function useNodeOperations({
  state,
  setStateAndNotify,
  setSelectedNodes,
  nodeTypes,
}) {
  /**
   * Adds a new node to the flow
   * @param {Object} nodeType - Type of node to add
   * @param {Object} pos - Position where the node will be added
   */
  const addNode = useCallback(
    (nodeType, pos) => {
      const newNode = {
        id: nanoid(),
        name: nodeType.label,
        type: nodeType.type,
        position: pos,
        values: nodeType.inputs().reduce((acc, input) => {
          if (input.defaultValue == null) return acc;

          acc[input.name] = input.defaultValue;
          return acc;
        }, {}),
      };

      setStateAndNotify((prev) => ({
        ...prev,
        nodes: {
          ...(prev.nodes ?? {}),
          [newNode.id]: newNode,
        },
      }));
    },
    [setStateAndNotify]
  );

  /**
   * Remove nodes from the flow
   * @param {Array} ids - IDs of nodes to remove
   */
  const removeNodes = useCallback(
    (ids) => {
      if (!ids?.length) return;

      const idsNoRoot = ids.filter(
        (id) => !nodeTypes[state.nodes[id]?.type]?.root
      );

      const nodesToRemove = [...ids];
      const nodesToAdd = {};

      for (const nodeId of ids) {
        const node = state.nodes[nodeId];
        if (!node) continue;

        if (node.connections?.outputs?.length) {
          for (const conn of node.connections.outputs) {
            const otherNode = state.nodes[conn.node];

            if (!otherNode || idsNoRoot.includes(otherNode.id)) continue;

            if (!nodesToRemove.includes(otherNode.id))
              nodesToRemove.push(otherNode.id);

            if (!nodesToAdd[otherNode.id]) {
              nodesToAdd[otherNode.id] = {
                ...otherNode,
                connections: {
                  ...otherNode.connections,
                  inputs: otherNode.connections?.inputs ?? [],
                  outputs: otherNode.connections?.outputs ?? [],
                },
              };
            }
            nodesToAdd[otherNode.id].connections.outputs = [
              ...(otherNode.connections.outputs ?? []),
            ];
            nodesToAdd[otherNode.id].connections.inputs =
              otherNode.connections?.inputs?.filter(
                (c) => !(c.port === conn.name && c.node === node.id)
              ) ?? [];
          }
        }

        if (node.connections?.inputs?.length) {
          for (const conn of node.connections.inputs) {
            const otherNode = state.nodes[conn.node];

            if (!otherNode || idsNoRoot.includes(otherNode.id)) continue;

            if (!nodesToRemove.includes(otherNode.id))
              nodesToRemove.push(otherNode.id);

            if (!nodesToAdd[otherNode.id])
              nodesToAdd[otherNode.id] = { ...otherNode };

            nodesToAdd[otherNode.id].connections.outputs =
              otherNode.connections?.outputs?.filter(
                (c) => !(c.port === conn.name && c.node === node.id)
              ) ?? [];
            nodesToAdd[otherNode.id].connections.inputs = [
              ...(otherNode.connections.inputs ?? []),
            ];
          }
        }
      }

      setSelectedNodes([]);

      setStateAndNotify((prev) => {
        const newNodes = {
          ...(prev.nodes ?? {}),
        };

        nodesToRemove
          .filter((id) => !nodeTypes[state.nodes[id]?.type]?.root)
          .forEach((id) => {
            delete newNodes[id];
          });
        Object.values(nodesToAdd).forEach((node) => {
          newNodes[node.id] = node;
        });

        return {
          ...prev,
          nodes: newNodes,
        };
      });
    },
    [state, setStateAndNotify, setSelectedNodes, nodeTypes]
  );

  /**
   * Clona um nó existente
   * @param {string} id - ID do nó a ser clonado
   */
  const cloneNode = useCallback(
    (id) => {
      const node = state.nodes[id];
      if (!node) return;

      const newNode = {
        ...node,
        id: nanoid(),
        position: { x: node.position.x + 20, y: node.position.y + 20 },
        connections: {
          inputs: [],
          outputs: [],
        },
      };

      setStateAndNotify((prev) => ({
        ...prev,
        nodes: {
          ...(prev.nodes ?? {}),
          [newNode.id]: newNode,
        },
      }));
    },
    [setStateAndNotify, state]
  );

  /**
   * Remove uma conexão entre nós
   * @param {string} srcNode - ID do nó de origem
   * @param {string} srcPort - Porta do nó de origem
   * @param {string} dstNode - ID do nó de destino
   * @param {string} dstPort - Porta do nó de destino
   */
  const removeConnectionFromOutput = useCallback(
    (srcNode, srcPort, dstNode, dstPort) => {
      setStateAndNotify((prev) => {
        const newNodes = {
          ...(prev.nodes ?? {}),
        };

        if (!newNodes[srcNode] || !newNodes[dstNode]) return prev;

        newNodes[srcNode] = {
          ...newNodes[srcNode],
          connections: {
            ...newNodes[srcNode].connections,
            outputs: newNodes[srcNode].connections.outputs.filter(
              (conn) =>
                !(
                  conn.name === srcPort &&
                  conn.node === dstNode &&
                  conn.port === dstPort
                )
            ),
          },
        };

        newNodes[dstNode] = {
          ...newNodes[dstNode],
          connections: {
            ...newNodes[dstNode].connections,
            inputs: newNodes[dstNode].connections.inputs.filter(
              (conn) =>
                !(
                  conn.name === dstPort &&
                  conn.node === srcNode &&
                  conn.port === srcPort
                )
            ),
          },
        };

        return {
          ...prev,
          nodes: newNodes,
        };
      });
    },
    [setStateAndNotify]
  );

  /**
   * Adiciona um ponto de waypoint a uma conexão
   * @param {string} srcNode - ID do nó de origem
   * @param {string} srcPort - Porta do nó de origem
   * @param {string} dstNode - ID do nó de destino
   * @param {string} dstPort - Porta do nó de destino
   * @param {Object} position - Posição do waypoint
   */
  const addWaypoint = useCallback(
    (srcNode, srcPort, dstNode, dstPort, position) => {
      setStateAndNotify((prev) => {
        const newNodes = {
          ...(prev.nodes ?? {}),
        };

        if (!newNodes[srcNode]) return prev;

        // Encontrar a conexão correspondente nos outputs do nó de origem
        const connectionIndex = newNodes[
          srcNode
        ].connections?.outputs?.findIndex(
          (conn) =>
            conn.name === srcPort &&
            conn.node === dstNode &&
            conn.port === dstPort
        );

        if (connectionIndex === -1) return prev;

        // Clonar a conexão e garantir que o array de waypoints existe
        const connection = {
          ...newNodes[srcNode].connections.outputs[connectionIndex],
          waypoints: [
            ...(newNodes[srcNode].connections.outputs[connectionIndex]
              .waypoints || []),
          ],
        };

        // Adicionar o novo waypoint
        connection.waypoints.push(position);

        // Atualizar a conexão no objeto newNodes
        newNodes[srcNode] = {
          ...newNodes[srcNode],
          connections: {
            ...newNodes[srcNode].connections,
            outputs: [
              ...newNodes[srcNode].connections.outputs.slice(
                0,
                connectionIndex
              ),
              connection,
              ...newNodes[srcNode].connections.outputs.slice(
                connectionIndex + 1
              ),
            ],
          },
        };

        return {
          ...prev,
          nodes: newNodes,
        };
      });
    },
    [setStateAndNotify]
  );

  /**
   * Atualiza a posição de um waypoint
   * @param {string} srcNode - ID do nó de origem
   * @param {string} srcPort - Porta do nó de origem
   * @param {string} dstNode - ID do nó de destino
   * @param {string} dstPort - Porta do nó de destino
   * @param {number} waypointIndex - Índice do waypoint a ser atualizado
   * @param {Object} newPosition - Nova posição do waypoint
   */
  const updateWaypointPosition = useCallback(
    (srcNode, srcPort, dstNode, dstPort, waypointIndex, newPosition) => {
      setStateAndNotify((prev) => {
        const newNodes = {
          ...(prev.nodes ?? {}),
        };

        if (!newNodes[srcNode]) return prev;

        // Encontrar a conexão correspondente nos outputs do nó de origem
        const connectionIndex = newNodes[
          srcNode
        ].connections?.outputs?.findIndex(
          (conn) =>
            conn.name === srcPort &&
            conn.node === dstNode &&
            conn.port === dstPort
        );

        if (connectionIndex === -1) return prev;

        // Clonar a conexão e garantir que o array de waypoints existe
        const connection = {
          ...newNodes[srcNode].connections.outputs[connectionIndex],
          waypoints: [
            ...(newNodes[srcNode].connections.outputs[connectionIndex]
              .waypoints || []),
          ],
        };

        // Atualizar a posição do waypoint
        if (waypointIndex >= 0 && waypointIndex < connection.waypoints.length) {
          connection.waypoints[waypointIndex] = newPosition;
        }

        // Atualizar a conexão no objeto newNodes
        newNodes[srcNode] = {
          ...newNodes[srcNode],
          connections: {
            ...newNodes[srcNode].connections,
            outputs: [
              ...newNodes[srcNode].connections.outputs.slice(
                0,
                connectionIndex
              ),
              connection,
              ...newNodes[srcNode].connections.outputs.slice(
                connectionIndex + 1
              ),
            ],
          },
        };

        return {
          ...prev,
          nodes: newNodes,
        };
      });
    },
    [setStateAndNotify]
  );

  /**
   * Remove um waypoint de uma conexão
   * @param {string} srcNode - ID do nó de origem
   * @param {string} srcPort - Porta do nó de origem
   * @param {string} dstNode - ID do nó de destino
   * @param {string} dstPort - Porta do nó de destino
   * @param {number} waypointIndex - Índice do waypoint a ser removido
   */
  const removeWaypoint = useCallback(
    (srcNode, srcPort, dstNode, dstPort, waypointIndex) => {
      setStateAndNotify((prev) => {
        const newNodes = {
          ...(prev.nodes ?? {}),
        };

        if (!newNodes[srcNode]) return prev;

        // Encontrar a conexão correspondente nos outputs do nó de origem
        const connectionIndex = newNodes[
          srcNode
        ].connections?.outputs?.findIndex(
          (conn) =>
            conn.name === srcPort &&
            conn.node === dstNode &&
            conn.port === dstPort
        );

        if (connectionIndex === -1) return prev;

        // Clonar a conexão e garantir que o array de waypoints existe
        const connection = {
          ...newNodes[srcNode].connections.outputs[connectionIndex],
          waypoints: [
            ...(newNodes[srcNode].connections.outputs[connectionIndex]
              .waypoints || []),
          ],
        };

        // Remover o waypoint pelo índice
        connection.waypoints.splice(waypointIndex, 1);

        // Atualizar a conexão no objeto newNodes
        newNodes[srcNode] = {
          ...newNodes[srcNode],
          connections: {
            ...newNodes[srcNode].connections,
            outputs: [
              ...newNodes[srcNode].connections.outputs.slice(
                0,
                connectionIndex
              ),
              connection,
              ...newNodes[srcNode].connections.outputs.slice(
                connectionIndex + 1
              ),
            ],
          },
        };

        return {
          ...prev,
          nodes: newNodes,
        };
      });
    },
    [setStateAndNotify]
  );

  /**
   * Conecta dois nós
   * @param {Object} connection - Informações da conexão
   * @param {Object} connection.source - Nó e porta de origem
   * @param {Object} connection.target - Nó e porta de destino
   */
  const connectNodes = useCallback(
    ({ source, target }) => {
      let connectionSuccess = false;

      setStateAndNotify((prev) => {
        if (!prev?.nodes || !Object.keys(prev.nodes).length) return null;

        const item = {
          srcNode: source.nodeId,
          dstNode: target.nodeId,
          srcPort: source.portName,
          dstPort: target.portName,
        };

        if (item.srcNode === item.dstNode) return prev;

        // deep merge
        const srcNode = JSON.parse(JSON.stringify(prev.nodes[item.srcNode]));
        const dstNode = JSON.parse(JSON.stringify(prev.nodes[item.dstNode]));

        const srcPort = nodeTypes[srcNode.type]
          .outputs(srcNode.values, srcNode.connections?.inputs)
          .find((p) => p.name === item.srcPort);
        const dstPort = nodeTypes[dstNode.type]
          .inputs(dstNode.values)
          .find((p) => p.name === item.dstPort);

        if (!srcPort || !dstPort || srcPort.type !== dstPort.type) return prev;

        if (!srcNode.connections) srcNode.connections = {};
        if (!srcNode.connections?.outputs) srcNode.connections.outputs = [];
        if (!srcNode.connections?.inputs) srcNode.connections.inputs = [];

        if (!dstNode.connections) dstNode.connections = {};
        if (!dstNode.connections?.outputs) dstNode.connections.outputs = [];
        if (!dstNode.connections?.inputs) dstNode.connections.inputs = [];

        if (
          !srcNode.connections.outputs.find(
            (c) => c.node === dstNode.id && c.name === dstPort.name
          )
        ) {
          srcNode.connections.outputs.push({
            name: srcPort.name,
            node: dstNode.id,
            port: dstPort.name,
            type: srcPort.type,
            waypoints: [], // Array vazio que armazenará os waypoints
          });
        }

        if (
          !dstNode.connections.inputs.find(
            (c) => c.node === srcNode.id && c.name === srcPort.name
          )
        ) {
          dstNode.connections.inputs.push({
            name: dstPort.name,
            node: srcNode.id,
            port: srcPort.name,
            type: srcPort.type,
          });
        }

        const nodes = {
          ...prev.nodes,
          [srcNode.id]: srcNode,
          [dstNode.id]: dstNode,
        };

        connectionSuccess = true;
        return {
          ...prev,
          nodes,
        };
      });

      return connectionSuccess;
    },
    [setStateAndNotify, nodeTypes]
  );

  /**
   * Updates node values
   * @param {string} id - Node ID
   * @param {Object} values - New values
   */
  const updateNodeValues = useCallback(
    (id, values) => {
      setStateAndNotify((prev) => {
        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [id]: {
              ...prev.nodes[id],
              values,
            },
          },
        };
      });
    },
    [setStateAndNotify]
  );

  return {
    addNode,
    removeNodes,
    cloneNode,
    removeConnectionFromOutput,
    addWaypoint,
    updateWaypointPosition,
    removeWaypoint,
    connectNodes,
    updateNodeValues,
  };
}
