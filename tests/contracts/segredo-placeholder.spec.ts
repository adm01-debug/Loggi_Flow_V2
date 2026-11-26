import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isSecretConfigured,
  PLACEHOLDER_NEEDS_SETUP,
} from "../../supabase/functions/_shared/secretConfig";

const fonte = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

// Em producao 13 segredos estavam com o literal PLACEHOLDER_NEEDS_SETUP: a variavel
// existia, o guard `if (!valor)` passava e o parceiro respondia erro generico.
describe("segredo com placeholder nao conta como configurado", () => {
  it("recusa o literal do set_missing_secrets.sh, o vazio e o <entre_sinais>", () => {
    expect(isSecretConfigured(undefined)).toBe(false);
    expect(isSecretConfigured(null)).toBe(false);
    expect(isSecretConfigured("")).toBe(false);
    expect(isSecretConfigured("   ")).toBe(false);
    expect(isSecretConfigured(PLACEHOLDER_NEEDS_SETUP)).toBe(false);
    expect(isSecretConfigured("placeholder_needs_setup")).toBe(false);
    expect(isSecretConfigured("<troque_aqui>")).toBe(false);
  });

  it("aceita valor real do parceiro", () => {
    expect(isSecretConfigured("abc123")).toBe(true);
    expect(
      isSecretConfigured("https://portal.bitrix24.com.br/rest/1/xyz/"),
    ).toBe(true);
  });

  it("toda funcao que depende de credencial usa o guard", () => {
    const casos: Array<[string, string]> = [
      [
        "supabase/functions/bitrix24-integration/index.ts",
        "isSecretConfigured(bitrixWebhookUrl)",
      ],
      [
        "supabase/functions/melhor-envio-api/index.ts",
        "isSecretConfigured(token)",
      ],
      [
        "supabase/functions/get-weather-data/index.ts",
        "isSecretConfigured(WEATHER_API_KEY)",
      ],
      ["supabase/functions/_shared/weather.ts", "isSecretConfigured(key)"],
      [
        "supabase/functions/lalamove-tracking/index.ts",
        "isSecretConfigured(apiKey)",
      ],
      [
        "supabase/functions/rodonaves-api/index.ts",
        "isSecretConfigured(username)",
      ],
      [
        "supabase/functions/_shared/redis.ts",
        "isSecretConfigured(UPSTASH_REDIS_REST_URL)",
      ],
      [
        "supabase/functions/log-security-event/index.ts",
        "isSecretConfigured(slackWebhook)",
      ],
      [
        "supabase/functions/normalize-freight-response/index.ts",
        'isSecretConfigured(Deno.env.get("OPENAI_API_KEY"))',
      ],
    ];
    for (const [arquivo, trecho] of casos) {
      expect(fonte(arquivo), arquivo).toContain(trecho);
    }
  });

  it("o painel do Bitrix mostra a mensagem que a funcao devolveu", () => {
    const painel = fonte("src/pages/IntegracaoBitrix.tsx");
    expect(painel).toContain("mensagemDaFuncao");
    expect(painel).toContain("await mensagemDaFuncao(error, error.message)");
  });
});
