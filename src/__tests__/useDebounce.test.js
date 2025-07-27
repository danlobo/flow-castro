import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../hooks/useDebounce";

jest.useFakeTimers();

describe("useDebounce Hook", () => {
  test("retorna o valor inicial imediatamente", () => {
    const initialValue = "initialValue";
    const { result } = renderHook(() => useDebounce(initialValue, 500));

    expect(result.current).toBe(initialValue);
  });

  test("não atualiza o valor antes do delay", () => {
    const initialValue = "initialValue";
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialValue, delay: 500 } }
    );

    rerender({ value: "newValue", delay: 500 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(initialValue);
  });

  test("atualiza o valor após o delay", () => {
    const initialValue = "initialValue";
    const newValue = "newValue";

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialValue, delay: 500 } }
    );

    rerender({ value: newValue, delay: 500 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe(newValue);
  });

  test("cancela o timeout anterior ao receber novo valor", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initialValue", delay: 500 } }
    );

    rerender({ value: "intermediaryValue", delay: 500 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender({ value: "finalValue", delay: 500 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("finalValue");
  });
});
