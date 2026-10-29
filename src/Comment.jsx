import React, { useCallback, useEffect, useRef } from "react";
import css from "./Comment.module.css";
import { useScreenViewportRef } from "./ScreenContext.jsx";
import { trackPointerDrag } from "./util/pointerDrag";

const Comment = ({
  title,
  onChangeTitle,
  text,
  onChangeText,
  backgroundColor,
  position,
  size,
  onResize,
  onMove,
  onMoveEnd,
  isSelected,
  nodeId,
  onContextMenu,
}) => {
  const viewportRef = useScreenViewportRef();

  const containerRef = useRef(null);

  const moveStartHandler = useCallback(
    (e) => {
      if (e.isPrimary === false) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.stopPropagation();

      const { scale: screenScale } = viewportRef.current;
      const positionAt = (dx, dy) => ({
        x: position.x + dx / screenScale,
        y: position.y + dy / screenScale,
      });

      trackPointerDrag(e, {
        threshold: 0,
        onMove: (dx, dy) => onMove?.(positionAt(dx, dy)),
        onEnd: (dx, dy) => onMoveEnd?.(positionAt(dx, dy)),
        onCancel: () => onMoveEnd?.(positionAt(0, 0)),
      });
    },
    [position, onMove, onMoveEnd, viewportRef],
  );

  /**
   * The CSS resize grip only answers to a mouse, so fingers and pens resize
   * through the corner handle instead. The size is written straight to the
   * element while dragging and reported once at the end, like the grip does.
   */
  const resizeStartHandler = useCallback(
    (e) => {
      if (e.pointerType === "mouse" || e.isPrimary === false) return;
      e.stopPropagation();

      const el = containerRef.current;
      const { scale: screenScale } = viewportRef.current;
      const startW = el.offsetWidth;
      const startH = el.offsetHeight;
      const sizeAt = (dx, dy) => ({
        w: Math.max(80, startW + dx / screenScale),
        h: Math.max(40, startH + dy / screenScale),
      });

      trackPointerDrag(e, {
        threshold: 0,
        onMove: (dx, dy) => {
          const { w, h } = sizeAt(dx, dy);
          el.style.width = `${w}px`;
          el.style.height = `${h}px`;
        },
        onEnd: (dx, dy) => onResize?.(sizeAt(dx, dy)),
        onCancel: () => {
          el.style.width = `${startW}px`;
          el.style.height = `${startH}px`;
        },
      });
    },
    [onResize, viewportRef],
  );

  useEffect(() => {
    const currentRef = containerRef.current;

    const mouseUpHandler = (e) => {
      if (
        size?.w !== currentRef.offsetWidth ||
        size?.h !== currentRef.offsetHeight
      ) {
        onResize?.({ w: currentRef.offsetWidth, h: currentRef.offsetHeight });
      }
    };

    currentRef.addEventListener("mouseup", mouseUpHandler);
    return () => {
      currentRef.removeEventListener("mouseup", mouseUpHandler);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id={`card-${nodeId}`}
      key={`card-${nodeId}`}
      className={[css.container, isSelected ? css.selected : ""].join(" ")}
      style={{
        backgroundColor,
        transform: `translate(${position?.x ?? 0}px, ${position?.y ?? 0}px)`,
        width: size?.w ?? 300,
        height: size?.h ?? 200,
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        if (!e.target.closest("input") && !e.target.closest("textarea")) {
          e.stopPropagation();
        }
      }}
      onContextMenu={onContextMenu}
    >
      {/* Focusable so touch screens count the handles as tap targets: the
          browser otherwise hands a touch near the title to the title input. */}
      <div
        className={css.moveHandler}
        tabIndex={-1}
        onPointerDown={moveStartHandler}
        onMouseDown={(e) => e.stopPropagation()}
      ></div>
      <div
        className={css.handler}
        tabIndex={-1}
        onPointerDown={resizeStartHandler}
      ></div>
      <input
        className={css.title}
        placeholder="Comment"
        value={title ?? ""}
        onChange={(e) => onChangeTitle(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <textarea
        className={css.value}
        value={text ?? ""}
        onChange={(e) => onChangeText(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default Comment;
