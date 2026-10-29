/**
 * Shared rules for finding where a connection being made should land.
 *
 * `source` is the port the connection starts from: `{ nodeId, portName,
 * portType, direction }`. Ports are found through the `data-*` attributes the
 * port overlay carries, so this works on plain DOM without React state.
 */

// How far (px) from a compatible port a drag may end and still snap to it.
// A finger covers the port it is aiming at, so it gets the most slack.
export const SNAP_RADIUS = { mouse: 0, pen: 16, touch: 32 };

// How close (px) a dragging finger must get to a compatible port before the
// loupe opens to show what is under it.
export const LOUPE_RADIUS = 72;

export const isCompatiblePort = (source, { nodeId, direction, portType }) =>
  Boolean(source) &&
  String(source.nodeId) !== String(nodeId) &&
  String(source.direction) !== String(direction) &&
  String(source.portType) === String(portType);

const overlayPort = (el) => ({
  nodeId: el.dataset.nodeId,
  portName: el.dataset.portName,
  portType: el.dataset.portType,
  direction: el.dataset.portDirection,
});

const isCompatibleOverlay = (source, el, overlayClass) =>
  el.classList?.contains(overlayClass) &&
  !el.closest("[data-flow-loupe]") &&
  isCompatiblePort(source, overlayPort(el));

const distanceToRect = (x, y, rect) => {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
};

/**
 * Returns the overlay element of the port the connection should snap to, or
 * null. A port right under the pointer always wins; otherwise the closest
 * compatible port within `radius` screen pixels is taken, which keeps a finger
 * from having to land exactly on a small port it is covering.
 */
export const findConnectionTarget = ({
  root,
  source,
  x,
  y,
  radius = 0,
  overlayClass,
}) => {
  if (!source) return null;

  const direct = document
    .elementsFromPoint(x, y)
    .find((el) => isCompatibleOverlay(source, el, overlayClass));
  if (direct || radius <= 0 || !root) return direct ?? null;

  let best = null;
  let bestDistance = radius;
  root.querySelectorAll(`.${overlayClass}`).forEach((el) => {
    if (!isCompatibleOverlay(source, el, overlayClass)) return;
    const distance = distanceToRect(x, y, el.getBoundingClientRect());
    if (distance <= bestDistance) {
      best = el;
      bestDistance = distance;
    }
  });
  return best;
};

/**
 * Screen position of the visible connector of the port an overlay belongs to,
 * i.e. where the connection line should end when snapped to it.
 */
export const connectorAnchor = (overlay) => {
  const { nodeId, portName, portDirection } = overlay.dataset;
  const connector = overlay.ownerDocument.getElementById(
    `card-${nodeId}-${portDirection}-${portName}`,
  );
  const rect = (connector ?? overlay).getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

export const portFromOverlay = overlayPort;
