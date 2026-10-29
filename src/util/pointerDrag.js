// How far (px) a pointer must travel before a press becomes a drag instead of
// a tap. Fingers wobble more than mice.
export const DRAG_THRESHOLD = { mouse: 3, pen: 6, touch: 8 };

/**
 * Follows one pointer from a `pointerdown` until it is released, telling a tap
 * apart from a drag. Works the same for mouse, touch and pen.
 *
 * - `onStart(event)` once the pointer has moved past the threshold;
 * - `onMove(dx, dy, event)` on every move after that, with the distance from
 *   where the press started, in screen pixels;
 * - `onEnd(dx, dy, event)` when a drag is released;
 * - `onTap(event)` when the pointer is released without having dragged;
 * - `onCancel(event)` when a drag is interrupted - the browser took the
 *   gesture over, or a second finger came down to pinch.
 */
export function trackPointerDrag(
  event,
  { threshold, onStart, onMove, onEnd, onTap, onCancel } = {},
) {
  const pointerId = event.pointerId;
  const pointerType = event.pointerType || "mouse";
  const limit =
    threshold ?? DRAG_THRESHOLD[pointerType] ?? DRAG_THRESHOLD.touch;
  const startX = event.clientX;
  const startY = event.clientY;
  let dragging = false;

  const handleMove = (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragging) {
      if (Math.hypot(dx, dy) < limit) return;
      dragging = true;
      onStart?.(e);
    }
    onMove?.(dx, dy, e);
  };

  const handleUp = (e) => {
    if (e.pointerId !== pointerId) return;
    removeListeners();
    if (dragging) onEnd?.(e.clientX - startX, e.clientY - startY, e);
    else onTap?.(e);
  };

  const handleCancel = (e) => {
    if (e.type === "pointercancel" && e.pointerId !== pointerId) return;
    if (e.type === "pointerdown" && e.pointerId === pointerId) return;
    removeListeners();
    if (dragging) onCancel?.(e);
  };

  const removeListeners = () => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleCancel);
    window.removeEventListener("pointerdown", handleCancel, true);
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleCancel);
  window.addEventListener("pointerdown", handleCancel, true);

  return { pointerType, cancel: removeListeners };
}
