import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMelhorEnvioQuote } from "../../supabase/functions/melhor-envio-api/parse";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const EDGE = join(
  process.cwd(),
  "supabase/functions/melhor-envio-api/index.ts",
);

// Payload real de src/components/melhorenvio/MECotacaoPanel.tsx:95-101
function cotacaoValida(): Record<string, unknown> {
  return {
    from: { postal_code: "01310100" },
    to: { postal_code: "20040020" },
    products: [
      {
        width: 20,
        height: 10,
        length: 30,
        weight: 1,
        insurance_value: 100,
        quantity: 1,
      },
    ],
    options: { receipt: false, own_hand: false },
  };
}

function erro(params: unknown): ValidationError {
  try {
    parseMelhorEnvioQuote(params);
  } catch (e) {
    return e as ValidationError;
  }
  throw new Error("esperava ValidationError");
}

describe("melhor-envio-api: corpo da cotação (etapa 151 / B-04)", () => {
  it("aceita o payload do painel e normaliza os CEPs para 8 dígitos", () => {
    const body = cotacaoValida();
    (body.to as Record<string, unknown>).postal_code = "20040-020";

    const quote = parseMelhorEnvioQuote(body);

    expect((quote.from as Record<string, unknown>).postal_code).toBe(
      "01310100",
    );
    expect((quote.to as Record<string, unknown>).postal_code).toBe("20040020");
    expect(quote.options).toEqual({ receipt: false, own_hand: false });
    expect((quote.products as Array<Record<string, unknown>>)[0].weight).toBe(
      1,
    );
  });

  it("recusa cotação sem CEP de destino, nomeando o campo", () => {
    const body = cotacaoValida();
    delete (body.to as Record<string, unknown>).postal_code;

    const e = erro(body);
    expect(e.field).toBe("to.postal_code");
  });

  it("recusa CEP que não tem 8 dígitos", () => {
    const body = cotacaoValida();
    (body.from as Record<string, unknown>).postal_code = "1310-100";

    expect(erro(body).field).toBe("from.postal_code");
  });

  it("recusa cotação sem volumes", () => {
    const body = cotacaoValida();
    delete body.products;

    // sem "products" a validação cai no alias "volumes" (useMelhorEnvio.tsx:128)
    expect(erro(body).field).toBe("volumes");
  });

  it("recusa lista de volumes vazia", () => {
    const body = cotacaoValida();
    body.products = [];

    expect(erro(body).field).toBe("products");
  });

  it("recusa cotação com volumes acima do teto", () => {
    const body = cotacaoValida();
    const volume = (body.products as Array<Record<string, unknown>>)[0];
    body.products = Array.from({ length: 51 }, () => ({ ...volume }));

    expect(erro(body).field).toBe("products");
  });

  it("recusa produto com peso ausente, nomeando o índice", () => {
    const body = cotacaoValida();
    delete (body.products as Array<Record<string, unknown>>)[0].weight;

    const e = erro(body);
    expect(e.field).toBe("products[0].weight");
  });

  it("recusa dimensão abaixo do mínimo físico", () => {
    const body = cotacaoValida();
    (body.products as Array<Record<string, unknown>>)[0].width = 0;

    expect(erro(body).field).toBe("products[0].width");
  });

  it("assume valor declarado zero e quantidade 1 quando ausentes", () => {
    const body = cotacaoValida();
    const produto = (body.products as Array<Record<string, unknown>>)[0];
    delete produto.insurance_value;
    delete produto.quantity;

    const quote = parseMelhorEnvioQuote(body);
    const validado = (quote.products as Array<Record<string, unknown>>)[0];

    expect(validado.insurance_value).toBe(0);
    expect(validado.quantity).toBe(1);
  });

  it("recusa params que não é objeto", () => {
    expect(erro(undefined).field).toBe("params");
    expect(erro([]).field).toBe("params");
  });

  it("a edge não devolve mais o corpo cru ao parceiro", () => {
    const src = readFileSync(EDGE, "utf8");
    expect(src).toContain("parseMelhorEnvioQuote(params)");
    expect(src).toMatch(
      /\/me\/shipment\/calculate`;[\s\S]{0,140}JSON\.stringify\(quote\)/,
    );
    expect(src).toContain("validationErrorResponse(error, corsHeaders)");
  });
});
