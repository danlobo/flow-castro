import { deepMerge } from "../util/deepMerge";

describe("deepMerge Utility", () => {
  test("deve mesclar dois objetos simples", () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };

    const result = deepMerge(target, source);

    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  test("deve mesclar objetos aninhados", () => {
    const target = {
      a: 1,
      b: {
        c: 2,
        d: 3,
      },
    };

    const source = {
      b: {
        d: 4,
        e: 5,
      },
      f: 6,
    };

    const result = deepMerge(target, source);

    expect(result).toEqual({
      a: 1,
      b: {
        c: 2,
        d: 4,
        e: 5,
      },
      f: 6,
    });
  });

  test("deve lidar com múltiplas fontes de mesclagem", () => {
    const target = { a: 1 };
    const source1 = { b: 2 };
    const source2 = { c: 3 };
    const source3 = { d: 4 };

    const result = deepMerge(target, source1, source2, source3);

    expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });

  test("deve retornar o alvo se não houver fontes", () => {
    const target = { a: 1, b: 2 };

    const result = deepMerge(target);

    expect(result).toEqual({ a: 1, b: 2 });
  });

  test("deve criar objetos aninhados se eles não existirem no alvo", () => {
    const target = { a: 1 };
    const source = { b: { c: 2 } };

    const result = deepMerge(target, source);

    expect(result).toEqual({ a: 1, b: { c: 2 } });
  });
});
