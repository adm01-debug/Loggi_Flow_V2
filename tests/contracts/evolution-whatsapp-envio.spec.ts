import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MAX_MESSAGE_LENGTH,
  parseCotacaoRequest,
  parseSendTextRequest,
  parseStatusRequest,
} from "../../supabase/functions/evolution-whatsapp/parse";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const EDGE = join(
  process.cwd(),
  "supabase/functions/evolution-whatsapp/index.ts",
);
const INSTANCES = ["PRINCIPAL", "SUPORTE"];

function erro(call: () => unknown): ValidationError {
  try {
    call();
  } catch (e) {
    return e as ValidationError;
  }
  throw new Error("expected ValidationError");
}

describe("parseSendTextRequest", () => {
  it("aceita o envio real do hook com instance da lista e E.164", () => {
    expect(
      parseSendTextRequest(
        {
          instance: "PRINCIPAL",
          phone: "+5511999999999",
          message: "Sua carga saiu para entrega",
        },
        INSTANCES,
      ),
    ).toEqual({
      instance: "PRINCIPAL",
      phone: "+5511999999999",
      message: "Sua carga saiu para entrega",
    });
  });

  it("aceita telefone com DDI sem o + e recusa o que não é E.164", () => {
    expect(
      parseSendTextRequest(
        { instance: "SUPORTE", phone: "5511999999999", message: "oi" },
        INSTANCES,
      ).phone,
    ).toBe("5511999999999");
  });

  it("recusa telefone curto, com máscara ou com letras em vez de normalizar", () => {
    for (const phone of [
      "123",
      "(11) 99999-9999",
      "11999999999",
      "+551199999999999999",
    ]) {
      const falha = erro(() =>
        parseSendTextRequest(
          { instance: "PRINCIPAL", phone, message: "oi" },
          INSTANCES,
        ),
      );
      expect(falha.field).toBe("phone");
      expect(falha.message).toBe("phone has invalid format");
    }
  });

  it("recusa instance fora da lista fechada citando as permitidas", () => {
    const falha = erro(() =>
      parseSendTextRequest(
        { instance: "OUTRA_EMPRESA", phone: "+5511999999999", message: "oi" },
        INSTANCES,
      ),
    );
    expect(falha.field).toBe("instance");
    expect(falha.message).toContain("PRINCIPAL, SUPORTE");
  });

  it("recusa corpo que nem é objeto", () => {
    for (const corpo of [null, "send_text", ["PRINCIPAL"]]) {
      expect(erro(() => parseSendTextRequest(corpo, INSTANCES)).field).toBe(
        "instance",
      );
    }
  });

  it("recusa instance vazia, com barra de URL ou não-texto", () => {
    for (const instance of [undefined, "", "../../admin", 7]) {
      expect(
        erro(() =>
          parseSendTextRequest(
            { instance, phone: "+5511999999999", message: "oi" },
            INSTANCES,
          ),
        ).field,
      ).toBe("instance");
    }
  });

  it("recusa mensagem vazia e mensagem acima do limite do WhatsApp", () => {
    expect(
      erro(() =>
        parseSendTextRequest(
          { instance: "PRINCIPAL", phone: "+5511999999999", message: "   " },
          INSTANCES,
        ),
      ).field,
    ).toBe("message");

    const falha = erro(() =>
      parseSendTextRequest(
        {
          instance: "PRINCIPAL",
          phone: "+5511999999999",
          message: "a".repeat(MAX_MESSAGE_LENGTH + 1),
        },
        INSTANCES,
      ),
    );
    expect(falha.field).toBe("message");
    expect(falha.message).toContain(String(MAX_MESSAGE_LENGTH));
  });
});

describe("parseCotacaoRequest e parseStatusRequest", () => {
  it("aceita cotação só com instance e phone, com opcionais ausentes", () => {
    const pedido = parseCotacaoRequest(
      { instance: "PRINCIPAL", phone: "+5511999999999" },
      INSTANCES,
    );
    expect(pedido).toEqual({
      instance: "PRINCIPAL",
      phone: "+5511999999999",
      transportadora: undefined,
      origem: undefined,
      destino: undefined,
      peso: undefined,
      volumes: undefined,
      valor_mercadoria: undefined,
    });
  });

  it("preserva os opcionais e recusa campo de texto gigante", () => {
    const pedido = parseCotacaoRequest(
      {
        instance: "PRINCIPAL",
        phone: "+5511999999999",
        transportadora: "Rodonaves",
        origem: "São Paulo",
        destino: "Recife",
        peso: "120",
        volumes: "4",
        valor_mercadoria: "1500",
      },
      INSTANCES,
    );
    expect(pedido.transportadora).toBe("Rodonaves");
    expect(pedido.valor_mercadoria).toBe("1500");

    expect(
      erro(() =>
        parseCotacaoRequest(
          {
            instance: "PRINCIPAL",
            phone: "+5511999999999",
            valor_mercadoria: "9".repeat(201),
          },
          INSTANCES,
        ),
      ).field,
    ).toBe("valor_mercadoria");
  });

  it("exige instance do status na lista fechada", () => {
    expect(parseStatusRequest({ instance: "SUPORTE" }, INSTANCES)).toEqual({
      instance: "SUPORTE",
    });
    expect(erro(() => parseStatusRequest({}, INSTANCES)).field).toBe(
      "instance",
    );
  });
});

describe("evolution-whatsapp/index.ts", () => {
  const src = readFileSync(EDGE, "utf8");

  it("valida as três ações com os parses no lugar do corpo cru", () => {
    expect(src).toContain(
      "const { instance, phone, message } = parseSendTextRequest(",
    );
    expect(src).toContain("} = parseCotacaoRequest(data, ALLOWED_INSTANCES);");
    expect(src).toContain(
      "const { instance } = parseStatusRequest(data, ALLOWED_INSTANCES);",
    );
    expect(src).not.toContain("} = data;");
    expect(src).not.toContain("!instance || !phone");
  });

  it("monta a lista fechada de instâncias e responde 400 com o campo", () => {
    expect(src).toContain("EVOLUTION_ALLOWED_INSTANCES");
    expect(src).toContain(
      'Deno.env.get("EVOLUTION_INSTANCE_NAME") || "PRINCIPAL"',
    );
    const trecho = src.slice(
      src.indexOf("if (error instanceof ValidationError)"),
    );
    expect(trecho).toContain("status: 400");
    expect(trecho.indexOf("field: error.field")).toBeLessThan(
      trecho.indexOf('log("ERROR"'),
    );
  });
});
