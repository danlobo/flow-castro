import { renderHook, act } from "@testing-library/react";
import { useDebounceCallback } from "../useDebounceCallback";

jest.useFakeTimers();

describe("useDebounceCallback", () => {
  test("should call the callback function after the specified delay", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current();
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("should only call the callback once when called multiple times within the delay", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("should pass arguments to the callback function", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current("test", 123, { key: "value" });
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith("test", 123, { key: "value" });
  });

  test("should use the latest callback function", () => {
    const callbackA = jest.fn();
    const callbackB = jest.fn();

    const { result, rerender } = renderHook(
      ({ callback, delay }) => useDebounceCallback(callback, delay),
      { initialProps: { callback: callbackA, delay: 500 } }
    );

    rerender({ callback: callbackB, delay: 500 });

    act(() => {
      result.current();
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callbackA).not.toHaveBeenCalled();
    expect(callbackB).toHaveBeenCalledTimes(1);
  });

  test("should reset the timer when called again within the delay", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      result.current();
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("should not call the callback if the component is unmounted", () => {
    const callback = jest.fn();
    const { result, unmount } = renderHook(() =>
      useDebounceCallback(callback, 500)
    );

    act(() => {
      result.current();
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  test("should cancel pending debounced call when cancel() is called", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => {
      result.current();
    });

    act(() => {
      result.current.cancel();
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  test("should maintain a stable reference to the debounced function", () => {
    const callback = jest.fn();
    const { result, rerender } = renderHook(() =>
      useDebounceCallback(callback, 500)
    );

    const initialFn = result.current;

    rerender();

    expect(result.current).toBe(initialFn);
  });
});
