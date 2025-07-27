import { i } from "../util/i18n";

describe("Função de Internacionalização (i18n)", () => {
  test("deve retornar o texto traduzido quando a chave existe", () => {
    const context = {
      greeting: "Olá {name}!",
    };

    const result = i(context, "greeting", { name: "João" });

    expect(result).toBe("Olá João!");
  });

  test("deve retornar o valor padrão quando a chave não existe", () => {
    const context = {
      greeting: "Olá {name}!",
    };

    const result = i(context, "farewell", {}, "Valor padrão");

    expect(result).toBe("Valor padrão");
  });

  test("deve retornar o valor padrão quando o contexto é nulo", () => {
    const result = i(null, "greeting", { name: "João" }, "Valor padrão");

    expect(result).toBe("Valor padrão");
  });

  test("deve retornar o valor padrão quando a chave é nula", () => {
    const context = {
      greeting: "Olá {name}!",
    };

    const result = i(context, null, { name: "João" }, "Valor padrão");

    expect(result).toBe("Valor padrão");
  });

  test("deve manter os parâmetros não substituídos como texto", () => {
    const context = {
      message: "Olá {name}, você tem {count} mensagens",
    };

    const result = i(context, "message", { name: "João" });

    expect(result).toBe("Olá João, você tem count mensagens");
  });

  test("deve lidar com múltiplos parâmetros", () => {
    const context = {
      message: "Olá {name}, você tem {count} mensagens de {sender}",
    };

    const result = i(context, "message", {
      name: "João",
      count: "5",
      sender: "Maria",
    });

    expect(result).toBe("Olá João, você tem 5 mensagens de Maria");
  });
});
