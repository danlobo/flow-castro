import { fireEvent } from "@testing-library/react";
import { trackPointerDrag } from "../pointerDrag";

const press = (init = {}) =>
  new PointerEvent("pointerdown", { pointerId: 1, clientX: 0, clientY: 0, ...init });

describe("trackPointerDrag", () => {
  test("a release within the threshold is a tap", () => {
    const handlers = { onStart: jest.fn(), onTap: jest.fn(), onEnd: jest.fn() };
    trackPointerDrag(press({ pointerType: "touch" }), handlers);

    fireEvent.pointerMove(window, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 5, clientY: 5 });

    expect(handlers.onTap).toHaveBeenCalledTimes(1);
    expect(handlers.onStart).not.toHaveBeenCalled();
    expect(handlers.onEnd).not.toHaveBeenCalled();
  });

  test("past the threshold it is a drag, measured from the press", () => {
    const handlers = { onStart: jest.fn(), onMove: jest.fn(), onEnd: jest.fn(), onTap: jest.fn() };
    trackPointerDrag(press({ pointerType: "touch" }), handlers);

    fireEvent.pointerMove(window, { pointerId: 1, clientX: 10, clientY: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 30, clientY: 20 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 30, clientY: 20 });

    expect(handlers.onStart).toHaveBeenCalledTimes(1);
    expect(handlers.onMove).toHaveBeenLastCalledWith(30, 20, expect.anything());
    expect(handlers.onEnd).toHaveBeenCalledWith(30, 20, expect.anything());
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  test("ignores other pointers moving and lifting", () => {
    const handlers = { onMove: jest.fn(), onTap: jest.fn() };
    trackPointerDrag(press(), { threshold: 0, ...handlers });

    fireEvent.pointerMove(window, { pointerId: 2, clientX: 50, clientY: 0 });
    fireEvent.pointerUp(window, { pointerId: 2, clientX: 50, clientY: 0 });

    expect(handlers.onMove).not.toHaveBeenCalled();
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  test("a second pointer coming down cancels the drag and stops tracking", () => {
    const handlers = { onCancel: jest.fn(), onEnd: jest.fn(), onMove: jest.fn() };
    trackPointerDrag(press({ pointerType: "touch" }), handlers);

    fireEvent.pointerMove(window, { pointerId: 1, clientX: 40, clientY: 0 });
    fireEvent.pointerDown(document.body, { pointerId: 2, clientX: 200, clientY: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 80, clientY: 0 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 80, clientY: 0 });

    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
    expect(handlers.onMove).toHaveBeenCalledTimes(1);
    expect(handlers.onEnd).not.toHaveBeenCalled();
  });

  test("pointercancel cancels a drag", () => {
    const onCancel = jest.fn();
    trackPointerDrag(press(), { threshold: 0, onCancel });

    fireEvent.pointerMove(window, { pointerId: 1, clientX: 10, clientY: 0 });
    fireEvent.pointerCancel(window, { pointerId: 1 });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
