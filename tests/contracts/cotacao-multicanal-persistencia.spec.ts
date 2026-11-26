import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const raiz = process.cwd();
const fonte = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const tela = fonte("src/pages/CotacaoMultiCanal.tsx");
const hook = fonte("src/hooks/logistics/useCotacoesMulticanal.tsx");

/** Recorte entre dois marcadores, para afirmar o que esta dentro de um handler. */
function recorte(inicio: string, fim: string) {
  const de = tela.indexOf(inicio);
  expect(de, `marcador ausente: ${inicio}`).toBeGreaterThan(-1);
  const ate = tela.indexOf(fim, de + inicio.length);
  return tela.slice(de, ate === -1 ? undefined : ate);
}

describe("CotacaoMultiCanal: criacao e resposta passam pelo banco (etapas 039 e 041 / C-02)", () => {
  it("a tela nao guarda mais cotacao em estado local", () => {
    expect(tela).not.toContain("setCotacoes(");
  });

  it("handleRegistrarResposta grava pela mutation do hook", () => {
    const corpo = recorte(
      "const handleRegistrarResposta",
      "const melhorCotacao",
    );
    expect(corpo).toContain("updateCotacao.mutate(");
  });

  it("o Nexus Blast aguarda a gravacao de cada transportadora", () => {
    const corpo = recorte(
      "const handleNexusBlast",
      "const handleCotarWhatsApp",
    );
    expect(corpo).toContain("await createCotacao.mutateAsync(");
  });

  it("os envios por WhatsApp e por e-mail criam a cotacao no banco", () => {
    const whatsapp = recorte(
      "const handleCotarWhatsApp",
      "const handleCotarEmail",
    );
    const email = recorte(
      "const handleCotarEmail",
      "const handleRegistrarResposta",
    );
    expect(whatsapp).toContain("createCotacao.mutate(");
    expect(email).toContain("createCotacao.mutate(");
  });

  it("o hook preenche responded_at quando o status vira respondido", () => {
    expect(hook).toContain("responded_at = new Date().toISOString()");
  });
});
