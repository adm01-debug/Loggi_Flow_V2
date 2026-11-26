import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PRODUCTION_PROJECT_REF,
  resolveMelhorEnvioAmbiente,
} from "../../supabase/functions/melhor-envio-api/ambiente";

const raiz = process.cwd();
const fonte = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const handler = fonte("supabase/functions/melhor-envio-api/index.ts");

describe("melhor-envio-api: ambiente decidido pelo servidor (etapa 008 / S-04)", () => {
  it("sem a variavel ligada, opera em producao", () => {
    expect(resolveMelhorEnvioAmbiente({})).toBe("producao");
    expect(resolveMelhorEnvioAmbiente({ sandbox: "false" })).toBe("producao");
    expect(resolveMelhorEnvioAmbiente({ sandbox: " TRUE " })).toBe("sandbox");
  });

  it("recusa o sandbox dentro do projeto de producao, mesmo com a variavel ligada", () => {
    const url = `https://${PRODUCTION_PROJECT_REF}.supabase.co`;
    expect(resolveMelhorEnvioAmbiente({ sandbox: "true", supabaseUrl: url })).toBe("producao");
    expect(
      resolveMelhorEnvioAmbiente({ sandbox: "true", supabaseUrl: "https://outro.supabase.co" }),
    ).toBe("sandbox");
  });

  it("o handler nao usa o valor do corpo para escolher a URL", () => {
    expect(handler).toContain('Deno.env.get("MELHOR_ENVIO_SANDBOX")');
    expect(handler).toContain('const { action, params, useSandbox } = body ?? {};');
    expect(handler).toContain('ambiente === "sandbox" ? SANDBOX_URL : PRODUCTION_URL');
    expect(handler).not.toMatch(/useSandbox\s*[?!]/);
    expect(handler).not.toContain("useSandbox = true");
  });

  it("o painel pergunta o ambiente ao servidor e nao manda mais o campo", () => {
    expect(handler).toContain('action === "ambiente"');

    const hook = fonte("src/hooks/logistics/useMelhorEnvio.tsx");
    expect(hook).not.toContain("useSandbox");
    expect(hook).not.toContain("me-sandbox-mode");

    const validacao = fonte("src/hooks/security/useIntegrationValidation.tsx");
    expect(validacao).not.toContain("useSandbox");

    const painel = fonte("src/pages/GestaoMelhorEnvio.tsx");
    expect(painel).not.toContain("me-sandbox-mode");
    expect(painel).not.toContain("<Switch checked");
    expect(painel).toContain("action: 'ambiente'");
  });
});
