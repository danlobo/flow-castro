/**
 * Reads the on-screen position of every port from the DOM.
 *
 * The layout algorithm has no idea how a custom node renders its ports, so it
 * asks for them: with these offsets it aligns edges with the actual ports
 * instead of the node center, and it learns the visual order of the outputs.
 *
 * @param {HTMLElement} container - The screen element holding the cards
 * @param {Object} state - Flow state ({ nodes: { [id]: node } })
 * @param {number} [scale=1] - Current zoom, to convert back to flow units
 * @returns {Object} { [nodeId]: { outputs: { [port]: dy }, inputs: {...} } }
 */
export function measurePortOffsets(container, state, scale = 1) {
  if (!container || !state?.nodes) return null;

  const zoom = scale || 1;
  const offsets = {};

  for (const id of Object.keys(state.nodes)) {
    const card = container.querySelector(`#card-${CSS.escape(id)}`);
    if (!card) continue;

    const cardTop = card.getBoundingClientRect().top;
    const entry = { inputs: {}, outputs: {} };

    for (const port of card.querySelectorAll("[data-port-connector-name]")) {
      const name = port.dataset.portConnectorName;
      const direction = port.dataset.portConnectorDirection;
      const bucket = direction === "input" ? entry.inputs : entry.outputs;

      const rect = port.getBoundingClientRect();
      bucket[name] = (rect.top + rect.height / 2 - cardTop) / zoom;
    }

    offsets[id] = entry;
  }

  return offsets;
}

export default measurePortOffsets;
