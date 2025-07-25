import React, { useCallback, useEffect, useRef } from "react";
import css from "./Comment.module.css";
import { useScreenContext } from "./ScreenContext.jsx";

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
  const { scale: screenScale } = useScreenContext();

  const containerRef = useRef(null);

  const mouseDownHandler = useCallback(
    (e) => {
      e.stopPropagation();

      const startX = e.pageX;
      const startY = e.pageY;

      const mouseMoveHandler = (e) => {
        const dx = e.pageX - startX;
        const dy = e.pageY - startY;

        onMove?.({
          x: position.x + dx / screenScale,
          y: position.y + dy / screenScale,
        });
      };
      const mouseUpHandler = (e) => {
        const dx = e.pageX - startX;
        const dy = e.pageY - startY;

        onMoveEnd?.({
          x: position.x + dx / screenScale,
          y: position.y + dy / screenScale,
        });
        window.removeEventListener("mousemove", mouseMoveHandler);
        window.removeEventListener("mouseup", mouseUpHandler);
      };
      window.addEventListener("mousemove", mouseMoveHandler);
      window.addEventListener("mouseup", mouseUpHandler);
    },
    [position, onMove, onMoveEnd, screenScale]
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
      <div className={css.moveHandler} onMouseDown={mouseDownHandler}></div>
      <div className={css.handler}></div>
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
