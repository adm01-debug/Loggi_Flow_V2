import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MAX_HISTORY_ITEM_LENGTH,
  MAX_HISTORY_ITEMS,
  MAX_MESSAGE_LENGTH,
  parseAssistantRequest,
} from "../../supabase/functions/ai-logistics-assistant/parse";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const EDGE = join(
  process.cwd(),
  "supabase/functions/ai-logistics-assistant/index.ts",
);

function erro(call: () => unknown): ValidationError {
  try {
    call();
  } catch (e) {
    return e as ValidationError;
  }
  throw new Error("expected ValidationError");
}

describe("parseAssistantRequest", () => {
  it("aceita o pedido mínimo e assume histórico vazio e stream desligado", () => {
    expect(
      parseAssistantRequest({ message: "Quais alertas críticos agora?" }),
    ).toEqual({
      message: "Quais alertas críticos agora?",
      conversationHistory: [],
      stream: false,
    });
  });

  it("apara espaços das pontas da pergunta", () => {
    expect(
      parseAssistantRequest({ message: "  resumo do dia  " }).message,
    ).toBe("resumo do dia");
  });

  it("mantém o alias prompt aceito pelo app antigo", () => {
    expect(parseAssistantRequest({ prompt: "e agora?" }).message).toBe(
      "e agora?",
    );
  });

  it("recusa corpo sem mensagem com a resposta em português que a UI já mostra", () => {
    const falha = erro(() => parseAssistantRequest({}));
    expect(falha.field).toBe("message");
    expect(falha.message).toBe("Por favor, envie uma mensagem.");
  });

  it("recusa corpo que nem é objeto", () => {
    expect(erro(() => parseAssistantRequest("oi")).message).toBe(
      "Por favor, envie uma mensagem.",
    );
    expect(erro(() => parseAssistantRequest(null)).field).toBe("message");
    expect(erro(() => parseAssistantRequest(["oi"])).field).toBe("message");
  });

  it("recusa mensagem só de espaços e mensagem que não é texto", () => {
    expect(erro(() => parseAssistantRequest({ message: "   " })).message).toBe(
      "Por favor, envie uma mensagem.",
    );
    expect(erro(() => parseAssistantRequest({ message: 42 })).message).toBe(
      "Por favor, envie uma mensagem.",
    );
  });

  it("aceita o teto exato e recusa um caractere acima, citando o limite", () => {
    const noLimite = "a".repeat(MAX_MESSAGE_LENGTH);
    expect(parseAssistantRequest({ message: noLimite }).message).toHaveLength(
      MAX_MESSAGE_LENGTH,
    );

    const falha = erro(() =>
      parseAssistantRequest({ message: "a".repeat(MAX_MESSAGE_LENGTH + 1) }),
    );
    expect(falha.field).toBe("message");
    expect(falha.message).toContain(String(MAX_MESSAGE_LENGTH));
  });

  it("aceita stream booleano e recusa string que ligaria SSE por ser truthy", () => {
    expect(parseAssistantRequest({ message: "oi", stream: true }).stream).toBe(
      true,
    );
    expect(parseAssistantRequest({ message: "oi", stream: false }).stream).toBe(
      false,
    );

    const falha = erro(() =>
      parseAssistantRequest({ message: "oi", stream: "true" }),
    );
    expect(falha.field).toBe("stream");
  });

  it("recusa histórico que não é lista e histórico maior que o corte do provedor", () => {
    expect(
      erro(() =>
        parseAssistantRequest({ message: "oi", conversationHistory: "x" }),
      ).field,
    ).toBe("conversationHistory");

    const longo = Array.from({ length: MAX_HISTORY_ITEMS + 1 }, () => ({
      role: "user",
      content: "oi",
    }));
    expect(
      erro(() =>
        parseAssistantRequest({ message: "oi", conversationHistory: longo }),
      ).field,
    ).toBe("conversationHistory");
  });

  it("aponta o item inválido do histórico pelo índice", () => {
    const roleInvalido = erro(() =>
      parseAssistantRequest({
        message: "oi",
        conversationHistory: [{ role: "tool", content: "x" }],
      }),
    );
    expect(roleInvalido.field).toBe("conversationHistory[0].role");

    const conteudoLongo = erro(() =>
      parseAssistantRequest({
        message: "oi",
        conversationHistory: [
          {
            role: "assistant",
            content: "a".repeat(MAX_HISTORY_ITEM_LENGTH + 1),
          },
        ],
      }),
    );
    expect(conteudoLongo.field).toBe("conversationHistory[0].content");
  });

  it("devolve o histórico normalizado com papéis permitidos", () => {
    const pedido = parseAssistantRequest({
      message: "resuma",
      conversationHistory: [
        { role: "user", content: "bom dia" },
        { role: "assistant", content: "bom dia!" },
      ],
    });
    expect(pedido.conversationHistory).toEqual([
      { role: "user", content: "bom dia" },
      { role: "assistant", content: "bom dia!" },
    ]);
  });
});

describe("ai-logistics-assistant/index.ts", () => {
  const src = readFileSync(EDGE, "utf8");

  it("usa o parse no lugar do corpo cru", () => {
    expect(src).toContain(
      "const { message, conversationHistory, stream } = parseAssistantRequest(body);",
    );
    expect(src).not.toContain("body.message || body.prompt");
    expect(src).not.toContain("body.conversationHistory");
    expect(src).not.toContain("body.stream");
  });

  it("responde 400 com o campo inválido antes de chamar o provedor", () => {
    const trecho = src.slice(
      src.indexOf("if (error instanceof ValidationError)"),
    );
    expect(trecho).toContain("status: 400");
    expect(trecho.indexOf("field: error.field")).toBeLessThan(
      trecho.indexOf("log.error"),
    );
  });
});
