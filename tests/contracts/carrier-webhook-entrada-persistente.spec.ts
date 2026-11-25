import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(
  process.cwd(),
  "supabase/functions/carrier-webhook-receiver/index.ts",
);
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoCatch = entre("  } catch (error: any) {", "\n});");

const TABELA = "webhook_inbound_failures";

describe("etapa 288: a falha do webhook de entrada tem destino persistente", () => {
  it("o catch grava uma linha identificando o receptor", () => {
    expect(blocoCatch).toContain(`.from("${TABELA}")`);
    expect(blocoCatch).toContain(".insert({");
    expect(blocoCatch).toContain('receiver: "carrier-webhook-receiver"');
  });

  it("a gravacao tem try/catch proprio e nao derruba o webhook", () => {
    expect(blocoCatch).toContain("} catch (persistError) {");
    // `lastIndexOf`: a resposta final e a ultima ocorrencia de `status: 500,`
    // (`response_status: 500,` do insert aparece antes e nao conta).
    expect(blocoCatch.indexOf(".insert({")).toBeLessThan(
      blocoCatch.lastIndexOf("status: 500,"),
    );
    expect(blocoCatch.indexOf("} catch (persistError) {")).toBeLessThan(
      blocoCatch.lastIndexOf("status: 500,"),
    );
    expect(blocoCatch).toContain("(persistError as Error).message");
  });

  it("nao engole o evento: a resposta continua 500 e sem fingir sucesso", () => {
    expect(blocoCatch).toContain('JSON.stringify({ error: "Internal Server Error" })');
    expect(blocoCatch).toContain("status: 500,");
    expect(blocoCatch).not.toMatch(/status:\s*2\d\d/);
    expect(blocoCatch).not.toContain("success: true");
  });

  it("nao grava o corpo do webhook (LGPD) e mascara a mensagem de erro", () => {
    expect(blocoCatch).not.toMatch(/payload\s*[,:]/);
    expect(blocoCatch).not.toContain("raw");
    expect(blocoCatch).toContain("redact(");
    expect(blocoCatch).toContain(".slice(0, 2000)");
  });

  it("o payload sai do escopo do try para o catch poder identificar a origem", () => {
    expect(src).toContain("let payload: any;");
    expect(src).not.toContain("const payload = JSON.parse(raw)");
    expect(src.indexOf("let payload: any;")).toBeLessThan(
      src.indexOf("  } catch (error: any) {"),
    );
    expect(src.indexOf("payload = JSON.parse(raw);")).toBeLessThan(
      src.indexOf("  } catch (error: any) {"),
    );
  });

  it("a identidade do evento vem do payload sem quebrar quando ele e ilegivel", () => {
    expect(blocoCatch).toContain("payload?.event_id");
    expect(blocoCatch).toContain("payload?.carrier_id");
    expect(blocoCatch).toContain("typeof origem === \"string\" ? origem : null");
  });

  it("a tabela tem migration com RLS fechada e retencao sem pg_cron", () => {
    const caminho = join(
      process.cwd(),
      "supabase/migrations/20261125093000_webhook_inbound_failures.sql",
    );
    expect(existsSync(caminho)).toBe(true);
    const sql = readFileSync(caminho, "utf8");
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS public.webhook_inbound_failures",
    );
    expect(sql).toContain(
      "ALTER TABLE public.webhook_inbound_failures ENABLE ROW LEVEL SECURITY",
    );
    expect(sql).toContain("public.has_role(auth.uid(), 'admin'::app_role)");
    expect(sql).toContain("FOR INSERT\n  TO service_role");
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.purge_webhook_inbound_failures(integer) FROM anon;",
    );
  });
});
