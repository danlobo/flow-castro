import { throttle } from "../util/throttle";

jest.useFakeTimers();

describe("Função throttle", () => {
  test("deve executar a função apenas uma vez dentro do intervalo de limite", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(150);

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test("deve preservar o contexto e argumentos da função", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn("a", "b", "c");

    expect(mockFn).toHaveBeenCalledWith("a", "b", "c");
  });

  test("opção leading=false deve funcionar corretamente", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100, { leading: false });

    throttledFn();

    jest.advanceTimersByTime(150);

    expect(mockFn).toHaveBeenCalled();
  });

  test("opção trailing=false deve impedir a execução após o intervalo", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100, { trailing: false });

    throttledFn();

    const callCountAfterFirstInvocation = mockFn.mock.calls.length;

    throttledFn();
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(callCountAfterFirstInvocation);

    jest.advanceTimersByTime(150);

    expect(mockFn).toHaveBeenCalledTimes(callCountAfterFirstInvocation);

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(callCountAfterFirstInvocation + 1);
  });

  test("deve retornar valores das invocações", () => {
    const mockFn = jest.fn().mockImplementation((x) => x * 2);
    const throttledFn = throttle(mockFn, 100);

    const initialResult = throttledFn(5);

    expect(typeof initialResult).toBe("number");

    const subsequentResult = throttledFn(20);

    expect(typeof subsequentResult).toBe("number");

    jest.advanceTimersByTime(150);

    const finalResult = throttledFn(7);
    expect(typeof finalResult).toBe("number");
  });

  test("método cancel deve cancelar a execução pendente", () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(1);

    throttledFn();

    throttledFn.cancel();

    jest.advanceTimersByTime(150);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
