import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invokeFunction } from "../../supabase/functions/_shared/invokeFunction";

const env: Record<string, string | undefined> = {
  SUPABASE_URL: "https://proj.supabase.co/",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
};

type Chamada = { url: string; init: RequestInit & { timeout?: number } };

function stubFetch(
  impl: (url: string, init: Chamada["init"]) => Promise<Response>,
) {
  const chamadas: Chamada[] = [];
  const fn = vi.fn(async (url: string, init: Chamada["init"]) => {
    chamadas.push({ url, init });
    return impl(url, init);
  });
  vi.stubGlobal("fetch", fn);
  return chamadas;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).Deno = {
    env: { get: (key: string) => env[key] },
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (globalThis as Record<string, unknown>).Deno;
  env.SUPABASE_URL = "https://proj.supabase.co/";
  env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

describe("invokeFunction", () => {
  it("chama o gateway do projeto com o token de serviço e devolve o corpo", async () => {
    const chamadas = stubFetch(async () => json({ success: true, id: "abc" }));

    const resultado = await invokeFunction("whatsapp-notification", {
      to: "5511999999999",
    });

    expect(resultado).toEqual({
      ok: true,
      status: 200,
      data: { success: true, id: "abc" },
    });
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0].url).toBe(
      "https://proj.supabase.co/functions/v1/whatsapp-notification",
    );
    expect(chamadas[0].init.method).toBe("POST");
    expect(chamadas[0].init.body).toBe('{"to":"5511999999999"}');
    const headers = chamadas[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer service-role-key");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(chamadas[0].init.signal).toBeDefined();
  });

  it("não repete a barra quando a URL já termina em /", async () => {
    const chamadas = stubFetch(async () => json({}));
    await invokeFunction("health");
    expect(chamadas[0].url).toBe(
      "https://proj.supabase.co/functions/v1/health",
    );
  });

  it("devolve ok:false com status quando a função responde erro", async () => {
    stubFetch(async () => json({ error: "boom" }, 500));

    const resultado = await invokeFunction("send-password-reset", {});

    expect(resultado.ok).toBe(false);
    if (resultado.ok) throw new Error("esperado falha");
    expect(resultado.reason).toBe("http");
    expect(resultado.status).toBe(500);
    expect(resultado.data).toEqual({ error: "boom" });
  });

  it("devolve reason timeout sem lançar quando estoura o tempo limite", async () => {
    stubFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const erro = new Error("aborted");
            erro.name = "AbortError";
            reject(erro);
          });
        }) as Promise<Response>,
    );

    const resultado = await invokeFunction(
      "nexus-webhook-receiver",
      {},
      { timeoutMs: 20 },
    );

    expect(resultado.ok).toBe(false);
    if (resultado.ok) throw new Error("esperado timeout");
    expect(resultado.reason).toBe("timeout");
    expect(resultado.error).toContain("20");
  });

  it("devolve reason network em erro de conexão", async () => {
    stubFetch(async () => {
      throw new TypeError("fetch failed");
    });

    const resultado = await invokeFunction("accuracy-weekly-digest", {});

    expect(resultado.ok).toBe(false);
    if (resultado.ok) throw new Error("esperado falha");
    expect(resultado.reason).toBe("network");
    expect(resultado.error).toContain("fetch failed");
  });

  it("devolve reason config e não chama nada com nome de função inválido", async () => {
    const chamadas = stubFetch(async () => json({}));

    for (const nome of [
      "",
      "Funcao",
      "../admin",
      "a/b",
      "nome_com_underscore",
    ]) {
      const resultado = await invokeFunction(nome, {});
      expect(resultado.ok).toBe(false);
      if (resultado.ok) throw new Error("esperado falha");
      expect(resultado.reason).toBe("config");
    }
    expect(chamadas).toHaveLength(0);
  });

  it("devolve reason config e não chama nada sem URL ou chave do projeto", async () => {
    const chamadas = stubFetch(async () => json({}));
    env.SUPABASE_SERVICE_ROLE_KEY = undefined;

    const resultado = await invokeFunction("health", {});

    expect(resultado.ok).toBe(false);
    if (resultado.ok) throw new Error("esperado falha");
    expect(resultado.reason).toBe("config");
    expect(chamadas).toHaveLength(0);
  });

  it("aceita resposta sem corpo (204) devolvendo data nula", async () => {
    stubFetch(async () => new Response(null, { status: 204 }));

    const resultado = await invokeFunction("health", {});

    expect(resultado).toEqual({ ok: true, status: 204, data: null });
  });
});
